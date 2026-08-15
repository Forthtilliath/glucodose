import { PrivacySettingsScreen } from "@forthtilliath/react-native-kit/components/settings/PrivacySettingsScreen";
import { ScrollView } from "react-native";

import { useColors } from "@/theme/colors";

export default function LegalPage() {
  const colors = useColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      <PrivacySettingsScreen
        sections={[
          {
            title: "Avertissement médical",
            paragraphs: [
              "GlucoDose n’est pas un dispositif médical. C’est un outil personnel d’aide au calcul, construit pour un usage individuel. Les ratios insuline/glucides, le facteur de sensibilité et les valeurs glucidiques saisies doivent provenir de ton équipe soignante (diététicien·ne, diabétologue). Vérifie toujours une dose avant de l’injecter. En cas de doute, fie-toi à ton jugement clinique et à celui de ton équipe de soins, jamais uniquement à cette application.",
            ],
          },
          {
            title: "Confidentialité",
            paragraphs: [
              "L’app ne collecte aucune donnée personnelle et ne dispose d’aucun compte utilisateur. Tout ce que tu saisis (récipients, aliments, recettes, ratios, réglages, historique, photos de récipients) est stocké uniquement dans une base de données locale sur cet appareil, et n’est jamais transmis à un serveur ni à un tiers.",
              "L’accès à l’appareil photo et à la pellicule n’est utilisé que pour illustrer tes récipients, à ta demande. Aucun outil d’analyse d’usage ni de publicité n’est intégré à l’app.",
              "Tes données restent sous ton contrôle : tu peux les exporter ou les supprimer à tout moment depuis Réglages → Sauvegarde et restauration, ou en désinstallant l’app.",
            ],
          },
          {
            title: "Conditions d’utilisation",
            paragraphs: [
              "L’app est fournie gratuitement, sans achat intégré, « en l’état » et sans garantie d’exactitude des calculs. Elle est destinée à un usage strictement personnel et ne remplace en aucun cas un avis médical. L’utilisation de l’app se fait sous ta seule responsabilité.",
            ],
          },
        ]}
        styles={{
          title: { color: colors.text },
          paragraph: { color: colors.textMuted },
          separator: { backgroundColor: colors.border },
        }}
      />
    </ScrollView>
  );
}
