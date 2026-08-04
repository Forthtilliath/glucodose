import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function LegalScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Avertissement médical</Text>
      <Text style={styles.paragraph}>
        GlucoDose n’est pas un dispositif médical. C’est un outil personnel d’aide au calcul, construit
        pour un usage individuel. Les ratios insuline/glucides, le facteur de sensibilité et les valeurs
        glucidiques saisies doivent provenir de ton équipe soignante (diététicien·ne, diabétologue).
        Vérifie toujours une dose avant de l’injecter. En cas de doute, fie-toi à ton jugement clinique et
        à celui de ton équipe de soins, jamais uniquement à cette application.
      </Text>

      <Text style={styles.sectionTitle}>Confidentialité</Text>
      <Text style={styles.paragraph}>
        L’app ne collecte aucune donnée personnelle et ne dispose d’aucun compte utilisateur. Tout ce que
        tu saisis (récipients, aliments, recettes, ratios, réglages, historique, photos de récipients) est
        stocké uniquement dans une base de données locale sur cet appareil, et n’est jamais transmis à un
        serveur ni à un tiers.
      </Text>
      <Text style={styles.paragraph}>
        L’accès à l’appareil photo et à la pellicule n’est utilisé que pour illustrer tes récipients, à ta
        demande. Aucun outil d’analyse d’usage ni de publicité n’est intégré à l’app.
      </Text>
      <Text style={styles.paragraph}>
        Tes données restent sous ton contrôle : tu peux les exporter ou les supprimer à tout moment depuis
        Réglages → Sauvegarde et restauration, ou en désinstallant l’app.
      </Text>

      <Text style={styles.sectionTitle}>Conditions d’utilisation</Text>
      <Text style={styles.paragraph}>
        L’app est fournie gratuitement, sans achat intégré, « en l’état » et sans garantie d’exactitude des
        calculs. Elle est destinée à un usage strictement personnel et ne remplace en aucun cas un avis
        médical. L’utilisation de l’app se fait sous ta seule responsabilité.
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20 },
    paragraph: { fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  });
}
