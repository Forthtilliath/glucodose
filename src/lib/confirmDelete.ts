import { Alert } from "react-native";

import { archiveFood, deleteFood, isFoodUsedInRecipes } from "@/db/repository";

// Suppression d'un aliment (ingrédient ou recette) : si utilisé comme
// composant d'une autre recette, propose l'archivage à la place (la
// suppression directe est bloquée par la contrainte de clé étrangère).
// onDone est appelé après l'archivage ou la suppression effective, jamais
// après une simple annulation.
export async function confirmDeleteOrArchiveFood(
  food: { id: number; name: string; photoUri?: string | null },
  onDone: () => void
) {
  const inUse = await isFoodUsedInRecipes(food.id);
  if (inUse) {
    Alert.alert(
      `"${food.name}" est utilisé dans une recette`,
      "Impossible de le supprimer car il est utilisé dans au moins une recette. Tu peux l'archiver à la place : il n'apparaîtra plus dans les listes mais restera valide dans les recettes existantes.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Archiver",
          onPress: async () => {
            await archiveFood(food.id);
            onDone();
          },
        },
      ]
    );
    return;
  }
  Alert.alert(`Supprimer "${food.name}" ?`, "Cette action est définitive.", [
    { text: "Annuler", style: "cancel" },
    {
      text: "Supprimer",
      style: "destructive",
      onPress: async () => {
        await deleteFood(food.id, food.photoUri ?? null);
        onDone();
      },
    },
  ]);
}
