import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ChangelogNotes } from "@forthtilliath/expo-release-updates-ui/ChangelogNotes";

import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  version: string;
  notes: string;
  onInstall: () => void;
  onDismiss: () => void;
};

// Bannière "nouvelle version disponible". Remplace UpdateAvailableBanner du
// package, qui a deux défauts ici : ses notes ne défilent pas (la carte,
// positionnée en absolu, déborde de l'écran dès que les notes sont longues)
// et seules `heading`/`text` de ChangelogNotes y étaient thémées — puces,
// éléments de liste et gras gardaient leurs couleurs claires par défaut,
// illisibles en mode sombre. Toutes les couleurs viennent donc du thème.
export function UpdateBanner({ version, notes, onInstall, onDismiss }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { height } = useWindowDimensions();
  const notesStyles = useMemo(
    () => ({
      heading: { color: colors.text },
      bullet: { color: colors.textMuted },
      itemText: { color: colors.textMuted },
      text: { color: colors.textMuted },
      bold: { color: colors.text },
    }),
    [colors]
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Version {version} disponible</Text>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={`Ignorer la version ${version}`}
          style={styles.dismissButton}
        >
          <Text style={styles.dismissButtonText}>Ignorer</Text>
        </Pressable>
      </View>
      {notes ? (
        <ScrollView
          style={{ maxHeight: Math.round(height * 0.45) }}
          nestedScrollEnabled
          persistentScrollbar
          testID="update-notes"
        >
          <ChangelogNotes notes={notes} styles={notesStyles} />
        </ScrollView>
      ) : null}
      <Pressable onPress={onInstall} accessibilityRole="button" style={styles.installButton}>
        <Text style={styles.installButtonText}>Installer</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      gap: 8,
    },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { flexShrink: 1, fontSize: 15, fontWeight: "700", color: colors.text },
    dismissButton: { padding: 4 },
    dismissButtonText: { fontSize: 13, color: colors.textMuted },
    installButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    installButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: "700" },
  });
}
