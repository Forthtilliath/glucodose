import { useMemo } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

const CONTACT_EMAIL = "vincent.lisita+diab@gmail.com";

export default function ContactScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleEmail() {
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("GlucoDose")}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Aucune app mail", `Écris-moi directement à ${CONTACT_EMAIL}`);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: "GlucoDose, une app pour calculer sa dose d'insuline au repas sans calculette.",
      });
    } catch {
      // L'utilisateur a annulé le partage, rien à faire.
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.helpText}>
        Une question, un bug à signaler, une idée d’amélioration ? Ou juste envie de faire connaître
        l’app à quelqu’un ?
      </Text>

      <Pressable
        style={styles.row}
        onPress={handleEmail}
        accessibilityRole="button"
        accessibilityLabel={`M'envoyer un email à ${CONTACT_EMAIL}`}
      >
        <Ionicons name="mail-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Me contacter</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="Partager l’app"
      >
        <Ionicons name="share-social-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Partager l’app</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    helpText: { fontSize: 13, color: colors.textMuted, marginBottom: 14, lineHeight: 18 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    rowText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  });
}
