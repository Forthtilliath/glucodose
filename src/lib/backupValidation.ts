import { z } from "zod";

import type { containers, foods, insulinRatios, recipeComponents, settings, weighings } from "@/db/schema";

// Validation d'une sauvegarde importée, un schéma zod par table. Un fichier
// corrompu ou modifié ne doit jamais pouvoir injecter une valeur absurde (ratio
// négatif, texte à la place d'un nombre, texte de plusieurs Mo…) : elle
// fausserait le calcul des doses d'insuline ou saturerait l'app. Toute anomalie
// rejette le fichier entier, rien n'est importé. Les colonnes inconnues sont
// retirées ; les colonnes absentes des anciennes sauvegardes reprennent leur
// valeur par défaut en base.

export class BackupValidationError extends Error {}

const id = z.number().int().positive();
const int = z.number().int().min(-1_000_000).max(1_000_000);
// Bornes larges, mais qui écartent les valeurs physiquement impossibles.
const range = (min: number, max: number, exclusiveMin = false) =>
  (exclusiveMin ? z.number().gt(min) : z.number().gte(min)).lte(max);
const text = (max: number) => z.string().max(max);
const NAME = text(200);
const LABEL = text(100);
const NOTES = text(2000);
const URI = text(2048);
// Dates écrites par SQLite (`2026-10-09 19:46:00`) ou par JS (ISO 8601).
const DATE = z
  .string()
  .max(40)
  .regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/, "date invalide");
const WEIGHT_G = range(0, 1_000_000);
const CARBS_PER_100G = range(0, 100.5); // tolérance d'arrondi des recettes
// Historique : valeurs figées au moment de la pesée, contrôlées plus largement
// pour ne pas rejeter d'anciennes pesées légitimes.
const SNAPSHOT = range(-1_000_000, 1_000_000);
const GLYCEMIA_UNIT = z.enum(["mmol/L", "g/L"]);

const opt = <T extends z.ZodType>(schema: T) => schema.optional();
const optNull = <T extends z.ZodType>(schema: T) => schema.nullable().optional();

const SCHEMAS = {
  containers: z.object({
    id, name: NAME, tareWeightG: WEIGHT_G,
    photoUri: optNull(URI), notes: optNull(NOTES), createdAt: opt(DATE), updatedAt: opt(DATE),
  }),
  foods: z.object({
    id, name: NAME, type: z.enum(["ingredient", "recipe"]), carbsPer100g: CARBS_PER_100G,
    totalWeightG: optNull(WEIGHT_G), totalCarbsG: optNull(WEIGHT_G),
    source: optNull(text(50)), notes: optNull(NOTES), photoUri: optNull(URI),
    isArchived: opt(z.boolean()), createdAt: opt(DATE), updatedAt: opt(DATE),
  }),
  recipeComponents: z.object({
    id, recipeFoodId: id, componentFoodId: id, weightG: WEIGHT_G, carbsG: WEIGHT_G, position: opt(int),
  }),
  insulinRatios: z.object({
    id, label: LABEL,
    // Grammes de glucides couverts par 1 unité : strictement positif.
    carbsGramsPerUnit: range(0, 200, true),
    position: opt(int), createdAt: opt(DATE), updatedAt: opt(DATE),
  }),
  settings: z.object({
    id, glycemiaUnit: opt(GLYCEMIA_UNIT),
    targetGlycemia: optNull(range(0, 30, true)), sensitivityFactor: optNull(range(0, 30, true)),
    showInsulinDose: opt(z.boolean()),
    widgetSelectedContainerId: optNull(id), widgetSelectedFoodId: optNull(id),
    themePreference: opt(z.enum(["light", "dark", "system"])),
    lastUpdateCheckAt: optNull(range(0, Number.MAX_SAFE_INTEGER)),
    dismissedUpdateVersion: optNull(text(50)), updatedAt: opt(DATE),
  }),
  weighings: z.object({
    id, foodId: optNull(id), foodNameSnapshot: NAME, containerId: optNull(id),
    grossWeightG: SNAPSHOT, tareWeightG: opt(SNAPSHOT), netWeightG: SNAPSHOT,
    carbsPer100gSnapshot: CARBS_PER_100G, carbsG: SNAPSHOT,
    ratioId: optNull(id), ratioLabelSnapshot: optNull(LABEL),
    carbsGramsPerUnitSnapshot: optNull(SNAPSHOT), mealInsulinUnits: SNAPSHOT,
    glycemiaUnitSnapshot: optNull(GLYCEMIA_UNIT), currentGlycemia: optNull(SNAPSHOT),
    targetGlycemiaSnapshot: optNull(SNAPSHOT), sensitivityFactorSnapshot: optNull(SNAPSHOT),
    correctionInsulinUnits: opt(SNAPSHOT), totalInsulinUnits: SNAPSHOT,
    weighedAt: opt(DATE), notes: optNull(NOTES),
  }),
};

type TableName = keyof typeof SCHEMAS;

// Nombre de lignes maximal par table : très au-dessus d'un usage réel (des
// années de pesées quotidiennes), mais un fichier gonflé est refusé avant
// d'être écrit en base.
const MAX_ROWS: Record<TableName, number> = {
  containers: 1_000,
  foods: 20_000,
  recipeComponents: 50_000,
  insulinRatios: 100,
  settings: 1,
  weighings: 200_000,
};

export type ValidatedBackup = {
  containers: (typeof containers.$inferInsert)[];
  foods: (typeof foods.$inferInsert)[];
  recipeComponents: (typeof recipeComponents.$inferInsert)[];
  insulinRatios: (typeof insulinRatios.$inferInsert)[];
  settings: (typeof settings.$inferInsert)[];
  weighings: (typeof weighings.$inferInsert)[];
};

type Row = Record<string, unknown>;

// Message affichable de la première anomalie, au format « table[i] : … ».
function describeIssue(table: TableName, rows: unknown[], issue: z.core.$ZodIssue): string {
  const [index, key] = issue.path;
  if (typeof index !== "number") return `${table} : ${String(MAX_ROWS[table])} lignes au maximum.`;
  const where = `${table}[${String(index)}]`;
  const row = rows[index];
  if (key === undefined || typeof row !== "object" || row === null) return `${where} : ligne invalide.`;
  const missing = (row as Row)[String(key)] === undefined;
  return `${where} : « ${String(key)} » ${missing ? "manquant" : "invalide"}.`;
}

function validateTable(table: TableName, rows: unknown): Row[] {
  if (!Array.isArray(rows)) throw new BackupValidationError(`${table} : liste attendue.`);
  const result = z.array(SCHEMAS[table]).max(MAX_ROWS[table]).safeParse(rows);
  if (!result.success) {
    throw new BackupValidationError(describeIssue(table, rows, result.error.issues[0]));
  }
  const seenIds = new Set<number>();
  result.data.forEach((row, index) => {
    if (seenIds.has(row.id)) throw new BackupValidationError(`${table}[${String(index)}] : identifiant en double.`);
    seenIds.add(row.id);
  });
  return result.data as Row[];
}

const idsOf = (rows: Row[]) => new Set(rows.map((row) => row.id));

export function validateBackupRows(data: Record<TableName, unknown>): ValidatedBackup {
  const tables = Object.fromEntries(
    (Object.keys(SCHEMAS) as TableName[]).map((table) => [table, validateTable(table, data[table])])
  ) as Record<TableName, Row[]>;

  // Une recette doit pointer vers des aliments présents dans le fichier.
  const foodIds = idsOf(tables.foods);
  tables.recipeComponents.forEach((component, index) => {
    if (!foodIds.has(component.recipeFoodId) || !foodIds.has(component.componentFoodId)) {
      throw new BackupValidationError(`recipeComponents[${String(index)}] : aliment introuvable.`);
    }
  });

  // L'historique garde ses valeurs figées : une référence orpheline (aliment,
  // récipient ou ratio absent du fichier) est simplement détachée, comme le
  // fait la base avec ON DELETE SET NULL.
  const references = { foodId: foodIds, containerId: idsOf(tables.containers), ratioId: idsOf(tables.insulinRatios) };
  for (const weighing of tables.weighings) {
    for (const [key, ids] of Object.entries(references)) {
      if (weighing[key] != null && !ids.has(weighing[key])) weighing[key] = null;
    }
  }

  return tables as unknown as ValidatedBackup;
}
