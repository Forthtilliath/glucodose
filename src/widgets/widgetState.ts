import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { containers, foods, settings, weighings } from "@/db/schema";
import { nextInCycle } from "@/lib/cycleSelection";
import { getMostRecentIds } from "@/lib/recentIds";

export type WidgetSelection = {
  containerId: number | null;
  containerName: string | null;
  foodId: number | null;
  foodName: string | null;
};

// Fenêtre bornée plutôt que tout l'historique : largement suffisant pour
// déduire les quelques éléments récents proposés au cycle du widget.
const RECENT_QUERY_LIMIT = 30;
// Nombre d'éléments parmi lesquels le widget fait défiler sur tap : plus
// large que les 5 du sélecteur "Récents" de l'écran Peser, pour laisser un
// peu plus de choix vu qu'il n'y a pas de recherche possible dans le widget.
const RECENT_CYCLE_LIMIT = 8;

async function getSettingsRow() {
  const rows = await db.select().from(settings).where(eq(settings.id, 1));
  return rows[0] ?? null;
}

async function getRecentContainerIds(): Promise<number[]> {
  const rows = await db
    .select({ id: weighings.containerId, weighedAt: weighings.weighedAt })
    .from(weighings)
    .orderBy(desc(weighings.weighedAt))
    .limit(RECENT_QUERY_LIMIT);
  return getMostRecentIds(rows, RECENT_CYCLE_LIMIT);
}

async function getRecentFoodIds(): Promise<number[]> {
  const rows = await db
    .select({ id: weighings.foodId, weighedAt: weighings.weighedAt })
    .from(weighings)
    .orderBy(desc(weighings.weighedAt))
    .limit(RECENT_QUERY_LIMIT);
  return getMostRecentIds(rows, RECENT_CYCLE_LIMIT);
}

// Sélection actuelle du widget (récipient/aliment), avec les noms résolus
// pour l'affichage — un id sélectionné mais supprimé depuis (onDelete: set
// null côté weighings, mais ici la référence est sur settings) redevient
// simplement "aucune sélection" au prochain cycle.
export async function getWidgetSelection(): Promise<WidgetSelection> {
  const settingsRow = await getSettingsRow();
  const containerId = settingsRow?.widgetSelectedContainerId ?? null;
  const foodId = settingsRow?.widgetSelectedFoodId ?? null;

  const container =
    containerId != null
      ? (await db.select().from(containers).where(eq(containers.id, containerId)))[0]
      : undefined;
  const food = foodId != null ? (await db.select().from(foods).where(eq(foods.id, foodId)))[0] : undefined;

  return {
    containerId: container?.id ?? null,
    containerName: container?.name ?? null,
    foodId: food?.id ?? null,
    foodName: food?.name ?? null,
  };
}

async function setWidgetSelection(patch: { widgetSelectedContainerId?: number | null; widgetSelectedFoodId?: number | null }) {
  await db
    .insert(settings)
    .values({ id: 1, ...patch })
    .onConflictDoUpdate({ target: settings.id, set: patch });
}

export async function cycleWidgetContainer(): Promise<void> {
  const [settingsRow, recentIds] = await Promise.all([getSettingsRow(), getRecentContainerIds()]);
  const nextId = nextInCycle(recentIds, settingsRow?.widgetSelectedContainerId ?? null);
  await setWidgetSelection({ widgetSelectedContainerId: nextId });
}

export async function cycleWidgetFood(): Promise<void> {
  const [settingsRow, recentIds] = await Promise.all([getSettingsRow(), getRecentFoodIds()]);
  const nextId = nextInCycle(recentIds, settingsRow?.widgetSelectedFoodId ?? null);
  await setWidgetSelection({ widgetSelectedFoodId: nextId });
}
