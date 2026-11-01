import * as schema from "./schema";
import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "./testDb";

// Ratios et réglages ; le reste du repository est testé dans repository.test.ts.
jest.mock("@/lib/photos", () => ({ deletePhoto: jest.fn() }));

type Repository = typeof import("./repository");

let testDb: TestDb;
let repo: Repository;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("./client", testDb);
  // require(), not import(): must run after mockDbClient, synchronously, so
  // this gets a fresh module instance built against the mocked db client
  // instead of the one already cached from the top-level import graph.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  repo = require("./repository");
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
});

describe("ratios insuline/glucides", () => {
  it("crée, met à jour puis supprime un ratio", async () => {
    await repo.createRatio({ label: "Petit-déjeuner", carbsGramsPerUnit: 10 });
    const [created] = await testDb.select().from(schema.insulinRatios);

    await repo.updateRatio(created.id, { label: "Déjeuner", carbsGramsPerUnit: 12 });
    const [updated] = await testDb.select().from(schema.insulinRatios);
    expect(updated.label).toBe("Déjeuner");
    expect(updated.carbsGramsPerUnit).toBe(12);

    await repo.deleteRatio(created.id);
    expect(await testDb.select().from(schema.insulinRatios)).toHaveLength(0);
  });
});

describe("réglages", () => {
  it("n'active pas le calcul de dose sur une nouvelle installation", async () => {
    // Première écriture de l'app : la vérification de mise à jour au lancement.
    await repo.recordUpdateCheck(1_700_000_000_000);

    const rows = await testDb.select().from(schema.settings);
    expect(rows[0].showInsulinDose).toBe(false);
  });

  it("crée la ligne de réglages si elle n'existe pas encore", async () => {
    await repo.updateSettings({
      glycemiaUnit: "mmol/L",
      targetGlycemia: 6,
      sensitivityFactor: 3,
      showInsulinDose: true,
      themePreference: "system",
    });

    const rows = await testDb.select().from(schema.settings);
    expect(rows).toHaveLength(1);
    expect(rows[0].targetGlycemia).toBe(6);
  });

  it("met à jour la ligne existante plutôt que d'en créer une seconde", async () => {
    await repo.updateSettings({
      glycemiaUnit: "mmol/L",
      targetGlycemia: 6,
      sensitivityFactor: 3,
      showInsulinDose: true,
      themePreference: "system",
    });
    await repo.updateSettings({
      glycemiaUnit: "g/L",
      targetGlycemia: 1.1,
      sensitivityFactor: 0.5,
      showInsulinDose: false,
      themePreference: "dark",
    });

    const rows = await testDb.select().from(schema.settings);
    expect(rows).toHaveLength(1);
    expect(rows[0].glycemiaUnit).toBe("g/L");
    expect(rows[0].showInsulinDose).toBe(false);
    expect(rows[0].themePreference).toBe("dark");
  });

  it("recordUpdateCheck et dismissUpdateVersion ciblent chacun leur champ sans écraser les autres réglages", async () => {
    await repo.updateSettings({
      glycemiaUnit: "mmol/L",
      targetGlycemia: 6,
      sensitivityFactor: 3,
      showInsulinDose: true,
      themePreference: "dark",
    });

    await repo.recordUpdateCheck(1_700_000_000_000);
    await repo.dismissUpdateVersion("1.12.0");

    const rows = await testDb.select().from(schema.settings);
    expect(rows).toHaveLength(1);
    expect(rows[0].lastUpdateCheckAt).toBe(1_700_000_000_000);
    expect(rows[0].dismissedUpdateVersion).toBe("1.12.0");
    expect(rows[0].themePreference).toBe("dark");
  });
});
