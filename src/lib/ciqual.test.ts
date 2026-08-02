import { normalizeForSearch } from "@forthtilliath/react-native-kit/utils/normalizeForSearch";

import { searchCiqualFoods } from "./ciqual";

describe("searchCiqualFoods", () => {
  it("ne renvoie rien en dessous de la longueur minimale de requête", () => {
    expect(searchCiqualFoods("a")).toEqual([]);
    expect(searchCiqualFoods("")).toEqual([]);
  });

  it("trouve un aliment courant de la base Ciqual", () => {
    const results = searchCiqualFoods("pomme de terre");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((food) => normalizeForSearch(food.name).includes("pomme de terre"))).toBe(true);
  });

  it("limite le nombre de résultats", () => {
    const results = searchCiqualFoods("pomme", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("trouve les oeufs même écrits avec la ligature Œ", () => {
    const results = searchCiqualFoods("Œuf");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((food) => /oeuf/i.test(food.name))).toBe(true);
  });
});
