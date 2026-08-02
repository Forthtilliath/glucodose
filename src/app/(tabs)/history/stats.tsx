import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";

import { db } from "@/db/client";
import { weighings } from "@/db/schema";
import type { PeriodFilter } from "@forthtilliath/react-native-kit/utils/getPeriodStartMs";
import { computeHistoryStats } from "@/lib/historyStats";
import { formatCarbs } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "all", label: "Tout" },
];

function isPeriodFilter(value: string | undefined): value is PeriodFilter {
  return value === "all" || value === "today" || value === "7d" || value === "30d";
}

export default function HistoryStatsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { period: initialPeriod } = useLocalSearchParams<{ period?: string }>();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(
    isPeriodFilter(initialPeriod) && initialPeriod !== "today" ? initialPeriod : "30d"
  );

  const { data } = useLiveQuery(
    db
      .select({
        weighedAt: weighings.weighedAt,
        carbsG: weighings.carbsG,
        foodNameSnapshot: weighings.foodNameSnapshot,
      })
      .from(weighings)
  );

  const stats = useMemo(() => computeHistoryStats(data ?? [], periodFilter), [data, periodFilter]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            <Text style={[styles.periodOptionText, periodFilter === option.value && styles.periodOptionTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {stats.totalWeighings === 0 ? (
        <Text style={styles.empty}>Aucune pesée sur cette période.</Text>
      ) : (
        <>
          <View style={styles.tilesRow}>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{formatCarbs(stats.avgCarbsPerDay)}</Text>
              <Text style={styles.tileLabel}>Glucides / jour en moyenne</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{stats.weighingsPerWeek.toFixed(1)}</Text>
              <Text style={styles.tileLabel}>Pesées / semaine en moyenne</Text>
            </View>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{stats.totalWeighings}</Text>
            <Text style={styles.tileLabel}>Pesée{stats.totalWeighings > 1 ? "s" : ""} sur la période</Text>
          </View>

          <Text style={styles.sectionTitle}>Aliments les plus utilisés</Text>
          {stats.topFoods.map((food, index) => (
            <View key={food.name} style={styles.topFoodRow}>
              <Text style={styles.topFoodRank}>{index + 1}</Text>
              <Text style={styles.topFoodName}>{food.name}</Text>
              <Text style={styles.topFoodCount}>
                {food.count} pesée{food.count > 1 ? "s" : ""}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 12 },
    periodRow: { flexDirection: "row", gap: 8 },
    periodOption: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    periodOptionText: { fontSize: 13, fontWeight: "600", color: colors.text },
    periodOptionTextActive: { color: colors.primaryText },
    empty: { textAlign: "center", color: colors.textMuted, marginTop: 24 },
    tilesRow: { flexDirection: "row", gap: 12 },
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
    },
    tileValue: { fontSize: 22, fontWeight: "700", color: colors.text },
    tileLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 8 },
    topFoodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
    },
    topFoodRank: { fontSize: 14, fontWeight: "700", color: colors.textMuted, width: 18 },
    topFoodName: { flex: 1, fontSize: 14, color: colors.text },
    topFoodCount: { fontSize: 12, color: colors.textMuted },
  });
}
