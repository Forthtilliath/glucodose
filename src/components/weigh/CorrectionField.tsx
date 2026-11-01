import { useMemo } from "react";
import { StyleSheet, Text, TextInput } from "react-native";

import { formatInsulinUnits } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  glycemiaUnit: string | null;
  targetGlycemia: number;
  currentGlycemia: string;
  onChangeCurrentGlycemia: (glycemia: string) => void;
  correctionInsulinUnits: number;
};

// Glycémie actuelle (optionnelle), qui ajoute une dose de correction.
export function CorrectionField({
  glycemiaUnit,
  targetGlycemia,
  currentGlycemia,
  onChangeCurrentGlycemia,
  correctionInsulinUnits,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <Text style={styles.label}>
        Glycémie actuelle ({glycemiaUnit}), cible {targetGlycemia}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={glycemiaUnit === "mmol/L" ? "ex: 8" : "ex: 1.40"}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={currentGlycemia}
        onChangeText={onChangeCurrentGlycemia}
        accessibilityLabel={`Glycémie actuelle en ${glycemiaUnit}`}
      />
      {correctionInsulinUnits > 0 && (
        <Text style={styles.hint}>+ {formatInsulinUnits(correctionInsulinUnits)} U de correction</Text>
      )}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: { fontSize: 14, color: colors.textMuted },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      marginTop: 6,
    },
    hint: { textAlign: "center", color: colors.textMuted, marginTop: 6, fontSize: 14 },
  });
}
