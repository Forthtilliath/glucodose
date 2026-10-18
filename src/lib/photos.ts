import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { PHOTO_TABLES, type PhotoTable } from "./backupPhotoValidation";

// Types d'entité ayant une photo : un sous-dossier chacun, du même nom que la
// table (containers, foods), pour ne pas tout mélanger.
const PHOTO_SUBDIRS = PHOTO_TABLES;
type PhotoSubdir = PhotoTable;

// Les photos sont incluses dans les sauvegardes (fichier et Google Drive,
// renvoyée à chaque modification) : on les réduit pour garder une sauvegarde
// légère. Elles ne s'affichent qu'en petit (140 dp au plus, l'aperçu de
// l'écran d'édition, soit ~420 px sur un écran 3x ; 48 dp dans les listes) :
// 320 px restent nets et pèsent ~12 à 20 Ko.
const MAX_PHOTO_SIDE = 320;
const PHOTO_QUALITY = 0.6;
// Au-delà, une photo date d'un réglage plus lourd (avant 1.17.0 : 800 px,
// 100 à 200 Ko) : elle est réduite à la prochaine sauvegarde (voir
// compactExistingPhoto).
const COMPACT_PHOTO_MAX_BYTES = 50 * 1024;
const PHOTO_FILE_NAME = /^[\w-]+\.(jpe?g|png|webp)$/i;

// expo-image-picker renvoie souvent un fichier dans un dossier de cache
// temporaire (nettoyable par l'OS) : on le copie vers le dossier document,
// stable, pour que la photo survive au nettoyage du cache.
export function getPhotosDirectory(subdir: PhotoSubdir): Directory {
  const dir = new Directory(Paths.document, subdir);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

// Une photo de l'app = un fichier directement dans l'un des dossiers photos,
// au nom simple. Tout autre chemin (venu d'une sauvegarde importée, par
// exemple) n'est jamais lu, affiché ni supprimé comme une photo : sinon un
// fichier modifié pourrait faire supprimer la base de données de l'app.
export function isAppPhotoUri(uri: string): boolean {
  return PHOTO_SUBDIRS.some((subdir) => {
    const prefix = new Directory(Paths.document, subdir).uri.replace(/\/?$/, "/");
    return uri.startsWith(prefix) && PHOTO_FILE_NAME.test(uri.slice(prefix.length));
  });
}

async function compressPhoto(sourceUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(sourceUri);
  const original = await context.renderAsync();
  if (Math.max(original.width, original.height) > MAX_PHOTO_SIDE) {
    context.resize(original.width >= original.height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE });
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
  return result.uri;
}

async function savePhoto(sourceUri: string, subdir: PhotoSubdir, prefix: string): Promise<string> {
  const destination = new File(getPhotosDirectory(subdir), `${prefix}-${Date.now()}.jpg`);
  const compressed = new File(await compressPhoto(sourceUri));
  await compressed.copy(destination);
  deleteQuietly(compressed);
  return destination.uri;
}

export function saveContainerPhoto(sourceUri: string): Promise<string> {
  return savePhoto(sourceUri, "containers", "container");
}

export function saveFoodPhoto(sourceUri: string): Promise<string> {
  return savePhoto(sourceUri, "foods", "food");
}

// Réduit sur place une photo enregistrée avant la réduction automatique, pour
// ne pas alourdir les sauvegardes. Garde l'original si la réduction échoue.
export async function compactExistingPhoto(file: File): Promise<void> {
  if ((file.size ?? 0) <= COMPACT_PHOTO_MAX_BYTES) return;
  try {
    const compressed = new File(await compressPhoto(file.uri));
    file.write(await compressed.bytes());
    deleteQuietly(compressed);
  } catch {
    // Best effort : la photo d'origine reste utilisable telle quelle.
  }
}

function deleteQuietly(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // Best effort : un fichier déjà absent ne doit jamais faire échouer l'appelant.
  }
}

// Générique : la suppression ne dépend pas du type d'entité, juste de l'uri.
export function deletePhoto(uri: string) {
  if (!isAppPhotoUri(uri)) return;
  try {
    deleteQuietly(new File(uri));
  } catch {
    // Uri invalide : rien à supprimer.
  }
}
