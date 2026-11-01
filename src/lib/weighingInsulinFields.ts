type GlycemiaUnit = "mmol/L" | "g/L";

export type WeighingInsulinFields = {
  ratioId: number | null;
  ratioLabel: string | null;
  carbsGramsPerUnit: number | null;
  mealInsulinUnits: number;
  glycemiaUnit: GlycemiaUnit | null;
  currentGlycemia: number | null;
  targetGlycemia: number | null;
  sensitivityFactor: number | null;
  correctionInsulinUnits: number;
  totalInsulinUnits: number;
};

type Input = {
  showInsulinDose: boolean;
  ratio: { id: number; label: string; carbsGramsPerUnit: number } | null;
  mealInsulinUnits: number;
  glycemiaUnit: GlycemiaUnit | null;
  // NaN quand le champ est vide ou illisible.
  currentGlycemia: number;
  targetGlycemia: number | null;
  sensitivityFactor: number | null;
  correctionInsulinUnits: number;
  totalInsulinUnits: number;
};

// Regroupe tous les champs liés au calcul de dose : quand ce calcul est
// désactivé (mode "glucides seuls"), la pesée est quand même enregistrée,
// juste sans aucune de ces valeurs.
export function buildWeighingInsulinFields({ showInsulinDose, ratio, currentGlycemia, ...dose }: Input): WeighingInsulinFields {
  if (!showInsulinDose || !ratio) {
    return {
      ratioId: null,
      ratioLabel: null,
      carbsGramsPerUnit: null,
      mealInsulinUnits: 0,
      glycemiaUnit: null,
      currentGlycemia: null,
      targetGlycemia: null,
      sensitivityFactor: null,
      correctionInsulinUnits: 0,
      totalInsulinUnits: 0,
    };
  }
  return {
    ratioId: ratio.id,
    ratioLabel: ratio.label,
    carbsGramsPerUnit: ratio.carbsGramsPerUnit,
    currentGlycemia: Number.isNaN(currentGlycemia) ? null : currentGlycemia,
    ...dose,
  };
}
