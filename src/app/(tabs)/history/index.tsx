import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { SwipeableRow } from "@/components/SwipeableRow";
import { db } from "@/db/client";
import { deleteWeighing } from "@/db/repository";
import { weighings } from "@/db/schema";
import { confirmDestructive } from "@/lib/confirmDelete";
import { formatCarbs, formatInsulinUnits, formatWeight } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function HistoryScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data } = useLiveQuery(db.select().from(weighings).orderBy(desc(weighings.weighedAt)));

  function handleDelete(id: number) {
    confirmDestructive("Supprimer cette pesée ?", () => deleteWeighing(id));
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucune pesée enregistrée pour l'instant.</Text>}
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
