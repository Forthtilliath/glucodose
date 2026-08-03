import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { ThemeToggle } from "@forthtilliath/react-native-kit/ThemeToggle";
import type { ThemePreference } from "@forthtilliath/react-native-kit/useEffectiveColorScheme";

import { db } from "@/db/client";
import { updateSettings } from "@/db/repository";
import { settings } from "@/db/schema";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function ThemeSettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const currentSettings = settingsRows?.[0];

  const [themePreference, setThemePreference] = useState<ThemePreference>("system");

  useEffect(() => {
    if (currentSettings) {
      setThemePreference(currentSettings.themePreference);
    }
  }, [currentSettings]);

  // Bascule à effet immédiat, comme les autres réglages de préférence
  // (unité de glycémie, affichage du calcul de dose dans Réglages > Dose).
  async function handleChange(preference: ThemePreference) {
    setThemePreference(preference);
    await updateSettings({
      glycemiaUnit: currentSettings?.glycemiaUnit ?? "mmol/L",
      targetGlycemia: currentSettings?.targetGlycemia ?? null,
      sensitivityFactor: currentSettings?.sensitivityFactor ?? null,
      showInsulinDose: currentSettings?.showInsulinDose ?? true,
      themePreference: preference,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Thème de l'app</Text>
      <Text style={styles.helpText}>"Système" suit le réglage clair/sombre de ton téléphone.</Text>
      <ThemeToggle
        value={themePreference}
        onChange={(preference) => {
          handleChange(preference).catch(() => {});
        }}
        styles={{
          option: { backgroundColor: colors.surface, borderColor: colors.border },
          optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
          optionText: { color: colors.text },
          optionTextActive: { color: colors.primaryText },
        }}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 8 },
    helpText: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 12 },
  });
}
