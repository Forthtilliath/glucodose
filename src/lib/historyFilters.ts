export type PeriodFilter = "all" | "today" | "7d" | "30d";

// Timestamp (ms) à partir duquel une pesée est incluse pour cette période, ou
// null pour "Tout" (pas de filtre de date). "today" part du début du jour
// calendaire courant, pas d'il y a 24h glissantes.
export function getPeriodStartMs(period: PeriodFilter, now = new Date()): number | null {
  if (period === "all") return null;
  if (period === "today") {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay.getTime();
  }
  const days = period === "7d" ? 7 : 30;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}
