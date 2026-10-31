// Lit un nombre tapé au clavier. Selon le clavier et la langue du téléphone,
// le séparateur décimal est un point ou une virgule : `parseFloat("1,8")`
// renverrait 1 sans erreur, et fausserait en silence une glycémie, un ratio ou
// un poids. Toute saisie qui n'est pas un nombre complet ("", "1,8,2", "12abc")
// donne NaN, pour que l'écran la refuse au lieu d'en garder le début.
const DECIMAL = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

export function parseDecimal(text: string): number {
  const trimmed = text.trim();
  return DECIMAL.test(trimmed) ? Number(trimmed.replace(",", ".")) : Number.NaN;
}
