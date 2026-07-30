import { desc } from "drizzle-orm";

import { db } from "@/db/client";
import { weighings } from "@/db/schema";
import { getPeriodStartMs } from "@/lib/historyFilters";

export type DailySummary = {
  carbsG: number;
  doseUnits: number;
  // Distingue "aucune pesée aujourd'hui" de "des pesées, mais sans dose"
  // (mode glucides seuls) : affichage différent dans le widget.
  hasAnyWeighing: boolean;
  hasAnyDose: boolean;
};

// Limité aux pesées récentes plutôt qu'à tout l'historique : largement
// suffisant pour couvrir une journée, sans avoir à filtrer par date en SQL
// (le format de `weighed_at`, écrit par le DEFAULT current_timestamp de
// SQLite, ne se compare pas fiablement en chaîne avec un ISO string JS —
// même limitation déjà gérée en filtrant côté JS dans l'écran Historique).
const RECENT_WEIGHINGS_LIMIT = 200;

export async function getTodaySummary(): Promise<DailySummary> {
  const startOfDayMs = getPeriodStartMs("today") as number;
  const recent = await db
    .select({
      weighedAt: weighings.weighedAt,
      carbsG: weighings.carbsG,
      totalInsulinUnits: weighings.totalInsulinUnits,
      ratioLabelSnapshot: weighings.ratioLabelSnapshot,
    })
    .from(weighings)
    .orderBy(desc(weighings.weighedAt))
    .limit(RECENT_WEIGHINGS_LIMIT);

  const todayRows = recent.filter((row) => new Date(row.weighedAt).getTime() >= startOfDayMs);

  return {
    carbsG: todayRows.reduce((sum, row) => sum + row.carbsG, 0),
    doseUnits: todayRows.reduce((sum, row) => sum + row.totalInsulinUnits, 0),
    hasAnyWeighing: todayRows.length > 0,
    hasAnyDose: todayRows.some((row) => row.ratioLabelSnapshot != null),
  };
}
