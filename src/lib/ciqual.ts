import ciqualData from "@/assets/data/ciqual.json";
import { formatCarbs } from "@/lib/insulin";
import type { PickerItem } from "@/components/PickerModal";

export type CiqualFood = { name: string; carbsPer100g: number };

export const ALL_CIQUAL_FOODS: CiqualFood[] = ciqualData as CiqualFood[];

// Représentation des ~3300 aliments Ciqual pour le picker de recherche
// plein écran, calculée une seule fois pour la durée du process : réutilisée
// telle quelle par tous les écrans qui proposent une recherche/ajout rapide
// Ciqual (écran Peser, formulaire ingrédient), au lieu de la recalculer à
// chaque montage d'écran.
export const CIQUAL_PICKER_ITEMS: PickerItem[] = ALL_CIQUAL_FOODS.map((food, index) => ({
  id: index,
  label: food.name,
  subtitle: `${formatCarbs(food.carbsPer100g)} / 100 g`,
}));

export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Cache le nom normalisé de chaque élément par référence d'objet : les
// listes cherchées dans cette app (ALL_CIQUAL_FOODS, CIQUAL_PICKER_ITEMS)
// sont des constantes de module figées, donc un élément donné a toujours le
// même nom. Sans ce cache, rankByNameMatch renormaliserait les ~3300 noms
// Ciqual (accents, casse) à chaque frappe clavier dans le champ de recherche.
const normalizedNameCache = new WeakMap<object, string>();

function getNormalizedName<T>(item: T, getName: (item: T) => string): string {
  if (typeof item !== "object" || item === null) return normalizeForSearch(getName(item));
  const cached = normalizedNameCache.get(item);
  if (cached !== undefined) return cached;
  const normalized = normalizeForSearch(getName(item));
  normalizedNameCache.set(item, normalized);
  return normalized;
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
    const matchIndex = getNormalizedName(item, getName).indexOf(normalizedQuery);
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
