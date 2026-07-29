import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Récipients : poids à vide (tare) mémorisé pour ne plus avoir à repeser.
export const containers = sqliteTable("containers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tareWeightG: real("tare_weight_g").notNull(),
  photoUri: text("photo_uri"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Aliments : ingrédients simples ET recettes composées, unifiés pour être
// interchangeables dans l'écran de pesée. La valeur enregistrée est le taux
// de GLUCIDES (propriété stable de l'aliment) — jamais une dose d'insuline,
// qui dépend du ratio personnel appliqué au moment du repas.
export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["ingredient", "recipe"] }).notNull(),
  carbsPer100g: real("carbs_per_100g").notNull(),
  // Renseigné uniquement pour type = "recipe", recalculé à chaque édition.
  totalWeightG: real("total_weight_g"),
  totalCarbsG: real("total_carbs_g"),
  source: text("source"),
  notes: text("notes"),
  photoUri: text("photo_uri"),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Composants d'une recette : poids et glucides figés au moment de la
// sauvegarde de la recette (une recette ne se recalcule pas toute seule si
// on édite un ingrédient existant plus tard).
export const recipeComponents = sqliteTable("recipe_components", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeFoodId: integer("recipe_food_id")
    .notNull()
    .references(() => foods.id, { onDelete: "cascade" }),
  componentFoodId: integer("component_food_id")
    .notNull()
    .references(() => foods.id, { onDelete: "restrict" }),
  weightG: real("weight_g").notNull(),
  carbsG: real("carbs_g").notNull(),
  position: integer("position").notNull().default(0),
});

// Ratios insuline/glucides : combien de grammes de glucides sont couverts
// par 1 unité d'insuline. Paramètre personnel, PAS une propriété de
// l'aliment — il peut y avoir plusieurs ratios (matin/midi/soir...) et ils
// évoluent dans le temps, d'où une table séparée plutôt qu'un champ figé
// par aliment.
export const insulinRatios = sqliteTable("insulin_ratios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(), // ex: "Petit-déjeuner"
  carbsGramsPerUnit: real("carbs_grams_per_unit").notNull(), // 1 unité couvre X g de glucides
  position: integer("position").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Réglages de correction d'hyperglycémie (ligne unique, id = 1).
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  glycemiaUnit: text("glycemia_unit", { enum: ["mmol/L", "g/L"] })
    .notNull()
    .default("mmol/L"),
  targetGlycemia: real("target_glycemia"),
  sensitivityFactor: real("sensitivity_factor"), // baisse de glycémie pour 1 unité, dans glycemiaUnit
  // Désactivable pour les utilisateurs qui veulent juste connaître les
  // glucides d'un repas, sans calcul de dose (pas de ratio ni de correction).
  showInsulinDose: integer("show_insulin_dose", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Historique des pesées réelles. Toutes les valeurs de référence utilisées
// pour le calcul (glucides/100g, ratio, cible, facteur) sont snapshotées :
// une dose déjà calculée/injectée ne doit jamais changer rétroactivement si
// on édite un aliment ou un réglage plus tard.
export const weighings = sqliteTable("weighings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  foodId: integer("food_id").references(() => foods.id, {
    onDelete: "set null",
  }),
  foodNameSnapshot: text("food_name_snapshot").notNull(),
  containerId: integer("container_id").references(() => containers.id, {
    onDelete: "set null",
  }),
  grossWeightG: real("gross_weight_g").notNull(),
  tareWeightG: real("tare_weight_g").notNull().default(0),
  netWeightG: real("net_weight_g").notNull(),
  carbsPer100gSnapshot: real("carbs_per_100g_snapshot").notNull(),
  carbsG: real("carbs_g").notNull(),

  ratioId: integer("ratio_id").references(() => insulinRatios.id, {
    onDelete: "set null",
  }),
  ratioLabelSnapshot: text("ratio_label_snapshot"),
  carbsGramsPerUnitSnapshot: real("carbs_grams_per_unit_snapshot"),
  mealInsulinUnits: real("meal_insulin_units").notNull(),

  glycemiaUnitSnapshot: text("glycemia_unit_snapshot", {
    enum: ["mmol/L", "g/L"],
  }),
  currentGlycemia: real("current_glycemia"),
  targetGlycemiaSnapshot: real("target_glycemia_snapshot"),
  sensitivityFactorSnapshot: real("sensitivity_factor_snapshot"),
  correctionInsulinUnits: real("correction_insulin_units")
    .notNull()
    .default(0),

  totalInsulinUnits: real("total_insulin_units").notNull(),

  weighedAt: text("weighed_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  notes: text("notes"),
});
