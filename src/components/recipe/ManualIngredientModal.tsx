import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { MAX_CARBS_PER_100G } from "@/lib/insulin";
import { parseDecimal } from "@/lib/parseDecimal";
import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  visible: boolean;
  onAdd: (ingredient: { name: string; carbsPer100g: number }) => void;
  onClose: () => void;
};

// Ingrédient saisi à la main pour une seule recette (ex. « Légumes », 6 g de
// glucides pour 100 g) : il n'apparaîtra pas dans la liste des aliments.
export function ManualIngredientModal({ visible, onAdd, onClose }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [carbs, setCarbs] = useState("");

  const parsedCarbs = parseDecimal(carbs);
  const carbsTooHigh = !Number.isNaN(parsedCarbs) && parsedCarbs > MAX_CARBS_PER_100G;
  const canAdd = name.trim().length > 0 && !Number.isNaN(parsedCarbs) && parsedCarbs >= 0 && !carbsTooHigh;

  function close() {
    setName("");
    setCarbs("");
    onClose();
  }

  function handleAdd() {
    onAdd({ name: name.trim(), carbsPer100g: parsedCarbs });
    close();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      {/* Version keyboard-controller : celle de react-native ne voit pas le
          clavier en edge-to-edge. La carte se recentre au-dessus du clavier. */}
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            Ingrédient pour cette recette
          </Text>
          <Text style={styles.hint}>Il ne sera pas ajouté à ta liste d’aliments.</Text>

          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Légumes"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            accessibilityLabel="Nom de l'ingrédient"
          />

          <Text style={styles.label}>Glucides pour 100g (g)</Text>
          <TextInput
            style={[styles.input, carbsTooHigh && styles.inputError]}
            placeholder="ex: 6"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={carbs}
            onChangeText={setCarbs}
            accessibilityLabel="Glucides pour 100 grammes"
          />
          {carbsTooHigh && (
            <Text style={styles.error}>100g d’aliment ne peuvent pas contenir plus de 100g de glucides.</Text>
          )}

          <View style={styles.actions}>
            <Pressable onPress={close} style={styles.cancel} accessibilityRole="button">
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!canAdd}
              style={[styles.add, !canAdd && styles.addDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAdd }}
            >
              <Text style={styles.addText}>Ajouter</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.5)" },
    card: { backgroundColor: colors.background, borderRadius: 14, padding: 20, gap: 8 },
    title: { fontSize: 18, fontWeight: "700", color: colors.text },
    hint: { fontSize: 13, color: colors.textMuted },
    label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginTop: 8 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    inputError: { borderColor: colors.danger },
    error: { fontSize: 12, color: colors.danger },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
    cancel: { paddingVertical: 10, paddingHorizontal: 16 },
    cancelText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
    add: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
    addDisabled: { opacity: 0.5 },
    addText: { color: colors.primaryText, fontSize: 15, fontWeight: "700" },
  });
}
