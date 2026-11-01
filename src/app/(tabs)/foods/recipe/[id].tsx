import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { eq, ne } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PhotoPicker } from "@forthtilliath/react-native-kit/components/picker/PhotoPicker";
import { useSubmitGuard } from "@forthtilliath/react-native-kit/hooks/useSubmitGuard";

import { RecipeComponentRow } from "@/components/recipe/RecipeComponentRow";
import { type PickedIngredient, RecipeIngredientPickers } from "@/components/recipe/RecipeIngredientPickers";
import { RecipeTotalsBox } from "@/components/recipe/RecipeTotalsBox";
import { describeRow, type DraftRow, toComponentInput } from "@/components/recipe/recipeDraft";
import { db } from "@/db/client";
import { saveRecipe } from "@/db/repository";
import { foods, recipeComponents } from "@/db/schema";
import { confirmDeleteOrArchiveFood } from "@/lib/confirmDelete";
import { MAX_WEIGHT_G } from "@/lib/insulin";
import { deletePhoto, saveFoodPhoto } from "@/lib/photos";
import { parseDecimal } from "@/lib/parseDecimal";
import { computeRecipeTotals, isCookedWeightPlausible, storedCookedWeight } from "@/lib/recipeTotals";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function RecipeFormScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const recipeFoodId = isNew ? null : Number(id);
  const nextKey = useRef(0);
  const initialized = useRef(false);

  const { data: existingRecipe } = useLiveQuery(
    db.select().from(foods).where(eq(foods.id, recipeFoodId ?? -1))
  );
  const existing = !isNew ? existingRecipe?.[0] : undefined;

  const { data: existingComponents } = useLiveQuery(
    db
      .select({
        weightG: recipeComponents.weightG,
        foodId: recipeComponents.componentFoodId,
      })
      .from(recipeComponents)
      .where(eq(recipeComponents.recipeFoodId, recipeFoodId ?? -1))
      .orderBy(recipeComponents.position)
  );

  // Tous les aliments sauf la recette elle-même (évite une auto-référence
  // directe), archivés compris : un composant archivé doit garder son nom et
  // son taux, sinon il compterait pour 0 g de glucides au réenregistrement.
  const { data: allFoods } = useLiveQuery(
    db.select().from(foods).where(ne(foods.id, recipeFoodId ?? -1))
  );
  const foodMap = useMemo(() => new Map((allFoods ?? []).map((f) => [f.id, f])), [allFoods]);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [cookedWeightG, setCookedWeightG] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const { isSaving, guard } = useSubmitGuard();

  // Hydrates the editable draft from the async-loaded record, once it
  // arrives. Deliberately not derived directly from `existing` — the form
  // state needs to stay a local draft the user can edit without a live-query
  // refresh overwriting it.
  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(existing.name);
      setNotes(existing.notes ?? "");
      setPhotoUri(existing.photoUri ?? null);
    }
  }, [existing]);

  useEffect(() => {
    if (!initialized.current && existing && existingComponents && existingComponents.length > 0) {
      setRows(
        existingComponents.map((c) => ({
          key: String(nextKey.current++),
          foodId: c.foodId,
          weightG: String(c.weightG),
        }))
      );
      const cooked = storedCookedWeight(existing.totalWeightG, existingComponents.map((c) => c.weightG));
      setCookedWeightG(cooked == null ? "" : String(cooked));
      initialized.current = true;
    }
  }, [existing, existingComponents]);

  function addRow(row: PickedIngredient) {
    setRows((prev) => [...prev, { ...row, key: String(nextKey.current++), weightG: "" }]);
  }

  function updateRowWeight(key: string, weightG: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, weightG } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const infos = useMemo(() => rows.map((row) => describeRow(row, foodMap)), [rows, foodMap]);

  const cookedText = cookedWeightG.trim();
  const parsedCooked = cookedText === "" ? null : parseDecimal(cookedText);

  const totals = useMemo(() => {
    const components = rows.flatMap((row, index) => {
      const weightG = parseDecimal(row.weightG);
      return Number.isNaN(weightG) ? [] : [{ weightG, carbsPer100g: infos[index].carbsPer100g }];
    });
    const raw = computeRecipeTotals(components, null);
    const cooked =
      parsedCooked != null && !Number.isNaN(parsedCooked) && isCookedWeightPlausible(parsedCooked, raw.rawWeightG)
        ? parsedCooked
        : null;
    return { ...computeRecipeTotals(components, cooked), cooked };
  }, [rows, infos, parsedCooked]);

  const cookedWeightInvalid = parsedCooked != null && totals.cooked == null;

  const canSave =
    name.trim().length > 0 &&
    rows.length > 0 &&
    !cookedWeightInvalid &&
    infos.every((info) => !info.missing) &&
    rows.every((r) => {
      const w = parseDecimal(r.weightG);
      return !Number.isNaN(w) && w > 0 && w <= MAX_WEIGHT_G;
    });

  async function handleSave() {
    await guard(async () => {
      // Nettoie l'ancienne photo sur disque si elle a été remplacée ou retirée,
      // pour ne pas accumuler des fichiers orphelins au fil des éditions.
      if (existing?.photoUri && existing.photoUri !== photoUri) {
        deletePhoto(existing.photoUri);
      }
      await saveRecipe(recipeFoodId, {
        name: name.trim(),
        notes: notes.trim() || undefined,
        photoUri,
        cookedWeightG: totals.cooked,
        components: rows.map((row, index) => toComponentInput(row, infos[index])),
      });
      router.back();
    });
  }

  async function handleDelete() {
    await confirmDeleteOrArchiveFood(
      { id: recipeFoodId as number, name: existing?.name ?? name, photoUri: existing?.photoUri },
      () => router.back()
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoPicker
        photoUri={photoUri}
        onChange={setPhotoUri}
        savePhoto={saveFoodPhoto}
        photoLabel="de la recette"
        styles={{
          photoPreview: { backgroundColor: colors.surface },
          photoPlaceholder: { backgroundColor: colors.surface, borderColor: colors.border },
          photoPlaceholderText: { color: colors.textMuted },
          clearLink: { color: colors.primary },
          iconColor: colors.textMuted,
        }}
      />

      <Text style={styles.label}>Nom de la recette</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: Salade composée"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        accessibilityLabel="Nom de la recette"
      />

      <Text style={styles.label}>Ingrédients</Text>
      {rows.map((row, index) => (
        <RecipeComponentRow
          key={row.key}
          info={infos[index]}
          weightG={row.weightG}
          onChangeWeight={(v) => updateRowWeight(row.key, v)}
          onRemove={() => removeRow(row.key)}
        />
      ))}

      <Pressable
        style={styles.addRowButton}
        onPress={() => setPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un ingrédient"
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addRowButtonText}>Ajouter un ingrédient</Text>
      </Pressable>

      <RecipeTotalsBox
        totals={totals}
        cookedWeightG={cookedWeightG}
        onChangeCookedWeight={setCookedWeightG}
        cookedWeightInvalid={cookedWeightInvalid}
        hasCookedWeight={totals.cooked != null}
      />

      <Text style={styles.label}>Notes (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel="Notes"
      />

      <Pressable
        style={[styles.saveButton, (!canSave || isSaving) && styles.saveButtonDisabled]}
        disabled={!canSave || isSaving}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave || isSaving }}
        accessibilityLabel="Enregistrer la recette"
      >
        <Text style={styles.saveButtonText}>Enregistrer la recette</Text>
      </Pressable>

      {!isNew && (
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la recette"
        >
          <Text style={styles.deleteButtonText}>Supprimer la recette</Text>
        </Pressable>
      )}

      <RecipeIngredientPickers
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        foods={allFoods ?? []}
        onPick={addRow}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 8, paddingBottom: 48 },
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
    addRowButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      marginTop: 4,
    },
    addRowButtonText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
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
}
