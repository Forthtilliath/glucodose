# Pistes d'amélioration

Liste de ce qui pourrait être fait ensuite, classé par thème. Rien ici n'est urgent — l'app est fonctionnelle en l'état — mais ça vaut la peine d'être noté pour plus tard.

## ✅ Corrigé lors du dernier passage (sécurité/robustesse)

Ces points ont été trouvés pendant la revue de sécurité et corrigés directement :

- **Valeurs négatives non bloquées** : le poids à vide d'un récipient, les glucides/100g d'un ingrédient, la glycémie cible et le facteur de sensibilité pouvaient être enregistrés négatifs (aucune validation). Le cas le plus dangereux : une **tare manuelle négative** sur l'écran Peser gonflait silencieusement le poids net calculé, donc la dose. Tous ces champs bloquent maintenant la sauvegarde si la valeur n'a pas de sens physique.
- **Photos orphelines** : remplacer ou retirer la photo d'un récipient ne supprimait jamais l'ancien fichier du stockage — il restait indéfiniment sur le téléphone. La photo précédente est maintenant supprimée quand elle est remplacée.

## 🔒 Sécurité — pas de faille identifiée, mais à garder en tête

- **Pas de chiffrement au repos** : la base SQLite (glycémies, doses, habitudes alimentaires) est stockée en clair dans le stockage de l'app. Sur un téléphone avec chiffrement disque activé (par défaut sur Android/iOS modernes), c'est déjà couvert au niveau OS. Si tu veux un niveau supplémentaire, `expo-sqlite` supporte SQLCipher moyennant une config native (nécessite un build de développement, pas Expo Go).
- **`npm audit` remonte 16 vulnérabilités "moderate"** : toutes viennent d'outils de build transitifs (`esbuild` via `drizzle-kit`, `xcode` via `@expo/config-plugins`), jamais exécutés dans l'app installée sur le téléphone — uniquement pendant `npx expo start`/`drizzle-kit generate` sur ta machine de dev. `npm audit fix` proposerait de rétrograder Expo vers la version 46 (cassant tout) : **ne pas l'appliquer**. À surveiller lors des futures mises à jour de `drizzle-kit`/`expo`.
- **Pas d'injection SQL possible** : toutes les requêtes passent par le query builder Drizzle (paramétrées) — aucune concaténation de chaîne SQL avec une valeur utilisateur nulle part dans le code.
- **Pas de secret ni clé d'API dans le repo** : normal, l'app n'a aucun backend.

## 🚀 Fonctionnalités

- **Export / import JSON** : sauvegarder ou transférer sa base vers un autre téléphone (mentionné dans le README comme non fait). Utile en cas de changement de téléphone ou de perte.
- **Photos sur les aliments/recettes**, pas seulement les récipients — même bénéfice de reconnaissance visuelle rapide.
- **Historique filtrable/recherchable** (par aliment, par période, par type repas/correction).
- **Alerte anti-empilement d'insuline** (déjà évoquée puis explicitement écartée — laissée ici pour mémoire si le besoin change) : avertir si une correction est saisie moins de 3h après la précédente.
- **Sélection automatique du ratio** selon l'heure de la journée (matin/midi/soir), plutôt que le dernier ratio utilisé mémorisé manuellement.
- **Widget/raccourci** poids→dose pour aller encore plus vite que d'ouvrir l'app.

## 🎨 UX / Ergonomie

- **Confirmation visuelle plus longue** après une pesée enregistrée (actuellement 4 secondes, disparaît vite si on est en train de manipuler la balance).
- **Annuler la dernière pesée** directement depuis l'écran Peser (pas seulement via Historique).
- **Recherche dans l'historique** et regroupement par jour.
- **Mode sombre** : l'app force actuellement une palette claire fixe (`src/theme/colors.ts`), pas de variante sombre alors que `userInterfaceStyle: "automatic"` est activé dans `app.json`.

## 🧱 Qualité de code / architecture

- **Dépendances installées mais jamais utilisées dans `src/`** : `@expo/ui`, `expo-device`, `expo-document-picker`, `expo-glass-effect`, `expo-image`, `expo-sharing`, `expo-symbols`, `expo-web-browser` (résidus du template de départ et d'une fonctionnalité de sauvegarde jamais implémentée). À vérifier une par une avant suppression — certaines peuvent être des dépendances transitives attendues par `expo-router`/`expo` — mais ça vaut le nettoyage.
- **`saveRecipe` (dans `src/db/repository.ts`)** fait un `delete` + `insert` complet des composants à chaque sauvegarde plutôt qu'un diff — largement suffisant à cette échelle (quelques composants par recette), mais à garder en tête si les recettes grossissent beaucoup.
- **Pas de bornes maximales** sur les champs numériques (ex. poids de 999999 g) — actuellement seule la positivité est vérifiée. Une borne haute raisonnable éviterait les fautes de frappe grossières (ex. oublier de repasser en grammes).

## 🧪 Tests

- Les tests unitaires ajoutés couvrent le **moteur de calcul** (`src/lib/insulin.ts`), la partie la plus critique puisqu'elle détermine la dose. Ce qui n'est **pas encore couvert** et demanderait un investissement séparé :
  - `src/db/repository.ts` (logique d'écriture/transactions) — nécessiterait de mocker `expo-sqlite` ou d'utiliser une base SQLite en mémoire pour des tests d'intégration.
  - Les écrans eux-mêmes (rendu, interactions) — nécessiterait `@testing-library/react-native` et du temps de mise en place (mocks de `expo-router`, `expo-image-picker`, etc.).
  - `src/lib/photos.ts` — repose entièrement sur les classes natives `File`/`Directory` d'`expo-file-system`, difficilement testable en unitaire sans mock lourd ; plus adapté à un test manuel/E2E.
- **Aucune CI** configurée (pas de GitHub Actions) pour lancer automatiquement `tsc`, `lint` et les tests à chaque changement.

## ♿ Accessibilité

- Pas de `accessibilityLabel` explicites sur les boutons icônes (ex. la corbeille dans l'historique, le "+" flottant) — un lecteur d'écran lira probablement le nom de l'icône ou rien du tout.
- Contraste à vérifier sur les badges "Recette"/"Ingrédient" (fond pastel clair + texte sombre, probablement correct mais non audité formellement).
