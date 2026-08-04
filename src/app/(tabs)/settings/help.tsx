import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { type ThemeColors, useColors } from "@/theme/colors";

export default function HelpScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Pourquoi cette app</Text>
      <Text style={styles.paragraph}>
        À chaque repas, gérer un diabète sous insuline demande de peser chaque aliment, convertir ce poids
        en glucides, puis convertir ces glucides en unités d’insuline grâce à ton ratio personnel — et
        éventuellement ajouter une correction si la glycémie est trop haute.
      </Text>
      <Text style={styles.paragraph}>
        GlucoDose remplace la calculette : elle mémorise les poids de récipients, les valeurs
        glucidiques des aliments et recettes déjà utilisés, et fait tous les calculs à la volée pendant la
        pesée.
      </Text>

      <Text style={styles.sectionTitle}>Les étapes d’une pesée</Text>
      <Text style={styles.step}>1. Choisis un récipient (son poids à vide est déjà connu).</Text>
      <Text style={styles.step}>2. Pose-le sur la balance et ajoute tes aliments un par un.</Text>
      <Text style={styles.step}>
        3. Sélectionne chaque aliment ou recette dans la liste pour que l’app calcule ses glucides à partir
        du poids pesé.
      </Text>
      <Text style={styles.step}>
        4. L’app additionne les glucides, applique ton ratio insuline/glucides et affiche la dose
        conseillée, avec une correction en plus si tu as renseigné une glycémie actuelle.
      </Text>

      <Text style={styles.sectionTitle}>Aliments, récipients et recettes</Text>
      <Text style={styles.paragraph}>
        Onglet Aliments : renseigne une fois la teneur en glucides pour 100 g d’un aliment, elle sera
        réutilisée à chaque pesée. Onglet Récipients : enregistre le poids à vide de tes bols, assiettes ou
        boîtes pour ne plus avoir à faire la tare. Une recette combine plusieurs aliments avec leurs
        proportions, pratique pour un plat préparé à l’avance.
      </Text>

      <Text style={styles.sectionTitle}>Ratios et correction</Text>
      <Text style={styles.paragraph}>
        Dans Réglages, tu peux définir un ou plusieurs ratios insuline/glucides (par exemple un pour le
        petit-déjeuner, un autre pour le reste de la journée), ainsi qu’une glycémie cible et un facteur de
        sensibilité pour que l’app propose une dose de correction en plus de la dose repas.
      </Text>

      <Text style={styles.sectionTitle}>Historique et sauvegarde</Text>
      <Text style={styles.paragraph}>
        L’onglet Historique garde une trace de tes pesées passées. Dans Réglages → Sauvegarde et
        restauration, tu peux exporter toutes tes données dans un fichier, à garder précieusement ou à
        transférer vers un autre téléphone.
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 48, gap: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20 },
    paragraph: { fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
    step: { fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  });
}
