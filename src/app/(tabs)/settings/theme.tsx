import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { ThemeOptionList } from "@forthtilliath/react-native-kit/components/theme/ThemeOptionList";
import type { ThemePreference } from "@forthtilliath/react-native-kit/hooks/useEffectiveColorScheme";

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

  // Hydrates local state from the async-loaded settings, once they arrive —
  // not derived directly, so a settings refresh mid-interaction doesn't
  // override a change the user just made that hasn't persisted yet.
  useEffect(() => {
    if (currentSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <Text style={styles.sectionTitle}>Thème de l’app</Text>
      <Text style={styles.helpText}>« Système » suit le réglage clair/sombre de ton téléphone.</Text>
      <ThemeOptionList
        value={themePreference}
        onChange={(preference) => {
          handleChange(preference).catch(() => {});
        }}
        styles={{
          container: styles.optionsContainer,
          row: [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }],
          rowActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}1a` },
          label: { color: colors.text },
          labelActive: { color: colors.primary },
          iconColor: colors.text,
          iconColorActive: colors.primary,
          checkColor: colors.primary,
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
    optionsContainer: { gap: 8, marginTop: 8 },
    row: { borderRadius: 10, padding: 14 },
  });
}
