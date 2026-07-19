import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";

import { db } from "@/db/client";
import {
  archiveFood,
  createIngredient,
  deleteFood,
  isFoodUsedInRecipes,
  updateIngredient,
} from "@/db/repository";
import { foods } from "@/db/schema";
import { MAX_CARBS_PER_100G } from "@/lib/insulin";
import { colors } from "@/theme/colors";

export default function IngredientFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const foodId = isNew ? null : Number(id);

  const { data } = useLiveQuery(db.select().from(foods).where(eq(foods.id, foodId ?? -1)));
  const existing = !isNew ? data?.[0] : undefined;

  const [name, setName] = useState("");
  const [carbsPer100g, setCarbsPer100g] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCarbsPer100g(String(existing.carbsPer100g));
      setSource(existing.source ?? "");
      setNotes(existing.notes ?? "");
    }
  }, [existing]);

  const parsedCarbsPer100g = parseFloat(carbsPer100g);
  const canSave =
    name.trim().length > 0 &&
    !Number.isNaN(parsedCarbsPer100g) &&
    parsedCarbsPer100g >= 0 &&
    parsedCarbsPer100g <= MAX_CARBS_PER_100G;

  async function handleSave() {
    if (isNew) {
      await createIngredient({
        name: name.trim(),
        carbsPer100g: parsedCarbsPer100g,
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await updateIngredient(foodId as number, {
        name: name.trim(),
        carbsPer100g: parsedCarbsPer100g,
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
    router.back();
  }

  async function handleDelete() {
    const inUse = await isFoodUsedInRecipes(foodId as number);
    if (inUse) {
      Alert.alert(
        "Ingrédient utilisé dans une recette",
        "Impossible de le supprimer car il est utilisé dans au moins une recette. Tu peux l'archiver à la place : il n'apparaîtra plus dans les listes mais restera valide dans les recettes existantes.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Archiver",
            onPress: async () => {
              await archiveFood(foodId as number);
              router.back();
            },
          },
        ]
      );
      return;
    }
    Alert.alert("Supprimer cet ingrédient ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteFood(foodId as number);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} placeholder="ex: Nutella" value={name} onChangeText={setName} />

      <Text style={styles.label}>Glucides pour 100g (g)</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: 56"
        keyboardType="decimal-pad"
        value={carbsPer100g}
        onChangeText={setCarbsPer100g}
      />
      {!Number.isNaN(parsedCarbsPer100g) && parsedCarbsPer100g > MAX_CARBS_PER_100G && (
        <Text style={styles.errorText}>100g d'aliment ne peuvent pas contenir plus de 100g de glucides.</Text>
      )}

      <Text style={styles.label}>Source (optionnel)</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: nom de l'appli/table consultée"
        value={source}
        onChangeText={setSource}
      />

      <Text style={styles.label}>Notes (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </Pressable>

      {!isNew && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Supprimer l'ingrédient</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
  deleteButton: { paddingVertical: 14, alignItems: "center", marginTop: 8 },
  deleteButtonText: { color: colors.danger, fontSize: 15, fontWeight: "600" },
});
