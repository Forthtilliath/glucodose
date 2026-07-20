import type { Href } from "expo-router";
import type { Action } from "expo-quick-actions";

// Raccourcis affichés par un appui long sur l'icône de l'app (Android et
// iOS). L'id sert à retrouver la route de destination au clic.
export const QUICK_ACTIONS: Action[] = [
  { id: "weigh", title: "Peser", icon: "compose" },
  { id: "add-container", title: "Nouveau récipient", icon: "add" },
  { id: "add-food", title: "Nouvel aliment", icon: "add" },
];

const ROUTE_BY_ACTION_ID: Record<string, Href> = {
  // Le focus auto du poids brut n'a de sens que pour ce raccourci (peser
  // tout de suite) — pas au lancement normal de l'app, d'où le paramètre
  // plutôt qu'un autoFocus inconditionnel sur l'écran.
  weigh: { pathname: "/", params: { autoFocusWeight: "1" } },
  "add-container": "/containers/new",
  "add-food": "/foods/new",
};

export function routeForQuickAction(actionId: string): Href | undefined {
  return ROUTE_BY_ACTION_ID[actionId];
}
