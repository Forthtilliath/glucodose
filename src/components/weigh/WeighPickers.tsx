import { useMemo } from "react";
import { useRouter } from "expo-router";
import { PickerModal, type PickerItem } from "@forthtilliath/react-native-kit/components/picker/PickerModal";
import { getMostRecentIds, type RecentIdRow } from "@forthtilliath/ts-kit/array/getMostRecentIds";
import { rankByNameMatch } from "@forthtilliath/ts-kit/array/rankByNameMatch";

import { createIngredient } from "@/db/repository";
import type { containers, foods, insulinRatios } from "@/db/schema";
import { ALL_CIQUAL_FOODS, CIQUAL_PICKER_ITEMS } from "@/lib/ciqual";
import { formatCarbs, formatWeight } from "@/lib/insulin";
import { pickerModalStyles } from "@/lib/pickerModalStyles";
import { useColors } from "@/theme/colors";

type Container = typeof containers.$inferSelect;
type Food = typeof foods.$inferSelect;
type Ratio = typeof insulinRatios.$inferSelect;

export type WeighPicker = "container" | "food" | "ciqual" | "ratio";

type Props = {
  // Sélecteur ouvert (un seul à la fois), ou null.
  openPicker: WeighPicker | null;
  onOpenPicker: (picker: WeighPicker | null) => void;
  containers: Container[];
  foods: Food[];
  recentWeighings: RecentIdRow[];
  ratios: Ratio[];
  onSelectContainer: (id: number) => void;
  onSelectFood: (id: number) => void;
  onSelectRatio: (id: number) => void;
};

function filterCiqualPickerItems(items: PickerItem[], query: string): PickerItem[] {
  return rankByNameMatch(items, query, (item) => item.label);
}

function toFoodItem(f: Food, group: string): PickerItem {
  return {
    id: f.id,
    label: f.name,
    subtitle: `${formatCarbs(f.carbsPer100g)} glucides/100g${f.type === "recipe" ? " · recette" : ""}`,
    imageUri: f.photoUri,
    group,
  };
}

// Sélecteurs de l'écran Peser : récipient, aliment (avec ajout rapide depuis
// Ciqual) et ratio d'insuline.
export function WeighPickers({
  openPicker,
  onOpenPicker,
  containers: containerList,
  foods: foodList,
  recentWeighings,
  ratios: ratioList,
  onSelectContainer,
  onSelectFood,
  onSelectRatio,
}: Props) {
  const colors = useColors();
  const pickerStyles = useMemo(() => pickerModalStyles(colors), [colors]);
  const router = useRouter();
  const close = () => onOpenPicker(null);

  const containerItems: PickerItem[] = useMemo(
    () =>
      containerList.map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: formatWeight(c.tareWeightG),
        imageUri: c.photoUri,
      })),
    [containerList]
  );
  const recentFoodIds = useMemo(() => getMostRecentIds(recentWeighings), [recentWeighings]);

  // Les aliments récemment pesés sont sortis de leur groupe habituel
  // (ingrédients/recettes) pour apparaître une seule fois, en tête de liste
  // sous "Récents", plutôt que dupliqués à deux endroits du sélecteur.
  const foodItems: PickerItem[] = useMemo(() => {
    const byId = new Map(foodList.map((f) => [f.id, f]));
    const recentFoods = recentFoodIds.map((id) => byId.get(id)).filter((f) => f != null);
    const recentIds = new Set(recentFoods.map((f) => f.id));
    const restFoods = foodList.filter((f) => !recentIds.has(f.id));
    return [
      ...recentFoods.map((f) => toFoodItem(f, "Récents")),
      ...restFoods.map((f) => toFoodItem(f, f.type === "recipe" ? "Recettes" : "Ingrédients")),
    ];
  }, [foodList, recentFoodIds]);
  const ratioItems: PickerItem[] = useMemo(
    () =>
      ratioList.map((r) => ({
        id: r.id,
        label: r.label,
        subtitle: `1 U / ${formatCarbs(r.carbsGramsPerUnit)}`,
      })),
    [ratioList]
  );

  async function handleSelectCiqualQuickAdd(item: PickerItem) {
    const food = ALL_CIQUAL_FOODS[item.id];
    if (!food) return;
    const newFoodId = await createIngredient({
      name: food.name,
      carbsPer100g: food.carbsPer100g,
      source: "Ciqual",
    });
    onSelectFood(newFoodId);
    close();
  }

  return (
    <>
      <PickerModal
        visible={openPicker === "container"}
        title="Choisir un récipient"
        items={containerItems}
        onSelect={(item) => {
          onSelectContainer(item.id);
          close();
        }}
        onClose={close}
        emptyMessage="Aucun récipient enregistré."
        extraActions={[
          {
            label: "Ajouter un récipient",
            onPress: () => {
              close();
              router.push("/containers/new");
            },
          },
        ]}
        styles={pickerStyles}
      />
      <PickerModal
        visible={openPicker === "food"}
        title="Choisir un aliment"
        items={foodItems}
        onSelect={(item) => {
          onSelectFood(item.id);
          close();
        }}
        onClose={close}
        emptyMessage="Aucun aliment enregistré."
        groupOrder={["Récents", "Ingrédients", "Recettes"]}
        extraActions={[
          {
            label: "Ajouter un aliment ou une recette",
            onPress: () => {
              close();
              router.push("/foods/new");
            },
          },
          { label: "Chercher dans Ciqual", onPress: () => onOpenPicker("ciqual") },
        ]}
        styles={pickerStyles}
      />
      <PickerModal
        visible={openPicker === "ciqual"}
        title="Chercher dans Ciqual"
        items={CIQUAL_PICKER_ITEMS}
        filterItems={filterCiqualPickerItems}
        onSelect={handleSelectCiqualQuickAdd}
        onClose={close}
        emptyMessage="Aucun aliment trouvé dans Ciqual."
        styles={pickerStyles}
      />
      <PickerModal
        visible={openPicker === "ratio"}
        title="Choisir un ratio"
        items={ratioItems}
        onSelect={(item) => {
          onSelectRatio(item.id);
          close();
        }}
        onClose={close}
        emptyMessage="Aucun ratio enregistré."
        styles={pickerStyles}
      />
    </>
  );
}
