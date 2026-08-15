import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import Constants from "expo-constants";
import { AboutSettingsScreen } from "@forthtilliath/react-native-kit/components/settings/AboutSettingsScreen";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function AboutScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const version = Constants.expoConfig?.version ?? "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AboutSettingsScreen
        appName="GlucoDose"
        version={version}
        description={[
          "GlucoDose est un outil personnel d’aide au calcul de dose d’insuline au repas : pesée, aliments, recettes et correction, sans calculette.",
          "Toutes les données (récipients, aliments, recettes, ratios, réglages, historique) restent uniquement sur cet appareil, dans une base locale. Rien n’est envoyé sur un serveur.",
        ]}
        sections={[
          {
            title: "Avertissement médical",
            paragraphs: [
              "Ceci n’est pas un dispositif médical. C’est un outil personnel d’aide au calcul, construit pour un usage individuel. Les ratios insuline/glucides, le facteur de sensibilité et les valeurs glucidiques saisies doivent provenir de ton équipe soignante (diététicien·ne, diabétologue). Vérifie toujours une dose avant de l’injecter. En cas de doute, fie-toi à ton jugement clinique et à celui de ton équipe de soins, jamais uniquement à cette application.",
            ],
          },
        ]}
        styles={{
          appName: { color: colors.text, textAlign: "center" },
          version: { color: colors.textMuted, textAlign: "center" },
          separator: { backgroundColor: colors.border },
          paragraph: { color: colors.textMuted },
          sectionTitle: { color: colors.text },
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
