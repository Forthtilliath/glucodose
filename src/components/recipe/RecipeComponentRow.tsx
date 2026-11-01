import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { computeCarbsGrams, formatCarbs, MAX_WEIGHT_G } from "@/lib/insulin";
import { parseDecimal } from "@/lib/parseDecimal";
import { type ThemeColors, useColors } from "@/theme/colors";
import type { RowInfo } from "./recipeDraft";

type Props = {
  info: RowInfo;
  weightG: string;
  onChangeWeight: (weightG: string) => void;
  onRemove: () => void;
};

export function RecipeComponentRow({ info, weightG, onChangeWeight, onRemove }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const weight = parseDecimal(weightG);
  const carbs = !Number.isNaN(weight) ? computeCarbsGrams(weight, info.carbsPer100g) : 0;
  const label = info.missing ? "cet aliment" : info.name;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{info.name}</Text>
        <Text style={styles.subtitle}>
          {info.missing ? "" : `${formatCarbs(info.carbsPer100g)}/100g`} · {formatCarbs(carbs)} glucides
        </Text>
        {info.tag && <Text style={styles.tag}>{info.tag}</Text>}
      </View>
      <TextInput
        style={[styles.weightInput, weight > MAX_WEIGHT_G && styles.weightInputError]}
        placeholder="g"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={weightG}
        onChangeText={onChangeWeight}
        accessibilityLabel={`Poids de ${label} en grammes`}
      />
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Retirer ${label} de la recette`}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginTop: 8,
    },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: "600", color: colors.text },
    subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    tag: { fontSize: 11, fontStyle: "italic", color: colors.textMuted, marginTop: 2 },
    weightInput: {
      width: 70,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 15,
      textAlign: "right",
      color: colors.text,
    },
    weightInputError: { borderColor: colors.danger },
  });
}
