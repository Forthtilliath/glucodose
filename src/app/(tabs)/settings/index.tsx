import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SettingsMenu } from "@forthtilliath/react-native-kit/components/settings/SettingsMenu";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsMenu
        defaultIconKind="icon"
        showHints={false}
        groups={[
          {
            title: "Réglages de calcul",
            items: [
              {
                key: "dose",
                icon: "water-outline",
                title: "Dose et correction",
                onPress: () => router.push("/settings/dose"),
              },
              {
                key: "ratios",
                icon: "calculator-outline",
                title: "Ratios insuline/glucides",
                onPress: () => router.push("/settings/ratios"),
              },
            ],
          },
          {
            title: "Données",
            items: [
              {
                key: "backup",
                icon: "cloud-upload-outline",
                title: "Sauvegarde et restauration",
                onPress: () => router.push("/settings/backup"),
              },
            ],
          },
          {
            title: "App",
            items: [
              { key: "theme", title: "Apparence", onPress: () => router.push("/settings/theme") },
              { key: "update", title: "Mises à jour", onPress: () => router.push("/settings/update") },
              {
                key: "help",
                icon: "help-circle-outline",
                title: "Aide",
                onPress: () => router.push("/settings/help"),
              },
              { key: "contact", title: "Contact", onPress: () => router.push("/settings/contact") },
              { key: "about", title: "À propos", onPress: () => router.push("/settings/about") },
              {
                key: "legal",
                icon: "document-text-outline",
                title: "Mentions légales",
                onPress: () => router.push("/settings/legal"),
              },
            ],
          },
        ]}
        styles={{
          groupTitle: { color: colors.textMuted },
          row: { backgroundColor: colors.surface, borderColor: colors.border },
          iconColor: colors.text,
          title: { color: colors.text },
          chevronColor: colors.textMuted,
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
