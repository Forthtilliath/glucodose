import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PhotoPicker } from "@/components/PhotoPicker";
import { db } from "@/db/client";
import { deleteContainer, createContainer, updateContainer } from "@/db/repository";
import { containers } from "@/db/schema";
import { confirmDestructive } from "@/lib/confirmDelete";
import { formatWeight, MAX_WEIGHT_G } from "@/lib/insulin";
import { deletePhoto, saveContainerPhoto } from "@/lib/photos";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function ContainerFormScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const containerId = isNew ? null : Number(id);

  const { data } = useLiveQuery(
    db.select().from(containers).where(eq(containers.id, containerId ?? -1))
  );
  const existing = !isNew ? data?.[0] : undefined;

  const [name, setName] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { isSaving, guard } = useSubmitGuard();

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setTareWeight(String(existing.tareWeightG));
      setNotes(existing.notes ?? "");
      setPhotoUri(existing.photoUri ?? null);
    }
  }, [existing]);

  const parsedTareWeight = parseFloat(tareWeight);
  const canSave =
    name.trim().length > 0 &&
    !Number.isNaN(parsedTareWeight) &&
    parsedTareWeight >= 0 &&
    parsedTareWeight <= MAX_WEIGHT_G;

  async function handleSave() {
    await guard(async () => {
      // Nettoie l'ancienne photo sur disque si elle a été remplacée ou retirée,
      // pour ne pas accumuler des fichiers orphelins au fil des éditions.
      if (existing?.photoUri && existing.photoUri !== photoUri) {
        deletePhoto(existing.photoUri);
      }
      if (isNew) {
        await createContainer({
          name: name.trim(),
          tareWeightG: parsedTareWeight,
          photoUri,
          notes: notes.trim() || undefined,
        });
      } else {
        await updateContainer(containerId as number, {
          name: name.trim(),
          tareWeightG: parsedTareWeight,
          photoUri,
          notes: notes.trim() || undefined,
        });
      }
      router.back();
    });
  }

  function handleDelete() {
    confirmDestructive("Supprimer ce récipient ?", async () => {
      await deleteContainer(containerId as number, existing?.photoUri ?? null);
      router.back();
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoPicker
        photoUri={photoUri}
        onChange={setPhotoUri}
        savePhoto={saveContainerPhoto}
        photoLabel="du récipient"
      />

      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: Bol bleu"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Nom du récipient"
      />

      <Text style={styles.label}>Poids à vide (g)</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: 150"
        keyboardType="decimal-pad"
        value={tareWeight}
        onChangeText={setTareWeight}
        accessibilityLabel="Poids à vide en grammes"
      />
      {!Number.isNaN(parsedTareWeight) && parsedTareWeight > MAX_WEIGHT_G && (
        <Text style={styles.errorText}>Poids invraisemblable pour un récipient (max {formatWeight(MAX_WEIGHT_G)}).</Text>
      )}

      <Text style={styles.label}>Notes (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="ex: assiette blanche du placard du haut"
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel="Notes"
      />

      <Pressable
        style={[styles.saveButton, (!canSave || isSaving) && styles.saveButtonDisabled]}
        disabled={!canSave || isSaving}
        onPress={handleSave}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave || isSaving }}
        accessibilityLabel="Enregistrer le récipient"
      >
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </Pressable>

      {!isNew && (
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer le récipient"
        >
          <Text style={styles.deleteButtonText}>Supprimer le récipient</Text>
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
    notesInput: { minHeight: 80, textAlignVertical: "top" },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
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
