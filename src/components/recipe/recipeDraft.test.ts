import type { foods } from "@/db/schema";
import { describeRow, toComponentInput } from "./recipeDraft";

type Food = typeof foods.$inferSelect;

const food = (overrides: Partial<Food>): Food => ({
  id: 1,
  name: "Farine",
  type: "ingredient",
  carbsPer100g: 70,
  totalWeightG: null,
  totalCarbsG: null,
  source: null,
  notes: null,
  photoUri: null,
  isArchived: false,
  createdAt: "2026-11-01 10:00:00",
  updatedAt: "2026-11-01 10:00:00",
  ...overrides,
});

describe("describeRow", () => {
  it("garde le nom et le taux d'un aliment archivé", () => {
    const foodMap = new Map([[1, food({ name: "Légumes", carbsPer100g: 6, isArchived: true })]]);
    const info = describeRow({ key: "0", weightG: "100", foodId: 1 }, foodMap);
    expect(info).toEqual({ name: "Légumes", carbsPer100g: 6, tag: "propre à la recette", missing: false });
  });

  it("signale un aliment introuvable", () => {
    expect(describeRow({ key: "0", weightG: "100", foodId: 9 }, new Map()).missing).toBe(true);
  });
});

describe("toComponentInput", () => {
  it("transmet un nouvel ingrédient avec son taux et le poids lu avec une virgule", () => {
    const row = {
      key: "0",
      weightG: "12,5",
      newIngredient: { name: "Poireau", carbsPer100g: 4, source: "Ciqual", recipeOnly: false },
    };
    expect(toComponentInput(row, describeRow(row, new Map()))).toEqual({
      newIngredient: { name: "Poireau", source: "Ciqual", recipeOnly: false },
      weightG: 12.5,
      carbsPer100gAtEntry: 4,
    });
  });
});
