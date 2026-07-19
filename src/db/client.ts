import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

// Renommé après la refonte du schéma (glucides/ratios au lieu d'insuline
// par aliment) : évite un conflit avec l'ancien fichier déjà créé sur les
// appareils qui avaient lancé une version précédente de l'app.
// enableChangeListener est requis pour que useLiveQuery (drizzle) soit
// notifié des écritures et rafraîchisse les écrans déjà montés, sans quoi
// une liste ne se met à jour qu'en étant remontée.
export const expoDb = openDatabaseSync("insulin-v2.db", { enableChangeListener: true });

// SQLite n'applique PAS les contraintes de clé étrangère par défaut, même
// si elles sont déclarées dans le schéma (elles seraient alors purement
// documentaires). Sans ce pragma, supprimer une recette laisserait ses
// composants orphelins en base, et le blocage "aliment utilisé dans une
// recette" ne serait garanti qu'au niveau applicatif, pas par la base.
expoDb.execSync("PRAGMA foreign_keys = ON;");

export const db = drizzle(expoDb, { schema });
