import type { WidgetTaskHandler } from "react-native-android-widget";

import { cycleWidgetContainer, cycleWidgetFood, getWidgetSelection, type WidgetSelection } from "./widgetState";
import { WeighWidget } from "./WeighWidget";

const EMPTY_SELECTION: WidgetSelection = {
  containerId: null,
  containerName: null,
  foodId: null,
  foodName: null,
};

// "OPEN_URI" (bouton Peser) est géré nativement par la librairie sans jamais
// invoquer ce handler avec widgetAction "WIDGET_CLICK" — seuls les clics sur
// les cases récipient/aliment (clickAction custom) y remontent.
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, clickAction, renderWidget }) => {
  if (widgetAction === "WIDGET_CLICK") {
    // Tâche headless indépendante de l'app : une erreur ici ne doit pas
    // empêcher le widget de se redessiner avec son état précédent.
    try {
      if (clickAction === "CYCLE_CONTAINER") await cycleWidgetContainer();
      else if (clickAction === "CYCLE_FOOD") await cycleWidgetFood();
    } catch {
      // Ignoré : le widget se redessine quand même juste en dessous.
    }
  }

  if (widgetAction === "WIDGET_DELETED") return;

  // Si la lecture DB échoue (ex. migrations pas encore jouées), le widget
  // doit quand même s'afficher plutôt que de rester invisible.
  try {
    const selection = await getWidgetSelection();
    renderWidget(<WeighWidget selection={selection} />);
  } catch {
    renderWidget(<WeighWidget selection={EMPTY_SELECTION} />);
  }
};
