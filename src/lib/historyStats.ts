import { getPeriodStartMs, type PeriodFilter } from "@forthtilliath/react-native-kit/utils/getPeriodStartMs";

export type HistoryStatsRow = { weighedAt: string; carbsG: number; foodNameSnapshot: string };

export type HistoryStats = {
  totalWeighings: number;
  avgCarbsPerDay: number;
  weighingsPerWeek: number;
  topFoods: { name: string; count: number }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_FOODS_LIMIT = 5;

// Nombre de jours calendaires couverts par la période, dénominateur des
// moyennes. Pour "tout", basé sur l'étalement réel des données (de la pesée
// la plus ancienne à aujourd'hui) plutôt qu'une valeur arbitraire.
function periodDays(period: PeriodFilter, rowsInPeriod: HistoryStatsRow[], now: Date): number {
  if (period === "today") return 1;
  if (period === "7d") return 7;
  if (period === "30d") return 30;
  if (rowsInPeriod.length === 0) return 0;
  const earliestMs = Math.min(...rowsInPeriod.map((row) => new Date(row.weighedAt).getTime()));
  // +1 pour un compte inclusif : une pesée aujourd'hui et une il y a 9 jours
  // couvrent 10 jours calendaires distincts, pas 9 (l'écart brut en ms).
  return Math.max(1, Math.floor((now.getTime() - earliestMs) / DAY_MS) + 1);
}

export function computeHistoryStats(
  rows: HistoryStatsRow[],
  period: PeriodFilter,
  now = new Date()
): HistoryStats {
  const startMs = getPeriodStartMs(period, now);
  const rowsInPeriod =
    startMs == null ? rows : rows.filter((row) => new Date(row.weighedAt).getTime() >= startMs);

  const days = periodDays(period, rowsInPeriod, now);
  const totalCarbs = rowsInPeriod.reduce((sum, row) => sum + row.carbsG, 0);

  const countByFood = new Map<string, number>();
  for (const row of rowsInPeriod) {
    countByFood.set(row.foodNameSnapshot, (countByFood.get(row.foodNameSnapshot) ?? 0) + 1);
  }
  const topFoods = [...countByFood.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_FOODS_LIMIT)
    .map(([name, count]) => ({ name, count }));

  return {
    totalWeighings: rowsInPeriod.length,
    avgCarbsPerDay: days > 0 ? totalCarbs / days : 0,
    weighingsPerWeek: days > 0 ? (rowsInPeriod.length / days) * 7 : 0,
    topFoods,
  };
}
