import { File, Paths } from "expo-file-system";

import { db } from "@/db/client";
import { containers, foods, insulinRatios, recipeComponents, settings, weighings } from "@/db/schema";

const SCHEMA_VERSION = 1;

type ExportedData = {
  schemaVersion: number;
  exportedAt: string;
  containers: (typeof containers.$inferSelect)[];
  foods: (typeof foods.$inferSelect)[];
  recipeComponents: (typeof recipeComponents.$inferSelect)[];
  insulinRatios: (typeof insulinRatios.$inferSelect)[];
  settings: (typeof settings.$inferSelect)[];
  weighings: (typeof weighings.$inferSelect)[];
};

async function buildExportedData(): Promise<ExportedData> {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    containers: await db.select().from(containers),
    foods: await db.select().from(foods),
    recipeComponents: await db.select().from(recipeComponents),
    insulinRatios: await db.select().from(insulinRatios),
    settings: await db.select().from(settings),
    weighings: await db.select().from(weighings),
  };
}

// Écrit un export JSON complet dans un fichier temporaire et retourne son
// URI, prêt à être partagé (voir Sharing.shareAsync côté écran).
export async function exportAllData(): Promise<string> {
  const data = await buildExportedData();

  const dateStamp = data.exportedAt.slice(0, 10);
  const file = new File(Paths.cache, `glucodose-sauvegarde-${dateStamp}.json`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(JSON.stringify(data, null, 2));
  return file.uri;
}

// Nom fixe (écrasé à chaque sauvegarde) plutôt qu'horodaté comme l'export
// manuel : ce fichier est un filet de sécurité qui ne garde que le dernier
// état, pas un historique de versions. Dans Paths.document (pas .cache) pour
// ne pas être supprimé par le système en cas de stockage bas.
const AUTO_BACKUP_FILENAME = "glucodose-sauvegarde-auto.json";

// Sauvegarde silencieuse déclenchée après une période d'inactivité sur les
// réglages/aliments/récipients (voir useAutoBackup) — filet de sécurité en
// cas d'oubli d'export manuel, pas une alternative à la restauration.
export async function runAutoBackup(): Promise<void> {
  const data = await buildExportedData();
  const file = new File(Paths.document, AUTO_BACKUP_FILENAME);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
}

export async function getAutoBackupSavedAt(): Promise<string | null> {
  const file = new File(Paths.document, AUTO_BACKUP_FILENAME);
  if (!file.exists) return null;
  try {
    const data = JSON.parse(await file.text()) as Partial<ExportedData>;
    return data.exportedAt ?? null;
  } catch {
    return null;
  }
}

function isExportedData(value: unknown): value is ExportedData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.schemaVersion === "number" &&
    Array.isArray(v.containers) &&
    Array.isArray(v.foods) &&
    Array.isArray(v.recipeComponents) &&
    Array.isArray(v.insulinRatios) &&
    Array.isArray(v.settings) &&
    Array.isArray(v.weighings)
  );
}

export class InvalidBackupFileError extends Error {}

// Remplace entièrement les données actuelles par celles du fichier importé.
// L'appelant doit avoir confirmé explicitement avec l'utilisateur avant
// d'appeler cette fonction : c'est une opération destructive, pas une fusion.
export async function importAllData(sourceUri: string): Promise<void> {
  const source = new File(sourceUri);
  const text = await source.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidBackupFileError("Ce fichier n'est pas un JSON valide.");
  }

  if (!isExportedData(parsed) || parsed.schemaVersion > SCHEMA_VERSION) {
    throw new InvalidBackupFileError("Ce fichier ne ressemble pas à une sauvegarde valide de l'app.");
  }

  const data = parsed;

  await db.transaction(async (tx) => {
    // Ordre de suppression sûr vis-à-vis des clés étrangères : les tables
    // qui référencent les autres d'abord.
    await tx.delete(weighings);
    await tx.delete(recipeComponents);
    await tx.delete(foods);
    await tx.delete(containers);
    await tx.delete(insulinRatios);
    await tx.delete(settings);

    // Puis réinsertion en conservant les identifiants d'origine, pour que
    // les relations (composants de recette, historique) restent cohérentes.
    if (data.containers.length) await tx.insert(containers).values(data.containers);
    if (data.insulinRatios.length) await tx.insert(insulinRatios).values(data.insulinRatios);
    if (data.settings.length) await tx.insert(settings).values(data.settings);
    if (data.foods.length) await tx.insert(foods).values(data.foods);
    if (data.recipeComponents.length) await tx.insert(recipeComponents).values(data.recipeComponents);
    if (data.weighings.length) await tx.insert(weighings).values(data.weighings);
  });
}

export function cleanupExportedFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best effort.
  }
}

