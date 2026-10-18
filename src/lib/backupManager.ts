import { File, Paths } from "expo-file-system";
import { createBackupManager } from "@forthtilliath/expo-backup";

import { buildExportedData, isBackupEmpty, parseBackup, replaceAllData, type BackupData } from "./backup";
import { buildExportFileName } from "./exportFileName";

// Sauvegarde automatique (Google Drive), export/import manuel et chiffrement,
// via le paquet partagé entre les apps. Chiffrement obligatoire : données de
// santé. La clé est générée par l'app, gardée dans le Keystore et déposée
// dans le dossier privé Drive de l'app — rien à retenir pour l'utilisateur.
export const backup = createBackupManager<BackupData>({
  appId: "glucodose",
  encryption: "required",
  collect: buildExportedData,
  parse: parseBackup,
  apply: replaceAllData,
  isEmpty: isBackupEmpty,
  exportFileName: (date) => buildExportFileName("sauvegarde", "json", date),
  exportDialogTitle: "Sauvegarder mes données",
  // Les photos sont dans la sauvegarde, sans nombre maximal : ~200 à 270 Ko
  // chacune une fois chiffrée. Les 10 Mo par défaut refuseraient l'import
  // d'une sauvegarde exportée normalement dès une quarantaine de photos ;
  // 50 Mo en laissent ~180, et bornent toujours la lecture d'un fichier choisi.
  maxFileBytes: 50 * 1024 * 1024,
});

// Ancienne sauvegarde automatique locale (avant 1.15), en clair dans les
// documents de l'app : supprimée, la sauvegarde chiffrée sur Drive la remplace.
export function removeLegacyAutoBackup(): void {
  try {
    const legacy = new File(Paths.document, "glucodose-sauvegarde-auto.json");
    if (legacy.exists) legacy.delete();
  } catch {
    // Best effort : rien de bloquant si la suppression échoue.
  }
}
