import {
  createFakeExpoFileSystem,
  type FakeExpoFileSystem,
  getFakeExpoFileSystem,
} from "@forthtilliath/expo-test-kit/createFakeExpoFileSystem";

import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "@/db/testDb";
import * as schema from "@/db/schema";

// Double léger d'expo-file-system : un simple magasin clé/valeur en mémoire,
// suffisant pour vérifier ce que exportAllData/importAllData lisent et
// écrivent, sans dépendre du système de fichiers natif (indisponible en Jest).
// Le nom préfixé "mock" est requis : jest.mock() est hoisté avant les imports,
// et babel-plugin-jest-hoist interdit toute référence hors-scope dans la
// factory, sauf pour les identifiants préfixés "mock" (insensible à la casse).
const mockCreateFakeExpoFileSystem = createFakeExpoFileSystem;
jest.mock("expo-file-system", () => mockCreateFakeExpoFileSystem());

type Backup = typeof import("./backup");

let testDb: TestDb;
let backup: Backup;
let fakeFs: FakeExpoFileSystem;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("@/db/client", testDb);
  backup = require("./backup");
  fakeFs = getFakeExpoFileSystem();
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
  fakeFs.store.clear();
});

describe("exportAllData", () => {
  it("exporte toutes les tables dans un fichier JSON et retourne son uri", async () => {
    await testDb.insert(schema.containers).values({ name: "Bol", tareWeightG: 100 });

    const uri = await backup.exportAllData();
    const content = JSON.parse(fakeFs.store.get(uri) as string);

    expect(content.schemaVersion).toBe(1);
    expect(content.containers).toHaveLength(1);
    expect(content.containers[0].name).toBe("Bol");
    expect(content.foods).toEqual([]);
  });
});

describe("importAllData", () => {
  it("rejette un fichier qui n'est pas du JSON valide", async () => {
    fakeFs.store.set("bad.json", "ceci n'est pas du json");
    await expect(backup.importAllData("bad.json")).rejects.toThrow(backup.InvalidBackupFileError);
  });

  it("rejette un JSON qui ne ressemble pas à une sauvegarde", async () => {
    fakeFs.store.set("bad.json", JSON.stringify({ hello: "world" }));
    await expect(backup.importAllData("bad.json")).rejects.toThrow(backup.InvalidBackupFileError);
  });

  it("rejette une sauvegarde d'une version de schéma plus récente que celle supportée", async () => {
    fakeFs.store.set(
      "future.json",
      JSON.stringify({
        schemaVersion: 999,
        containers: [],
        foods: [],
        recipeComponents: [],
        insulinRatios: [],
        settings: [],
        weighings: [],
      })
    );
    await expect(backup.importAllData("future.json")).rejects.toThrow(backup.InvalidBackupFileError);
  });

  it("remplace entièrement les données existantes par celles du fichier importé", async () => {
    // Donnée existante avant import, qui doit disparaître après import.
    await testDb.insert(schema.containers).values({ name: "Ancien bol", tareWeightG: 50 });

    fakeFs.store.set(
      "backup.json",
      JSON.stringify({
        schemaVersion: 1,
        containers: [{ id: 1, name: "Bol importé", tareWeightG: 120, photoUri: null, notes: null }],
        foods: [],
        recipeComponents: [],
        insulinRatios: [],
        settings: [],
        weighings: [],
      })
    );

    await backup.importAllData("backup.json");

    const containers = await testDb.select().from(schema.containers);
    expect(containers).toHaveLength(1);
    expect(containers[0].name).toBe("Bol importé");
  });
});

describe("runAutoBackup / getAutoBackupSavedAt", () => {
  it("retourne null tant qu'aucune sauvegarde automatique n'a eu lieu", async () => {
    expect(await backup.getAutoBackupSavedAt()).toBeNull();
  });

  it("écrit la sauvegarde dans un fichier au nom fixe, écrasé à chaque appel", async () => {
    await testDb.insert(schema.containers).values({ name: "Bol", tareWeightG: 100 });
    await backup.runAutoBackup();

    const savedAt = await backup.getAutoBackupSavedAt();
    expect(savedAt).not.toBeNull();

    // Un fichier fixe (pas horodaté comme l'export manuel) : un seul fichier
    // dans le magasin après plusieurs sauvegardes successives.
    await backup.runAutoBackup();
    const filesAfterTwoRuns = [...fakeFs.store.keys()].filter((uri) => uri.includes("sauvegarde-auto"));
    expect(filesAfterTwoRuns).toHaveLength(1);
  });

  it("contient les mêmes données que l'export manuel", async () => {
    await testDb.insert(schema.containers).values({ name: "Bol", tareWeightG: 100 });
    await backup.runAutoBackup();

    const autoFile = [...fakeFs.store.keys()].find((uri) => uri.includes("sauvegarde-auto"));
    const content = JSON.parse(fakeFs.store.get(autoFile as string) as string);
    expect(content.containers).toHaveLength(1);
    expect(content.containers[0].name).toBe("Bol");
  });
});

describe("cleanupExportedFile", () => {
  it("supprime le fichier s'il existe", () => {
    fakeFs.store.set("to-delete.json", "{}");
    backup.cleanupExportedFile("to-delete.json");
    expect(fakeFs.store.has("to-delete.json")).toBe(false);
  });

  it("ne lève pas d'erreur si le fichier n'existe pas", () => {
    expect(() => backup.cleanupExportedFile("does-not-exist.json")).not.toThrow();
  });
});
