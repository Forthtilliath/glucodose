import { buildExportFileName } from "./exportFileName";

describe("buildExportFileName", () => {
  it("compose le type, la date locale, l'heure et la version", () => {
    const date = new Date(2026, 9, 8, 9, 2);
    expect(buildExportFileName("sauvegarde", "json", date, "1.13.0")).toBe(
      "glucodose-sauvegarde-20261008-0902-v1.13.0.json"
    );
  });

  it("complète les mois, jours, heures et minutes à deux chiffres", () => {
    const date = new Date(2027, 0, 5, 0, 7);
    expect(buildExportFileName("historique", "pdf", date, "2.0.0")).toBe(
      "glucodose-historique-20270105-0007-v2.0.0.pdf"
    );
  });

  it("utilise la version de l'app par défaut", () => {
    expect(buildExportFileName("historique", "csv")).toMatch(
      /^glucodose-historique-\d{8}-\d{4}-v\d+\.\d+\.\d+\.csv$/
    );
  });
});
