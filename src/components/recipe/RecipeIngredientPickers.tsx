import { useMemo, useState } from "react";
import { PickerModal, type PickerItem } from "@forthtilliath/react-native-kit/components/picker/PickerModal";
import { rankByNameMatch } from "@forthtilliath/ts-kit/array/rankByNameMatch";

import type { foods } from "@/db/schema";
import { ALL_CIQUAL_FOODS, CIQUAL_PICKER_ITEMS } from "@/lib/ciqual";
import { formatCarbs } from "@/lib/insulin";
import { pickerModalStyles } from "@/lib/pickerModalStyles";
import { useColors } from "@/theme/colors";
import { ManualIngredientModal } from "./ManualIngredientModal";
import type { DraftIngredient } from "./recipeDraft";

type Food = typeof foods.$inferSelect;

export type PickedIngredient = { foodId: number } | { newIngredient: DraftIngredient };

type Props = {
  visible: boolean;
  onClose: () => void;
  // Aliments sélectionnables (archivés compris : seuls les autres sont listés).
  foods: Food[];
  onPick: (picked: PickedIngredient) => void;
};

function filterCiqualItems(items: PickerItem[], query: string): PickerItem[] {
  return rankByNameMatch(items, query, (item) => item.label);
}

// Trois façons d'ajouter un ingrédient à une recette : un aliment de la liste,
// un aliment Ciqual (ajouté à la liste à l'enregistrement de la recette), ou
// une saisie à la main propre à la recette.
export function RecipeIngredientPickers({ visible, onClose, foods: foodList, onPick }: Props) {
  const colors = useColors();
  const pickerStyles = useMemo(() => pickerModalStyles(colors), [colors]);
  const [ciqualVisible, setCiqualVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  const items: PickerItem[] = useMemo(
    () =>
      foodList
        .filter((f) => !f.isArchived)
        .map((f) => ({
          id: f.id,
          label: f.name,
          subtitle: `${formatCarbs(f.carbsPer100g)} glucides/100g${f.type === "recipe" ? " · recette" : ""}`,
          imageUri: f.photoUri,
          group: f.type === "recipe" ? "Recettes" : "Ingrédients",
        })),
    [foodList]
  );

  // Un aliment Ciqual déjà dans la liste est réutilisé plutôt que dupliqué.
  function handleSelectCiqual(item: PickerItem) {
    setCiqualVisible(false);
    const food = ALL_CIQUAL_FOODS[item.id];
    if (!food) return;
    const known = foodList.find((f) => !f.isArchived && f.type === "ingredient" && f.name === food.name);
    onPick(
      known
        ? { foodId: known.id }
        : { newIngredient: { name: food.name, carbsPer100g: food.carbsPer100g, source: "Ciqual", recipeOnly: false } }
    );
  }

  return (
    <>
      <PickerModal
        visible={visible}
        title="Ajouter un ingrédient"
        items={items}
        onSelect={(item) => {
          onClose();
          onPick({ foodId: item.id });
        }}
        onClose={onClose}
        emptyMessage="Aucun aliment dans ta liste : cherche-le dans Ciqual ou saisis-le à la main."
        groupOrder={["Ingrédients", "Recettes"]}
        extraActions={[
          {
            label: "Chercher dans Ciqual",
            onPress: () => {
              onClose();
              setCiqualVisible(true);
            },
          },
          {
            label: "Saisir un ingrédient pour cette recette",
            onPress: () => {
              onClose();
              setManualVisible(true);
            },
          },
        ]}
        styles={pickerStyles}
      />
      <PickerModal
        visible={ciqualVisible}
        title="Chercher dans Ciqual"
        items={CIQUAL_PICKER_ITEMS}
        filterItems={filterCiqualItems}
        onSelect={handleSelectCiqual}
        onClose={() => setCiqualVisible(false)}
        emptyMessage="Aucun aliment trouvé dans Ciqual."
        styles={pickerStyles}
      />
      <ManualIngredientModal
        visible={manualVisible}
        onAdd={(ingredient) => onPick({ newIngredient: { ...ingredient, recipeOnly: true } })}
        onClose={() => setManualVisible(false)}
      />
    </>
  );
}
