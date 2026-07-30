"use no memo";

import * as Linking from "expo-linking";
import { FlexWidget, TextWidget } from "react-native-android-widget";

import type { WidgetSelection } from "./widgetState";

type WeighWidgetProps = {
  selection: WidgetSelection;
};

const BG_COLOR = "#208AEF";
const CELL_COLOR = "#1976D2";

// Case cliquable en haut du widget : affiche la sélection courante et fait
// défiler vers l'élément récent suivant au tap (clickAction custom géré par
// widgetTaskHandler, sans jamais ouvrir l'app — voir click-action.ts de la
// librairie : seuls "OPEN_APP"/"OPEN_URI" ont un sens réservé).
function SelectionCell({
  label,
  value,
  clickAction,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  clickAction: string;
  accessibilityLabel: string;
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      accessibilityLabel={accessibilityLabel}
      style={{
        flex: 1,
        height: "match_parent",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: CELL_COLOR,
        borderRadius: 16,
        margin: 3,
        padding: 4,
      }}
    >
      <TextWidget text={label} style={{ fontSize: 10, color: "#cfe3fb" }} />
      <TextWidget
        text={value}
        style={{ fontSize: 13, fontWeight: "700", color: "#ffffff", marginTop: 2 }}
        maxLines={1}
      />
    </FlexWidget>
  );
}

// Widget d'accueil Android : grille récipient/aliment (cycle sur tap, sans
// ouvrir l'app) + bouton Peser qui ouvre l'écran de pesée avec cette
// sélection déjà pré-remplie — pensé pour servir de raccourci de saisie
// réel, pas juste un lanceur d'app.
export function WeighWidget({ selection }: WeighWidgetProps) {
  const weighUri = Linking.createURL("", {
    queryParams: {
      autoFocusWeight: "1",
      ...(selection.containerId != null ? { containerId: String(selection.containerId) } : {}),
      ...(selection.foodId != null ? { foodId: String(selection.foodId) } : {}),
    },
  });

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        backgroundColor: BG_COLOR,
        borderRadius: 24,
        padding: 4,
      }}
    >
      <FlexWidget style={{ flexDirection: "row", flex: 1, width: "match_parent" }}>
        <SelectionCell
          label="Récipient"
          value={selection.containerName ?? "—"}
          clickAction="CYCLE_CONTAINER"
          accessibilityLabel="Changer de récipient"
        />
        <SelectionCell
          label="Aliment"
          value={selection.foodName ?? "—"}
          clickAction="CYCLE_FOOD"
          accessibilityLabel="Changer d'aliment"
        />
      </FlexWidget>
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: weighUri }}
        accessibilityLabel="Peser avec cette sélection"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "match_parent",
          height: 44,
          backgroundColor: "#ffffff",
          borderRadius: 16,
          margin: 3,
          marginTop: 0,
        }}
      >
        <TextWidget text="⚖️" style={{ fontSize: 18, marginRight: 6 }} />
        <TextWidget text="Peser" style={{ fontSize: 15, fontWeight: "700", color: BG_COLOR }} />
      </FlexWidget>
    </FlexWidget>
  );
}
