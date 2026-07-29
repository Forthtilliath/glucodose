import { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  photoUri: string | null;
  // Icône affichée en l'absence de photo (ex: "cube-outline" pour un
  // récipient, "restaurant-outline" pour un aliment).
  placeholderIcon: keyof typeof Ionicons.glyphMap;
  size?: number;
};

// Miniature de ligne de liste (photo ou icône de substitution), partagée par
// les listes récipients et aliments.
export function Thumbnail({ photoUri, placeholderIcon, size = 48 }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={styles.thumbnail} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={styles.placeholder}>
      <Ionicons name={placeholderIcon} size={Math.round(size * 0.46)} color={colors.textMuted} />
    </View>
  );
}

function createStyles(colors: ThemeColors, size: number) {
  return StyleSheet.create({
    thumbnail: { width: size, height: size, borderRadius: 10, backgroundColor: colors.background },
    placeholder: {
      width: size,
      height: size,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
