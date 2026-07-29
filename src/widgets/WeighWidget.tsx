import * as Linking from "expo-linking";
import { FlexWidget, TextWidget } from "react-native-android-widget";

// Widget d'accueil Android : un simple raccourci vers l'écran Peser, en
// complément du raccourci d'icône (appui long) déjà existant. L'URI est
// construite avec Linking.createURL plutôt qu'écrite en dur, pour rester
// correcte quel que soit le scheme configuré (voir app.json).
export function WeighWidget() {
  const weighUri = Linking.createURL("", { queryParams: { autoFocusWeight: "1" } });

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: weighUri }}
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#208AEF",
        borderRadius: 24,
      }}
    >
      <TextWidget text="⚖️" style={{ fontSize: 32 }} />
      <TextWidget
        text="Peser"
        style={{ fontSize: 14, fontWeight: "700", color: "#ffffff", marginTop: 4 }}
      />
    </FlexWidget>
  );
}
