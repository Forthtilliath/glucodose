import { Directory, File, Paths } from "expo-file-system";

// expo-image-picker renvoie souvent un fichier dans un dossier de cache
// temporaire (nettoyable par l'OS) : on le copie vers le dossier document,
// stable, pour que la photo du récipient survive au nettoyage du cache.
function getContainersDirectory(): Directory {
  const dir = new Directory(Paths.document, "containers");
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

// Exportée pour être testée isolément : c'est la seule partie de ce fichier
// qui ne dépend pas du système de fichiers natif.
export function getFileExtension(uri: string): string {
  const extensionMatch = uri.split("?")[0].match(/\.(\w+)$/);
  return extensionMatch ? extensionMatch[1] : "jpg";
}

export async function saveContainerPhoto(sourceUri: string): Promise<string> {
  const destination = new File(getContainersDirectory(), `container-${Date.now()}.${getFileExtension(sourceUri)}`);
  const source = new File(sourceUri);
  await source.copy(destination);
  return destination.uri;
}

export function deleteContainerPhoto(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best effort : un fichier déjà absent ne doit jamais faire échouer l'appelant.
  }
}
