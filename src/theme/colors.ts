import { createContext, useContext } from "react";
import { type ThemePreference, useEffectiveColorScheme } from "@forthtilliath/react-native-kit/useEffectiveColorScheme";

// Valeur par défaut "system" : tout composant rendu avant que
// ThemePreferenceRunner (src/app/_layout.tsx) n'ait fini de charger le
// réglage stocké en base (ou pendant le chargement/erreur de migration, où
// ce provider n'est pas encore monté) suit simplement le thème du téléphone.
const ThemePreferenceContext = createContext<ThemePreference>("system");
export const ThemePreferenceProvider = ThemePreferenceContext.Provider;

export type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  badgeIngredientBg: string;
  badgeRecipeBg: string;
  badgeText: string;
};

const lightColors: ThemeColors = {
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  primary: "#2563eb",
  primaryText: "#ffffff",
  danger: "#dc2626",
  success: "#16a34a",
  badgeIngredientBg: "#dbeafe",
  badgeRecipeBg: "#dcfce7",
  badgeText: "#0f172a",
};

const darkColors: ThemeColors = {
  background: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  primary: "#3b82f6",
  primaryText: "#ffffff",
  danger: "#f87171",
  success: "#4ade80",
  badgeIngredientBg: "#1e3a5f",
  badgeRecipeBg: "#14532d",
  badgeText: "#f1f5f9",
};

// Palette par défaut pour le code qui s'exécute hors composant React (aucun
// cas d'usage actuel, gardé pour compatibilité s'il en apparaît un).
export const colors = lightColors;

// Exposé séparément de useColors() pour src/app/_layout.tsx, qui a aussi
// besoin du schéma effectif brut ("light"/"dark") pour choisir le thème du
// ThemeProvider d'expo-router (Dark/DefaultTheme).
export function useEffectiveScheme(): "light" | "dark" {
  const preference = useContext(ThemePreferenceContext);
  return useEffectiveColorScheme(preference);
}

// Chaque écran doit appeler ce hook plutôt qu'importer `colors` directement,
// pour suivre la préférence de thème (Réglages > Apparence, "system" suit le
// thème du téléphone comme userInterfaceStyle "automatic" dans app.json).
export function useColors(): ThemeColors {
  const scheme = useEffectiveScheme();
  return scheme === "dark" ? darkColors : lightColors;
}
