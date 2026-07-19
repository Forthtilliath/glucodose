import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { deleteWeighing } from "@/db/repository";
import { weighings } from "@/db/schema";
import { formatInsulinUnits } from "@/lib/insulin";
import { colors } from "@/theme/colors";

export default function HistoryScreen() {
  const { data } = useLiveQuery(db.select().from(weighings).orderBy(desc(weighings.weighedAt)));

  function handleDelete(id: number) {
    Alert.alert("Supprimer cette pesée ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => deleteWeighing(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucune pesée enregistrée pour l'instant.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowLabel}>{item.foodNameSnapshot}</Text>
              <Text style={styles.rowSubtitle}>
                {new Date(item.weighedAt).toLocaleString("fr-FR")} · {item.netWeightG.toFixed(0)} g net ·{" "}
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
            <Text style={styles.rowValue}>{formatInsulinUnits(item.totalInsulinUnits)} U</Text>
            <Pressable onPress={() => handleDelete(item.id)} hitSlop={10} style={styles.deleteIcon}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  rowValue: { fontSize: 16, fontWeight: "700", color: colors.primary, marginRight: 12 },
  deleteIcon: { padding: 4 },
});
