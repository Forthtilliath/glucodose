import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";

import { SwipeableRow } from "@/components/SwipeableRow";
import { db } from "@/db/client";
import { deleteWeighing } from "@/db/repository";
import { weighings } from "@/db/schema";
import { normalizeForSearch } from "@/lib/ciqual";
import { confirmDestructive } from "@/lib/confirmDelete";
import { exportHistoryToCsv } from "@/lib/historyCsv";
import { getPeriodStartMs, type PeriodFilter } from "@/lib/historyFilters";
import { exportHistoryToPdf } from "@/lib/historyPdf";
import { formatCarbs, formatInsulinUnits, formatWeight } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
];

export default function HistoryScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data } = useLiveQuery(db.select().from(weighings).orderBy(desc(weighings.weighedAt)));

  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const filteredData = useMemo(() => {
    if (!data) return [];
    const periodStartMs = getPeriodStartMs(periodFilter);
    const normalizedQuery = normalizeForSearch(searchQuery);
    return data.filter((item) => {
      if (periodStartMs != null && new Date(item.weighedAt).getTime() < periodStartMs) return false;
      if (normalizedQuery && !normalizeForSearch(item.foodNameSnapshot).includes(normalizedQuery)) return false;
      return true;
    });
  }, [data, periodFilter, searchQuery]);

  const hasAnyHistory = (data?.length ?? 0) > 0;

  function handleDelete(id: number) {
    confirmDestructive("Supprimer cette pesée ?", () => deleteWeighing(id));
  }

  async function handleExportPdf() {
    if (filteredData.length === 0) {
      Alert.alert("Rien à exporter", "Aucune pesée ne correspond au filtre actuel.");
      return;
    }
    setIsExportingPdf(true);
    try {
      const periodLabel = PERIOD_OPTIONS.find((option) => option.value === periodFilter)?.label;
      const title =
        periodFilter === "all" ? "Historique des pesées" : `Historique des pesées — ${periodLabel}`;
      const uri = await exportHistoryToPdf(filteredData, title);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Partager l'historique" });
      } else {
        Alert.alert("Export prêt", `Fichier créé : ${uri}`);
      }
    } catch {
      Alert.alert("Échec de l'export", "Une erreur est survenue pendant la création du PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportCsv() {
    if (filteredData.length === 0) {
      Alert.alert("Rien à exporter", "Aucune pesée ne correspond au filtre actuel.");
      return;
    }
    setIsExportingCsv(true);
    try {
      const uri = await exportHistoryToCsv(filteredData);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Partager l'historique" });
      } else {
        Alert.alert("Export prêt", `Fichier créé : ${uri}`);
      }
    } catch {
      Alert.alert("Échec de l'export", "Une erreur est survenue pendant la création du CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher un aliment…"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Rechercher une pesée par aliment"
        />
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.periodOption, periodFilter === option.value && styles.periodOptionActive]}
              onPress={() => setPeriodFilter(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: periodFilter === option.value }}
              accessibilityLabel={`Période : ${option.label}`}
            >
              <Text
                style={[styles.periodOptionText, periodFilter === option.value && styles.periodOptionTextActive]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.exportRow}>
          <Pressable
            style={[styles.exportButton, isExportingPdf && styles.exportButtonDisabled]}
            onPress={handleExportPdf}
            disabled={isExportingPdf}
            accessibilityRole="button"
            accessibilityLabel="Exporter l'historique affiché en PDF"
          >
            {isExportingPdf ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text style={styles.exportButtonText}>PDF</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.exportButton, isExportingCsv && styles.exportButtonDisabled]}
            onPress={handleExportCsv}
            disabled={isExportingCsv}
            accessibilityRole="button"
            accessibilityLabel="Exporter l'historique affiché en CSV"
          >
            {isExportingCsv ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="grid-outline" size={18} color={colors.primary} />
                <Text style={styles.exportButtonText}>CSV</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {hasAnyHistory ? "Aucune pesée ne correspond à ce filtre." : "Aucune pesée enregistrée pour l'instant."}
          </Text>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            onDelete={() => handleDelete(item.id)}
            deleteLabel={`Supprimer la pesée ${item.foodNameSnapshot}`}
          >
            <View
              style={styles.row}
              accessible
              accessibilityLabel={
                item.ratioLabelSnapshot
                  ? `${item.foodNameSnapshot}, le ${new Date(item.weighedAt).toLocaleString("fr-FR")}, dose totale ${formatInsulinUnits(item.totalInsulinUnits)} unités`
                  : `${item.foodNameSnapshot}, le ${new Date(item.weighedAt).toLocaleString("fr-FR")}, ${formatCarbs(item.carbsG)} de glucides`
              }
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowLabel}>{item.foodNameSnapshot}</Text>
                <Text style={styles.rowSubtitle}>
                  {new Date(item.weighedAt).toLocaleString("fr-FR")} · {formatWeight(item.netWeightG)} net ·{" "}
                  {item.carbsG.toFixed(1)} g glucides
                  {item.ratioLabelSnapshot ? ` · ${item.ratioLabelSnapshot}` : ""}
                </Text>
                {item.correctionInsulinUnits > 0 && (
                  <Text style={styles.rowSubtitle}>
                    dont {formatInsulinUnits(item.correctionInsulinUnits)} U de correction (glycémie{" "}
                    {item.currentGlycemia} {item.glycemiaUnitSnapshot})
                  </Text>
                )}
              </View>
              {item.ratioLabelSnapshot && (
                <Text style={styles.rowValue}>{formatInsulinUnits(item.totalInsulinUnits)} U</Text>
              )}
            </View>
          </SwipeableRow>
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    filters: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
    search: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
    },
    periodRow: { flexDirection: "row", gap: 8 },
    periodOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    periodOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    periodOptionText: { fontSize: 13, fontWeight: "600", color: colors.text },
    periodOptionTextActive: { color: colors.primaryText },
    exportRow: { flexDirection: "row", gap: 8 },
    exportButton: {
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
    exportButtonDisabled: { opacity: 0.6 },
    exportButtonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
    list: { padding: 16 },
    empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    rowMain: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    rowValue: { fontSize: 16, fontWeight: "700", color: colors.primary },
  });
}
