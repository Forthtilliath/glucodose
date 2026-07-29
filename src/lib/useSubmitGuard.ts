import { useState } from "react";

// Empêche un second appel pendant qu'un premier est encore en cours (ex:
// double-tap sur "Enregistrer" avant que le bouton n'ait eu le temps de se
// désactiver, qui créait plusieurs entrées identiques).
export function useSubmitGuard() {
  const [isSaving, setIsSaving] = useState(false);

  async function guard(action: () => Promise<void>) {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await action();
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, guard };
}
