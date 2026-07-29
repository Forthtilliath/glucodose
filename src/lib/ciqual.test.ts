import { normalizeForSearch, rankByNameMatch, searchCiqualFoods } from "./ciqual";

describe("normalizeForSearch", () => {
  it("met en minuscules et retire les accents", () => {
    expect(normalizeForSearch("Pâtes À La Crème")).toBe("pates a la creme");
  });

  it("retire les espaces en début/fin", () => {
    expect(normalizeForSearch("  Pomme  ")).toBe("pomme");
  });
});

describe("rankByNameMatch", () => {
  type Item = { label: string };
  const getName = (item: Item) => item.label;

  it("ne garde que les éléments dont le nom contient la recherche", () => {
    const items: Item[] = [{ label: "Pomme" }, { label: "Poire" }, { label: "Banane" }];
    const result = rankByNameMatch(items, "po", getName);
    expect(result.map(getName)).toEqual(["Pomme", "Poire"]);
  });

  it("classe par position du match dans le nom (plus tôt = plus pertinent)", () => {
    const items: Item[] = [
      { label: "Salade de pomme de terre" },
      { label: "Pomme de terre" },
    ];
    const result = rankByNameMatch(items, "pomme de terre", getName);
    expect(result.map(getName)).toEqual(["Pomme de terre", "Salade de pomme de terre"]);
  });

  it("à position égale, classe par longueur de nom croissante", () => {
    const items: Item[] = [{ label: "Pomme golden bio" }, { label: "Pomme" }];
    const result = rankByNameMatch(items, "pomme", getName);
    expect(result.map(getName)).toEqual(["Pomme", "Pomme golden bio"]);
  });

  it("ignore les accents et la casse dans la recherche comme dans les noms", () => {
    const items: Item[] = [{ label: "Crème fraîche" }];
    expect(rankByNameMatch(items, "creme", getName)).toHaveLength(1);
    expect(rankByNameMatch(items, "CRÈME", getName)).toHaveLength(1);
  });

  it("retourne un tableau vide si rien ne correspond", () => {
    const items: Item[] = [{ label: "Pomme" }];
    expect(rankByNameMatch(items, "xyz", getName)).toEqual([]);
  });
});

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
});
