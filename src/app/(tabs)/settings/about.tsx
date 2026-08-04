import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import Constants from "expo-constants";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function AboutScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const version = Constants.expoConfig?.version ?? "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appName}>GlucoDose</Text>
      <Text style={styles.version}>Version {version}</Text>

      <Text style={styles.paragraph}>
        GlucoDose est un outil personnel d’aide au calcul de dose d’insuline au repas : pesée,
        aliments, recettes et correction, sans calculette.
      </Text>
      <Text style={styles.paragraph}>
        Toutes les données (récipients, aliments, recettes, ratios, réglages, historique) restent
        uniquement sur cet appareil, dans une base locale. Rien n’est envoyé sur un serveur.
      </Text>

      <Text style={styles.sectionTitle}>Avertissement médical</Text>
      <Text style={styles.paragraph}>
        Ceci n’est pas un dispositif médical. C’est un outil personnel d’aide au calcul, construit pour un
        usage individuel. Les ratios insuline/glucides, le facteur de sensibilité et les valeurs
        glucidiques saisies doivent provenir de ton équipe soignante (diététicien·ne, diabétologue).
        Vérifie toujours une dose avant de l’injecter. En cas de doute, fie-toi à ton jugement clinique et
        à celui de ton équipe de soins, jamais uniquement à cette application.
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    appName: { fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center", marginTop: 8 },
    version: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 4, marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20 },
    paragraph: { fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  });
}
