import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Réglages" }} />
      <Stack.Screen name="dose" options={{ title: "Dose et correction" }} />
      <Stack.Screen name="ratios" options={{ title: "Ratios insuline/glucides" }} />
      <Stack.Screen name="ratio/[id]" options={{ title: "Ratio insuline/glucides" }} />
      <Stack.Screen name="backup" options={{ title: "Sauvegarde" }} />
      <Stack.Screen name="update" options={{ title: "Mises à jour" }} />
      <Stack.Screen name="help" options={{ title: "Aide" }} />
      <Stack.Screen name="contact" options={{ title: "Contact" }} />
      <Stack.Screen name="about" options={{ title: "À propos" }} />
      <Stack.Screen name="legal" options={{ title: "Mentions légales" }} />
    </Stack>
  );
}
