import type { PickerModalStyles } from "@forthtilliath/react-native-kit/components/picker/PickerModal";

import type { ThemeColors } from "@/theme/colors";

// Styles partagés par tous les usages de PickerModal dans l'app, pour ne pas
// répéter ce mapping thème → styles à chaque écran. Reproduit exactement
// l'apparence de l'ancien PickerModal interne à l'app (couleurs uniquement :
// tailles/espacements restent les valeurs par défaut du package, déjà identiques).
export function pickerModalStyles(colors: ThemeColors): PickerModalStyles {
  return {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    close: { color: colors.primary },
    search: { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
    row: { backgroundColor: colors.surface, borderColor: colors.border },
    rowThumbnail: { backgroundColor: colors.background },
    rowThumbnailPlaceholder: { backgroundColor: colors.background },
    rowLabel: { color: colors.text },
    rowSubtitle: { color: colors.textMuted },
    empty: { color: colors.textMuted },
    sectionHeader: { color: colors.textMuted },
    extraActionLabel: { color: colors.primary },
    extraActionIconColor: colors.primary,
    rowThumbnailPlaceholderIconColor: colors.textMuted,
    placeholderTextColor: colors.textMuted,
  };
}
