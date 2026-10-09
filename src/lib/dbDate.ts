// Les colonnes remplies par `current_timestamp` contiennent l'heure UTC au
// format SQLite ("2026-10-09 19:46:00"), sans indication de fuseau : JS la
// lirait comme une heure locale. On la marque explicitement en UTC. Les dates
// ISO complètes (avec "Z" ou un décalage) sont lues telles quelles.
const SQLITE_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;

export function parseDbDate(value: string): Date {
  return new Date(SQLITE_DATETIME.test(value) ? `${value.replace(" ", "T")}Z` : value);
}
