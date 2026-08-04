import type { PickerItem } from "@forthtilliath/react-native-kit/components/picker/PickerModal";
import { normalizeForSearch } from "@forthtilliath/react-native-kit/utils/helpers/normalizeForSearch";
import { rankByNameMatch } from "@forthtilliath/react-native-kit/utils/helpers/rankByNameMatch";

import ciqualData from "@/assets/data/ciqual.json";
import { formatCarbs } from "@/lib/insulin";

export type CiqualFood = { name: string; carbsPer100g: number; group: string };

export const ALL_CIQUAL_FOODS: CiqualFood[] = ciqualData as CiqualFood[];

// Représentation des ~3300 aliments Ciqual pour le picker de recherche
// plein écran, calculée une seule fois pour la durée du process : réutilisée
// telle quelle par tous les écrans qui proposent une recherche/ajout rapide
// Ciqual (écran Peser, formulaire ingrédient), au lieu de la recalculer à
// chaque montage d'écran. Le groupe alimentaire (Anses) sert à regrouper les
// résultats en sections dans le picker plutôt qu'une longue liste plate.
export const CIQUAL_PICKER_ITEMS: PickerItem[] = ALL_CIQUAL_FOODS.map((food, index) => ({
  id: index,
  label: food.name,
  subtitle: `${formatCarbs(food.carbsPer100g)} / 100 g`,
  group: food.group,
}));

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
