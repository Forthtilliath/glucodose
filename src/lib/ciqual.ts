import ciqualData from "@/assets/data/ciqual.json";

export type CiqualFood = { name: string; carbsPer100g: number };

export const ALL_CIQUAL_FOODS: CiqualFood[] = ciqualData as CiqualFood[];

export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Classe des éléments par pertinence vis-à-vis d'une recherche texte :
// position du match dans le nom (plus tôt = plus pertinent), puis longueur
// du nom. Générique pour être réutilisable par n'importe quelle liste
// d'éléments ayant un nom affichable (aliments Ciqual, PickerItem...), sans
// dupliquer cette logique à chaque nouvel écran qui cherche dans Ciqual.
export function rankByNameMatch<T>(items: T[], query: string, getName: (item: T) => string): T[] {
  const normalizedQuery = normalizeForSearch(query);
  const matches: { item: T; matchIndex: number }[] = [];
  for (const item of items) {
    const matchIndex = normalizeForSearch(getName(item)).indexOf(normalizedQuery);
    if (matchIndex !== -1) {
      matches.push({ item, matchIndex });
    }
  }
  matches.sort((a, b) => a.matchIndex - b.matchIndex || getName(a.item).length - getName(b.item).length);
  return matches.map((m) => m.item);
}

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 5;

// Suggestions auto-affichées pendant la frappe : peu de résultats, classés
// par pertinence, pour tenir dans un petit encadré sans avoir besoin de
// scroller dedans.
export function searchCiqualFoods(query: string, limit = DEFAULT_LIMIT): CiqualFood[] {
  const normalizedQuery = normalizeForSearch(query);
  if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];
  return rankByNameMatch(ALL_CIQUAL_FOODS, query, (food) => food.name).slice(0, limit);
}
