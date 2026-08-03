import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { updateSettings } from "@/db/repository";
import { settings } from "@/db/schema";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function DoseSettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const currentSettings = settingsRows?.[0];

  const [glycemiaUnit, setGlycemiaUnit] = useState<"mmol/L" | "g/L">("mmol/L");
  const [targetGlycemia, setTargetGlycemia] = useState("");
  const [sensitivityFactor, setSensitivityFactor] = useState("");
  const [showInsulinDose, setShowInsulinDose] = useState(true);

  useEffect(() => {
    if (currentSettings) {
      setGlycemiaUnit(currentSettings.glycemiaUnit);
      setTargetGlycemia(currentSettings.targetGlycemia != null ? String(currentSettings.targetGlycemia) : "");
      setSensitivityFactor(
        currentSettings.sensitivityFactor != null ? String(currentSettings.sensitivityFactor) : ""
      );
      setShowInsulinDose(currentSettings.showInsulinDose);
    }
  }, [currentSettings]);

  // Champs optionnels (vide = correction désactivée), mais s'ils sont
  // renseignés ils doivent avoir un sens physique : une glycémie cible ne
  // peut pas être négative, et un facteur de sensibilité nul ou négatif
  // rendrait la formule de correction incohérente (division par zéro/signe).
  const targetGlycemiaValid =
    targetGlycemia.trim() === "" || (!Number.isNaN(parseFloat(targetGlycemia)) && parseFloat(targetGlycemia) >= 0);
  const sensitivityFactorValid =
    sensitivityFactor.trim() === "" ||
    (!Number.isNaN(parseFloat(sensitivityFactor)) && parseFloat(sensitivityFactor) > 0);
  const canSaveSettings = targetGlycemiaValid && sensitivityFactorValid;

  function saveCurrentSettings(showInsulinDoseOverride: boolean) {
    return updateSettings({
      glycemiaUnit,
      targetGlycemia: targetGlycemia.trim() ? parseFloat(targetGlycemia) : null,
      sensitivityFactor: sensitivityFactor.trim() ? parseFloat(sensitivityFactor) : null,
      showInsulinDose: showInsulinDoseOverride,
      themePreference: currentSettings?.themePreference ?? "system",
    });
  }

  async function handleSaveSettings() {
    if (!canSaveSettings) return;
    await saveCurrentSettings(showInsulinDose);
  }

  // Bascule à effet immédiat (pas besoin de passer par "Enregistrer les
  // réglages"), comme n'importe quel interrupteur de préférence.
  async function handleToggleShowInsulinDose(value: boolean) {
    setShowInsulinDose(value);
    await saveCurrentSettings(value);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Calcul de dose</Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleRowText}>
          <Text style={styles.toggleRowLabel}>Afficher le calcul de dose d'insuline</Text>
          <Text style={styles.helpText}>
            Désactive pour t'arrêter au calcul des glucides (étape 3), sans ratio ni dose d'insuline.
          </Text>
        </View>
        <Switch
          value={showInsulinDose}
          onValueChange={handleToggleShowInsulinDose}
          trackColor={{ true: colors.primary }}
          accessibilityLabel="Afficher le calcul de dose d'insuline"
        />
      </View>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Correction d'hyperglycémie</Text>
      <Text style={styles.helpText}>
        Optionnel. Renseigné, l'écran Peser proposera d'ajouter une dose de correction en plus de la dose
        repas, selon ta glycémie actuelle.
      </Text>

      <Text style={styles.label}>Unité de glycémie</Text>
      <View style={styles.unitToggle}>
        <Pressable
          style={[styles.unitOption, glycemiaUnit === "mmol/L" && styles.unitOptionActive]}
          onPress={() => setGlycemiaUnit("mmol/L")}
          accessibilityRole="button"
          accessibilityState={{ selected: glycemiaUnit === "mmol/L" }}
          accessibilityLabel="Unité mmol par litre"
        >
          <Text style={[styles.unitOptionText, glycemiaUnit === "mmol/L" && styles.unitOptionTextActive]}>
            mmol/L
          </Text>
        </Pressable>
        <Pressable
          style={[styles.unitOption, glycemiaUnit === "g/L" && styles.unitOptionActive]}
          onPress={() => setGlycemiaUnit("g/L")}
          accessibilityRole="button"
          accessibilityState={{ selected: glycemiaUnit === "g/L" }}
          accessibilityLabel="Unité gramme par litre"
        >
          <Text style={[styles.unitOptionText, glycemiaUnit === "g/L" && styles.unitOptionTextActive]}>
            g/L
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Glycémie cible ({glycemiaUnit})</Text>
      <TextInput
        style={styles.input}
        placeholder={glycemiaUnit === "mmol/L" ? "ex: 6" : "ex: 1.10"}
        keyboardType="decimal-pad"
        value={targetGlycemia}
        onChangeText={setTargetGlycemia}
        accessibilityLabel={`Glycémie cible en ${glycemiaUnit}`}
      />
      {!targetGlycemiaValid && <Text style={styles.errorText}>La glycémie cible doit être positive.</Text>}

      <Text style={styles.label}>Facteur de sensibilité</Text>
      <Text style={styles.helpText}>
        Baisse de glycémie provoquée par 1 unité d'insuline, en {glycemiaUnit}.
      </Text>
      <TextInput
        style={styles.input}
        placeholder={glycemiaUnit === "mmol/L" ? "ex: 3" : "ex: 0.5"}
        keyboardType="decimal-pad"
        value={sensitivityFactor}
        onChangeText={setSensitivityFactor}
        accessibilityLabel="Facteur de sensibilité"
      />
      {!sensitivityFactorValid && (
        <Text style={styles.errorText}>Le facteur de sensibilité doit être strictement positif.</Text>
      )}

      <Pressable
        style={[styles.saveButton, !canSaveSettings && styles.saveButtonDisabled]}
        disabled={!canSaveSettings}
        onPress={handleSaveSettings}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSaveSettings }}
        accessibilityLabel="Enregistrer les réglages"
      >
        <Text style={styles.saveButtonText}>Enregistrer les réglages</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 8 },
    sectionSpacing: { marginTop: 28 },
    helpText: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 4 },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    toggleRowText: { flex: 1 },
    toggleRowLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
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
    unitToggle: { flexDirection: "row", gap: 8, marginTop: 6 },
    unitOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    unitOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    unitOptionText: { fontSize: 15, fontWeight: "600", color: colors.text },
    unitOptionTextActive: { color: colors.primaryText },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
  });
}
