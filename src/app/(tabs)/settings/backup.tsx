import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { BackupSettingsScreen } from "@forthtilliath/react-native-kit/components/settings/BackupSettingsScreen";

import { exportAllData, getAutoBackupSavedAt, importAllData, InvalidBackupFileError } from "@/lib/backup";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function BackupScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [autoBackupSavedAt, setAutoBackupSavedAt] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    getAutoBackupSavedAt().then(setAutoBackupSavedAt);
  }, []);

  async function handleExport() {
    const uri = await exportAllData();
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: "Sauvegarder mes données",
      });
    } else {
      Alert.alert("Export prêt", `Fichier créé : ${uri}`);
    }
  }

  async function handleImport() {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;

    try {
      await importAllData(uri);
      Alert.alert("Restauration terminée", "Les données ont été remplacées avec succès.");
    } catch (error) {
      if (error instanceof InvalidBackupFileError) {
        // Titre distinct de l'erreur générique du composant — remonter
        // l'erreur telle quelle afficherait "Échec de l'import" à la place.
        Alert.alert("Fichier invalide", error.message);
        return;
      }
      throw error;
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackupSettingsScreen
        onExport={handleExport}
        onImport={handleImport}
        layout="sections"
        info={{
          label: "Sauvegarde automatique",
          value:
            autoBackupSavedAt == null
              ? "Aucune sauvegarde automatique pour l'instant."
              : new Date(autoBackupSavedAt).toLocaleString("fr-FR"),
        }}
        icons={{ export: "download-outline", import: "cloud-upload-outline" }}
        labels={{
          exportButton: "Exporter mes données",
          importButton: "Importer une sauvegarde",
          exportHelpText:
            "Crée un fichier JSON contenant tout : récipients, aliments, recettes, ratios, réglages et historique. À garder précieusement ou à transférer vers un autre téléphone.",
          importHelpText:
            "Restaure une sauvegarde exportée précédemment. Remplace entièrement les données actuelles — il n’y a pas de fusion.",
          importConfirmMessage:
            "Toutes les données actuelles (récipients, aliments, recettes, ratios, réglages, historique) seront définitivement remplacées par celles du fichier. Cette action est irréversible.",
        }}
        styles={{
          infoBox: { backgroundColor: colors.surface, borderColor: colors.border },
          infoLabel: { color: colors.textMuted },
          infoValue: { color: colors.textMuted },
          sectionTitle: { color: colors.text },
          hint: { color: colors.textMuted },
          button: { backgroundColor: colors.primary, borderColor: colors.primary },
          buttonDisabled: { opacity: 0.6 },
          buttonText: { color: colors.primaryText },
          iconColor: colors.primaryText,
          importButton: { backgroundColor: colors.danger, borderColor: colors.danger },
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
