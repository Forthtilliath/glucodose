import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";

import type { weighings } from "@/db/schema";
import { exportHistoryToCsv } from "@/lib/historyCsv";
import { exportHistoryToPdf } from "@/lib/historyPdf";
import { type ThemeColors, useColors } from "@/theme/colors";

type Weighing = typeof weighings.$inferSelect;

type Props = {
  // Pesées affichées (filtre appliqué) : ce sont elles qui sont exportées.
  rows: Weighing[];
  pdfTitle: string;
};

type Format = { label: string; mimeType: string; icon: keyof typeof Ionicons.glyphMap; build: (rows: Weighing[], title: string) => Promise<string> };

const FORMATS: Format[] = [
  { label: "PDF", mimeType: "application/pdf", icon: "document-text-outline", build: exportHistoryToPdf },
  { label: "CSV", mimeType: "text/csv", icon: "grid-outline", build: (rows) => exportHistoryToCsv(rows) },
];

// Export de l'historique affiché en PDF ou CSV, puis partage du fichier.
export function HistoryExportButtons({ rows, pdfTitle }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(format: Format) {
    if (rows.length === 0) {
      Alert.alert("Rien à exporter", "Aucune pesée ne correspond au filtre actuel.");
      return;
    }
    setExporting(format.label);
    try {
      const uri = await format.build(rows, pdfTitle);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: format.mimeType, dialogTitle: "Partager l'historique" });
      } else {
        Alert.alert("Export prêt", `Fichier créé : ${uri}`);
      }
    } catch {
      Alert.alert("Échec de l'export", `Une erreur est survenue pendant la création du ${format.label}.`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <View style={styles.row}>
      {FORMATS.map((format) => {
        const isExporting = exporting === format.label;
        return (
          <Pressable
            key={format.label}
            style={[styles.button, exporting != null && styles.buttonDisabled]}
            onPress={() => handleExport(format)}
            disabled={exporting != null}
            accessibilityRole="button"
            accessibilityLabel={`Exporter l'historique affiché en ${format.label}`}
          >
            {isExporting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name={format.icon} size={18} color={colors.primary} />
                <Text style={styles.buttonText}>{format.label}</Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: 8 },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  });
}
