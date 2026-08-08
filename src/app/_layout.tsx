import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as RouterThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as QuickActions from "expo-quick-actions";
import Constants from "expo-constants";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { UpdateAvailableBanner } from "@forthtilliath/react-native-kit/components/update/UpdateAvailableBanner";
import { useUpdateCheck } from "@forthtilliath/react-native-kit/hooks/useUpdateCheck";

import { db } from "@/db/client";
import { dismissUpdateVersion, recordUpdateCheck } from "@/db/repository";
import { settings } from "@/db/schema";
import { compareVersions, fetchLatestRelease } from "@/lib/appUpdate";
import { QUICK_ACTIONS, routeForQuickAction } from "@/lib/quickActions";
import { useAutoBackup } from "@/lib/useAutoBackup";
import { ThemePreferenceProvider, useColors, useEffectiveScheme } from "@/theme/colors";
import migrations from "../../drizzle/migrations";

SplashScreen.preventAutoHideAsync();

// Composant séparé (plutôt qu'un appel direct du hook dans RootLayout) : ne
// doit être monté qu'une fois la base prête (voir le early-return `!success`
// plus bas), sans quoi useAutoBackup interrogerait des tables pas encore
// migrées.
function AutoBackupRunner() {
  useAutoBackup();
  return null;
}

// Même contrainte que AutoBackupRunner (monté seulement après succès des
// migrations) : lit la préférence de thème stockée et la fournit au reste de
// l'app via le contexte de src/theme/colors.ts.
function ThemePreferenceRunner({ children }: { children: ReactNode }) {
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const preference = settingsRows?.[0]?.themePreference ?? "system";
  return <ThemePreferenceProvider value={preference}>{children}</ThemePreferenceProvider>;
}

// Vérifie une fois par lancement si une nouvelle version est disponible sur
// GitHub (voir useUpdateCheck de @forthtilliath/react-native-kit), et
// affiche une bannière fermable si oui. "Voir" ouvre l'écran Mises à jour
// existant, qui garde toute la logique de téléchargement/installation — pas
// de duplication ici. "Fermer" ne renotifie plus pour cette version précise,
// mais renotifiera si une version encore plus récente sort.
function UpdateNotifier() {
  const router = useRouter();
  const { data: settingsRows } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  const currentSettings = settingsRows?.[0];

  const update = useUpdateCheck({
    currentVersion: Constants.expoConfig?.version ?? "0.0.0",
    checkForUpdate: fetchLatestRelease,
    compareVersions,
    getLastCheck: () => ({
      lastCheckedAt: currentSettings?.lastUpdateCheckAt ?? null,
      dismissedVersion: currentSettings?.dismissedUpdateVersion ?? null,
    }),
    onChecked: (lastCheckedAt) => {
      recordUpdateCheck(lastCheckedAt).catch(() => {});
    },
  });

  if (update.status !== "available") return null;

  return (
    <View style={updateNotifierStyles.container}>
      <UpdateAvailableBanner
        version={update.release.version}
        notes={update.release.notes}
        onPress={() => {
          router.push("/settings/update");
          // Ferme la bannière sans mémoriser de version "fermée" en base :
          // l'écran Mises à jour refait sa propre vérification à l'ouverture,
          // et si l'utilisateur revient sans installer, la bannière peut
          // réapparaître au prochain lancement (comportement voulu, distinct
          // d'un vrai "Fermer").
          update.dismiss();
        }}
        onDismiss={() => {
          dismissUpdateVersion(update.release.version).catch(() => {});
          update.dismiss();
        }}
      />
    </View>
  );
}

// Regroupe tout ce qui a besoin de la préférence de thème effective
// (contenu de l'app + thème du ThemeProvider d'expo-router), rendu à
// l'intérieur de ThemePreferenceRunner.
function AppShell() {
  const scheme = useEffectiveScheme();

  return (
    <RouterThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <AutoBackupRunner />
      <UpdateNotifier />
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="weighing-result/[id]"
          options={{ title: "Résultat de la pesée", presentation: "modal" }}
        />
      </Stack>
    </RouterThemeProvider>
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
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

  // Racine requise par react-native-gesture-handler pour que les gestes
  // (dont le swipe-to-delete des listes) fonctionnent : sans ce wrapper, le
  // pan responder natif n'est jamais installé et le geste ne se déclenche
  // simplement pas, sans erreur visible.
  if (error) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Erreur de migration de la base</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!success) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemePreferenceRunner>
        <AppShell />
      </ThemePreferenceRunner>
    </GestureHandlerRootView>
  );
}

const updateNotifierStyles = StyleSheet.create({
  container: { position: "absolute", top: 56, left: 16, right: 16, zIndex: 10 },
});

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    flex: { flex: 1 },
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
