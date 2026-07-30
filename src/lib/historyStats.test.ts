import { computeHistoryStats, type HistoryStatsRow } from "./historyStats";

// Mercredi 15 janvier 2026, 14h30.
const NOW = new Date(2026, 0, 15, 14, 30, 0);

function row(daysAgo: number, carbsG: number, foodName = "Pomme"): HistoryStatsRow {
  const weighedAt = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { weighedAt, carbsG, foodNameSnapshot: foodName };
}

describe("computeHistoryStats", () => {
  it("retourne des stats à zéro sans aucune pesée", () => {
    const stats = computeHistoryStats([], "30d", NOW);
    expect(stats).toEqual({ totalWeighings: 0, avgCarbsPerDay: 0, weighingsPerWeek: 0, topFoods: [] });
  });

  it("calcule la moyenne de glucides/jour sur la période demandée", () => {
    const rows = [row(0, 20), row(1, 40), row(10, 999)]; // hors période 7d
    const stats = computeHistoryStats(rows, "7d", NOW);
    expect(stats.totalWeighings).toBe(2);
    expect(stats.avgCarbsPerDay).toBeCloseTo((20 + 40) / 7);
  });

  it("calcule le nombre de pesées/semaine", () => {
    const rows = [row(0, 10), row(1, 10), row(2, 10), row(3, 10)];
    const stats = computeHistoryStats(rows, "7d", NOW);
    expect(stats.weighingsPerWeek).toBeCloseTo((4 / 7) * 7);
  });

  it("classe les aliments les plus utilisés par nombre de pesées", () => {
    const rows = [
      row(0, 10, "Pomme"),
      row(1, 10, "Pomme"),
      row(2, 10, "Riz"),
      row(3, 10, "Pomme"),
      row(4, 10, "Riz"),
    ];
    const stats = computeHistoryStats(rows, "30d", NOW);
    expect(stats.topFoods[0]).toEqual({ name: "Pomme", count: 3 });
    expect(stats.topFoods[1]).toEqual({ name: "Riz", count: 2 });
  });

  it("pour 'tout', base le nombre de jours sur l'étalement réel des données", () => {
    const rows = [row(0, 30), row(9, 30)]; // 10 jours d'étalement (0 à 9)
    const stats = computeHistoryStats(rows, "all", NOW);
    expect(stats.avgCarbsPerDay).toBeCloseTo(60 / 10);
  });

  it("ignore les pesées hors de la période sélectionnée", () => {
    const rows = [row(0, 10), row(40, 999)];
    const stats = computeHistoryStats(rows, "30d", NOW);
    expect(stats.totalWeighings).toBe(1);
  });
});
