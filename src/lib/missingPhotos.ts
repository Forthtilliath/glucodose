import { inArray, isNotNull } from "drizzle-orm";
import { File } from "expo-file-system";

import { db } from "@/db/client";
import { containers, foods } from "@/db/schema";

// Une photo dont le fichier a disparu (désinstallation avant la 1.16, dont
// les sauvegardes ne contenaient pas les images) laisse un lien vers rien :
// l'écran affiche un cadre vide au lieu de proposer d'ajouter une photo. Ces
// liens sont effacés au démarrage. Une adresse qu'on ne sait pas vérifier
// (autre chose qu'un fichier) est gardée.
function isMissing(uri: string): boolean {
  try {
    return !new File(uri).exists;
  } catch {
    return false;
  }
}

function missingIds(rows: { id: number; photoUri: string | null }[]): number[] {
  return rows.filter((row) => row.photoUri && isMissing(row.photoUri)).map((row) => row.id);
}

export async function clearMissingPhotoLinks(): Promise<number> {
  const missingContainers = missingIds(
    await db.select({ id: containers.id, photoUri: containers.photoUri }).from(containers).where(isNotNull(containers.photoUri))
  );
  if (missingContainers.length) {
    await db.update(containers).set({ photoUri: null }).where(inArray(containers.id, missingContainers));
  }

  const missingFoods = missingIds(
    await db.select({ id: foods.id, photoUri: foods.photoUri }).from(foods).where(isNotNull(foods.photoUri))
  );
  if (missingFoods.length) {
    await db.update(foods).set({ photoUri: null }).where(inArray(foods.id, missingFoods));
  }

  return missingContainers.length + missingFoods.length;
}
