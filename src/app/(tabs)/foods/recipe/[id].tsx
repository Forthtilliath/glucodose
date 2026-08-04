import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { and, eq, ne } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PhotoPicker } from "@forthtilliath/react-native-kit/components/picker/PhotoPicker";
import { PickerModal, type PickerItem } from "@forthtilliath/react-native-kit/components/picker/PickerModal";
import { useSubmitGuard } from "@forthtilliath/react-native-kit/hooks/useSubmitGuard";

import { db } from "@/db/client";
import { saveRecipe } from "@/db/repository";
import { foods, recipeComponents } from "@/db/schema";
import { confirmDeleteOrArchiveFood } from "@/lib/confirmDelete";
import { computeCarbsGrams, computeRecipeCarbsPer100g, formatCarbs, formatWeight, MAX_WEIGHT_G } from "@/lib/insulin";
import { deletePhoto, saveFoodPhoto } from "@/lib/photos";
import { pickerModalStyles } from "@/lib/pickerModalStyles";
import { type ThemeColors, useColors } from "@/theme/colors";

type Row = { key: string; foodId: number; weightG: string };

export default function RecipeFormScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pickerStyles = useMemo(() => pickerModalStyles(colors), [colors]);
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

  // Aliments sélectionnables comme composant : tous sauf la recette en cours
  // d'édition elle-même (évite une auto-référence directe).
  const { data: availableFoods } = useLiveQuery(
    db
      .select()
      .from(foods)
      .where(
        and(eq(foods.isArchived, false), ne(foods.id, recipeFoodId ?? -1))
      )
  );
  const foodMap = useMemo(() => new Map((availableFoods ?? []).map((f) => [f.id, f])), [availableFoods]);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
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
    if (!initialized.current && existingComponents && existingComponents.length > 0) {
      setRows(
        existingComponents.map((c) => ({
          key: String(nextKey.current++),
          foodId: c.foodId,
          weightG: String(c.weightG),
        }))
      );
      initialized.current = true;
    }
  }, [existingComponents]);

  const pickerItems: PickerItem[] = useMemo(
    () =>
      (availableFoods ?? []).map((f) => ({
        id: f.id,
        label: f.name,
        subtitle: `${formatCarbs(f.carbsPer100g)} glucides/100g${f.type === "recipe" ? " · recette" : ""}`,
        imageUri: f.photoUri,
        group: f.type === "recipe" ? "Recettes" : "Ingrédients",
      })),
    [availableFoods]
  );

  function addRow(foodId: number) {
    setRows((prev) => [...prev, { key: String(nextKey.current++), foodId, weightG: "" }]);
    setPickerVisible(false);
  }

  function updateRowWeight(key: string, weightG: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, weightG } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const totals = useMemo(() => {
    let totalWeightG = 0;
    let totalCarbsG = 0;
    for (const row of rows) {
      const weight = parseFloat(row.weightG);
      if (Number.isNaN(weight)) continue;
      const food = foodMap.get(row.foodId);
      totalWeightG += weight;
      totalCarbsG += computeCarbsGrams(weight, food?.carbsPer100g ?? 0);
    }
    return {
      totalWeightG,
      totalCarbsG,
      carbsPer100g: computeRecipeCarbsPer100g(totalCarbsG, totalWeightG),
    };
  }, [rows, foodMap]);

  const canSave =
    name.trim().length > 0 &&
    rows.length > 0 &&
    rows.every((r) => {
      const w = parseFloat(r.weightG);
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
        components: rows.map((r) => ({
          componentFoodId: r.foodId,
          weightG: parseFloat(r.weightG),
          carbsPer100gAtEntry: foodMap.get(r.foodId)?.carbsPer100g ?? 0,
        })),
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
        value={name}
        onChangeText={setName}
        accessibilityLabel="Nom de la recette"
      />

      <Text style={styles.label}>Composants</Text>
      {rows.map((row) => {
        const food = foodMap.get(row.foodId);
        const weight = parseFloat(row.weightG);
        const carbs = !Number.isNaN(weight) ? computeCarbsGrams(weight, food?.carbsPer100g ?? 0) : 0;
        return (
          <View key={row.key} style={styles.componentRow}>
            <View style={styles.componentInfo}>
              <Text style={styles.componentName}>{food?.name ?? "Aliment introuvable"}</Text>
              <Text style={styles.componentSubtitle}>
                {food ? `${formatCarbs(food.carbsPer100g)}/100g` : ""} · {formatCarbs(carbs)} glucides
              </Text>
            </View>
            <TextInput
              style={[styles.componentWeightInput, weight > MAX_WEIGHT_G && styles.componentWeightInputError]}
              placeholder="g"
              keyboardType="decimal-pad"
              value={row.weightG}
              onChangeText={(v) => updateRowWeight(row.key, v)}
              accessibilityLabel={`Poids de ${food?.name ?? "cet aliment"} en grammes`}
            />
            <Pressable
              onPress={() => removeRow(row.key)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Retirer ${food?.name ?? "cet aliment"} de la recette`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        );
      })}

      <Pressable
        style={styles.addRowButton}
        onPress={() => setPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un aliment pesé"
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addRowButtonText}>Ajouter un aliment pesé</Text>
      </Pressable>

      <View style={styles.totalsBox}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Poids total</Text>
          <Text style={styles.totalsValue}>{formatWeight(totals.totalWeightG)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Glucides totaux</Text>
          <Text style={styles.totalsValue}>{formatCarbs(totals.totalCarbsG)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabelStrong}>Glucides pour 100g</Text>
          <Text style={styles.totalsValueStrong}>{formatCarbs(totals.carbsPer100g)}</Text>
        </View>
      </View>

      <Text style={styles.label}>Notes (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
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

      <PickerModal
        visible={pickerVisible}
        title="Choisir un aliment"
        items={pickerItems}
        onSelect={(item) => addRow(item.id)}
        onClose={() => setPickerVisible(false)}
        emptyMessage="Aucun aliment disponible. Crée d'abord un ingrédient."
        styles={pickerStyles}
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
    componentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginTop: 8,
    },
    componentInfo: { flex: 1 },
    componentName: { fontSize: 15, fontWeight: "600", color: colors.text },
    componentSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    componentWeightInput: {
      width: 70,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 15,
      textAlign: "right",
      color: colors.text,
    },
    componentWeightInputError: { borderColor: colors.danger },
    addRowButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      marginTop: 4,
    },
    addRowButtonText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
    totalsBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 16,
      gap: 6,
    },
    totalsRow: { flexDirection: "row", justifyContent: "space-between" },
    totalsLabel: { fontSize: 14, color: colors.textMuted },
    totalsValue: { fontSize: 14, fontWeight: "600", color: colors.text },
    totalsLabelStrong: { fontSize: 15, fontWeight: "700", color: colors.text },
    totalsValueStrong: { fontSize: 15, fontWeight: "700", color: colors.primary },
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
