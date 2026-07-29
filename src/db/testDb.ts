import { type Client, createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as schema from "./schema";

export type TestDb = LibSQLDatabase<typeof schema> & { $client: Client };

// Chemin du fichier temporaire associé à chaque instance, pour le nettoyer
// dans closeTestDb() sans changer la forme de la valeur retournée par
// createTestDb() (qui doit rester un TestDb utilisable directement).
const tempFilesByDb = new WeakMap<TestDb, string>();

// Base SQLite en mémoire (libsql) utilisée uniquement par les tests, pour
// exercer la vraie logique SQL de repository.ts (contraintes de clé
// étrangère, transactions...) sans dépendre d'expo-sqlite, indisponible dans
// l'environnement Jest. Contrairement à better-sqlite3/sql.js, le driver
// libsql de drizzle est en mode "async" comme celui d'expo-sqlite : les
// transactions avec callback `async (tx) => {...}` (utilisées dans
// repository.ts) fonctionnent donc à l'identique en test et en production.
export async function createTestDb(): Promise<TestDb> {
  // Un fichier réel (et non ":memory:") : certaines connexions internes du
  // client libsql ré-ouvrent la base séparément (transactions, migrations),
  // ce qui repartirait sur une base vide à chaque fois avec ":memory:".
  const dbFile = path.join(os.tmpdir(), `glucodose-test-${randomUUID()}.sqlite`);
  const client = createClient({ url: `file:${dbFile}` });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: path.join(__dirname, "..", "..", "drizzle") });
  await client.execute("PRAGMA foreign_keys = ON;");

  tempFilesByDb.set(db, dbFile);
  return db;
}

// À appeler dans un afterAll : ferme la connexion native libsql (sans quoi le
// worker Jest ne se termine pas proprement) et supprime le fichier temporaire
// (et ses éventuels compagnons -wal/-shm) pour ne pas accumuler des bases de
// test dans le dossier temp à chaque exécution.
export function closeTestDb(db: TestDb) {
  db.$client.close();

  const dbFile = tempFilesByDb.get(db);
  if (!dbFile) return;
  for (const file of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) {
    try {
      fs.rmSync(file, { force: true });
    } catch {
      // Best effort : sur Windows le handle natif peut rester verrouillé
      // brièvement après close(), un fichier de test qui persiste n'est pas
      // grave (dossier temp, nettoyé de toute façon par l'OS).
    }
  }
}

// Vide toutes les tables entre deux tests, dans un ordre sûr vis-à-vis des
// clés étrangères : seul recipeComponents.componentFoodId → foods est en
// "restrict" (les autres relations sont en "set null"), donc lui seul doit
// être supprimé avant le reste.
export async function resetTestDb(db: TestDb) {
  await db.delete(schema.recipeComponents);
  await Promise.all([
    db.delete(schema.weighings),
    db.delete(schema.foods),
    db.delete(schema.containers),
    db.delete(schema.insulinRatios),
    db.delete(schema.settings),
  ]);
}

// Substitue testDb à l'instance réelle exportée par le module donné (typiquement
// "./client" ou "@/db/client"), pour les fichiers de test import ant repository.ts
// ou backup.ts. À appeler dans un beforeAll, avant le require() du module testé :
// jest.doMock n'est pas hoisté comme jest.mock, donc l'ordre d'appel est respecté.
export function mockDbClient(modulePath: string, testDb: TestDb) {
  jest.doMock(modulePath, () => ({ db: testDb }));
}
