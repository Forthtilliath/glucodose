import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";

import { db } from "@/db/client";
import { createRatio, deleteRatio, updateRatio } from "@/db/repository";
import { insulinRatios } from "@/db/schema";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function RatioFormScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const ratioId = isNew ? null : Number(id);

  const { data } = useLiveQuery(db.select().from(insulinRatios).where(eq(insulinRatios.id, ratioId ?? -1)));
  const existing = !isNew ? data?.[0] : undefined;

  const [label, setLabel] = useState("");
  const [carbsGramsPerUnit, setCarbsGramsPerUnit] = useState("");

  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setCarbsGramsPerUnit(String(existing.carbsGramsPerUnit));
    }
  }, [existing]);

  const parsedValue = parseFloat(carbsGramsPerUnit);
  const canSave = label.trim().length > 0 && !Number.isNaN(parsedValue) && parsedValue > 0;

  async function handleSave() {
    if (isNew) {
      await createRatio({ label: label.trim(), carbsGramsPerUnit: parsedValue });
    } else {
      await updateRatio(ratioId as number, { label: label.trim(), carbsGramsPerUnit: parsedValue });
    }
    router.back();
  }

  function handleDelete() {
    Alert.alert("Supprimer ce ratio ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteRatio(ratioId as number);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: Petit-déjeuner"
        value={label}
        onChangeText={setLabel}
        accessibilityLabel="Nom du ratio"
      />

      <Text style={styles.label}>1 unité d'insuline couvre combien de grammes de glucides ?</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: 10"
        keyboardType="decimal-pad"
        value={carbsGramsPerUnit}
        onChangeText={setCarbsGramsPerUnit}
        accessibilityLabel="Grammes de glucides couverts par une unité d'insuline"
      />

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
        accessibilityLabel="Enregistrer le ratio"
      >
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </Pressable>

      {!isNew && (
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer ce ratio"
        >
          <Text style={styles.deleteButtonText}>Supprimer ce ratio</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 8 },
    label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginTop: 12 },
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
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    deleteButton: { paddingVertical: 14, alignItems: "center", marginTop: 8 },
    deleteButtonText: { color: colors.danger, fontSize: 15, fontWeight: "600" },
  });
}
