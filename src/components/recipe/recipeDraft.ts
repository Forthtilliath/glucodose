import type { NewRecipeIngredient, RecipeComponentInput } from "@/db/foodRepository";
import type { foods } from "@/db/schema";
import { parseDecimal } from "@/lib/parseDecimal";

type Food = typeof foods.$inferSelect;

export type DraftIngredient = NewRecipeIngredient & { carbsPer100g: number };

// Ligne de composant en cours d'édition : un aliment existant, ou un
// ingrédient ajouté depuis la recette (Ciqual ou saisi à la main) qui ne sera
// créé qu'à l'enregistrement.
export type DraftRow = { key: string; weightG: string } & (
  | { foodId: number; newIngredient?: undefined }
  | { foodId?: undefined; newIngredient: DraftIngredient }
);

export type RowInfo = { name: string; carbsPer100g: number; tag: string | null; missing: boolean };

export function describeRow(row: DraftRow, foodMap: Map<number, Food>): RowInfo {
  if (row.newIngredient) {
    const { name, carbsPer100g, recipeOnly, source } = row.newIngredient;
    const tag = recipeOnly ? "propre à la recette" : `nouvel ingrédient${source ? ` ${source}` : ""}`;
    return { name, carbsPer100g, tag, missing: false };
  }
  const food = foodMap.get(row.foodId);
  if (!food) return { name: "Aliment introuvable", carbsPer100g: 0, tag: null, missing: true };
  // Un aliment archivé n'apparaît plus dans les listes : il n'existe que pour
  // les recettes qui l'utilisent.
  return { name: food.name, carbsPer100g: food.carbsPer100g, tag: food.isArchived ? "propre à la recette" : null, missing: false };
}

export function toComponentInput(row: DraftRow, info: RowInfo): RecipeComponentInput {
  const weightG = parseDecimal(row.weightG);
  if (row.newIngredient) {
    const { carbsPer100g, ...newIngredient } = row.newIngredient;
    return { newIngredient, weightG, carbsPer100gAtEntry: carbsPer100g };
  }
  return { componentFoodId: row.foodId, weightG, carbsPer100gAtEntry: info.carbsPer100g };
}
