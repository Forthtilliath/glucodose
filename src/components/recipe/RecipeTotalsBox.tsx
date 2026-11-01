import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { formatCarbs, formatWeight } from "@/lib/insulin";
import { MAX_COOKED_RATIO, MIN_COOKED_RATIO, type RecipeTotals } from "@/lib/recipeTotals";
import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  totals: RecipeTotals;
  cookedWeightG: string;
  onChangeCookedWeight: (weightG: string) => void;
  // Saisie non vide mais refusée (illisible ou hors bornes).
  cookedWeightInvalid: boolean;
  hasCookedWeight: boolean;
};

export function RecipeTotalsBox({ totals, cookedWeightG, onChangeCookedWeight, cookedWeightInvalid, hasCookedWeight }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.label}>Poids des ingrédients</Text>
        <Text style={styles.value}>{formatWeight(totals.rawWeightG)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Glucides totaux</Text>
        <Text style={styles.value}>{formatCarbs(totals.totalCarbsG)}</Text>
      </View>

      <Text style={styles.cookedLabel}>Poids du plat cuit (facultatif)</Text>
      <TextInput
        style={[styles.input, cookedWeightInvalid && styles.inputError]}
        placeholder="g, pesé après cuisson"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={cookedWeightG}
        onChangeText={onChangeCookedWeight}
        accessibilityLabel="Poids du plat cuit en grammes, facultatif"
        accessibilityHint="Laisse vide si le plat ne change pas de poids à la cuisson"
      />
      {cookedWeightInvalid ? (
        <Text style={styles.error}>
          Poids cuit attendu entre {formatWeight(totals.rawWeightG * MIN_COOKED_RATIO)} et{" "}
          {formatWeight(totals.rawWeightG * MAX_COOKED_RATIO)} : vérifie la saisie.
        </Text>
      ) : (
        <Text style={styles.hint}>
          Un plat qui perd de l’eau (quiche, gratin) ou en absorbe (riz, pâtes) change de poids : pèse-le
          cuit pour un taux juste.
        </Text>
      )}

      <View style={[styles.row, styles.resultRow]}>
        <Text style={styles.labelStrong}>Glucides pour 100g{hasCookedWeight ? " (cuit)" : ""}</Text>
        <Text style={styles.valueStrong}>{formatCarbs(totals.carbsPer100g)}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    box: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 16,
      gap: 6,
    },
    row: { flexDirection: "row", justifyContent: "space-between" },
    resultRow: { marginTop: 6 },
    label: { fontSize: 14, color: colors.textMuted },
    value: { fontSize: 14, fontWeight: "600", color: colors.text },
    labelStrong: { fontSize: 15, fontWeight: "700", color: colors.text },
    valueStrong: { fontSize: 15, fontWeight: "700", color: colors.primary },
    cookedLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginTop: 8 },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 15,
      color: colors.text,
    },
    inputError: { borderColor: colors.danger },
    hint: { fontSize: 12, color: colors.textMuted },
    error: { fontSize: 12, color: colors.danger },
  });
}
