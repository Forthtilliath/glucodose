export type RecentIdRow = { id: number | null; weighedAt: string };

const DEFAULT_LIMIT = 5;

// Ids distincts les plus récemment pesés, du plus récent au plus ancien.
// Générique (aliment ou récipient) : réutilisé par le sélecteur d'aliment de
// l'écran Peser et par le widget d'accueil (cycle "Récents" sur tap). `id`
// peut être null (aliment/récipient supprimé depuis, onDelete: set null) —
// ignoré, on ne peut plus le proposer.
export function getMostRecentIds(rows: RecentIdRow[], limit = DEFAULT_LIMIT): number[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.weighedAt).getTime() - new Date(a.weighedAt).getTime()
  );
  const seen = new Set<number>();
  const result: number[] = [];
  for (const row of sorted) {
    if (row.id == null || seen.has(row.id)) continue;
    seen.add(row.id);
    result.push(row.id);
    if (result.length >= limit) break;
  }
  return result;
}
