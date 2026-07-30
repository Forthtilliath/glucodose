import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";

import {
  compareVersions,
  downloadAndInstallApk,
  fetchLatestRelease,
  fetchReleaseHistory,
  type ReleaseHistoryEntry,
} from "@/lib/appUpdate";
import { type ThemeColors, useColors } from "@/theme/colors";

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "up-to-date" }
  | { status: "available"; version: string; notes: string; apkUrl: string }
  | { status: "downloading"; progress: number }
  | { status: "error"; message: string };

export default function UpdateSettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentVersion = Constants.expoConfig?.version ?? "?";
  const [updateState, setUpdateState] = useState<UpdateState>({ status: "idle" });
  const [releaseHistory, setReleaseHistory] = useState<ReleaseHistoryEntry[] | null>(null);

  useEffect(() => {
    fetchReleaseHistory()
      .then(setReleaseHistory)
      .catch(() => setReleaseHistory([]));
  }, []);

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

  const isBusy = updateState.status === "checking" || updateState.status === "downloading";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Version installée</Text>
        <Text style={styles.infoValue}>{currentVersion}</Text>
      </View>

      <Pressable
        style={[styles.button, isBusy && styles.buttonDisabled]}
        onPress={handleCheckForUpdate}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel="Rechercher une mise à jour"
      >
        {updateState.status === "checking" ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={styles.buttonText}>Rechercher une mise à jour</Text>
        )}
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
            style={styles.button}
            onPress={() => handleInstallUpdate(updateState.apkUrl)}
            accessibilityRole="button"
            accessibilityLabel={`Télécharger et installer la version ${updateState.version}`}
          >
            <Text style={styles.buttonText}>Télécharger et installer</Text>
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

      {releaseHistory && releaseHistory.length > 0 && (
        <View style={styles.changelog}>
          <Text style={styles.changelogTitle}>Historique des versions</Text>
          {releaseHistory.map((release) => (
            <View key={release.version} style={styles.changelogEntry}>
              <View style={styles.changelogEntryHeader}>
                <Text style={styles.changelogVersion}>v{release.version}</Text>
                {release.publishedAt ? (
                  <Text style={styles.changelogDate}>
                    {new Date(release.publishedAt).toLocaleDateString("fr-FR")}
                  </Text>
                ) : null}
              </View>
              {release.notes ? <Text style={styles.changelogNotes}>{release.notes}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    infoBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
    },
    infoLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
    infoValue: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 2 },
    helpText: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 8 },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    updateAvailableBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 12,
      gap: 4,
    },
    updateAvailableTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    changelog: { marginTop: 28 },
    changelogTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
    changelogEntry: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
    },
    changelogEntryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    changelogVersion: { fontSize: 14, fontWeight: "700", color: colors.text },
    changelogDate: { fontSize: 12, color: colors.textMuted },
    changelogNotes: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  });
}
