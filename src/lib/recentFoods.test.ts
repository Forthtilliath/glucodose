import { getRecentFoodIds, type RecentFoodRow } from "./recentFoods";

function row(foodId: number | null, weighedAt: string): RecentFoodRow {
  return { foodId, weighedAt };
}

describe("getRecentFoodIds", () => {
  it("retourne un tableau vide sans pesée", () => {
    expect(getRecentFoodIds([])).toEqual([]);
  });

  it("trie du plus récent au plus ancien", () => {
    const rows = [row(1, "2026-01-01T00:00:00.000Z"), row(2, "2026-01-03T00:00:00.000Z"), row(3, "2026-01-02T00:00:00.000Z")];
    expect(getRecentFoodIds(rows)).toEqual([2, 3, 1]);
  });

  it("dédoublonne un aliment pesé plusieurs fois, en gardant sa pesée la plus récente pour le tri", () => {
    const rows = [
      row(1, "2026-01-01T00:00:00.000Z"),
      row(2, "2026-01-02T00:00:00.000Z"),
      row(1, "2026-01-05T00:00:00.000Z"),
    ];
    expect(getRecentFoodIds(rows)).toEqual([1, 2]);
  });

  it("ignore les pesées dont l'aliment a été supprimé (foodId null)", () => {
    const rows = [row(null, "2026-01-05T00:00:00.000Z"), row(1, "2026-01-01T00:00:00.000Z")];
    expect(getRecentFoodIds(rows)).toEqual([1]);
  });

  it("respecte la limite fournie", () => {
    const rows = [1, 2, 3, 4, 5, 6].map((id) => row(id, `2026-01-0${id}T00:00:00.000Z`));
    expect(getRecentFoodIds(rows, 3)).toEqual([6, 5, 4]);
  });
});
