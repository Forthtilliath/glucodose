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
export const db = drizzle(expoDb, { schema });
