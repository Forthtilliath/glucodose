// Un seul endroit pour ces calculs : tous les écrans doivent passer par ici
// plutôt que de réimplémenter la formule, pour garantir un résultat cohérent
// partout. Modèle basé sur la méthode avancée du calcul des glucides :
// aliment → glucides → dose repas (ratio) → + dose de correction (glycémie).

export function computeNetWeight(grossWeightG: number, tareWeightG: number): number {
  return Math.max(0, grossWeightG - tareWeightG);
}

// Glucides contenus dans le poids net pesé, à partir du taux de l'aliment.
export function computeCarbsGrams(netWeightG: number, carbsPer100g: number): number {
  return (netWeightG / 100) * carbsPer100g;
}

export function computeRecipeCarbsPer100g(totalCarbsG: number, totalWeightG: number): number {
  if (totalWeightG <= 0) return 0;
  return (totalCarbsG / totalWeightG) * 100;
}

// Dose repas = glucides ÷ ratio (grammes de glucides couverts par 1 unité).
export function computeMealInsulinUnits(carbsG: number, carbsGramsPerUnit: number): number {
  if (carbsGramsPerUnit <= 0) return 0;
  return carbsG / carbsGramsPerUnit;
}

// Dose de correction = (glycémie actuelle − glycémie cible) ÷ facteur de
// sensibilité. On ne corrige jamais en négatif ici (sous la cible, la
// gestion de l'hypoglycémie relève d'une autre logique, pas de cette app).
export function computeCorrectionInsulinUnits(
  currentGlycemia: number,
  targetGlycemia: number,
  sensitivityFactor: number
): number {
  if (sensitivityFactor <= 0) return 0;
  return Math.max(0, (currentGlycemia - targetGlycemia) / sensitivityFactor);
}

// L'arrondi ne doit jamais être fait avant l'enregistrement en base : une
// recette à plusieurs composants cumulerait les erreurs d'arrondi.
export function formatInsulinUnits(units: number, decimals = 1): string {
  return units.toFixed(decimals);
}

export function formatWeight(grams: number, decimals = 0): string {
  return `${grams.toFixed(decimals)} g`;
}

export function formatCarbs(grams: number, decimals = 1): string {
  return `${grams.toFixed(decimals)} g`;
}
