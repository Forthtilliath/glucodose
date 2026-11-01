import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { formatWeight, MAX_WEIGHT_G } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";
import { SelectorButton } from "./SelectorButton";

type Props = {
  // Nom du récipient choisi, ou null pour une tare saisie à la main.
  containerName: string | null;
  manualTare: string;
  onChangeManualTare: (tare: string) => void;
  manualTareOutOfRange: boolean;
  onPickContainer: () => void;
  onClearContainer: () => void;
};

// Tare de la pesée : celle d'un récipient enregistré, ou une saisie manuelle.
export function TareField({
  containerName,
  manualTare,
  onChangeManualTare,
  manualTareOutOfRange,
  onPickContainer,
  onClearContainer,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <SelectorButton
        label={containerName ?? "Aucun récipient (tare manuelle)"}
        onPress={onPickContainer}
        accessibilityLabel={
          containerName
            ? `Récipient : ${containerName}. Modifier.`
            : "Choisir un récipient, ou saisir une tare manuelle"
        }
      />
      {containerName ? (
        <Pressable
          onPress={onClearContainer}
          accessibilityRole="button"
          accessibilityLabel="Retirer le récipient et saisir une tare manuelle"
        >
          <Text style={styles.clearLink}>Retirer le récipient / Saisir une tare manuelle</Text>
        </Pressable>
      ) : (
        <View style={styles.inlineField}>
          <Text style={styles.inlineFieldLabel}>Tare manuelle (g)</Text>
          <TextInput
            style={styles.inlineInput}
            keyboardType="decimal-pad"
            value={manualTare}
            onChangeText={onChangeManualTare}
            accessibilityLabel="Tare manuelle en grammes"
          />
        </View>
      )}
      {!containerName && manualTareOutOfRange && (
        <Text style={styles.errorText}>La tare doit être comprise entre 0 et {formatWeight(MAX_WEIGHT_G)}.</Text>
      )}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    clearLink: { color: colors.primary, fontSize: 13, marginTop: 6 },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
    inlineField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    inlineFieldLabel: { fontSize: 14, color: colors.textMuted },
    inlineInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 15,
      width: 90,
      textAlign: "right",
      backgroundColor: colors.surface,
      color: colors.text,
    },
  });
}
