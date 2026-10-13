import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "@/db/testDb";
import * as schema from "@/db/schema";
import { File, resetFakeFileSystem } from "@/lib/testing/fakeFileSystem";

jest.mock("expo-file-system", () => jest.requireActual("@/lib/testing/fakeFileSystem"));

type MissingPhotos = typeof import("./missingPhotos");

const DOC = "file:///data/app/files/";

let testDb: TestDb;
let missingPhotos: MissingPhotos;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("@/db/client", testDb);
  // Voir backup.test.ts : require() après mockDbClient, pour obtenir un
  // module construit avec la base de test.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  missingPhotos = require("./missingPhotos");
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
  resetFakeFileSystem();
});

describe("clearMissingPhotoLinks", () => {
  it("efface les liens vers des photos disparues et garde les autres", async () => {
    new File(`${DOC}containers/present.jpg`).write("image");
    await testDb.insert(schema.containers).values([
      { name: "Bol", tareWeightG: 100, photoUri: `${DOC}containers/present.jpg` },
      { name: "Assiette", tareWeightG: 200, photoUri: `${DOC}containers/disparue.jpg` },
      { name: "Verre", tareWeightG: 50, photoUri: null },
    ]);
    await testDb.insert(schema.foods).values({
      name: "Riz", type: "ingredient", carbsPer100g: 28, photoUri: `${DOC}foods/disparue.jpg`,
    });

    expect(await missingPhotos.clearMissingPhotoLinks()).toBe(2);

    const containers = await testDb.select().from(schema.containers);
    expect(containers.map((row) => row.photoUri)).toEqual([`${DOC}containers/present.jpg`, null, null]);
    expect((await testDb.select().from(schema.foods))[0].photoUri).toBeNull();
  });
});
