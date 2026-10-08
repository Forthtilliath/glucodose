import Constants from "expo-constants";

export type ExportKind = "sauvegarde" | "historique";

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

// Heure locale (pas toISOString, en UTC) : un export fait à 0h30 doit porter
// la date du jour, pas celle de la veille.
function formatTimestamp(date: Date): string {
  const day = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  return `${day}-${pad2(date.getHours())}${pad2(date.getMinutes())}`;
}

// Date avant version : le tri alphabétique d'un explorateur de fichiers suit
// ainsi l'ordre chronologique (avec la version en tête, "1.13.0" passerait
// avant "1.9.0"). Ex. : glucodose-sauvegarde-20261008-0902-v1.13.0.json
export function buildExportFileName(
  kind: ExportKind,
  extension: string,
  date = new Date(),
  version = getAppVersion()
): string {
  return `glucodose-${kind}-${formatTimestamp(date)}-v${version}.${extension}`;
}
