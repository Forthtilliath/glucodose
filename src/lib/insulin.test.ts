import {
  computeCarbsGrams,
  computeCorrectionInsulinUnits,
  computeMealInsulinUnits,
  computeNetWeight,
  computeRecipeCarbsPer100g,
  formatCarbs,
  formatInsulinUnits,
  formatWeight,
} from "./insulin";

describe("computeNetWeight", () => {
  it("soustrait la tare du poids brut", () => {
    expect(computeNetWeight(350, 150)).toBe(200);
  });

  it("ne descend jamais sous zéro si la tare dépasse le poids brut", () => {
    expect(computeNetWeight(100, 150)).toBe(0);
  });

  it("gère une tare nulle", () => {
    expect(computeNetWeight(250, 0)).toBe(250);
  });
});

describe("computeCarbsGrams", () => {
  it("calcule les glucides au prorata du poids net pesé", () => {
    // 200g d'un aliment à 56 g de glucides pour 100g -> 112g de glucides
    expect(computeCarbsGrams(200, 56)).toBeCloseTo(112);
  });

  it("retourne 0 si le poids net est nul", () => {
    expect(computeCarbsGrams(0, 56)).toBe(0);
  });

  it("retourne 0 si l'aliment ne contient pas de glucides", () => {
    expect(computeCarbsGrams(150, 0)).toBe(0);
  });
});

describe("computeRecipeCarbsPer100g", () => {
  it("déduit le taux de glucides pour 100g à partir des totaux", () => {
    // 9.6g de glucides pour 200g de recette -> 4.8g / 100g
    expect(computeRecipeCarbsPer100g(9.6, 200)).toBeCloseTo(4.8);
  });

  it("retourne 0 si le poids total est nul (évite une division par zéro)", () => {
    expect(computeRecipeCarbsPer100g(10, 0)).toBe(0);
  });

  it("retourne 0 si le poids total est négatif", () => {
    expect(computeRecipeCarbsPer100g(10, -50)).toBe(0);
  });
});

describe("computeMealInsulinUnits", () => {
  it("divise les glucides par le ratio (grammes couverts par 1 unité)", () => {
    // 60g de glucides, ratio 1 unité pour 10g -> 6 unités
    expect(computeMealInsulinUnits(60, 10)).toBeCloseTo(6);
  });

  it("retourne 0 si le ratio est nul (évite une division par zéro)", () => {
    expect(computeMealInsulinUnits(60, 0)).toBe(0);
  });

  it("retourne 0 si le ratio est négatif", () => {
    expect(computeMealInsulinUnits(60, -10)).toBe(0);
  });
});

describe("computeCorrectionInsulinUnits", () => {
  it("calcule la dose de correction quand la glycémie dépasse la cible", () => {
    // écart de 6 mmol/L, facteur de sensibilité 3 -> 2 unités
    expect(computeCorrectionInsulinUnits(12, 6, 3)).toBeCloseTo(2);
  });

  it("ne renvoie jamais une correction négative si la glycémie est sous la cible", () => {
    expect(computeCorrectionInsulinUnits(4, 6, 3)).toBe(0);
  });

  it("renvoie 0 si la glycémie est exactement à la cible", () => {
    expect(computeCorrectionInsulinUnits(6, 6, 3)).toBe(0);
  });

  it("retourne 0 si le facteur de sensibilité est nul ou négatif", () => {
    expect(computeCorrectionInsulinUnits(12, 6, 0)).toBe(0);
    expect(computeCorrectionInsulinUnits(12, 6, -1)).toBe(0);
  });
});

describe("formatInsulinUnits", () => {
  it("arrondit à 1 décimale par défaut", () => {
    expect(formatInsulinUnits(2.36666666666666667)).toBe("2.4");
  });

  it("accepte un nombre de décimales personnalisé", () => {
    expect(formatInsulinUnits(2.36666666666666667, 2)).toBe("2.37");
  });
});

describe("formatWeight", () => {
  it("arrondit à l'entier par défaut et ajoute l'unité", () => {
    expect(formatWeight(199.6)).toBe("200 g");
  });
});

describe("formatCarbs", () => {
  it("arrondit à 1 décimale et ajoute l'unité", () => {
    expect(formatCarbs(2.36666666666666667)).toBe("2.4 g");
  });
});

describe("scénario complet : pesée avec correction (bout en bout)", () => {
  it("reproduit l'exemple du guide de calcul de glucides (Diabète Québec)", () => {
    // Déjeuner à 50g de glucides, ratio 1:10, glycémie 12 mmol/L pour une
    // cible de 6 mmol/L et un facteur de sensibilité de 3.
    const netWeightG = computeNetWeight(500, 0);
    const carbsG = computeCarbsGrams(netWeightG, 10); // aliment fictif à 10g/100g -> 50g de glucides pour 500g
    const mealUnits = computeMealInsulinUnits(carbsG, 10);
    const correctionUnits = computeCorrectionInsulinUnits(12, 6, 3);

    expect(carbsG).toBeCloseTo(50);
    expect(mealUnits).toBeCloseTo(5);
    expect(correctionUnits).toBeCloseTo(2);
    expect(mealUnits + correctionUnits).toBeCloseTo(7);
  });
});
