import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";

import { exportAllData, importAllData, InvalidBackupFileError } from "@/lib/backup";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function BackupScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  async function handleExport() {
    setBusy("export");
    try {
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
    } catch {
      Alert.alert("Échec de l'export", "Une erreur est survenue pendant la création de la sauvegarde.");
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;

    Alert.alert(
      "Restaurer cette sauvegarde ?",
      "Toutes les données actuelles (récipients, aliments, recettes, ratios, réglages, historique) seront définitivement remplacées par celles du fichier. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Remplacer",
          style: "destructive",
          onPress: async () => {
            setBusy("import");
            try {
              await importAllData(uri);
              Alert.alert("Restauration terminée", "Les données ont été remplacées avec succès.");
            } catch (error) {
              if (error instanceof InvalidBackupFileError) {
                Alert.alert("Fichier invalide", error.message);
              } else {
                Alert.alert("Échec de l'import", "Une erreur est survenue pendant la restauration.");
              }
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Exporter</Text>
      <Text style={styles.helpText}>
        Crée un fichier JSON contenant tout : récipients, aliments, recettes, ratios, réglages et
        historique. À garder précieusement ou à transférer vers un autre téléphone.
      </Text>
      <Pressable
        style={[styles.button, busy != null && styles.buttonDisabled]}
        onPress={handleExport}
        disabled={busy != null}
        accessibilityRole="button"
        accessibilityLabel="Exporter mes données"
      >
        {busy === "export" ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <>
            <Ionicons name="download-outline" size={18} color={colors.primaryText} />
            <Text style={styles.buttonText}>Exporter mes données</Text>
          </>
        )}
      </Pressable>

      <Text style={[styles.sectionTitle, styles.importTitle]}>Importer</Text>
      <Text style={styles.helpText}>
        Restaure une sauvegarde exportée précédemment. Remplace entièrement les données actuelles — il
        n'y a pas de fusion.
      </Text>
      <Pressable
        style={[styles.button, styles.buttonDanger, busy != null && styles.buttonDisabled]}
        onPress={handleImport}
        disabled={busy != null}
        accessibilityRole="button"
        accessibilityLabel="Importer une sauvegarde"
      >
        {busy === "import" ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryText} />
            <Text style={styles.buttonText}>Importer une sauvegarde</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    importTitle: { marginTop: 32 },
    helpText: { fontSize: 13, color: colors.textMuted, marginTop: 6, marginBottom: 14, lineHeight: 18 },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
    },
    buttonDanger: { backgroundColor: colors.danger },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
  });
}
