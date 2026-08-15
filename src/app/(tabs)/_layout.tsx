import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { useColors } from "@/theme/colors";

export default function TabsLayout() {
  const colors = useColors();
  const router = useRouter();

  // Onglets à sous-navigation (Stack imbriqué) : sans ça, revenir sur l'onglet
  // après en avoir quitté un autre restaure la dernière sous-page visitée
  // plutôt que l'écran principal — et rien ne permet alors de remonter dessus
  // facilement. `router.navigate` vers la racine du groupe saute directement
  // sur cette route existante en dépilant le surplus, aussi bien en arrivant
  // d'un autre onglet qu'en retapant sur l'onglet déjà actif.
  function resetTabOnPress(rootPath: "/foods" | "/history" | "/settings") {
    return {
      tabPress: (e: { preventDefault: () => void }) => {
        e.preventDefault();
        router.navigate(rootPath);
      },
    };
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleAlign: "center",
        // Le ripple Android par défaut de la barre d'onglets est "borderless" :
        // son rayon peut dépasser la hauteur de l'onglet et se faire tronquer
        // par le haut de l'écran au lieu de rester contenu dedans. On le
        // contraint aux limites de l'onglet, comme un ripple Material classique.
        tabBarButton: ({ ref: _ref, ...props }) => (
          <Pressable {...props} android_ripple={{ borderless: false, color: `${colors.primary}33` }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Peser",
          tabBarIcon: ({ color, size }) => <Ionicons name="scale-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="foods"
        listeners={resetTabOnPress("/foods")}
        options={{
          title: "Aliments",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="containers"
        options={{
          title: "Récipients",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        listeners={resetTabOnPress("/history")}
        options={{
          title: "Historique",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={resetTabOnPress("/settings")}
        options={{
          title: "Réglages",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
