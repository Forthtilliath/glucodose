import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { codeMessage, defaultLabels, useCloudBackupProblem } from "@forthtilliath/expo-backup-ui";

import { backup } from "@/lib/backupManager";

const BACKUP_SCREEN = "/settings/backup";

// Prévient quand la sauvegarde automatique sur Google Drive échoue. Sans ça,
// l'erreur n'apparaît que dans Réglages ▸ Sauvegarde, que personne n'ouvre
// pour vérifier : un Drive plein a ainsi bloqué les envois pendant des jours
// sans que l'utilisateur le sache. Une alerte par type de problème et par
// lancement, jamais sur l'écran Sauvegarde (qui affiche déjà l'erreur). Les
// coupures passagères (hors ligne, Drive indisponible) n'alertent qu'au bout
// d'un jour (voir getCloudBackupProblem d'expo-backup).
export function BackupProblemNotifier() {
  const problem = useCloudBackupProblem(backup);
  const router = useRouter();
  const pathname = usePathname();
  const alertedCodes = useRef(new Set<string>());
  const code = problem?.code ?? null;
  const since = problem?.since ?? null;

  useEffect(() => {
    if (code === null || since === null) return;
    if (pathname === BACKUP_SCREEN || alertedCodes.current.has(code)) return;
    alertedCodes.current.add(code);
    const t = defaultLabels.fr;
    Alert.alert(
      "La sauvegarde Google Drive ne fonctionne plus",
      `${codeMessage(t, code)}\n\n${t.failingSince(new Date(since).toLocaleDateString("fr-FR"))}`,
      [
        { text: "Plus tard", style: "cancel" },
        { text: "Voir", onPress: () => router.push(BACKUP_SCREEN) },
      ]
    );
  }, [code, since, pathname, router]);

  return null;
}
