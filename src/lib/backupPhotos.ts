import { File } from "expo-file-system";

import {
  type BackupPhoto,
  detectImageType,
  MAX_PHOTO_BASE64_LENGTH,
  PHOTO_TABLES,
  type PhotoTable,
} from "./backupPhotoValidation";
import { compactExistingPhoto, getPhotosDirectory, isAppPhotoUri } from "./photos";

// Lecture et écriture des photos d'une sauvegarde. Avant la 1.16, seule leur
// adresse sur le téléphone était sauvegardée : une réinstallation (ou un
// nouveau téléphone) les perdait.

type PhotoRow = { id?: number; photoUri?: string | null };
type PhotoRows = Record<PhotoTable, PhotoRow[]>;

const EXTENSIONS: Record<BackupPhoto["mimeType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Photos à inclure dans une sauvegarde. Une photo absente ou illisible est
// simplement laissée de côté : elle ne doit jamais bloquer la sauvegarde.
export async function collectBackupPhotos(rows: PhotoRows): Promise<BackupPhoto[]> {
  const photos: BackupPhoto[] = [];
  for (const table of PHOTO_TABLES) {
    for (const { id, photoUri } of rows[table]) {
      if (id == null || !photoUri || !isAppPhotoUri(photoUri)) continue;
      try {
        const file = new File(photoUri);
        if (!file.exists) continue;
        await compactExistingPhoto(file);
        const data = await file.base64();
        const mimeType = detectImageType(data);
        if (mimeType && data.length <= MAX_PHOTO_BASE64_LENGTH) photos.push({ table, id, mimeType, data });
      } catch {
        // Photo illisible : sauvegardée sans elle.
      }
    }
  }
  return photos;
}

// Écrit les photos d'une sauvegarde validée dans les dossiers de l'app, sous
// un nouveau nom, et renvoie les lignes à réinsérer avec leur nouvelle
// adresse. Une ligne sans photo dans la sauvegarde ne garde son adresse que
// si elle désigne une photo de l'app encore présente (même téléphone) :
// jamais un chemin quelconque venu du fichier importé.
export function writeBackupPhotos<C extends PhotoRow, F extends PhotoRow>(
  rows: { containers: C[]; foods: F[] },
  photos: BackupPhoto[]
): { rows: { containers: C[]; foods: F[] }; writtenUris: string[] } {
  const writtenUris: string[] = [];
  const stamp = Date.now();
  try {
    const uriOf = new Map<string, string>();
    for (const photo of photos) {
      const name = `restored-${photo.table}-${photo.id}-${stamp}.${EXTENSIONS[photo.mimeType]}`;
      const file = new File(getPhotosDirectory(photo.table), name);
      file.write(photo.data, { encoding: "base64" });
      writtenUris.push(file.uri);
      uriOf.set(`${photo.table}:${photo.id}`, file.uri);
    }
    const remap = <Row extends PhotoRow>(table: PhotoTable, tableRows: Row[]): Row[] =>
      tableRows.map((row) => ({
        ...row,
        photoUri: uriOf.get(`${table}:${row.id}`) ?? keepIfPresent(row.photoUri),
      }));
    return {
      rows: { containers: remap("containers", rows.containers), foods: remap("foods", rows.foods) },
      writtenUris,
    };
  } catch (error) {
    deletePhotoFiles(writtenUris);
    throw error;
  }
}

function keepIfPresent(uri: string | null | undefined): string | null {
  if (!uri || !isAppPhotoUri(uri)) return null;
  try {
    return new File(uri).exists ? uri : null;
  } catch {
    return null;
  }
}

export function deletePhotoFiles(uris: string[]) {
  for (const uri of uris) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Best effort.
    }
  }
}

// Après une restauration, supprime les photos que plus aucune ligne
// n'utilise (celles des données remplacées : elles restent dans la
// sauvegarde de secours, pour "Annuler la restauration").
// Comparaison par nom de fichier (unique dans le dossier) plutôt que par
// adresse complète, dont l'écriture pourrait varier d'une version à l'autre.
export function pruneUnusedPhotos(rows: PhotoRows) {
  const fileName = (uri: string) => uri.slice(uri.lastIndexOf("/") + 1);
  const used = new Set(
    PHOTO_TABLES.flatMap((table) => rows[table].flatMap((row) => (row.photoUri ? [fileName(row.photoUri)] : [])))
  );
  for (const table of PHOTO_TABLES) {
    try {
      for (const entry of getPhotosDirectory(table).list()) {
        if (entry instanceof File && !used.has(entry.name)) entry.delete();
      }
    } catch {
      // Best effort : une photo orpheline ne gêne rien.
    }
  }
}
