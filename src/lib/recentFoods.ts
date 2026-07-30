export type RecentFoodRow = { foodId: number | null; weighedAt: string };

const DEFAULT_LIMIT = 5;

// Ids d'aliments distincts les plus récemment pesés, du plus récent au plus
// ancien. `foodId` peut être null (aliment supprimé depuis, onDelete: set
// null) — ignoré, on ne peut plus le proposer dans un sélecteur.
export function getRecentFoodIds(rows: RecentFoodRow[], limit = DEFAULT_LIMIT): number[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.weighedAt).getTime() - new Date(a.weighedAt).getTime()
  );
  const seen = new Set<number>();
  const result: number[] = [];
  for (const row of sorted) {
    if (row.foodId == null || seen.has(row.foodId)) continue;
    seen.add(row.foodId);
    result.push(row.foodId);
    if (result.length >= limit) break;
  }
  return result;
}
