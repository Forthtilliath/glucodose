import { buildWeighingInsulinFields } from "./weighingInsulinFields";

const base = {
  showInsulinDose: true,
  ratio: { id: 3, label: "Midi", carbsGramsPerUnit: 10 },
  mealInsulinUnits: 5,
  glycemiaUnit: "mmol/L" as const,
  currentGlycemia: 9.5,
  targetGlycemia: 6,
  sensitivityFactor: 2,
  correctionInsulinUnits: 1.75,
  totalInsulinUnits: 6.75,
};

describe("buildWeighingInsulinFields", () => {
  it("reprend le ratio et les doses quand le calcul de dose est activé", () => {
    expect(buildWeighingInsulinFields(base)).toEqual({
      ratioId: 3,
      ratioLabel: "Midi",
      carbsGramsPerUnit: 10,
      mealInsulinUnits: 5,
      glycemiaUnit: "mmol/L",
      currentGlycemia: 9.5,
      targetGlycemia: 6,
      sensitivityFactor: 2,
      correctionInsulinUnits: 1.75,
      totalInsulinUnits: 6.75,
    });
  });

  it("enregistre une glycémie absente (champ vide) comme null", () => {
    expect(buildWeighingInsulinFields({ ...base, currentGlycemia: NaN }).currentGlycemia).toBeNull();
  });

  it.each([
    ["le calcul de dose est désactivé", { showInsulinDose: false }],
    ["aucun ratio n'est choisi", { ratio: null }],
  ])("vide tous les champs de dose quand %s", (_, override) => {
    expect(buildWeighingInsulinFields({ ...base, ...override })).toEqual({
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
    });
  });
});
