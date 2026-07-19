import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from "react-native";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as QuickActions from "expo-quick-actions";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { db } from "@/db/client";
import { QUICK_ACTIONS, routeForQuickAction } from "@/lib/quickActions";
import { useColors } from "@/theme/colors";
import migrations from "../../drizzle/migrations";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const scheme = useColorScheme();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  // Raccourcis d'icône (appui long) : déclarés une fois la base prête, et
  // écoutés pour naviguer directement vers la bonne route au clic — y
  // compris quand ils servent à lancer l'app à froid (QuickActions.initial).
  useEffect(() => {
    if (!success) return;

    QuickActions.setItems(QUICK_ACTIONS);

    const initialRoute = QuickActions.initial ? routeForQuickAction(QuickActions.initial.id) : undefined;
    if (initialRoute) {
      router.push(initialRoute);
    }

    const subscription = QuickActions.addListener((action) => {
      const route = routeForQuickAction(action.id);
      if (route) {
        router.push(route);
      }
    });
    return () => subscription.remove();
  }, [success, router]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Erreur de migration de la base</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 12,
      backgroundColor: colors.background,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.danger,
      textAlign: "center",
    },
  });
}
