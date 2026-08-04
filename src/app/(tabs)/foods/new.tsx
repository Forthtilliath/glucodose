import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function NewFoodScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.option}
        onPress={() => router.replace("/foods/ingredient/new")}
        accessibilityRole="button"
        accessibilityLabel="Ingrédient simple : un aliment unique avec une valeur d'insuline pour 100g connue"
      >
        <Ionicons name="nutrition-outline" size={28} color={colors.primary} />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Ingrédient simple</Text>
          <Text style={styles.optionSubtitle}>
            Un aliment unique avec une valeur d’insuline pour 100g connue.
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.option}
        onPress={() => router.replace("/foods/recipe/new")}
        accessibilityRole="button"
        accessibilityLabel="Recette composée : plusieurs ingrédients pesés ensemble, dont on déduit une valeur pour 100g"
      >
        <Ionicons name="restaurant-outline" size={28} color={colors.primary} />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Recette composée</Text>
          <Text style={styles.optionSubtitle}>
            Plusieurs ingrédients pesés ensemble, dont on déduit une valeur pour 100g.
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
    },
    optionText: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    optionSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  });
}
