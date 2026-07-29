import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { createIngredient, updateIngredient } from "@/db/repository";
import { foods } from "@/db/schema";
import {
  ALL_CIQUAL_FOODS,
  CIQUAL_PICKER_ITEMS,
  rankByNameMatch,
  searchCiqualFoods,
  type CiqualFood,
} from "@/lib/ciqual";
import { confirmDeleteOrArchiveFood } from "@/lib/confirmDelete";
import { formatCarbs, MAX_CARBS_PER_100G } from "@/lib/insulin";
import { deletePhoto, saveFoodPhoto } from "@/lib/photos";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { type ThemeColors, useColors } from "@/theme/colors";
import { PhotoPicker } from "@/components/PhotoPicker";
import { PickerModal, type PickerItem } from "@/components/PickerModal";

function filterCiqualItems(items: PickerItem[], query: string): PickerItem[] {
  return rankByNameMatch(items, query, (item) => item.label);
}

export default function IngredientFormScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const { isSaving, guard } = useSubmitGuard();
  const nameInputRef = useRef<TextInput>(null);
  const carbsInputRef = useRef<TextInput>(null);

  // Suggestions compactes affichées automatiquement pendant la frappe. La
  // modale plein écran (icône loupe) reste dispo pour chercher plus large.
  // L'ouverture est pilotée par un état explicite (pas dérivée du focus natif
  // du champ) : sinon, comme le nom sélectionné correspond forcément à un
  // résultat Ciqual, le dropdown se re-remplissait avec la nouvelle valeur
  // avant même que le blur ait le temps de s'appliquer, et restait ouvert.
  const suggestions = useMemo(
    () => (isNew && isSuggestionsOpen ? searchCiqualFoods(name) : []),
    [isNew, isSuggestionsOpen, name]
  );

  function applyCiqualFood(food: CiqualFood) {
    setName(food.name);
    setCarbsPer100g(String(food.carbsPer100g));
    setSource("Ciqual");
  }

  function handleSelectSuggestion(food: CiqualFood) {
    setIsSuggestionsOpen(false);
    applyCiqualFood(food);
    carbsInputRef.current?.focus();
  }

  function handleSelectCiqualPickerItem(item: PickerItem) {
    const food = ALL_CIQUAL_FOODS[item.id];
    if (!food) return;
    applyCiqualFood(food);
    setIsCiqualPickerVisible(false);
  }

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCarbsPer100g(String(existing.carbsPer100g));
      setSource(existing.source ?? "");
      setNotes(existing.notes ?? "");
      setPhotoUri(existing.photoUri ?? null);
    }
  }, [existing]);

  const parsedCarbsPer100g = parseFloat(carbsPer100g);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <PhotoPicker
        photoUri={photoUri}
        onChange={setPhotoUri}
        savePhoto={saveFoodPhoto}
        photoLabel="de l'ingrédient"
      />

      <Text style={styles.label}>Nom</Text>
      <View style={styles.nameFieldWrapper}>
        <View style={styles.nameFieldRow}>
          <TextInput
            ref={nameInputRef}
            style={[styles.input, styles.nameInput]}
            placeholder="ex: Nutella"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            onFocus={() => setIsSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
            accessibilityLabel="Nom de l'ingrédient"
          />
          {name.length > 0 && (
            <Pressable
              onPress={() => setName("")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Vider le nom"
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
          {isNew && (
            <Pressable
              onPress={() => setIsCiqualPickerVisible(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Chercher un aliment dans la base Ciqual"
            >
              <Ionicons name="search-outline" size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((food) => (
              <Pressable
                key={food.name}
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(food)}
                accessibilityRole="button"
                accessibilityLabel={`${food.name}, ${formatCarbs(food.carbsPer100g)} pour 100 grammes, source Ciqual`}
              >
                <Text style={styles.suggestionName}>{food.name}</Text>
                <Text style={styles.suggestionCarbs}>{formatCarbs(food.carbsPer100g)} / 100 g</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

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
        <Text style={styles.errorText}>100g d'aliment ne peuvent pas contenir plus de 100g de glucides.</Text>
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
          accessibilityLabel="Supprimer l'ingrédient"
        >
          <Text style={styles.deleteButtonText}>Supprimer l'ingrédient</Text>
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
      />
    </ScrollView>
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
    nameFieldWrapper: { position: "relative", zIndex: 10 },
    nameFieldRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    nameInput: { flex: 1 },
    suggestionsBox: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
      zIndex: 20,
      elevation: 4,
    },
    suggestionRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    suggestionName: { fontSize: 15, color: colors.text },
    suggestionCarbs: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
