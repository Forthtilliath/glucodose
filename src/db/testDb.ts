import path from "node:path";
import { closeTestDb } from "@forthtilliath/expo-test-kit/closeTestDb";
import { createTestDb as createTestDbBase, type TestDb as TestDbBase } from "@forthtilliath/expo-test-kit/createTestDb";
import { mockDbClient as mockDbClientBase } from "@forthtilliath/expo-test-kit/mockDbClient";
import { resetTestDb as resetTestDbBase } from "@forthtilliath/expo-test-kit/resetTestDb";

import * as schema from "./schema";

export type TestDb = TestDbBase<typeof schema>;

export { closeTestDb };

export function createTestDb(): Promise<TestDb> {
  return createTestDbBase(schema, path.join(__dirname, "..", "..", "drizzle"));
}

// Vide toutes les tables entre deux tests, dans un ordre sûr vis-à-vis des
// clés étrangères : seul recipeComponents.componentFoodId → foods est en
// "restrict" (les autres relations sont en "set null"), donc lui seul doit
// être supprimé avant le reste.
export function resetTestDb(db: TestDb) {
  return resetTestDbBase(db, [
    schema.recipeComponents,
    schema.weighings,
    schema.foods,
    schema.containers,
    schema.insulinRatios,
    schema.settings,
  ]);
}

// Substitue testDb à l'instance réelle exportée par le module donné (typiquement
// "./client" ou "@/db/client"), pour les fichiers de test important repository.ts
// ou backup.ts. À appeler dans un beforeAll, avant le require() du module testé :
// jest.doMock n'est pas hoisté comme jest.mock, donc l'ordre d'appel est respecté.
export function mockDbClient(modulePath: string, testDb: TestDb) {
  mockDbClientBase(jest.doMock, modulePath, testDb);
}
