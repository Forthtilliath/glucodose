import { getPeriodStartMs } from "./historyFilters";

// Mercredi 15 janvier 2026, 14h30.
const NOW = new Date(2026, 0, 15, 14, 30, 0);

describe("getPeriodStartMs", () => {
  it("retourne null pour 'all' (aucun filtre de date)", () => {
    expect(getPeriodStartMs("all", NOW)).toBeNull();
  });

  it("retourne le début du jour calendaire courant pour 'today'", () => {
    const startOfDay = new Date(2026, 0, 15, 0, 0, 0, 0).getTime();
    expect(getPeriodStartMs("today", NOW)).toBe(startOfDay);
  });

  it("retourne 7 jours en arrière pour '7d'", () => {
    const expected = NOW.getTime() - 7 * 24 * 60 * 60 * 1000;
    expect(getPeriodStartMs("7d", NOW)).toBe(expected);
  });

  it("retourne 30 jours en arrière pour '30d'", () => {
    const expected = NOW.getTime() - 30 * 24 * 60 * 60 * 1000;
    expect(getPeriodStartMs("30d", NOW)).toBe(expected);
  });
});
