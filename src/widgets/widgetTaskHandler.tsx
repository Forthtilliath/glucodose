import type { WidgetTaskHandler } from "react-native-android-widget";

import { WeighWidget } from "./WeighWidget";

// "OPEN_URI" (utilisé par WeighWidget) est géré nativement par la librairie
// sans jamais invoquer ce handler avec widgetAction "WIDGET_CLICK" — il n'y a
// donc rien à faire ici pour le clic, seulement pour le (re)dessin du widget.
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      renderWidget(<WeighWidget />);
      break;
    default:
      break;
  }
};
