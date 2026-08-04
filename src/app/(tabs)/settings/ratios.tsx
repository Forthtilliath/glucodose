import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { insulinRatios } from "@/db/schema";
import { formatCarbs } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function RatiosScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: ratios } = useLiveQuery(db.select().from(insulinRatios).orderBy(insulinRatios.position));

  return (
    <View style={styles.container}>
      <Text style={styles.helpText}>
        Combien de grammes de glucides sont couverts par 1 unité d’insuline. Peut varier selon le repas
        (petit-déjeuner, déjeuner...).
      </Text>

      <FlatList
        data={ratios}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucun ratio enregistré pour l’instant.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.ratioRow}
            onPress={() => router.push(`/settings/ratio/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Ratio ${item.label}, 1 unité pour ${formatCarbs(item.carbsGramsPerUnit)}. Modifier.`}
          >
            <Text style={styles.ratioLabel}>{item.label}</Text>
            <Text style={styles.ratioValue}>1 U / {formatCarbs(item.carbsGramsPerUnit)}</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.addRatioButton}
        onPress={() => router.push("/settings/ratio/new")}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un ratio"
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addRatioButtonText}>Ajouter un ratio</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16 },
    helpText: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
    list: { paddingBottom: 8 },
    empty: { textAlign: "center", color: colors.textMuted, marginTop: 12 },
    ratioRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    ratioLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    ratioValue: { fontSize: 14, fontWeight: "600", color: colors.primary },
    addRatioButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, marginTop: 4 },
    addRatioButtonText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  });
}
