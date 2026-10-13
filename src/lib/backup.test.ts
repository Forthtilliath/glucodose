import {
  decryptBackup,
  emptyKeyring,
  encryptBackup,
  ensureCurrentKey,
  getCurrentKey,
} from "@forthtilliath/backup-crypto";

import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "@/db/testDb";
import * as schema from "@/db/schema";

type Backup = typeof import("./backup");

let testDb: TestDb;
let backup: Backup;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("@/db/client", testDb);
  // require(), not import(): must run after mockDbClient, synchronously, so
  // this gets a fresh module instance built against the mocked db client
  // instead of the one already cached from the top-level import graph.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  backup = require("./backup");
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
});

function backupText(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    schemaVersion: 1,
    containers: [],
    foods: [],
    recipeComponents: [],
    insulinRatios: [],
    settings: [],
    weighings: [],
    ...overrides,
  });
}

async function seed() {
  await testDb.insert(schema.containers).values({ name: "Bol", tareWeightG: 100 });
  const [food] = await testDb
    .insert(schema.foods)
    .values({ name: "Riz", type: "ingredient", carbsPer100g: 28 })
    .returning();
  const [ratio] = await testDb
    .insert(schema.insulinRatios)
    .values({ label: "Midi", carbsGramsPerUnit: 10 })
    .returning();
  await testDb.insert(schema.settings).values({ id: 1, targetGlycemia: 1.2, sensitivityFactor: 0.4 });
  await testDb.insert(schema.weighings).values({
    foodId: food.id, foodNameSnapshot: "Riz", grossWeightG: 300, netWeightG: 200,
    carbsPer100gSnapshot: 28, carbsG: 56, ratioId: ratio.id, mealInsulinUnits: 5.6, totalInsulinUnits: 5.6,
  });
}

describe("buildExportedData", () => {
  it("exporte toutes les tables avec la version du schéma et de l'app", async () => {
    await testDb.insert(schema.containers).values({ name: "Bol", tareWeightG: 100 });

    const data = await backup.buildExportedData();

    expect(data.schemaVersion).toBe(1);
    expect(data.appVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(data.containers).toHaveLength(1);
    expect(data.containers[0].name).toBe("Bol");
    expect(data.foods).toEqual([]);
  });
});

describe("parseBackup", () => {
  it("rejette un texte qui n'est pas du JSON valide", () => {
    expect(() => backup.parseBackup("ceci n'est pas du json")).toThrow(backup.InvalidBackupFileError);
  });

  it("rejette un JSON qui ne ressemble pas à une sauvegarde", () => {
    expect(() => backup.parseBackup(JSON.stringify({ hello: "world" }))).toThrow(
      backup.InvalidBackupFileError
    );
  });

  it("rejette une sauvegarde d'une version de schéma plus récente que celle supportée", () => {
    expect(() => backup.parseBackup(backupText({ schemaVersion: 999 }))).toThrow(
      backup.InvalidBackupFileError
    );
  });

  it("rejette un ratio d'insuline invalide avec un message affichable", () => {
    const tampered = backupText({ insulinRatios: [{ id: 1, label: "Midi", carbsGramsPerUnit: -1 }] });
    expect(() => backup.parseBackup(tampered)).toThrow(/données invalides/);
  });

  it("garde la date d'export et la version de l'app", () => {
    const data = backup.parseBackup(
      backupText({ exportedAt: "2026-10-12T10:00:00.000Z", appVersion: "1.14.0" })
    );
    expect(data).toMatchObject({ exportedAt: "2026-10-12T10:00:00.000Z", appVersion: "1.14.0" });
  });
});

describe("replaceAllData", () => {
  it("remplace entièrement les données existantes", async () => {
    await testDb.insert(schema.containers).values({ name: "Ancien bol", tareWeightG: 50 });

    await backup.replaceAllData(
      backup.parseBackup(
        backupText({
          containers: [{ id: 1, name: "Bol importé", tareWeightG: 120, photoUri: null, notes: null }],
        })
      )
    );

    const containers = await testDb.select().from(schema.containers);
    expect(containers).toHaveLength(1);
    expect(containers[0].name).toBe("Bol importé");
  });

  it("restaure une sauvegarde exportée par l'app, même chiffrée puis déchiffrée", async () => {
    await seed();
    const key = getCurrentKey(ensureCurrentKey(emptyKeyring))!.key;
    const encrypted = encryptBackup(JSON.stringify(await backup.buildExportedData()), key, {
      app: "glucodose",
    });
    expect(encrypted).not.toContain("Riz");

    await resetTestDb(testDb);
    await backup.replaceAllData(backup.parseBackup(decryptBackup(encrypted, key)));

    expect(await testDb.select().from(schema.weighings)).toHaveLength(1);
    expect((await testDb.select().from(schema.settings))[0].sensitivityFactor).toBe(0.4);
  });

  it("garde la dose affichée pour une sauvegarde antérieure à ce réglage", async () => {
    await backup.replaceAllData(backup.parseBackup(backupText({ settings: [{ id: 1, glycemiaUnit: "g/L" }] })));

    expect((await testDb.select().from(schema.settings))[0].showInsulinDose).toBe(true);
  });
});

describe("isBackupEmpty / describeBackup", () => {
  it("ignore les réglages par défaut pour juger une sauvegarde vide", async () => {
    await testDb.insert(schema.settings).values({ id: 1 });
    expect(backup.isBackupEmpty(await backup.buildExportedData())).toBe(true);
    await resetTestDb(testDb);
    await seed();
    expect(backup.isBackupEmpty(await backup.buildExportedData())).toBe(false);
  });

  it("résume le contenu d'une sauvegarde", async () => {
    await seed();
    expect(backup.describeBackup(await backup.buildExportedData())).toMatch(
      /^1 aliment\(s\), 1 récipient\(s\), 1 ratio\(s\), 1 pesée\(s\) du /
    );
  });
});
