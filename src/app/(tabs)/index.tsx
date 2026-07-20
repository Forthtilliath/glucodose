import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { PickerModal, type PickerItem } from "@/components/PickerModal";
import { db } from "@/db/client";
import { recordWeighing } from "@/db/repository";
import { containers, foods, insulinRatios, settings } from "@/db/schema";
import {
  computeCarbsGrams,
  computeCorrectionInsulinUnits,
  computeMealInsulinUnits,
  computeNetWeight,
  formatCarbs,
  formatInsulinUnits,
  formatWeight,
  MAX_WEIGHT_G,
} from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function WeighScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { autoFocusWeight } = useLocalSearchParams<{ autoFocusWeight?: string }>();

  const { data: containerList } = useLiveQuery(db.select().from(containers));
  const { data: foodList } = useLiveQuery(db.select().from(foods).where(eq(foods.isArchived, false)));
  const { data: ratioList } = useLiveQuery(db.select().from(insulinRatios).orderBy(insulinRatios.position));
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const appSettings = settingsRows?.[0];
  const targetGlycemia = appSettings?.targetGlycemia ?? null;
  const sensitivityFactor = appSettings?.sensitivityFactor ?? null;
  const glycemiaUnit = appSettings?.glycemiaUnit ?? null;
  const correctionAvailable = targetGlycemia != null && sensitivityFactor != null;

  const [selectedContainerId, setSelectedContainerId] = useState<number | null>(null);
  const [manualTare, setManualTare] = useState("0");
  const [grossWeight, setGrossWeight] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [selectedRatioId, setSelectedRatioId] = useState<number | null>(null);
  const [currentGlycemia, setCurrentGlycemia] = useState("");

  const [containerPickerVisible, setContainerPickerVisible] = useState(false);
  const [foodPickerVisible, setFoodPickerVisible] = useState(false);
  const [ratioPickerVisible, setRatioPickerVisible] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Sélectionne le premier ratio disponible par défaut, pour éviter un clic
  // supplémentaire quand une seule tranche horaire est configurée.
  useEffect(() => {
    if (selectedRatioId == null && ratioList && ratioList.length > 0) {
      setSelectedRatioId(ratioList[0].id);
    }
  }, [ratioList, selectedRatioId]);

  const selectedContainer = (containerList ?? []).find((c) => c.id === selectedContainerId) ?? null;
  const selectedFood = (foodList ?? []).find((f) => f.id === selectedFoodId) ?? null;
  const selectedRatio = (ratioList ?? []).find((r) => r.id === selectedRatioId) ?? null;

  const manualTareNumber = parseFloat(manualTare);
  const manualTareValid =
    !Number.isNaN(manualTareNumber) && manualTareNumber >= 0 && manualTareNumber <= MAX_WEIGHT_G;
  const tareWeightG = selectedContainer
    ? selectedContainer.tareWeightG
    : Math.max(0, manualTareValid ? manualTareNumber : 0);
  const grossWeightNumber = parseFloat(grossWeight);
  const grossWeightValid = !Number.isNaN(grossWeightNumber) && grossWeightNumber <= MAX_WEIGHT_G;
  const netWeightG = Number.isNaN(grossWeightNumber) ? 0 : computeNetWeight(grossWeightNumber, tareWeightG);
  const carbsG = selectedFood ? computeCarbsGrams(netWeightG, selectedFood.carbsPer100g) : 0;
  const mealInsulinUnits = selectedRatio ? computeMealInsulinUnits(carbsG, selectedRatio.carbsGramsPerUnit) : 0;

  const currentGlycemiaNumber = parseFloat(currentGlycemia);
  const correctionInsulinUnits =
    targetGlycemia != null && sensitivityFactor != null && !Number.isNaN(currentGlycemiaNumber)
      ? computeCorrectionInsulinUnits(currentGlycemiaNumber, targetGlycemia, sensitivityFactor)
      : 0;
  const totalInsulinUnits = mealInsulinUnits + correctionInsulinUnits;

  const containerItems: PickerItem[] = useMemo(
    () =>
      (containerList ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: formatWeight(c.tareWeightG),
        imageUri: c.photoUri,
      })),
    [containerList]
  );
  const foodItems: PickerItem[] = useMemo(
    () =>
      (foodList ?? []).map((f) => ({
        id: f.id,
        label: f.name,
        subtitle: `${formatCarbs(f.carbsPer100g)} glucides/100g${f.type === "recipe" ? " · recette" : ""}`,
      })),
    [foodList]
  );
  const ratioItems: PickerItem[] = useMemo(
    () =>
      (ratioList ?? []).map((r) => ({
        id: r.id,
        label: r.label,
        subtitle: `1 U / ${formatCarbs(r.carbsGramsPerUnit)}`,
      })),
    [ratioList]
  );

  const canSave =
    grossWeightValid &&
    grossWeightNumber > 0 &&
    (selectedContainer != null || manualTareValid) &&
    selectedFood != null &&
    selectedRatio != null;

  async function handleSave() {
    if (!selectedFood || !selectedRatio) return;
    await recordWeighing({
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      containerId: selectedContainer?.id ?? null,
      grossWeightG: grossWeightNumber,
      tareWeightG,
      netWeightG,
      carbsPer100g: selectedFood.carbsPer100g,
      carbsG,
      ratioId: selectedRatio.id,
      ratioLabel: selectedRatio.label,
      carbsGramsPerUnit: selectedRatio.carbsGramsPerUnit,
      mealInsulinUnits,
      glycemiaUnit,
      currentGlycemia: !Number.isNaN(currentGlycemiaNumber) ? currentGlycemiaNumber : null,
      targetGlycemia,
      sensitivityFactor,
      correctionInsulinUnits,
      totalInsulinUnits,
    });
    setSavedMessage(`Pesée enregistrée : ${formatInsulinUnits(totalInsulinUnits)} U pour ${selectedFood.name}`);
    setGrossWeight("");
    setSelectedFoodId(null);
    setCurrentGlycemia("");
    setTimeout(() => setSavedMessage(null), 4000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>1. Tare</Text>
      <Pressable
        style={styles.selector}
        onPress={() => setContainerPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={
          selectedContainer
            ? `Récipient : ${selectedContainer.name}. Modifier.`
            : "Choisir un récipient, ou saisir une tare manuelle"
        }
      >
        <Text style={styles.selectorLabel}>
          {selectedContainer ? selectedContainer.name : "Aucun récipient (tare manuelle)"}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {selectedContainer ? (
        <Pressable
          onPress={() => setSelectedContainerId(null)}
          accessibilityRole="button"
          accessibilityLabel="Retirer le récipient et saisir une tare manuelle"
        >
          <Text style={styles.clearLink}>Retirer le récipient / Saisir une tare manuelle</Text>
        </Pressable>
      ) : (
        <View style={styles.inlineField}>
          <Text style={styles.inlineFieldLabel}>Tare manuelle (g)</Text>
          <TextInput
            style={styles.inlineInput}
            keyboardType="decimal-pad"
            value={manualTare}
            onChangeText={setManualTare}
            accessibilityLabel="Tare manuelle en grammes"
          />
        </View>
      )}
      {!selectedContainer && !manualTareValid && (
        <Text style={styles.errorText}>La tare doit être comprise entre 0 et {MAX_WEIGHT_G} g.</Text>
      )}

      <Text style={styles.sectionTitle}>2. Poids brut</Text>
      <TextInput
        style={styles.grossInput}
        placeholder="0"
        keyboardType="decimal-pad"
        value={grossWeight}
        onChangeText={setGrossWeight}
        autoFocus={autoFocusWeight === "1"}
        accessibilityLabel="Poids brut en grammes"
      />
      {!grossWeightValid && (
        <Text style={styles.errorText}>Poids invraisemblable (max {MAX_WEIGHT_G} g).</Text>
      )}
      <Text style={styles.netWeightHint}>Poids net : {netWeightG.toFixed(0)} g</Text>

      <Text style={styles.sectionTitle}>3. Aliment</Text>
      <Pressable
        style={styles.selector}
        onPress={() => setFoodPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={selectedFood ? `Aliment : ${selectedFood.name}. Modifier.` : "Choisir un aliment"}
      >
        <Text style={styles.selectorLabel}>{selectedFood ? selectedFood.name : "Choisir un aliment"}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {selectedFood ? (
        <Text style={styles.netWeightHint}>{formatCarbs(carbsG)} de glucides</Text>
      ) : null}

      <Text style={styles.sectionTitle}>4. Ratio insuline/glucides</Text>
      <Pressable
        style={styles.selector}
        onPress={() => setRatioPickerVisible(true)}
        disabled={(ratioList ?? []).length === 0}
        accessibilityRole="button"
        accessibilityLabel={
          selectedRatio
            ? `Ratio : ${selectedRatio.label}, 1 unité pour ${formatCarbs(selectedRatio.carbsGramsPerUnit)}. Modifier.`
            : "Aucun ratio configuré, va dans Réglages"
        }
      >
        <Text style={styles.selectorLabel}>
          {selectedRatio
            ? `${selectedRatio.label} (1 U / ${formatCarbs(selectedRatio.carbsGramsPerUnit)})`
            : "Aucun ratio configuré — va dans Réglages"}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      {correctionAvailable && (
        <>
          <Text style={styles.sectionTitle}>5. Correction (optionnel)</Text>
          <Text style={styles.inlineFieldLabel}>
            Glycémie actuelle ({glycemiaUnit}), cible {targetGlycemia}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 12"
            keyboardType="decimal-pad"
            value={currentGlycemia}
            onChangeText={setCurrentGlycemia}
            accessibilityLabel={`Glycémie actuelle en ${glycemiaUnit}`}
          />
          {correctionInsulinUnits > 0 && (
            <Text style={styles.netWeightHint}>
              + {formatInsulinUnits(correctionInsulinUnits)} U de correction
            </Text>
          )}
        </>
      )}

      <View
        style={styles.resultBox}
        accessible
        accessibilityLabel={`Dose d'insuline totale : ${formatInsulinUnits(totalInsulinUnits)} unités`}
      >
        <Text style={styles.resultLabel}>Dose d'insuline totale</Text>
        <Text style={styles.resultValue}>{formatInsulinUnits(totalInsulinUnits)} U</Text>
        {correctionInsulinUnits > 0 && (
          <Text style={styles.resultBreakdown}>
            {formatInsulinUnits(mealInsulinUnits)} U repas + {formatInsulinUnits(correctionInsulinUnits)} U
            correction
          </Text>
        )}
      </View>

      {savedMessage ? (
        <Text style={styles.savedMessage} accessibilityLiveRegion="polite">
          {savedMessage}
        </Text>
      ) : null}

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
        accessibilityLabel="Enregistrer la pesée"
      >
        <Text style={styles.saveButtonText}>Enregistrer la pesée</Text>
      </Pressable>

      <PickerModal
        visible={containerPickerVisible}
        title="Choisir un récipient"
        items={containerItems}
        onSelect={(item) => {
          setSelectedContainerId(item.id);
          setContainerPickerVisible(false);
        }}
        onClose={() => setContainerPickerVisible(false)}
        emptyMessage="Aucun récipient enregistré."
      />
      <PickerModal
        visible={foodPickerVisible}
        title="Choisir un aliment"
        items={foodItems}
        onSelect={(item) => {
          setSelectedFoodId(item.id);
          setFoodPickerVisible(false);
        }}
        onClose={() => setFoodPickerVisible(false)}
        emptyMessage="Aucun aliment enregistré."
      />
      <PickerModal
        visible={ratioPickerVisible}
        title="Choisir un ratio"
        items={ratioItems}
        onSelect={(item) => {
          setSelectedRatioId(item.id);
          setRatioPickerVisible(false);
        }}
        onClose={() => setRatioPickerVisible(false)}
        emptyMessage="Aucun ratio enregistré."
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 20, marginBottom: 8 },
    selector: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    selectorLabel: { fontSize: 16, color: colors.text, fontWeight: "600" },
    clearLink: { color: colors.primary, fontSize: 13, marginTop: 6 },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
    inlineField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    inlineFieldLabel: { fontSize: 14, color: colors.textMuted },
    inlineInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 15,
      width: 90,
      textAlign: "right",
      backgroundColor: colors.surface,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      marginTop: 6,
    },
    grossInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 16,
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    netWeightHint: { textAlign: "center", color: colors.textMuted, marginTop: 6, fontSize: 14 },
    resultBox: {
      marginTop: 24,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 20,
      alignItems: "center",
    },
    resultLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
    resultValue: { fontSize: 40, fontWeight: "800", color: colors.primary, marginTop: 4 },
    resultBreakdown: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
    savedMessage: { textAlign: "center", color: colors.success, marginTop: 12, fontSize: 14, fontWeight: "600" },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: colors.primaryText, fontSize: 17, fontWeight: "700" },
  });
}
