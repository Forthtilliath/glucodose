import { BackupValidationError, validateBackupRows } from "./backupValidation";

function backupWith(overrides: Record<string, unknown[]> = {}) {
  return {
    containers: [{ id: 1, name: "Bol", tareWeightG: 120, photoUri: null, notes: null }],
    foods: [
      { id: 1, name: "Riz", type: "ingredient", carbsPer100g: 28 },
      { id: 2, name: "Salade de riz", type: "recipe", carbsPer100g: 20, totalWeightG: 500, totalCarbsG: 100 },
    ],
    recipeComponents: [{ id: 1, recipeFoodId: 2, componentFoodId: 1, weightG: 300, carbsG: 84 }],
    insulinRatios: [{ id: 1, label: "Midi", carbsGramsPerUnit: 10 }],
    settings: [{ id: 1, glycemiaUnit: "g/L", targetGlycemia: 1.2, sensitivityFactor: 0.4 }],
    weighings: [
      {
        id: 1, foodId: 1, foodNameSnapshot: "Riz", containerId: 1, grossWeightG: 320, netWeightG: 200,
        carbsPer100gSnapshot: 28, carbsG: 56, ratioId: 1, mealInsulinUnits: 5.6, totalInsulinUnits: 5.6,
      },
    ],
    ...overrides,
  };
}

describe("validateBackupRows", () => {
  it("accepte une sauvegarde cohérente", () => {
    expect(validateBackupRows(backupWith()).insulinRatios[0].carbsGramsPerUnit).toBe(10);
  });

  it("ignore les colonnes inconnues", () => {
    const result = validateBackupRows(
      backupWith({ insulinRatios: [{ id: 1, label: "Midi", carbsGramsPerUnit: 10, injected: "x" }] })
    );

    expect(result.insulinRatios[0]).not.toHaveProperty("injected");
  });

  it.each([
    ["négatif", -10],
    ["nul", 0],
    ["en texte", "10"],
    ["absurde", 5000],
  ])("rejette un ratio d'insuline %s", (_label, carbsGramsPerUnit) => {
    const data = backupWith({ insulinRatios: [{ id: 1, label: "Midi", carbsGramsPerUnit }] });

    expect(() => validateBackupRows(data)).toThrow(BackupValidationError);
  });

  it("rejette un facteur de sensibilité négatif", () => {
    const data = backupWith({ settings: [{ id: 1, sensitivityFactor: -1 }] });

    expect(() => validateBackupRows(data)).toThrow("sensitivityFactor");
  });

  it("rejette un taux de glucides supérieur à 100 g pour 100 g", () => {
    const data = backupWith({ foods: [{ id: 1, name: "Riz", type: "ingredient", carbsPer100g: 280 }] });

    expect(() => validateBackupRows(data)).toThrow("carbsPer100g");
  });

  it("rejette un champ obligatoire manquant", () => {
    const data = backupWith({ insulinRatios: [{ id: 1, label: "Midi" }] });

    expect(() => validateBackupRows(data)).toThrow("manquant");
  });

  it("rejette un identifiant en double", () => {
    const ratio = { id: 1, label: "Midi", carbsGramsPerUnit: 10 };

    expect(() => validateBackupRows(backupWith({ insulinRatios: [ratio, ratio] }))).toThrow("en double");
  });

  it("rejette une recette qui pointe vers un aliment absent", () => {
    const data = backupWith({
      recipeComponents: [{ id: 1, recipeFoodId: 2, componentFoodId: 99, weightG: 300, carbsG: 84 }],
    });

    expect(() => validateBackupRows(data)).toThrow("aliment introuvable");
  });

  it("rejette un texte démesuré", () => {
    const data = backupWith({ foods: [{ id: 1, name: "R".repeat(201), type: "ingredient", carbsPer100g: 28 }] });

    expect(() => validateBackupRows(data)).toThrow("foods[0] : « name » invalide.");
  });

  it("rejette une date qui n'en est pas une", () => {
    const data = backupWith({
      containers: [{ id: 1, name: "Bol", tareWeightG: 120, createdAt: "<script>" }],
    });

    expect(() => validateBackupRows(data)).toThrow("« createdAt » invalide");
  });

  it("accepte les dates de SQLite comme les dates ISO", () => {
    const data = backupWith({
      containers: [
        { id: 1, name: "Bol", tareWeightG: 120, createdAt: "2026-10-09 19:46:00", updatedAt: "2026-10-09T19:46:00.000Z" },
      ],
    });

    expect(validateBackupRows(data).containers[0].createdAt).toBe("2026-10-09 19:46:00");
  });

  it("rejette une table trop longue (une seule ligne de réglages)", () => {
    const data = backupWith({ settings: [{ id: 1 }, { id: 2 }] });

    expect(() => validateBackupRows(data)).toThrow("settings : 1 lignes au maximum.");
  });

  it("rejette une table qui n'est pas une liste, ou une ligne qui n'est pas un objet", () => {
    expect(() => validateBackupRows(backupWith({ foods: "x" as unknown as unknown[] }))).toThrow("liste attendue");
    expect(() => validateBackupRows(backupWith({ containers: [42] }))).toThrow("containers[0] : ligne invalide.");
  });

  it("détache les références orphelines de l'historique sans rejeter le fichier", () => {
    const result = validateBackupRows(backupWith({ insulinRatios: [] }));

    expect(result.weighings[0].ratioId).toBeNull();
    expect(result.weighings[0].foodId).toBe(1);
  });
});
