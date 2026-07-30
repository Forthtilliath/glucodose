// Élément suivant dans une liste courte (widget d'accueil : cycle sur tap
// entre récipients/aliments récents). Reprend au début si l'actuel n'y est
// plus (supprimé, ou hors des plus récents) ou si on est en bout de liste.
// Séparé de la couche DB (src/widgets/widgetState.ts) pour rester testable
// sans base de données.
export function nextInCycle(ids: number[], currentId: number | null): number | null {
  if (ids.length === 0) return null;
  const currentIndex = currentId == null ? -1 : ids.indexOf(currentId);
  return ids[(currentIndex + 1) % ids.length];
}
