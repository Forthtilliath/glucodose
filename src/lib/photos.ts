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

export async function saveContainerPhoto(sourceUri: string): Promise<string> {
  const extensionMatch = sourceUri.split("?")[0].match(/\.(\w+)$/);
  const extension = extensionMatch ? extensionMatch[1] : "jpg";
  const destination = new File(getContainersDirectory(), `container-${Date.now()}.${extension}`);
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
