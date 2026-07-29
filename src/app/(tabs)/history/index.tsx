import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { SwipeableRow } from "@/components/SwipeableRow";
import { db } from "@/db/client";
import { deleteWeighing } from "@/db/repository";
import { weighings } from "@/db/schema";
import { normalizeForSearch } from "@/lib/ciqual";
import { confirmDestructive } from "@/lib/confirmDelete";
import { getPeriodStartMs, type PeriodFilter } from "@/lib/historyFilters";
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
