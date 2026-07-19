import { Stack } from "expo-router";

export default function ContainersLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Récipients" }} />
      <Stack.Screen name="[id]" options={{ title: "Récipient" }} />
    </Stack>
  );
}
