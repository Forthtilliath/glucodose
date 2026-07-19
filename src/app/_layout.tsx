import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from "react-native";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { db } from "@/db/client";
import { useColors } from "@/theme/colors";
import migrations from "../../drizzle/migrations";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const scheme = useColorScheme();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

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
