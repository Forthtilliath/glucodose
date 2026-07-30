import * as Linking from "expo-linking";
import { FlexWidget, TextWidget } from "react-native-android-widget";

import type { DailySummary } from "./dailySummary";

type WeighWidgetProps = {
  summary?: DailySummary;
};

// Widget d'accueil Android : raccourci vers l'écran Peser (comme le
// raccourci d'icône en appui long) + résumé du jour (glucides / dose totale)
// quand la base a pu être lue. `summary` est optionnel : si la lecture DB
// échoue côté widgetTaskHandler, le widget reste un simple raccourci plutôt
// que de planter.
export function WeighWidget({ summary }: WeighWidgetProps) {
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
        padding: 8,
      }}
    >
      <TextWidget text="⚖️" style={{ fontSize: 28 }} />
      <TextWidget
        text="Peser"
        style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginTop: 2 }}
      />
      {summary?.hasAnyWeighing ? (
        <FlexWidget
          style={{ flexDirection: "column", alignItems: "center", marginTop: 4 }}
        >
          <TextWidget
            text={`🍞 ${Math.round(summary.carbsG)} g`}
            style={{ fontSize: 12, color: "#ffffff" }}
          />
          {summary.hasAnyDose ? (
            <TextWidget
              text={`💉 ${summary.doseUnits.toFixed(1)} U`}
              style={{ fontSize: 12, color: "#ffffff" }}
            />
          ) : null}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}
