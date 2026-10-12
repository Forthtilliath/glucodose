import { useEffect } from "react";
import { count, max } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useAutoBackup as useBackupManager } from "@forthtilliath/expo-backup-ui";
import { useDebouncedChange } from "@forthtilliath/react-native-kit/hooks/useDebouncedChange";

import { db } from "@/db/client";
import { containers, foods, insulinRatios, recipeComponents, settings, weighings } from "@/db/schema";
import { backup, removeLegacyAutoBackup } from "@/lib/backupManager";

// Sauvegarde automatique sur Google Drive (si un compte est relié) : chaque
// modification des données planifie un envoi chiffré, regroupé par le
// gestionnaire (quelques secondes) et forcé au passage en arrière-plan.
// Les pesées, jamais modifiées après coup, ne sont suivies que par un agrégat
// (nombre + dernier id) pour ne pas recharger tout l'historique à chaque
// pesée. À monter une seule fois, après que la base soit prête (voir
// AutoBackupRunner dans _layout.tsx).
export function useAutoBackup() {
  useBackupManager(backup);

  useEffect(() => {
    removeLegacyAutoBackup();
  }, []);

  const { data: containersData } = useLiveQuery(db.select().from(containers));
  const { data: foodsData } = useLiveQuery(db.select().from(foods));
  const { data: componentsData } = useLiveQuery(db.select().from(recipeComponents));
  const { data: ratiosData } = useLiveQuery(db.select().from(insulinRatios));
  const { data: settingsData } = useLiveQuery(db.select().from(settings));
  const { data: weighingsSummary } = useLiveQuery(
    db.select({ total: count(), lastId: max(weighings.id) }).from(weighings)
  );

  // Délai nul : le regroupement des changements rapprochés est fait par le
  // gestionnaire ; ce hook ne sert qu'à ignorer le premier chargement.
  useDebouncedChange(
    [containersData, foodsData, componentsData, ratiosData, settingsData, weighingsSummary],
    0,
    () => {
      backup.notifyDataChanged();
    }
  );
}
