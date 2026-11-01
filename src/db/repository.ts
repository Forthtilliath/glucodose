import { eq } from "drizzle-orm";

import { deletePhoto } from "@/lib/photos";
import { db } from "./client";
import { containers, insulinRatios, settings, weighings } from "./schema";

// ---------- Récipients ----------

export async function createContainer(input: {
  name: string;
  tareWeightG: number;
  photoUri?: string | null;
  notes?: string;
}) {
  await db.insert(containers).values({
    name: input.name,
    tareWeightG: input.tareWeightG,
    photoUri: input.photoUri ?? null,
    notes: input.notes,
  });
}

export async function updateContainer(
  id: number,
  input: { name: string; tareWeightG: number; photoUri?: string | null; notes?: string }
) {
  await db
    .update(containers)
    .set({
      name: input.name,
      tareWeightG: input.tareWeightG,
      photoUri: input.photoUri ?? null,
      notes: input.notes,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(containers.id, id));
}

export async function deleteContainer(id: number, photoUri: string | null) {
  if (photoUri) {
    deletePhoto(photoUri);
  }
  await db.delete(containers).where(eq(containers.id, id));
}

// ---------- Aliments (ingrédients + recettes) ----------

export * from "./foodRepository";

// ---------- Ratios insuline/glucides ----------

export async function createRatio(input: { label: string; carbsGramsPerUnit: number }) {
  await db.insert(insulinRatios).values({
    label: input.label,
    carbsGramsPerUnit: input.carbsGramsPerUnit,
  });
}

export async function updateRatio(id: number, input: { label: string; carbsGramsPerUnit: number }) {
  await db
    .update(insulinRatios)
    .set({
      label: input.label,
      carbsGramsPerUnit: input.carbsGramsPerUnit,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(insulinRatios.id, id));
}

export async function deleteRatio(id: number) {
  await db.delete(insulinRatios).where(eq(insulinRatios.id, id));
}

// ---------- Réglages de correction ----------

export async function updateSettings(input: {
  glycemiaUnit: "mmol/L" | "g/L";
  targetGlycemia: number | null;
  sensitivityFactor: number | null;
  showInsulinDose: boolean;
  themePreference: "light" | "dark" | "system";
}) {
  await db
    .insert(settings)
    .values({
      id: 1,
      glycemiaUnit: input.glycemiaUnit,
      targetGlycemia: input.targetGlycemia,
      sensitivityFactor: input.sensitivityFactor,
      showInsulinDose: input.showInsulinDose,
      themePreference: input.themePreference,
    })
    .onConflictDoUpdate({
      target: settings.id,
      set: {
        glycemiaUnit: input.glycemiaUnit,
        targetGlycemia: input.targetGlycemia,
        sensitivityFactor: input.sensitivityFactor,
        showInsulinDose: input.showInsulinDose,
        themePreference: input.themePreference,
        updatedAt: new Date().toISOString(),
      },
    });
}

// Vérification de mise à jour en tâche de fond (voir useUpdateCheck du
// package @forthtilliath/react-native-kit) : deux champs ciblés, séparés
// d'updateSettings() pour ne pas obliger l'appelant (un composant monté à la
// racine de l'app, sans accès à l'état du formulaire Réglages) à connaître ni
// reporter les autres champs du réglage.
export async function recordUpdateCheck(lastCheckedAt: number) {
  await db
    .insert(settings)
    .values({ id: 1, lastUpdateCheckAt: lastCheckedAt })
    .onConflictDoUpdate({
      target: settings.id,
      set: { lastUpdateCheckAt: lastCheckedAt, updatedAt: new Date().toISOString() },
    });
}

export async function dismissUpdateVersion(version: string) {
  await db
    .insert(settings)
    .values({ id: 1, dismissedUpdateVersion: version })
    .onConflictDoUpdate({
      target: settings.id,
      set: { dismissedUpdateVersion: version, updatedAt: new Date().toISOString() },
    });
}

// ---------- Pesées ----------

export async function recordWeighing(input: {
  foodId: number;
  foodName: string;
  containerId: number | null;
  grossWeightG: number;
  tareWeightG: number;
  netWeightG: number;
  carbsPer100g: number;
  carbsG: number;
  ratioId: number | null;
  ratioLabel: string | null;
  carbsGramsPerUnit: number | null;
  mealInsulinUnits: number;
  glycemiaUnit: "mmol/L" | "g/L" | null;
  currentGlycemia: number | null;
  targetGlycemia: number | null;
  sensitivityFactor: number | null;
  correctionInsulinUnits: number;
  totalInsulinUnits: number;
}): Promise<number> {
  const [row] = await db
    .insert(weighings)
    .values({
      foodId: input.foodId,
      foodNameSnapshot: input.foodName,
      containerId: input.containerId,
      grossWeightG: input.grossWeightG,
      tareWeightG: input.tareWeightG,
      netWeightG: input.netWeightG,
      carbsPer100gSnapshot: input.carbsPer100g,
      carbsG: input.carbsG,
      ratioId: input.ratioId,
      ratioLabelSnapshot: input.ratioLabel,
      carbsGramsPerUnitSnapshot: input.carbsGramsPerUnit,
      mealInsulinUnits: input.mealInsulinUnits,
      glycemiaUnitSnapshot: input.glycemiaUnit,
      currentGlycemia: input.currentGlycemia,
      targetGlycemiaSnapshot: input.targetGlycemia,
      sensitivityFactorSnapshot: input.sensitivityFactor,
      correctionInsulinUnits: input.correctionInsulinUnits,
      totalInsulinUnits: input.totalInsulinUnits,
    })
    .returning({ id: weighings.id });
  return row.id;
}

export async function deleteWeighing(id: number) {
  await db.delete(weighings).where(eq(weighings.id, id));
}
