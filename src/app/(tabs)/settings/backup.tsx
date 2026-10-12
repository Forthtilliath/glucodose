import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { BackupScreen as SharedBackupScreen } from "@forthtilliath/expo-backup-ui";

import { describeBackup } from "@/lib/backup";
import { backup } from "@/lib/backupManager";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function BackupScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SharedBackupScreen
        manager={backup}
        describeBackup={describeBackup}
        labels={{
          fileHintEncrypted:
            "Un fichier chiffré contenant tout : récipients, aliments, recettes, ratios, réglages et historique. Illisible sans la clé de ce téléphone (ou sa clé de secours).",
          restoreConfirmMessage: (description) =>
            `Sauvegarde : ${description}. Toutes les données actuelles (récipients, aliments, recettes, ratios, réglages, historique) seront remplacées — tu pourras annuler la restauration ensuite.`,
        }}
        styles={{
          section: { backgroundColor: colors.surface, borderColor: colors.border },
          sectionTitle: { color: colors.text },
          hint: { color: colors.textMuted },
          status: { color: colors.text },
          errorText: { color: colors.danger },
          button: { backgroundColor: colors.primary },
          buttonText: { color: colors.primaryText },
          secondaryButton: { borderColor: colors.primary },
          secondaryButtonText: { color: colors.primary },
          ghostButtonText: { color: colors.textMuted },
          switchLabel: { color: colors.text },
          modalCard: { backgroundColor: colors.surface },
          recoveryCode: { color: colors.text },
          input: { color: colors.text, borderColor: colors.border },
          placeholderTextColor: colors.textMuted,
          activityIndicatorColor: colors.primary,
        }}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
  });
}
