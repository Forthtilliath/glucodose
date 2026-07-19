import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Réglages" }} />
      <Stack.Screen name="ratio/[id]" options={{ title: "Ratio insuline/glucides" }} />
    </Stack>
  );
}
