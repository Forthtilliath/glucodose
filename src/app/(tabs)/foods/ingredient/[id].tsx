import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PhotoPicker } from "@forthtilliath/react-native-kit/components/picker/PhotoPicker";
import { PickerModal, type PickerItem } from "@forthtilliath/react-native-kit/components/picker/PickerModal";
import { rankByNameMatch } from "@forthtilliath/ts-kit/array/rankByNameMatch";
import { useSubmitGuard } from "@forthtilliath/react-native-kit/hooks/useSubmitGuard";

import { FormScrollView } from "@/components/FormScrollView";
import { IngredientNameField } from "@/components/ingredient/IngredientNameField";
import { db } from "@/db/client";
import { createIngredient, updateIngredient } from "@/db/repository";
import { foods } from "@/db/schema";
import { ALL_CIQUAL_FOODS, CIQUAL_PICKER_ITEMS, type CiqualFood } from "@/lib/ciqual";
import { confirmDeleteOrArchiveFood } from "@/lib/confirmDelete";
import { MAX_CARBS_PER_100G } from "@/lib/insulin";
import { deletePhoto, saveFoodPhoto } from "@/lib/photos";
import { pickerModalStyles } from "@/lib/pickerModalStyles";
import { parseDecimal } from "@/lib/parseDecimal";
import { type ThemeColors, useColors } from "@/theme/colors";

function filterCiqualItems(items: PickerItem[], query: string): PickerItem[] {
  return rankByNameMatch(items, query, (item) => item.label);
}

export default function IngredientFormScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pickerStyles = useMemo(() => pickerModalStyles(colors), [colors]);
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCiqualPickerVisible, setIsCiqualPickerVisible] = useState(false);
  const { isSaving, guard } = useSubmitGuard();
  const carbsInputRef = useRef<TextInput>(null);

  function applyCiqualFood(food: CiqualFood) {
    setName(food.name);
    setCarbsPer100g(String(food.carbsPer100g));
    setSource("Ciqual");
  }

  function handleSelectSuggestion(food: CiqualFood) {
    applyCiqualFood(food);
    carbsInputRef.current?.focus();
  }

  function handleSelectCiqualPickerItem(item: PickerItem) {
    const food = ALL_CIQUAL_FOODS[item.id];
    if (!food) return;
    applyCiqualFood(food);
    setIsCiqualPickerVisible(false);
  }

  // Hydrates the editable draft from the async-loaded record, once it
  // arrives. Deliberately not derived directly from `existing` — the form
  // state needs to stay a local draft the user can edit without a live-query
  // refresh overwriting it.
  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(existing.name);
      setCarbsPer100g(String(existing.carbsPer100g));
      setSource(existing.source ?? "");
      setNotes(existing.notes ?? "");
      setPhotoUri(existing.photoUri ?? null);
    }
  }, [existing]);

  const parsedCarbsPer100g = parseDecimal(carbsPer100g);
  const canSave =
    name.trim().length > 0 &&
    !Number.isNaN(parsedCarbsPer100g) &&
    parsedCarbsPer100g >= 0 &&
    parsedCarbsPer100g <= MAX_CARBS_PER_100G;

  async function handleSave() {
    await guard(async () => {
      // Nettoie l'ancienne photo sur disque si elle a été remplacée ou retirée,
      // pour ne pas accumuler des fichiers orphelins au fil des éditions.
      if (existing?.photoUri && existing.photoUri !== photoUri) {
        deletePhoto(existing.photoUri);
      }
      if (isNew) {
        await createIngredient({
          name: name.trim(),
          carbsPer100g: parsedCarbsPer100g,
          source: source.trim() || undefined,
          notes: notes.trim() || undefined,
          photoUri,
        });
      } else {
        await updateIngredient(foodId as number, {
          name: name.trim(),
          carbsPer100g: parsedCarbsPer100g,
          source: source.trim() || undefined,
          notes: notes.trim() || undefined,
          photoUri,
        });
      }
      router.back();
    });
  }

  async function handleDelete() {
    await confirmDeleteOrArchiveFood(
      { id: foodId as number, name: existing?.name ?? name, photoUri: existing?.photoUri },
      () => router.back()
    );
  }

  return (
    <FormScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoPicker
        photoUri={photoUri}
        onChange={setPhotoUri}
        savePhoto={saveFoodPhoto}
        photoLabel="de l'ingrédient"
        styles={{
          photoPreview: { backgroundColor: colors.surface },
          photoPlaceholder: { backgroundColor: colors.surface, borderColor: colors.border },
          photoPlaceholderText: { color: colors.textMuted },
          clearLink: { color: colors.primary },
          iconColor: colors.textMuted,
        }}
      />

      <Text style={styles.label}>Nom</Text>
      <IngredientNameField
        name={name}
        onChangeName={setName}
        withCiqual={isNew}
        onSelectCiqualFood={handleSelectSuggestion}
        onOpenCiqualPicker={() => setIsCiqualPickerVisible(true)}
      />

      <Text style={styles.label}>Glucides pour 100g (g)</Text>
      <TextInput
        ref={carbsInputRef}
        style={styles.input}
        placeholder="ex: 56"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={carbsPer100g}
        onChangeText={setCarbsPer100g}
        accessibilityLabel="Glucides pour 100 grammes"
      />
      {!Number.isNaN(parsedCarbsPer100g) && parsedCarbsPer100g > MAX_CARBS_PER_100G && (
        <Text style={styles.errorText}>100g d’aliment ne peuvent pas contenir plus de 100g de glucides.</Text>
      )}

      <Text style={styles.label}>Source (optionnel)</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: nom de l'appli/table consultée"
        placeholderTextColor={colors.textMuted}
        value={source}
        onChangeText={setSource}
        accessibilityLabel="Source de l'information nutritionnelle"
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
        accessibilityLabel="Enregistrer l'ingrédient"
      >
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </Pressable>

      {!isNew && (
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer l’ingrédient"
        >
          <Text style={styles.deleteButtonText}>Supprimer l’ingrédient</Text>
        </Pressable>
      )}

      <PickerModal
        visible={isCiqualPickerVisible}
        title="Chercher dans Ciqual"
        items={CIQUAL_PICKER_ITEMS}
        initialQuery={name}
        filterItems={filterCiqualItems}
        onSelect={handleSelectCiqualPickerItem}
        onClose={() => setIsCiqualPickerVisible(false)}
        emptyMessage="Aucun aliment trouvé dans Ciqual."
        styles={pickerStyles}
      />
    </FormScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
