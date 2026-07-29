import { useMemo } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
  savePhoto: (sourceUri: string) => Promise<string>;
  // Groupe nominal utilisé tel quel dans "Photo {photoLabel}" et "Ajouter une
  // photo {photoLabel}", ex. "du récipient", "de l'ingrédient", "de la recette".
  photoLabel: string;
};

// Sélection de photo (appareil photo ou galerie) avec aperçu, partagée par
// les récipients et les aliments (ingrédients/recettes).
export function PhotoPicker({ photoUri, onChange, savePhoto, photoLabel }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Accès à l'appareil photo refusé",
        "Autorise l'accès dans les réglages du téléphone pour prendre une photo."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      onChange(await savePhoto(result.assets[0].uri));
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
      onChange(await savePhoto(result.assets[0].uri));
    }
  }

  function handlePickPhoto() {
    Alert.alert(`Photo ${photoLabel}`, undefined, [
      { text: "Prendre une photo", onPress: pickFromCamera },
      { text: "Choisir dans la galerie", onPress: pickFromLibrary },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  return (
    <>
      <Pressable
        style={styles.photoPicker}
        onPress={handlePickPhoto}
        accessibilityRole="button"
        accessibilityLabel={photoUri ? `Photo ${photoLabel}. Modifier.` : `Ajouter une photo ${photoLabel}`}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
          </View>
        )}
      </Pressable>
      {photoUri ? (
        <Pressable onPress={() => onChange(null)} accessibilityRole="button" accessibilityLabel="Retirer la photo">
          <Text style={styles.clearLink}>Retirer la photo</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
  });
}
