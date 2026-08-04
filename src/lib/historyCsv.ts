import { File, Paths } from "expo-file-system";
import { escapeCsvField } from "@forthtilliath/react-native-kit/utils/format/escapeCsvField";
import { formatCsvNumber } from "@forthtilliath/react-native-kit/utils/format/formatCsvNumber";

export type HistoryCsvRow = {
  weighedAt: string;
  foodNameSnapshot: string;
  netWeightG: number;
  carbsG: number;
  ratioLabelSnapshot: string | null;
  totalInsulinUnits: number;
};

const CSV_DELIMITER = ";"; // Excel FR ouvre correctement un CSV ";" avec virgule décimale.

// Générée séparément de l'écriture du fichier (native, non testable) pour
// pouvoir vérifier le contenu du CSV par un test unitaire, comme pour le PDF.
export function buildHistoryCsv(rows: HistoryCsvRow[]): string {
  const header = ["Date", "Aliment", "Poids net (g)", "Glucides (g)", "Ratio", "Dose (U)"].join(
    CSV_DELIMITER
  );
  const lines = rows.map((row) =>
    [
      escapeCsvField(new Date(row.weighedAt).toLocaleString("fr-FR")),
      escapeCsvField(row.foodNameSnapshot),
      formatCsvNumber(row.netWeightG, 0),
      formatCsvNumber(row.carbsG),
      escapeCsvField(row.ratioLabelSnapshot ?? ""),
      row.ratioLabelSnapshot ? formatCsvNumber(row.totalInsulinUnits) : "",
    ].join(CSV_DELIMITER)
  );
  // BOM UTF-8 : Excel Windows sans ça interprète les accents comme du Latin-1.
  return `﻿${[header, ...lines].join("\r\n")}`;
}

export async function exportHistoryToCsv(rows: HistoryCsvRow[]): Promise<string> {
  const csv = buildHistoryCsv(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `glucodose-historique-${dateStamp}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  return file.uri;
}
