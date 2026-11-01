import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { type ColorValue, Pressable } from "react-native";
import { useCloudBackupProblem } from "@forthtilliath/expo-backup-ui";

import { backup } from "@/lib/backupManager";
import { useColors } from "@/theme/colors";

// La couleur passée par la barre d'onglets est une ColorValue, qui admet un
// nombre ou null depuis React Native 0.88 : Ionicons n'accepte que la forme
// texte, celle des couleurs du thème.
function tabIcon(name: ComponentProps<typeof Ionicons>["name"]) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={typeof color === "number" ? undefined : (color ?? undefined)} />;
  };
}

export default function TabsLayout() {
  const colors = useColors();
  const router = useRouter();
  // Pastille sur Réglages tant que la sauvegarde Google Drive échoue (voir
  // BackupProblemNotifier) : l'alerte ne s'affiche qu'une fois par lancement.
  const backupProblem = useCloudBackupProblem(backup);

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
          tabBarIcon: tabIcon("scale-outline"),
        }}
      />
      <Tabs.Screen
        name="foods"
        listeners={resetTabOnPress("/foods")}
        options={{
          title: "Aliments",
          headerShown: false,
          tabBarIcon: tabIcon("restaurant-outline"),
        }}
      />
      <Tabs.Screen
        name="containers"
        options={{
          title: "Récipients",
          headerShown: false,
          tabBarIcon: tabIcon("cube-outline"),
        }}
      />
      <Tabs.Screen
        name="history"
        listeners={resetTabOnPress("/history")}
        options={{
          title: "Historique",
          headerShown: false,
          tabBarIcon: tabIcon("time-outline"),
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={resetTabOnPress("/settings")}
        options={{
          title: "Réglages",
          headerShown: false,
          tabBarBadge: backupProblem ? "!" : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger },
          tabBarIcon: tabIcon("settings-outline"),
        }}
      />
    </Tabs>
  );
}
