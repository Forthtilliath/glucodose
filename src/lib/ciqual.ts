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

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 5;

// Suggestions auto-affichées pendant la frappe : peu de résultats, classés
// par pertinence (position du match dans le nom, puis longueur), pour tenir
// dans un petit encadré sans avoir besoin de scroller dedans.
export function searchCiqualFoods(query: string, limit = DEFAULT_LIMIT): CiqualFood[] {
  const normalizedQuery = normalizeForSearch(query);
  if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];

  const matches: { food: CiqualFood; matchIndex: number }[] = [];
  for (const food of ALL_CIQUAL_FOODS) {
    const matchIndex = normalizeForSearch(food.name).indexOf(normalizedQuery);
    if (matchIndex !== -1) {
      matches.push({ food, matchIndex });
    }
  }

  matches.sort((a, b) => a.matchIndex - b.matchIndex || a.food.name.length - b.food.name.length);

  return matches.slice(0, limit).map((m) => m.food);
}
