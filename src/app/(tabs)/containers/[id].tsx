import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { deleteContainer, createContainer, updateContainer } from "@/db/repository";
import { containers } from "@/db/schema";
import { saveContainerPhoto } from "@/lib/photos";
import { colors } from "@/theme/colors";

export default function ContainerFormScreen() {
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

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setTareWeight(String(existing.tareWeightG));
      setNotes(existing.notes ?? "");
      setPhotoUri(existing.photoUri ?? null);
    }
  }, [existing]);

  const canSave = name.trim().length > 0 && !Number.isNaN(parseFloat(tareWeight));

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Accès à l'appareil photo refusé", "Autorise l'accès dans les réglages du téléphone pour prendre une photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const savedUri = await saveContainerPhoto(result.assets[0].uri);
      setPhotoUri(savedUri);
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Accès aux photos refusé", "Autorise l'accès dans les réglages du téléphone pour choisir une photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const savedUri = await saveContainerPhoto(result.assets[0].uri);
      setPhotoUri(savedUri);
    }
  }

  function handlePickPhoto() {
    Alert.alert("Photo du récipient", undefined, [
      { text: "Prendre une photo", onPress: pickFromCamera },
      { text: "Choisir dans la galerie", onPress: pickFromLibrary },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  async function handleSave() {
    const tareWeightG = parseFloat(tareWeight);
    if (isNew) {
      await createContainer({ name: name.trim(), tareWeightG, photoUri, notes: notes.trim() || undefined });
    } else {
      await updateContainer(containerId as number, {
        name: name.trim(),
        tareWeightG,
        photoUri,
        notes: notes.trim() || undefined,
      });
    }
    router.back();
  }

  function handleDelete() {
    Alert.alert("Supprimer ce récipient ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteContainer(containerId as number, existing?.photoUri ?? null);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
          </View>
        )}
      </Pressable>
      {photoUri ? (
        <Pressable onPress={() => setPhotoUri(null)}>
          <Text style={styles.clearLink}>Retirer la photo</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: Bol bleu"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Poids à vide (g)</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: 150"
        keyboardType="decimal-pad"
        value={tareWeight}
        onChangeText={setTareWeight}
      />

      <Text style={styles.label}>Notes (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="ex: assiette blanche du placard du haut"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </Pressable>

      {!isNew && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Supprimer le récipient</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8 },
  photoPicker: { alignSelf: "center", marginTop: 8 },
  photoPreview: { width: 140, height: 140, borderRadius: 16, backgroundColor: colors.surface },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoPlaceholderText: { fontSize: 12, color: colors.textMuted },
  clearLink: { color: colors.primary, fontSize: 13, textAlign: "center", marginTop: 8 },
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
