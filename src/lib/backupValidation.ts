import type { containers, foods, insulinRatios, recipeComponents, settings, weighings } from "@/db/schema";

// Validation ligne par ligne d'une sauvegarde importée. Un fichier corrompu ou
// modifié ne doit jamais pouvoir injecter une valeur absurde (ratio négatif,
// texte à la place d'un nombre…) : elle fausserait le calcul des doses
// d'insuline. Toute anomalie rejette le fichier entier, rien n'est importé.
// Les colonnes inconnues sont ignorées ; les colonnes absentes des anciennes
// sauvegardes reprennent leur valeur par défaut en base.

export class BackupValidationError extends Error {}

type Rule = (value: unknown) => boolean;
type Field = { rule: Rule; required?: boolean };
type Spec = Record<string, Field>;
type Row = Record<string, unknown>;

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const id: Rule = (v) => Number.isInteger(v) && (v as number) > 0;
const int: Rule = (v) => Number.isInteger(v);
const finite: Rule = isNumber;
const text: Rule = (v) => typeof v === "string";
const bool: Rule = (v) => typeof v === "boolean";
// Bornes larges, mais qui écartent les valeurs physiquement impossibles.
const range = (min: number, max: number, exclusiveMin = false): Rule => (v) =>
  isNumber(v) && (exclusiveMin ? v > min : v >= min) && v <= max;
const oneOf = (...values: string[]): Rule => (v) => typeof v === "string" && values.includes(v);
const nullable = (rule: Rule): Rule => (v) => v === null || rule(v);

const req = (rule: Rule): Field => ({ rule, required: true });
const opt = (rule: Rule): Field => ({ rule });

const WEIGHT_G = range(0, 1_000_000);
const CARBS_PER_100G = range(0, 100.5); // tolérance d'arrondi des recettes
const GLYCEMIA_UNITS = ["mmol/L", "g/L"];

const SPECS = {
  containers: {
    id: req(id), name: req(text), tareWeightG: req(WEIGHT_G),
    photoUri: opt(nullable(text)), notes: opt(nullable(text)),
    createdAt: opt(text), updatedAt: opt(text),
  },
  foods: {
    id: req(id), name: req(text), type: req(oneOf("ingredient", "recipe")),
    carbsPer100g: req(CARBS_PER_100G),
    totalWeightG: opt(nullable(WEIGHT_G)), totalCarbsG: opt(nullable(WEIGHT_G)),
    source: opt(nullable(text)), notes: opt(nullable(text)), photoUri: opt(nullable(text)),
    isArchived: opt(bool), createdAt: opt(text), updatedAt: opt(text),
  },
  recipeComponents: {
    id: req(id), recipeFoodId: req(id), componentFoodId: req(id),
    weightG: req(WEIGHT_G), carbsG: req(WEIGHT_G), position: opt(int),
  },
  insulinRatios: {
    id: req(id), label: req(text),
    // Grammes de glucides couverts par 1 unité : strictement positif.
    carbsGramsPerUnit: req(range(0, 200, true)),
    position: opt(int), createdAt: opt(text), updatedAt: opt(text),
  },
  settings: {
    id: req(id), glycemiaUnit: opt(oneOf(...GLYCEMIA_UNITS)),
    targetGlycemia: opt(nullable(range(0, 30, true))),
    sensitivityFactor: opt(nullable(range(0, 30, true))),
    showInsulinDose: opt(bool),
    widgetSelectedContainerId: opt(nullable(id)), widgetSelectedFoodId: opt(nullable(id)),
    themePreference: opt(oneOf("light", "dark", "system")),
    lastUpdateCheckAt: opt(nullable(range(0, Number.MAX_SAFE_INTEGER))),
    dismissedUpdateVersion: opt(nullable(text)), updatedAt: opt(text),
  },
  // Historique : valeurs figées au moment de la pesée, contrôlées plus
  // largement (nombres finis) pour ne pas rejeter d'anciennes pesées légitimes.
  weighings: {
    id: req(id), foodId: opt(nullable(id)), foodNameSnapshot: req(text),
    containerId: opt(nullable(id)),
    grossWeightG: req(finite), tareWeightG: opt(finite), netWeightG: req(finite),
    carbsPer100gSnapshot: req(CARBS_PER_100G), carbsG: req(finite),
    ratioId: opt(nullable(id)), ratioLabelSnapshot: opt(nullable(text)),
    carbsGramsPerUnitSnapshot: opt(nullable(finite)), mealInsulinUnits: req(finite),
    glycemiaUnitSnapshot: opt(nullable(oneOf(...GLYCEMIA_UNITS))),
    currentGlycemia: opt(nullable(finite)), targetGlycemiaSnapshot: opt(nullable(finite)),
    sensitivityFactorSnapshot: opt(nullable(finite)), correctionInsulinUnits: opt(finite),
    totalInsulinUnits: req(finite), weighedAt: opt(text), notes: opt(nullable(text)),
  },
} satisfies Record<string, Spec>;

type TableName = keyof typeof SPECS;

export type ValidatedBackup = {
  containers: (typeof containers.$inferInsert)[];
  foods: (typeof foods.$inferInsert)[];
  recipeComponents: (typeof recipeComponents.$inferInsert)[];
  insulinRatios: (typeof insulinRatios.$inferInsert)[];
  settings: (typeof settings.$inferInsert)[];
  weighings: (typeof weighings.$inferInsert)[];
};

function validateRows(table: TableName, rows: unknown): Row[] {
  if (!Array.isArray(rows)) throw new BackupValidationError(`${table} : liste attendue.`);
  const spec: Spec = SPECS[table];
  const seenIds = new Set<unknown>();
  return rows.map((row, index) => {
    const where = `${table}[${index}]`;
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new BackupValidationError(`${where} : ligne invalide.`);
    }
    const clean: Row = {};
    for (const [key, field] of Object.entries(spec)) {
      const value = (row as Row)[key];
      if (value === undefined) {
        if (field.required) throw new BackupValidationError(`${where} : « ${key} » manquant.`);
        continue;
      }
      if (!field.rule(value)) throw new BackupValidationError(`${where} : « ${key} » invalide.`);
      clean[key] = value;
    }
    if (seenIds.has(clean.id)) throw new BackupValidationError(`${where} : identifiant en double.`);
    seenIds.add(clean.id);
    return clean;
  });
}

const idsOf = (rows: Row[]) => new Set(rows.map((row) => row.id));

export function validateBackupRows(data: Record<TableName, unknown>): ValidatedBackup {
  const tables = Object.fromEntries(
    (Object.keys(SPECS) as TableName[]).map((table) => [table, validateRows(table, data[table])])
  ) as Record<TableName, Row[]>;

  // Une recette doit pointer vers des aliments présents dans le fichier.
  const foodIds = idsOf(tables.foods);
  tables.recipeComponents.forEach((component, index) => {
    if (!foodIds.has(component.recipeFoodId) || !foodIds.has(component.componentFoodId)) {
      throw new BackupValidationError(`recipeComponents[${index}] : aliment introuvable.`);
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
