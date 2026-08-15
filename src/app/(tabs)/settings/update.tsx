import { UpdateSettingsScreen } from "@forthtilliath/react-native-kit/components/settings/UpdateSettingsScreen";
import Constants from "expo-constants";
import { ScrollView } from "react-native";

import { compareVersions, downloadAndInstallApk, fetchLatestRelease, fetchReleaseHistory } from "@/lib/appUpdate";
import { useColors } from "@/theme/colors";

export default function UpdateSettingsPage() {
  const colors = useColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      <UpdateSettingsScreen
        currentVersion={Constants.expoConfig?.version ?? "?"}
        checkForUpdate={fetchLatestRelease}
        compareVersions={compareVersions}
        downloadAndInstallApk={downloadAndInstallApk}
        fetchReleaseHistory={fetchReleaseHistory}
        styles={{
          infoBox: { backgroundColor: colors.surface, borderColor: colors.border },
          infoLabel: { color: colors.textMuted },
          infoValue: { color: colors.text },
          helpText: { color: colors.textMuted },
          errorText: { color: colors.danger },
          button: { backgroundColor: colors.primary },
          buttonText: { color: colors.primaryText },
          activityIndicatorColor: colors.primaryText,
          updateAvailableBox: { backgroundColor: colors.surface, borderColor: colors.border },
          updateAvailableTitle: { color: colors.text },
          changelogTitle: { color: colors.text },
          changelogEntry: { backgroundColor: colors.surface, borderColor: colors.border },
          changelogVersion: { color: colors.text },
          changelogDate: { color: colors.textMuted },
        }}
      />
    </ScrollView>
  );
}
