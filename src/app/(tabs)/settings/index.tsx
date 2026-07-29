import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

import { compareVersions, downloadAndInstallApk, fetchLatestRelease } from "@/lib/appUpdate";
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
  const currentVersion = Constants.expoConfig?.version ?? "?";
  const [updateState, setUpdateState] = useState<UpdateState>({ status: "idle" });

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
      <Text style={styles.sectionTitle}>Réglages de calcul</Text>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/dose")}
        accessibilityRole="button"
        accessibilityLabel="Dose et correction"
      >
        <Ionicons name="water-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Dose et correction</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/ratios")}
        accessibilityRole="button"
        accessibilityLabel="Ratios insuline/glucides"
      >
        <Ionicons name="calculator-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Ratios insuline/glucides</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Données</Text>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/backup")}
        accessibilityRole="button"
        accessibilityLabel="Sauvegarde et restauration des données"
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Sauvegarde et restauration</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>App</Text>
      <Pressable
        style={styles.row}
        onPress={handleCheckForUpdate}
        disabled={updateState.status === "checking" || updateState.status === "downloading"}
        accessibilityRole="button"
        accessibilityLabel="Rechercher une mise à jour"
      >
        <Ionicons name="download-outline" size={20} color={colors.text} />
        <View style={styles.updateRowText}>
          <Text style={styles.rowText}>Rechercher une mise à jour</Text>
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
        style={styles.row}
        onPress={() => router.push("/settings/help")}
        accessibilityRole="button"
        accessibilityLabel="Aide, présentation de l'app"
      >
        <Ionicons name="help-circle-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Aide</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/contact")}
        accessibilityRole="button"
        accessibilityLabel="Contact"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Contact</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/about")}
        accessibilityRole="button"
        accessibilityLabel="À propos de l'app"
      >
        <Ionicons name="information-circle-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>À propos</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/legal")}
        accessibilityRole="button"
        accessibilityLabel="Mentions légales"
      >
        <Ionicons name="document-text-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Mentions légales</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 8, textTransform: "uppercase" },
    sectionSpacing: { marginTop: 24 },
    helpText: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 4 },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    rowText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
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
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    saveButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
  });
}
