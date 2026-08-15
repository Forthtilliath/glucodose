import { useMemo } from "react";
import { Linking, ScrollView, Share, StyleSheet } from "react-native";
import { ContactSettingsScreen } from "@forthtilliath/react-native-kit/components/settings/ContactSettingsScreen";

import { type ThemeColors, useColors } from "@/theme/colors";

const CONTACT_EMAIL = "vincent.lisita+diab@gmail.com";
const COFFEE_URL = "https://buymeacoffee.com/forthtilliath";

export default function ContactScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleShare() {
    try {
      await Share.share({
        message: "GlucoDose, une app pour calculer sa dose d'insuline au repas sans calculette.",
      });
    } catch {
      // L'utilisateur a annulé le partage, rien à faire.
    }
  }

  async function handleCoffee() {
    await Linking.openURL(COFFEE_URL);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ContactSettingsScreen
        email={CONTACT_EMAIL}
        actions={[
          {
            icon: "share-social-outline",
            label: "Partager l’app",
            onPress: () => {
              handleShare().catch(() => {});
            },
          },
          {
            icon: "cafe-outline",
            label: "M’offrir un café",
            accessibilityLabel: "M'offrir un café sur Buy Me a Coffee",
            onPress: () => {
              handleCoffee().catch(() => {});
            },
          },
        ]}
        labels={{
          hint: "Une question, un bug à signaler, une idée d’amélioration ? Ou juste envie de faire connaître l’app à quelqu’un ?",
        }}
        styles={{
          hint: { color: colors.textMuted },
          row: { backgroundColor: colors.surface, borderColor: colors.border },
          rowText: { color: colors.text },
          rowIconColor: colors.text,
        }}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
  });
}
