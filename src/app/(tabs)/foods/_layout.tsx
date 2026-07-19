import { Stack } from "expo-router";

export default function FoodsLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="index" options={{ title: "Aliments" }} />
      <Stack.Screen name="new" options={{ title: "Nouvel aliment", presentation: "modal" }} />
      <Stack.Screen name="ingredient/[id]" options={{ title: "Ingrédient" }} />
      <Stack.Screen name="recipe/[id]" options={{ title: "Recette" }} />
    </Stack>
  );
}
