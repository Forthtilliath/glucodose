import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";

import { FormScrollView } from "@/components/FormScrollView";
import { CorrectionField } from "@/components/weigh/CorrectionField";
import { SelectorButton } from "@/components/weigh/SelectorButton";
import { TareField } from "@/components/weigh/TareField";
import { type WeighPicker, WeighPickers } from "@/components/weigh/WeighPickers";
import { WeighResultBox } from "@/components/weigh/WeighResultBox";
import { db } from "@/db/client";
import { recordWeighing } from "@/db/repository";
import { containers, foods, insulinRatios, settings, weighings } from "@/db/schema";
import {
  computeCarbsGrams,
  computeCorrectionInsulinUnits,
  computeMealInsulinUnits,
  computeNetWeight,
  formatCarbs,
  formatWeight,
  MAX_WEIGHT_G,
} from "@/lib/insulin";
import { parseDecimal } from "@/lib/parseDecimal";
import { buildWeighingInsulinFields } from "@/lib/weighingInsulinFields";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function WeighScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    autoFocusWeight,
    containerId: containerIdParam,
    foodId: foodIdParam,
  } = useLocalSearchParams<{ autoFocusWeight?: string; containerId?: string; foodId?: string }>();
  const router = useRouter();

  const { data: containerList } = useLiveQuery(db.select().from(containers).orderBy(containers.name));
  const { data: foodList } = useLiveQuery(
    db.select().from(foods).where(eq(foods.isArchived, false)).orderBy(foods.name)
  );
  // Fenêtre bornée plutôt que tout l'historique : largement suffisant pour
  // déduire les quelques aliments récents à mettre en avant dans le sélecteur.
  const { data: recentWeighings } = useLiveQuery(
    db
      .select({ id: weighings.foodId, occurredAt: weighings.weighedAt })
      .from(weighings)
      .orderBy(desc(weighings.weighedAt))
      .limit(30)
  );
  const { data: ratioList } = useLiveQuery(db.select().from(insulinRatios).orderBy(insulinRatios.position));
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const appSettings = settingsRows?.[0];
  const targetGlycemia = appSettings?.targetGlycemia ?? null;
  const sensitivityFactor = appSettings?.sensitivityFactor ?? null;
  const glycemiaUnit = appSettings?.glycemiaUnit ?? null;
  const showInsulinDose = appSettings?.showInsulinDose ?? false;
  const correctionAvailable = showInsulinDose && targetGlycemia != null && sensitivityFactor != null;

  const [selectedContainerId, setSelectedContainerId] = useState<number | null>(null);
  const [manualTare, setManualTare] = useState("0");
  const [grossWeight, setGrossWeight] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [selectedRatioId, setSelectedRatioId] = useState<number | null>(null);
  const [currentGlycemia, setCurrentGlycemia] = useState("");
  const [openPicker, setOpenPicker] = useState<WeighPicker | null>(null);

  // Pré-remplit récipient/aliment quand on arrive depuis le widget d'accueil
  // (sélection faite là-bas, sans avoir à la refaire dans l'app).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off pre-fill from route params on arrival, not a derived value
    if (containerIdParam) setSelectedContainerId(Number(containerIdParam));
    if (foodIdParam) setSelectedFoodId(Number(foodIdParam));
  }, [containerIdParam, foodIdParam]);

  // Sélectionne le premier ratio disponible par défaut, pour éviter un clic
  // supplémentaire quand une seule tranche horaire est configurée. Inutile
  // (et faussement rassurant) si le calcul de dose est désactivé.
  useEffect(() => {
    if (showInsulinDose && selectedRatioId == null && ratioList && ratioList.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off default pick once the ratio list has loaded, not a derived value
      setSelectedRatioId(ratioList[0].id);
    }
  }, [ratioList, selectedRatioId, showInsulinDose]);

  const selectedContainer = (containerList ?? []).find((c) => c.id === selectedContainerId) ?? null;
  const selectedFood = (foodList ?? []).find((f) => f.id === selectedFoodId) ?? null;
  const selectedRatio = (ratioList ?? []).find((r) => r.id === selectedRatioId) ?? null;

  const manualTareNumber = parseDecimal(manualTare);
  const manualTareValid =
    !Number.isNaN(manualTareNumber) && manualTareNumber >= 0 && manualTareNumber <= MAX_WEIGHT_G;
  // NaN > ou < un nombre vaut toujours false, donc ces conditions ignorent
  // naturellement un champ vide : l'erreur ne doit s'afficher que face à une
  // vraie valeur hors bornes, pas à un champ pas encore rempli.
  const manualTareOutOfRange = manualTareNumber < 0 || manualTareNumber > MAX_WEIGHT_G;
  const tareWeightG = selectedContainer
    ? selectedContainer.tareWeightG
    : Math.max(0, manualTareValid ? manualTareNumber : 0);
  const grossWeightNumber = parseDecimal(grossWeight);
  const grossWeightValid = !Number.isNaN(grossWeightNumber) && grossWeightNumber <= MAX_WEIGHT_G;
  const grossWeightOutOfRange = grossWeightNumber > MAX_WEIGHT_G;
  const grossWeightBelowTare =
    grossWeightValid && tareWeightG > 0 && grossWeightNumber > 0 && grossWeightNumber < tareWeightG;
  const netWeightG = Number.isNaN(grossWeightNumber) ? 0 : computeNetWeight(grossWeightNumber, tareWeightG);
  const carbsG = selectedFood ? computeCarbsGrams(netWeightG, selectedFood.carbsPer100g) : 0;
  const mealInsulinUnits = selectedRatio ? computeMealInsulinUnits(carbsG, selectedRatio.carbsGramsPerUnit) : 0;

  const currentGlycemiaNumber = parseDecimal(currentGlycemia);
  const correctionInsulinUnits =
    targetGlycemia != null && sensitivityFactor != null && !Number.isNaN(currentGlycemiaNumber)
      ? computeCorrectionInsulinUnits(currentGlycemiaNumber, targetGlycemia, sensitivityFactor)
      : 0;
  const totalInsulinUnits = mealInsulinUnits + correctionInsulinUnits;

  const canSave =
    grossWeightValid &&
    grossWeightNumber > 0 &&
    (selectedContainer != null || manualTareValid) &&
    selectedFood != null &&
    (!showInsulinDose || selectedRatio != null);

  const insulinFields = buildWeighingInsulinFields({
    showInsulinDose,
    ratio: selectedRatio,
    mealInsulinUnits,
    glycemiaUnit,
    currentGlycemia: currentGlycemiaNumber,
    targetGlycemia,
    sensitivityFactor,
    correctionInsulinUnits,
    totalInsulinUnits,
  });

  async function handleSave() {
    if (!selectedFood || (showInsulinDose && !selectedRatio)) return;
    const id = await recordWeighing({
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      containerId: selectedContainer?.id ?? null,
      grossWeightG: grossWeightNumber,
      tareWeightG,
      netWeightG,
      carbsPer100g: selectedFood.carbsPer100g,
      carbsG,
      ...insulinFields,
    });
    setGrossWeight("");
    setSelectedFoodId(null);
    setCurrentGlycemia("");
    router.push(`/weighing-result/${id}`);
  }

  return (
    <FormScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>1. Tare</Text>
      <TareField
        containerName={selectedContainer?.name ?? null}
        manualTare={manualTare}
        onChangeManualTare={setManualTare}
        manualTareOutOfRange={manualTareOutOfRange}
        onPickContainer={() => setOpenPicker("container")}
        onClearContainer={() => setSelectedContainerId(null)}
      />

      <Text style={styles.sectionTitle}>2. Poids brut</Text>
      <TextInput
        style={styles.grossInput}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={grossWeight}
        onChangeText={setGrossWeight}
        autoFocus={autoFocusWeight === "1"}
        accessibilityLabel="Poids brut en grammes"
      />
      {grossWeightOutOfRange && (
        <Text style={styles.errorText}>Poids invraisemblable (max {formatWeight(MAX_WEIGHT_G)}).</Text>
      )}
      {grossWeightBelowTare && (
        <Text style={styles.errorText}>
          Poids brut inférieur à la tare ({formatWeight(tareWeightG)}) : vérifie le récipient ou la pesée.
        </Text>
      )}
      <Text style={styles.netWeightHint}>Poids net : {formatWeight(netWeightG)}</Text>

      <Text style={styles.sectionTitle}>3. Aliment</Text>
      <SelectorButton
        label={selectedFood ? selectedFood.name : "Choisir un aliment"}
        onPress={() => setOpenPicker("food")}
        accessibilityLabel={selectedFood ? `Aliment : ${selectedFood.name}. Modifier.` : "Choisir un aliment"}
      />
      {selectedFood && showInsulinDose ? (
        <Text style={styles.netWeightHint}>{formatCarbs(carbsG)} de glucides</Text>
      ) : null}

      {showInsulinDose && (
        <>
          <Text style={styles.sectionTitle}>4. Ratio insuline/glucides</Text>
          <SelectorButton
            label={
              selectedRatio
                ? `${selectedRatio.label} (1 U / ${formatCarbs(selectedRatio.carbsGramsPerUnit)})`
                : "Aucun ratio configuré — va dans Réglages"
            }
            onPress={() => setOpenPicker("ratio")}
            disabled={(ratioList ?? []).length === 0}
            accessibilityLabel={
              selectedRatio
                ? `Ratio : ${selectedRatio.label}, 1 unité pour ${formatCarbs(selectedRatio.carbsGramsPerUnit)}. Modifier.`
                : "Aucun ratio configuré, va dans Réglages"
            }
          />
        </>
      )}

      {correctionAvailable && (
        <>
          <Text style={styles.sectionTitle}>5. Correction (optionnel)</Text>
          <CorrectionField
            glycemiaUnit={glycemiaUnit}
            targetGlycemia={targetGlycemia}
            currentGlycemia={currentGlycemia}
            onChangeCurrentGlycemia={setCurrentGlycemia}
            correctionInsulinUnits={correctionInsulinUnits}
          />
        </>
      )}

      <WeighResultBox
        showInsulinDose={showInsulinDose}
        hasFood={selectedFood != null}
        carbsG={carbsG}
        mealInsulinUnits={mealInsulinUnits}
        correctionInsulinUnits={correctionInsulinUnits}
        totalInsulinUnits={totalInsulinUnits}
      />

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

      <WeighPickers
        openPicker={openPicker}
        onOpenPicker={setOpenPicker}
        containers={containerList ?? []}
        foods={foodList ?? []}
        recentWeighings={recentWeighings ?? []}
        ratios={ratioList ?? []}
        onSelectContainer={setSelectedContainerId}
        onSelectFood={setSelectedFoodId}
        onSelectRatio={setSelectedRatioId}
      />
    </FormScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 20, marginBottom: 8 },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
    grossInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 16,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    netWeightHint: { textAlign: "center", color: colors.textMuted, marginTop: 6, fontSize: 14 },
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
