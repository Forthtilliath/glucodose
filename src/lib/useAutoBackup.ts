import { useEffect, useRef } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { containers, foods, settings } from "@/db/schema";
import { runAutoBackup } from "@/lib/backup";

const AUTO_BACKUP_DELAY_MS = 5 * 60 * 1000;

// Sauvegarde silencieuse (voir runAutoBackup) déclenchée 5 minutes après la
// dernière modification des réglages, aliments/recettes ou récipients —
// volontairement PAS après chaque pesée (bien plus fréquentes ; l'historique
// est secondaire vis-à-vis de ce filet de sécurité, pensé pour ne pas perdre
// sa configuration en cas de perte du téléphone). À monter une seule fois,
// après que la base soit prête (voir AutoBackupRunner dans _layout.tsx).
export function useAutoBackup() {
  const { data: containersData } = useLiveQuery(db.select().from(containers));
  const { data: foodsData } = useLiveQuery(db.select().from(foods));
  const { data: settingsData } = useLiveQuery(db.select().from(settings));

  // Devient true seulement une fois que les trois requêtes ont livré leur
  // premier résultat : sans ça, chacune résolvant à un instant différent
  // déclencherait à tort une sauvegarde dès le démarrage de l'app.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (containersData === undefined || foodsData === undefined || settingsData === undefined) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    const timeout = setTimeout(() => {
      runAutoBackup().catch(() => {
        // Best effort : une sauvegarde automatique manquée n'est pas
        // bloquante, l'export manuel reste disponible dans Réglages.
      });
    }, AUTO_BACKUP_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [containersData, foodsData, settingsData]);
}
