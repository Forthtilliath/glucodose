import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatCarbs, formatInsulinUnits } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  showInsulinDose: boolean;
  hasFood: boolean;
  carbsG: number;
  mealInsulinUnits: number;
  correctionInsulinUnits: number;
  totalInsulinUnits: number;
};

// Résultat de la pesée : dose totale si le calcul de dose est activé, sinon
// les glucides seuls (dès qu'un aliment est choisi).
export function WeighResultBox({
  showInsulinDose,
  hasFood,
  carbsG,
  mealInsulinUnits,
  correctionInsulinUnits,
  totalInsulinUnits,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (showInsulinDose) {
    return (
      <View
        style={styles.box}
        accessible
        accessibilityLabel={`Dose d'insuline totale : ${formatInsulinUnits(totalInsulinUnits)} unités`}
      >
        <Text style={styles.label}>Dose d’insuline totale</Text>
        <Text style={styles.value}>{formatInsulinUnits(totalInsulinUnits)} U</Text>
        {correctionInsulinUnits > 0 && (
          <Text style={styles.breakdown}>
            {formatInsulinUnits(mealInsulinUnits)} U repas + {formatInsulinUnits(correctionInsulinUnits)} U
            correction
          </Text>
        )}
      </View>
    );
  }
  if (!hasFood) return null;
  return (
    <View style={styles.box} accessible accessibilityLabel={`Glucides : ${formatCarbs(carbsG)}`}>
      <Text style={styles.label}>Glucides</Text>
      <Text style={styles.value}>{formatCarbs(carbsG)}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    box: {
      marginTop: 24,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 20,
      alignItems: "center",
    },
    label: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
    value: { fontSize: 40, fontWeight: "800", color: colors.primary, marginTop: 4 },
    breakdown: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  });
}
