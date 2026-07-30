import { Stack } from "expo-router";

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Historique" }} />
      <Stack.Screen name="stats" options={{ title: "Statistiques" }} />
    </Stack>
  );
}
