import { computeCarbsGrams, computeRecipeCarbsPer100g } from "@/lib/insulin";

// Poids du plat cuit, facultatif : un plat qui perd de l'eau à la cuisson
// (quiche, gratin) est plus concentré en glucides que la somme de ses
// ingrédients crus ; un plat qui en absorbe (riz, pâtes) l'est moins. Les
// bornes écartent les fautes de frappe (un zéro en trop ou en moins) sans
// bloquer le riz, qui pèse jusqu'à ~3 fois son poids cru.
export const MIN_COOKED_RATIO = 0.1;
export const MAX_COOKED_RATIO = 4;

// Écart en dessous duquel un poids total enregistré est considéré égal à la
// somme des crus (arrondis flottants).
const SAME_WEIGHT_TOLERANCE_G = 0.5;

export function isCookedWeightPlausible(cookedWeightG: number, rawWeightG: number): boolean {
  return (
    rawWeightG > 0 &&
    cookedWeightG >= rawWeightG * MIN_COOKED_RATIO &&
    cookedWeightG <= rawWeightG * MAX_COOKED_RATIO
  );
}

export type RecipeTotals = {
  rawWeightG: number;
  totalWeightG: number;
  totalCarbsG: number;
  carbsPer100g: number;
};

// Le poids qui sert au taux pour 100 g est le poids cuit s'il est renseigné,
// sinon la somme des ingrédients crus (comportement historique).
export function computeRecipeTotals(
  components: { weightG: number; carbsPer100g: number }[],
  cookedWeightG: number | null
): RecipeTotals {
  const rawWeightG = components.reduce((sum, c) => sum + c.weightG, 0);
  const totalCarbsG = components.reduce((sum, c) => sum + computeCarbsGrams(c.weightG, c.carbsPer100g), 0);
  const totalWeightG = cookedWeightG ?? rawWeightG;
  return {
    rawWeightG,
    totalWeightG,
    totalCarbsG,
    carbsPer100g: computeRecipeCarbsPer100g(totalCarbsG, totalWeightG),
  };
}

// Le poids cuit n'a pas de colonne dédiée : il se déduit d'un poids total
// enregistré différent de la somme des composants crus.
export function storedCookedWeight(totalWeightG: number | null, componentWeightsG: number[]): number | null {
  if (totalWeightG == null || componentWeightsG.length === 0) return null;
  const rawWeightG = componentWeightsG.reduce((sum, w) => sum + w, 0);
  return Math.abs(totalWeightG - rawWeightG) > SAME_WEIGHT_TOLERANCE_G ? totalWeightG : null;
}
