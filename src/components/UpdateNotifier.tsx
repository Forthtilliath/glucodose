import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { UpdateAvailableBanner } from "@forthtilliath/react-native-kit/components/update/UpdateAvailableBanner";
import { useUpdateCheck } from "@forthtilliath/react-native-kit/hooks/useUpdateCheck";

import { db } from "@/db/client";
import { dismissUpdateVersion, recordUpdateCheck } from "@/db/repository";
import { settings } from "@/db/schema";
import { compareVersions, downloadAndInstallApk, fetchLatestRelease } from "@/lib/appUpdate";
import { type ThemeColors, useColors } from "@/theme/colors";

type InstallState =
  | { status: "downloading"; version: string; progress: number }
  | { status: "error"; version: string; apkUrl: string };

// Vérifie une fois par lancement si une nouvelle version est disponible sur
// GitHub (voir useUpdateCheck de @forthtilliath/react-native-kit), et
// affiche une bannière si oui. "Installer" ferme la bannière et lance
// directement le téléchargement de l'APK (une petite carte de progression
// prend sa place, puis Android demande confirmation d'installation) — pas
// de détour par l'écran Mises à jour. "Ignorer" ne renotifie plus pour cette
// version précise, mais renotifiera si une version encore plus récente sort.
export function UpdateNotifier() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const currentSettings = settingsRows?.[0];
  const [install, setInstall] = useState<InstallState | null>(null);

  const update = useUpdateCheck({
    currentVersion: Constants.expoConfig?.version ?? "0.0.0",
    checkForUpdate: fetchLatestRelease,
    compareVersions,
    getLastCheck: () => ({
      lastCheckedAt: currentSettings?.lastUpdateCheckAt ?? null,
      dismissedVersion: currentSettings?.dismissedUpdateVersion ?? null,
    }),
    onChecked: (lastCheckedAt) => {
      recordUpdateCheck(lastCheckedAt).catch(() => {});
    },
  });

  function startInstall(version: string, apkUrl: string) {
    setInstall({ status: "downloading", version, progress: 0 });
    downloadAndInstallApk(apkUrl, (progress) => setInstall({ status: "downloading", version, progress }))
      .then(() => setInstall(null))
      .catch(() => setInstall({ status: "error", version, apkUrl }));
  }

  if (install?.status === "downloading") {
    return (
      <View style={styles.container} pointerEvents="none">
        <View style={styles.card}>
          <Text style={styles.title}>
            Téléchargement de la version {install.version}… {Math.round(install.progress * 100)}%
          </Text>
          <Text style={styles.hint}>Ton téléphone va ensuite te demander confirmation pour l&apos;installer.</Text>
        </View>
      </View>
    );
  }

  if (install?.status === "error") {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.error}>Le téléchargement de la version {install.version} a échoué.</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => setInstall(null)} accessibilityRole="button" style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Fermer</Text>
            </Pressable>
            <Pressable
              onPress={() => startInstall(install.version, install.apkUrl)}
              accessibilityRole="button"
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Réessayer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (update.status !== "available") return null;

  const { release } = update;

  return (
    <View style={styles.container}>
      <UpdateAvailableBanner
        version={release.version}
        notes={release.notes}
        labels={{
          action: "Installer",
          dismiss: "Ignorer",
          dismissAccessibilityLabel: `Ignorer la version ${release.version}`,
        }}
        styles={{
          container: { backgroundColor: colors.surface, borderColor: colors.border },
          title: { color: colors.text },
          notes: { heading: { color: colors.text }, text: { color: colors.textMuted } },
          actionButton: { backgroundColor: colors.primary },
          actionButtonText: { color: colors.primaryText },
          dismissButtonText: { color: colors.textMuted },
        }}
        onPress={() => {
          // Pas de version "ignorée" mémorisée en base : si l'installation
          // n'aboutit pas, la bannière pourra réapparaître au prochain
          // lancement (comportement voulu, distinct d'un vrai "Ignorer").
          update.dismiss();
          startInstall(release.version, release.apkUrl);
        }}
        onDismiss={() => {
          dismissUpdateVersion(release.version).catch(() => {});
          update.dismiss();
        }}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { position: "absolute", top: 56, left: 16, right: 16, zIndex: 10 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      gap: 6,
    },
    title: { fontSize: 15, fontWeight: "700", color: colors.text },
    hint: { fontSize: 12, color: colors.textMuted },
    error: { fontSize: 14, color: colors.danger },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
    primaryButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
    primaryButtonText: { color: colors.primaryText, fontWeight: "700" },
    secondaryButton: { paddingVertical: 8, paddingHorizontal: 14 },
    secondaryButtonText: { color: colors.textMuted },
  });
}
