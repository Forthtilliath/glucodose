import * as Print from "expo-print";
import { escapeHtml } from "@forthtilliath/react-native-kit/utils/escapeHtml";

import { formatCarbs, formatInsulinUnits, formatWeight } from "./insulin";

export type HistoryPdfRow = {
  weighedAt: string;
  foodNameSnapshot: string;
  netWeightG: number;
  carbsG: number;
  ratioLabelSnapshot: string | null;
  totalInsulinUnits: number;
};

// Générée séparément de l'appel à expo-print (natif, non testable) pour
// pouvoir vérifier le contenu du rapport par un test unitaire.
export function buildHistoryHtml(rows: HistoryPdfRow[], title = "Historique des pesées"): string {
  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(new Date(row.weighedAt).toLocaleString("fr-FR"))}</td>
          <td>${escapeHtml(row.foodNameSnapshot)}</td>
          <td>${escapeHtml(formatWeight(row.netWeightG))}</td>
          <td>${escapeHtml(formatCarbs(row.carbsG))}</td>
          <td>${row.ratioLabelSnapshot ? escapeHtml(`${formatInsulinUnits(row.totalInsulinUnits)} U`) : "—"}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Roboto, sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .subtitle { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="subtitle">
      Généré le ${escapeHtml(new Date().toLocaleString("fr-FR"))} · ${rows.length} pesée${rows.length > 1 ? "s" : ""}
    </div>
    <table>
      <thead>
        <tr><th>Date</th><th>Aliment</th><th>Poids net</th><th>Glucides</th><th>Dose</th></tr>
      </thead>
      <tbody>
        ${tableRows || `<tr><td colspan="5">Aucune pesée.</td></tr>`}
      </tbody>
    </table>
  </body>
</html>`;
}

export async function exportHistoryToPdf(rows: HistoryPdfRow[], title?: string): Promise<string> {
  const html = buildHistoryHtml(rows, title);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}
