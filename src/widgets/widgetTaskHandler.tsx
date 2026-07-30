import type { WidgetTaskHandler } from "react-native-android-widget";

import { getTodaySummary } from "./dailySummary";
import { WeighWidget } from "./WeighWidget";

// "OPEN_URI" (utilisé par WeighWidget) est géré nativement par la librairie
// sans jamais invoquer ce handler avec widgetAction "WIDGET_CLICK" — il n'y a
// donc rien à faire ici pour le clic, seulement pour le (re)dessin du widget.
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      // Tâche headless indépendante de l'app : si la lecture DB échoue (ex.
      // migrations pas encore jouées), le widget doit quand même s'afficher
      // comme simple raccourci plutôt que de rester invisible.
      try {
        const summary = await getTodaySummary();
        renderWidget(<WeighWidget summary={summary} />);
      } catch {
        renderWidget(<WeighWidget />);
      }
      break;
    default:
      break;
  }
};
