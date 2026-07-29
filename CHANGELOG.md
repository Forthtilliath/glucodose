# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet suit le [Semantic Versioning](https://semver.org/lang/fr/) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

## [1.2.2] - 2026-07-30

### Corrigé
- Recherche Ciqual (et Historique) qui ne trouvait rien pour un nom tapé avec une vraie ligature `œ`/`æ` (ex. "Œuf") : Ciqual orthographie ces mots en toutes lettres ("Oeuf"), et la ligature ne se décompose pas via la normalisation Unicode utilisée jusqu'ici.

## [1.2.1] - 2026-07-29

### Corrigé
- **Crash au démarrage** ("Property 'jest' doesn't exist") présent dans les APK 1.1.0 et 1.2.0 : un fichier de test avait été placé dans `src/app/`, scanné par Expo Router pour générer les routes, et se retrouvait chargé comme une route dans le bundle de production.
- `versionCode` Android jamais incrémenté depuis la création du projet (toujours `1`) : empêchait Android de reconnaître correctement les mises à jour installées manuellement (le vérificateur de mise à jour intégré pouvait donc échouer silencieusement à remplacer une version installée par une plus récente).

## [1.2.0] - 2026-07-29

### Ajouté
- Recherche vocale pour dicter le nom d'un aliment à chercher dans Ciqual (bouton micro sur l'écran ingrédient).

### Modifié
- Écran Réglages réorganisé : "Dose et correction" et "Ratios insuline/glucides" ont désormais leur propre page, la page principale devient un simple menu groupé par sections.

## [1.1.0] - 2026-07-29

### Ajouté
- Swipe-to-delete sur les listes récipients et aliments.
- Vérification et installation des mises à jour depuis les releases GitHub (Réglages).
- Photo sur les ingrédients et recettes (comme pour les récipients), visible dans les listes et les sélecteurs.
- Filtres sur l'Historique : recherche par nom d'aliment et période (aujourd'hui / 7 jours / 30 jours / tout).
- Suite de tests unitaires complète : moteur Ciqual, mises à jour, sauvegarde, et couche base de données (contraintes, transactions) sur une vraie base SQLite en mémoire.
- Widget Android : raccourci "Peser" ajoutable sur l'écran d'accueil du téléphone.
- Export PDF de l'Historique (respecte les filtres actifs), partageable comme la sauvegarde JSON.

### Corrigé
- Double-soumission possible sur les formulaires récipient, ingrédient, recette et ratio (le formulaire pouvait créer plusieurs entrées identiques).
- Sélection d'un résultat Ciqual dans le formulaire ingrédient qui ne mettait pas à jour le formulaire.
- Icône et écran de démarrage plus nets, avec le nom de l'app affiché.
- Swipe-to-delete ne fonctionnait pas du tout : le `GestureHandlerRootView` requis par react-native-gesture-handler n'enveloppait jamais réellement la racine de l'app malgré ce qui était supposé.

## [1.0.0] - 2026-07-28

Première version suivie. L'app était déjà fonctionnelle avant cette date (historique de commits complet dans le repo) — ceci marque le début du suivi de version, pas la première ligne de code.

### Ajouté
- Renommage de l'app en **GlucoDose** (auparavant "Dose Insuline"), nouvelles icônes custom.
- Intégration de la table **Ciqual** (Anses) comme aide à la saisie : suggestions automatiques pendant la frappe, recherche complète, et ajout rapide directement depuis l'écran Peser.
- Ajout de récipients/aliments/recettes directement depuis les sheets de sélection de l'écran Peser.
- Réglage pour désactiver le calcul de dose d'insuline (mode "glucides seuls").
- Écrans Aide, Contact, À propos, Mentions légales dans Réglages.
- Export/import JSON complet de la base (Réglages → Sauvegarde).
- Raccourcis d'icône (appui long) : Peser, Nouveau récipient, Nouvel aliment.
- Mode sombre suivant le thème système.
- Tests unitaires du moteur de calcul (`src/lib/insulin.ts`).

### Corrigé
- Validation des valeurs négatives (poids, glucides, glycémie), contraintes de clé étrangère SQLite activées, permission microphone superflue retirée.

[Unreleased]: https://github.com/Forthtilliath/glucodose/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.2
[1.2.1]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.1
[1.2.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.0
[1.1.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.1.0
[1.0.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.0.0
