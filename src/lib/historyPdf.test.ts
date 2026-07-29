import { buildHistoryHtml, type HistoryPdfRow } from "./historyPdf";

function buildRow(overrides: Partial<HistoryPdfRow> = {}): HistoryPdfRow {
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

describe("buildHistoryHtml", () => {
  it("inclut le titre fourni", () => {
    const html = buildHistoryHtml([], "Historique — 7 jours");
    expect(html).toContain("Historique — 7 jours");
  });

  it("affiche un message quand il n'y a aucune pesée", () => {
    const html = buildHistoryHtml([]);
    expect(html).toContain("Aucune pesée.");
    expect(html).toContain("0 pesée");
  });

  it("inclut le nom de l'aliment et le poids net de chaque pesée", () => {
    const html = buildHistoryHtml([buildRow({ foodNameSnapshot: "Pomme golden", netWeightG: 150 })]);
    expect(html).toContain("Pomme golden");
    expect(html).toContain("150 g");
  });

  it("affiche la dose seulement pour les pesées avec un ratio", () => {
    const withDose = buildHistoryHtml([
      buildRow({ ratioLabelSnapshot: "Midi", totalInsulinUnits: 3.5 }),
    ]);
    expect(withDose).toContain("3.5 U");

    const withoutDose = buildHistoryHtml([buildRow({ ratioLabelSnapshot: null })]);
    expect(withoutDose).toContain("—");
  });

  it("échappe les caractères HTML dans le nom de l'aliment", () => {
    const html = buildHistoryHtml([buildRow({ foodNameSnapshot: "<script>alert(1)</script>" })]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("accorde 'pesée' au pluriel à partir de 2", () => {
    const html = buildHistoryHtml([buildRow(), buildRow()]);
    expect(html).toContain("2 pesées");
  });
});
