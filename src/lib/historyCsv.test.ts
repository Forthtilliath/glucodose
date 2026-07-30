import { buildHistoryCsv, type HistoryCsvRow } from "./historyCsv";

function buildRow(overrides: Partial<HistoryCsvRow> = {}): HistoryCsvRow {
  return {
    weighedAt: "2026-01-15T12:30:00.000Z",
    foodNameSnapshot: "Pomme",
    netWeightG: 200,
    carbsG: 24,
    ratioLabelSnapshot: null,
    totalInsulinUnits: 0,
    ...overrides,
  };
}

describe("buildHistoryCsv", () => {
  it("inclut l'en-tête même sans donnée", () => {
    const csv = buildHistoryCsv([]);
    expect(csv).toContain("Date;Aliment;Poids net (g);Glucides (g);Ratio;Dose (U)");
  });

  it("inclut le nom de l'aliment et le poids net de chaque pesée", () => {
    const csv = buildHistoryCsv([buildRow({ foodNameSnapshot: "Pomme golden", netWeightG: 150 })]);
    expect(csv).toContain("Pomme golden");
    expect(csv).toContain(";150;");
  });

  it("utilise la virgule comme séparateur décimal (Excel FR)", () => {
    const csv = buildHistoryCsv([buildRow({ carbsG: 24.5 })]);
    expect(csv).toContain(";24,5;");
    expect(csv).not.toContain("24.5");
  });

  it("laisse le ratio et la dose vides pour une pesée sans ratio", () => {
    const csv = buildHistoryCsv([buildRow({ ratioLabelSnapshot: null, totalInsulinUnits: 3 })]);
    const dataLine = csv.split("\r\n")[1];
    expect(dataLine.endsWith(";;")).toBe(true);
  });

  it("inclut le ratio et la dose pour une pesée avec calcul de dose", () => {
    const csv = buildHistoryCsv([buildRow({ ratioLabelSnapshot: "Midi", totalInsulinUnits: 3.5 })]);
    expect(csv).toContain("Midi;3,5");
  });

  it("échappe les champs contenant le délimiteur ou des guillemets", () => {
    const csv = buildHistoryCsv([buildRow({ foodNameSnapshot: 'Riz; "spécial"' })]);
    expect(csv).toContain('"Riz; ""spécial"""');
  });
});
