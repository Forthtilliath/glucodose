import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Réglages de calcul</Text>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/dose")}
        accessibilityRole="button"
        accessibilityLabel="Dose et correction"
      >
        <Ionicons name="water-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Dose et correction</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/ratios")}
        accessibilityRole="button"
        accessibilityLabel="Ratios insuline/glucides"
      >
        <Ionicons name="calculator-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Ratios insuline/glucides</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Données</Text>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/backup")}
        accessibilityRole="button"
        accessibilityLabel="Sauvegarde et restauration des données"
      >
        <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Sauvegarde et restauration</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>App</Text>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/theme")}
        accessibilityRole="button"
        accessibilityLabel="Apparence"
      >
        <Ionicons name="contrast-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Apparence</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/update")}
        accessibilityRole="button"
        accessibilityLabel="Mises à jour"
      >
        <Ionicons name="download-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Mises à jour</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/help")}
        accessibilityRole="button"
        accessibilityLabel="Aide, présentation de l'app"
      >
        <Ionicons name="help-circle-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Aide</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/contact")}
        accessibilityRole="button"
        accessibilityLabel="Contact"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Contact</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/about")}
        accessibilityRole="button"
        accessibilityLabel="À propos de l'app"
      >
        <Ionicons name="information-circle-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>À propos</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/legal")}
        accessibilityRole="button"
        accessibilityLabel="Mentions légales"
      >
        <Ionicons name="document-text-outline" size={20} color={colors.text} />
        <Text style={styles.rowText}>Mentions légales</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 8, textTransform: "uppercase" },
    sectionSpacing: { marginTop: 24 },
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
