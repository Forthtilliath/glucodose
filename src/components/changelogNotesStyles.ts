import type { ChangelogNotesStyles } from "@forthtilliath/expo-release-updates-ui/ChangelogNotes";

import type { ThemeColors } from "@/theme/colors";

// Couleurs des notes de version (popup de mise à jour, écran Mises à jour).
// Toutes les clés sont fournies : celles laissées aux valeurs par défaut du
// paquet gardent des couleurs foncées, illisibles en mode sombre.
export function changelogNotesStyles(colors: ThemeColors): ChangelogNotesStyles {
  return {
    heading: { color: colors.text },
    bullet: { color: colors.textMuted },
    itemText: { color: colors.textMuted },
    text: { color: colors.textMuted },
    bold: { color: colors.text },
  };
}
