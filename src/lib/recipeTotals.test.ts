import { computeRecipeTotals, isCookedWeightPlausible, storedCookedWeight } from "./recipeTotals";

describe("computeRecipeTotals", () => {
  const components = [
    { weightG: 200, carbsPer100g: 70 },
    { weightG: 100, carbsPer100g: 100 },
  ];

  it("utilise la somme des crus sans poids cuit", () => {
    const totals = computeRecipeTotals(components, null);
    expect(totals.rawWeightG).toBe(300);
    expect(totals.totalWeightG).toBe(300);
    expect(totals.totalCarbsG).toBe(240);
    expect(totals.carbsPer100g).toBeCloseTo(80);
  });

  it("rapporte les glucides au poids cuit s'il est renseigné", () => {
    const totals = computeRecipeTotals(components, 240);
    expect(totals.rawWeightG).toBe(300);
    expect(totals.totalWeightG).toBe(240);
    expect(totals.carbsPer100g).toBeCloseTo(100);
  });
});

describe("isCookedWeightPlausible", () => {
  it("accepte une perte ou un gain d'eau réaliste", () => {
    expect(isCookedWeightPlausible(240, 300)).toBe(true);
    expect(isCookedWeightPlausible(900, 300)).toBe(true);
  });

  it("refuse une faute de frappe ou une recette vide", () => {
    expect(isCookedWeightPlausible(24, 300)).toBe(false);
    expect(isCookedWeightPlausible(2400, 300)).toBe(false);
    expect(isCookedWeightPlausible(100, 0)).toBe(false);
  });
});

describe("storedCookedWeight", () => {
  it("ne voit pas de poids cuit quand le total égale la somme des crus", () => {
    expect(storedCookedWeight(300, [200, 100])).toBeNull();
    expect(storedCookedWeight(null, [200])).toBeNull();
  });

  it("retrouve le poids cuit enregistré", () => {
    expect(storedCookedWeight(240, [200, 100])).toBe(240);
  });
});
