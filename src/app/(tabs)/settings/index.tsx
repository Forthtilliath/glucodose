import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { updateSettings } from "@/db/repository";
import { insulinRatios, settings } from "@/db/schema";
import { compareVersions, downloadAndInstallApk, fetchLatestRelease } from "@/lib/appUpdate";
import { formatCarbs } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "up-to-date" }
  | { status: "available"; version: string; notes: string; apkUrl: string }
  | { status: "downloading"; progress: number }
  | { status: "error"; message: string };

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const currentSettings = settingsRows?.[0];
  const { data: ratios } = useLiveQuery(db.select().from(insulinRatios).orderBy(insulinRatios.position));

  const [glycemiaUnit, setGlycemiaUnit] = useState<"mmol/L" | "g/L">("mmol/L");
  const [targetGlycemia, setTargetGlycemia] = useState("");
  const [sensitivityFactor, setSensitivityFactor] = useState("");
  const [showInsulinDose, setShowInsulinDose] = useState(true);
  const [updateState, setUpdateState] = useState<UpdateState>({ status: "idle" });
  const currentVersion = Constants.expoConfig?.version ?? "?";

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

  async function handleSaveSettings() {
    if (!canSaveSettings) return;
    await updateSettings({
      glycemiaUnit,
      targetGlycemia: targetGlycemia.trim() ? parseFloat(targetGlycemia) : null,
      sensitivityFactor: sensitivityFactor.trim() ? parseFloat(sensitivityFactor) : null,
      showInsulinDose,
    });
  }

  // Bascule à effet immédiat (pas besoin de passer par "Enregistrer les
  // réglages"), comme n'importe quel interrupteur de préférence.
  async function handleToggleShowInsulinDose(value: boolean) {
    setShowInsulinDose(value);
    await updateSettings({
      glycemiaUnit,
      targetGlycemia: targetGlycemia.trim() ? parseFloat(targetGlycemia) : null,
      sensitivityFactor: sensitivityFactor.trim() ? parseFloat(sensitivityFactor) : null,
      showInsulinDose: value,
    });
  }

  async function handleCheckForUpdate() {
    setUpdateState({ status: "checking" });
    try {
      const release = await fetchLatestRelease();
      if (!release || compareVersions(release.version, currentVersion) <= 0) {
        setUpdateState({ status: "up-to-date" });
        return;
      }
      setUpdateState({
        status: "available",
        version: release.version,
        notes: release.notes,
        apkUrl: release.apkUrl,
      });
    } catch {
      setUpdateState({ status: "error", message: "Impossible de vérifier les mises à jour." });
    }
  }

  async function handleInstallUpdate(apkUrl: string) {
    setUpdateState({ status: "downloading", progress: 0 });
    try {
      await downloadAndInstallApk(apkUrl, (progress) => setUpdateState({ status: "downloading", progress }));
      setUpdateState({ status: "idle" });
    } catch {
      setUpdateState({ status: "error", message: "Le téléchargement a échoué." });
    }
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

      <Text style={[styles.sectionTitle, styles.ratiosTitle]}>Correction d'hyperglycémie</Text>
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

      <Text style={[styles.sectionTitle, styles.ratiosTitle]}>Ratios insuline/glucides</Text>
      <Text style={styles.helpText}>
        Combien de grammes de glucides sont couverts par 1 unité d'insuline. Peut varier selon le repas
        (petit-déjeuner, déjeuner...).
      </Text>

      <FlatList
        data={ratios}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>Aucun ratio enregistré pour l'instant.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.ratioRow}
            onPress={() => router.push(`/settings/ratio/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ratio ${item.label}, 1 unité pour ${formatCarbs(item.carbsGramsPerUnit)}. Modifier.`}
          >
            <Text style={styles.ratioLabel}>{item.label}</Text>
            <Text style={styles.ratioValue}>1 U / {formatCarbs(item.carbsGramsPerUnit)}</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.addRatioButton}
        onPress={() => router.push("/settings/ratio/new")}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un ratio"
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addRatioButtonText}>Ajouter un ratio</Text>
      </Pressable>

      <Pressable
        style={[styles.ratioRow, styles.backupRow]}
        onPress={() => router.push("/settings/backup")}
        accessibilityRole="button"
        accessibilityLabel="Sauvegarde et restauration des données"
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
        <Text style={styles.backupRowText}>Sauvegarde et restauration</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.sectionTitle, styles.ratiosTitle]}>À propos de l'app</Text>

      <Pressable
        style={[styles.ratioRow, styles.menuRow]}
        onPress={handleCheckForUpdate}
        disabled={updateState.status === "checking" || updateState.status === "downloading"}
        accessibilityRole="button"
        accessibilityLabel="Rechercher une mise à jour"
      >
        <Ionicons name="download-outline" size={20} color={colors.text} />
        <View style={styles.updateRowText}>
          <Text style={styles.ratioLabel}>Rechercher une mise à jour</Text>
          <Text style={styles.helpText}>Version installée : {currentVersion}</Text>
        </View>
        {updateState.status === "checking" && <Text style={styles.helpText}>Vérification…</Text>}
      </Pressable>

      {updateState.status === "up-to-date" && (
        <Text style={styles.helpText}>Tu as déjà la dernière version.</Text>
      )}

      {updateState.status === "error" && <Text style={styles.errorText}>{updateState.message}</Text>}

      {updateState.status === "available" && (
        <View style={styles.updateAvailableBox}>
          <Text style={styles.updateAvailableTitle}>Version {updateState.version} disponible</Text>
          {updateState.notes ? <Text style={styles.helpText}>{updateState.notes}</Text> : null}
          <Pressable
            style={styles.saveButton}
            onPress={() => handleInstallUpdate(updateState.apkUrl)}
            accessibilityRole="button"
            accessibilityLabel={`Télécharger et installer la version ${updateState.version}`}
          >
            <Text style={styles.saveButtonText}>Télécharger et installer</Text>
          </Pressable>
        </View>
      )}

      {updateState.status === "downloading" && (
        <View style={styles.updateAvailableBox}>
          <Text style={styles.helpText}>
            Téléchargement… {Math.round(updateState.progress * 100)}%
          </Text>
          <Text style={styles.helpText}>
            Android va ensuite te demander confirmation pour installer la mise à jour.
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.ratioRow, styles.menuRow]}
        onPress={() => router.push("/settings/help")}
        accessibilityRole="button"
        accessibilityLabel="Aide, présentation de l'app"
      >
        <Ionicons name="help-circle-outline" size={20} color={colors.text} />
        <Text style={styles.backupRowText}>Aide</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={[styles.ratioRow, styles.menuRow]}
        onPress={() => router.push("/settings/contact")}
        accessibilityRole="button"
        accessibilityLabel="Contact"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
        <Text style={styles.backupRowText}>Contact</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={[styles.ratioRow, styles.menuRow]}
        onPress={() => router.push("/settings/about")}
        accessibilityRole="button"
        accessibilityLabel="À propos de l'app"
      >
        <Ionicons name="information-circle-outline" size={20} color={colors.text} />
        <Text style={styles.backupRowText}>À propos</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={[styles.ratioRow, styles.menuRow]}
        onPress={() => router.push("/settings/legal")}
        accessibilityRole="button"
        accessibilityLabel="Mentions légales"
      >
        <Ionicons name="document-text-outline" size={20} color={colors.text} />
        <Text style={styles.backupRowText}>Mentions légales</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 8 },
    ratiosTitle: { marginTop: 28 },
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
    empty: { textAlign: "center", color: colors.textMuted, marginTop: 12 },
    ratioRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    ratioLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    ratioValue: { fontSize: 14, fontWeight: "600", color: colors.primary },
    addRatioButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, marginTop: 4 },
    addRatioButtonText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
    backupRow: { marginTop: 28, gap: 10 },
    backupRowText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
    menuRow: { gap: 10 },
    updateRowText: { flex: 1 },
    updateAvailableBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 4,
      gap: 4,
    },
    updateAvailableTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  });
}
