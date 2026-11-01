import { eq } from "drizzle-orm";

import { deletePhoto } from "@/lib/photos";
import { computeCarbsGrams } from "@/lib/insulin";
import { computeRecipeTotals, isCookedWeightPlausible } from "@/lib/recipeTotals";
import { db } from "./client";
import { foods, recipeComponents } from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ---------- Aliments (ingrédients + recettes) ----------

export async function createIngredient(input: {
  name: string;
  carbsPer100g: number;
  source?: string;
  notes?: string;
  photoUri?: string | null;
}): Promise<number> {
  const [row] = await db
    .insert(foods)
    .values({
      name: input.name,
      type: "ingredient",
      carbsPer100g: input.carbsPer100g,
      source: input.source,
      notes: input.notes,
      photoUri: input.photoUri ?? null,
    })
    .returning({ id: foods.id });
  return row.id;
}

export async function updateIngredient(
  id: number,
  input: { name: string; carbsPer100g: number; source?: string; notes?: string; photoUri?: string | null }
) {
  await db
    .update(foods)
    .set({
      name: input.name,
      carbsPer100g: input.carbsPer100g,
      source: input.source,
      notes: input.notes,
      photoUri: input.photoUri ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(foods.id, id));
}

// Ingrédient saisi depuis l'écran de recette (Ciqual ou à la main), créé
// seulement à l'enregistrement de la recette pour ne rien laisser derrière si
// on l'abandonne. `recipeOnly` le crée archivé : absent des listes et de la
// pesée, il n'existe que pour la recette.
export type NewRecipeIngredient = { name: string; source?: string; recipeOnly: boolean };

export type RecipeComponentInput = { weightG: number; carbsPer100gAtEntry: number } & (
  | { componentFoodId: number; newIngredient?: undefined }
  | { componentFoodId?: undefined; newIngredient: NewRecipeIngredient }
);

// Un aliment archivé n'existe plus que pour les recettes qui l'utilisent :
// quand la dernière le retire, il est supprimé (avec, pour une recette
// archivée, ses propres composants archivés devenus inutiles). Renvoie les
// photos à effacer une fois la transaction validée.
async function deleteUnusedArchivedFoods(tx: Tx, candidateIds: number[]): Promise<string[]> {
  const photos: string[] = [];
  const queue = [...new Set(candidateIds)];
  while (queue.length > 0) {
    const id = queue.pop() as number;
    const [food] = await tx.select().from(foods).where(eq(foods.id, id));
    if (!food?.isArchived) continue;
    const usages = await tx
      .select({ id: recipeComponents.id })
      .from(recipeComponents)
      .where(eq(recipeComponents.componentFoodId, id))
      .limit(1);
    if (usages.length > 0) continue;
    const children = await tx
      .select({ id: recipeComponents.componentFoodId })
      .from(recipeComponents)
      .where(eq(recipeComponents.recipeFoodId, id));
    queue.push(...children.map((c) => c.id));
    await tx.delete(foods).where(eq(foods.id, id));
    if (food.photoUri) photos.push(food.photoUri);
  }
  return photos;
}

// Une recette recalcule et écrase entièrement ses composants à chaque
// sauvegarde : c'est l'action explicite de "sauver la recette" qui fige les
// valeurs, pas une réaction automatique à l'édition d'un ingrédient existant.
export async function saveRecipe(
  recipeId: number | null,
  input: {
    name: string;
    notes?: string;
    photoUri?: string | null;
    cookedWeightG?: number | null;
    components: RecipeComponentInput[];
  }
) {
  const totals = computeRecipeTotals(
    input.components.map((c) => ({ weightG: c.weightG, carbsPer100g: c.carbsPer100gAtEntry })),
    input.cookedWeightG ?? null
  );
  if (input.cookedWeightG != null && !isCookedWeightPlausible(input.cookedWeightG, totals.rawWeightG)) {
    throw new Error("COOKED_WEIGHT_IMPLAUSIBLE");
  }
  const recipeValues = {
    name: input.name,
    carbsPer100g: totals.carbsPer100g,
    totalWeightG: totals.totalWeightG,
    totalCarbsG: totals.totalCarbsG,
    notes: input.notes,
    photoUri: input.photoUri ?? null,
  };

  const { id, orphanPhotos } = await db.transaction(async (tx) => {
    let foodId = recipeId;
    let previousComponentIds: number[] = [];
    if (foodId == null) {
      const [inserted] = await tx
        .insert(foods)
        .values({ ...recipeValues, type: "recipe" })
        .returning({ id: foods.id });
      foodId = inserted.id;
    } else {
      await tx
        .update(foods)
        .set({ ...recipeValues, updatedAt: new Date().toISOString() })
        .where(eq(foods.id, foodId));
      const previous = await tx
        .select({ id: recipeComponents.componentFoodId })
        .from(recipeComponents)
        .where(eq(recipeComponents.recipeFoodId, foodId));
      previousComponentIds = previous.map((c) => c.id);
      await tx.delete(recipeComponents).where(eq(recipeComponents.recipeFoodId, foodId));
    }

    const componentIds: number[] = [];
    for (const c of input.components) {
      if (c.newIngredient == null) {
        componentIds.push(c.componentFoodId);
        continue;
      }
      const [created] = await tx
        .insert(foods)
        .values({
          name: c.newIngredient.name,
          type: "ingredient",
          carbsPer100g: c.carbsPer100gAtEntry,
          source: c.newIngredient.source,
          isArchived: c.newIngredient.recipeOnly,
        })
        .returning({ id: foods.id });
      componentIds.push(created.id);
    }

    if (input.components.length > 0) {
      await tx.insert(recipeComponents).values(
        input.components.map((c, index) => ({
          recipeFoodId: foodId as number,
          componentFoodId: componentIds[index],
          weightG: c.weightG,
          carbsG: computeCarbsGrams(c.weightG, c.carbsPer100gAtEntry),
          position: index,
        }))
      );
    }

    const removedIds = previousComponentIds.filter((previousId) => !componentIds.includes(previousId));
    return { id: foodId, orphanPhotos: await deleteUnusedArchivedFoods(tx, removedIds) };
  });

  for (const uri of orphanPhotos) deletePhoto(uri);
  return id;
}

export async function isFoodUsedInRecipes(foodId: number): Promise<boolean> {
  const rows = await db
    .select({ id: recipeComponents.id })
    .from(recipeComponents)
    .where(eq(recipeComponents.componentFoodId, foodId))
    .limit(1);
  return rows.length > 0;
}

export async function archiveFood(id: number) {
  await db
    .update(foods)
    .set({ isArchived: true, updatedAt: new Date().toISOString() })
    .where(eq(foods.id, id));
}

// Lève une erreur explicite si l'aliment est référencé ailleurs, pour laisser
// l'écran appelant proposer l'archivage plutôt qu'échouer silencieusement.
export async function deleteFood(id: number, photoUri: string | null) {
  if (await isFoodUsedInRecipes(id)) {
    throw new Error("FOOD_IN_USE");
  }
  const orphanPhotos = await db.transaction(async (tx) => {
    const components = await tx
      .select({ id: recipeComponents.componentFoodId })
      .from(recipeComponents)
      .where(eq(recipeComponents.recipeFoodId, id));
    await tx.delete(foods).where(eq(foods.id, id));
    return deleteUnusedArchivedFoods(tx, components.map((c) => c.id));
  });
  if (photoUri) {
    deletePhoto(photoUri);
  }
  for (const uri of orphanPhotos) deletePhoto(uri);
}
