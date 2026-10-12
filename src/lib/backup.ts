import { db } from "@/db/client";
import { containers, foods, insulinRatios, recipeComponents, settings, weighings } from "@/db/schema";

import { BackupValidationError, validateBackupRows, type ValidatedBackup } from "./backupValidation";
import { getAppVersion } from "./exportFileName";

const SCHEMA_VERSION = 1;

// Contenu d'une sauvegarde (fichier exporté ou copie Google Drive), une fois
// déchiffré : toutes les tables, plus quelques métadonnées.
export type BackupData = ValidatedBackup & {
  schemaVersion: number;
  exportedAt?: string;
  // Version de l'app ayant produit le fichier (absente des anciennes
  // sauvegardes) : informative, non utilisée à l'import.
  appVersion?: string;
};

export async function buildExportedData(): Promise<BackupData> {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: getAppVersion(),
    containers: await db.select().from(containers),
    foods: await db.select().from(foods),
    recipeComponents: await db.select().from(recipeComponents),
    insulinRatios: await db.select().from(insulinRatios),
    settings: await db.select().from(settings),
    weighings: await db.select().from(weighings),
  };
}

export class InvalidBackupFileError extends Error {}

type BackupTable = keyof ValidatedBackup;

function hasBackupShape(
  value: unknown
): value is Record<string, unknown> & Record<BackupTable, unknown> & { schemaVersion: number } {
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

// Valide le texte (déjà déchiffré) d'une sauvegarde. Lève une
// InvalidBackupFileError au message affichable tel quel par l'écran de
// sauvegarde : rien n'est importé tant que tout le fichier n'est pas valide.
export function parseBackup(text: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidBackupFileError("Ce fichier n'est pas un JSON valide.");
  }

  if (!hasBackupShape(parsed) || parsed.schemaVersion > SCHEMA_VERSION) {
    throw new InvalidBackupFileError("Ce fichier ne ressemble pas à une sauvegarde valide de l'app.");
  }

  try {
    return {
      schemaVersion: parsed.schemaVersion,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : undefined,
      appVersion: typeof parsed.appVersion === "string" ? parsed.appVersion : undefined,
      ...validateBackupRows(parsed),
    };
  } catch (error) {
    if (!(error instanceof BackupValidationError)) throw error;
    throw new InvalidBackupFileError(
      `Ce fichier contient des données invalides (${error.message}) : rien n'a été importé.`
    );
  }
}

// Remplace entièrement les données actuelles (pas de fusion). La confirmation
// et la sauvegarde de secours de l'état actuel sont faites en amont par le
// gestionnaire de sauvegarde (voir backupManager.ts).
export async function replaceAllData(data: BackupData): Promise<void> {
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

// Une sauvegarde sans aucune donnée saisie (les réglages par défaut ne
// comptent pas) : relier Google Drive peut alors envoyer celles du téléphone
// sans demander laquelle garder.
export function isBackupEmpty(data: BackupData): boolean {
  return (
    data.containers.length + data.foods.length + data.insulinRatios.length + data.weighings.length === 0
  );
}

export function describeBackup(data: BackupData): string {
  const parts = [
    `${data.foods.length} aliment(s)`,
    `${data.containers.length} récipient(s)`,
    `${data.insulinRatios.length} ratio(s)`,
    `${data.weighings.length} pesée(s)`,
  ];
  const date = data.exportedAt ? ` du ${new Date(data.exportedAt).toLocaleString("fr-FR")}` : "";
  return `${parts.join(", ")}${date}`;
}
