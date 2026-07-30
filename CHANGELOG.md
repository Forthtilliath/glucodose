# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet suit le [Semantic Versioning](https://semver.org/lang/fr/) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

## [1.11.0] - 2026-07-30

### Ajouté
- Sauvegarde automatique et silencieuse, déclenchée 5 minutes après la dernière modification des réglages, aliments/recettes ou récipients — filet de sécurité en plus de l'export manuel (Réglages → Sauvegarde), qui affiche désormais l'heure de la dernière sauvegarde automatique.

### Retiré
- Widget d'écran d'accueil temporairement désactivé (texte tronqué dans les cases, design pas encore satisfaisant) — le code est conservé pour y revenir plus tard.

## [1.10.0] - 2026-07-30

### Ajouté
- Le widget d'écran d'accueil devient un vrai sélecteur rapide : une case récipient et une case aliment font défiler les éléments récents sur simple tap (sans ouvrir l'app), et un bouton "Peser" ouvre l'écran de pesée avec cette sélection déjà pré-remplie.

### Modifié
- Le widget n'affiche plus le résumé du jour (glucides/dose totale) — remplacé par ce sélecteur rapide, jugé plus utile qu'un simple résumé.

## [1.9.3] - 2026-07-30

### Corrigé
- Revenir sur l'onglet Aliments/Historique/Réglages après être passé sur un autre onglet restaurait la dernière sous-page visitée (ex. "Ratios") au lieu de l'écran principal, sans moyen simple de remonter dessus — l'onglet revient maintenant toujours sur son écran principal.

## [1.9.2] - 2026-07-30

### Corrigé
- Le nom de fichier des sauvegardes exportées (Réglages → Sauvegarde) reprenait encore l'ancien nom de l'app ("dose-insuline") au lieu de "glucodose".
- Les notes de version affichées dans Réglages → Mises à jour (historique + mise à jour disponible) apparaissaient en Markdown brut ("### Titre", "- item") au lieu d'un vrai titre et d'une vraie liste.

## [1.9.1] - 2026-07-30

### Corrigé
- **Widget d'écran d'accueil qui ne s'affichait jamais** (probable cause réelle du bug "widget invisible" signalé précédemment) : le React Compiler (activé pour toute l'app) transformait le composant du widget, provoquant un crash silencieux au rendu ("Invalid Hook Call") — `react-native-android-widget` exige un composant non transformé par le compilateur.


### Ajouté
- Le sélecteur d'aliment de l'écran Peser met désormais en avant, dans une section "Récents", les aliments/recettes pesés le plus récemment — en plus du tri ingrédients/recettes déjà en place, plutôt qu'une simple liste alphabétique.

## [1.8.0] - 2026-07-30

### Ajouté
- Nouvel écran Statistiques (Historique → Statistiques) : moyenne de glucides/jour, nombre de pesées/semaine, aliments les plus utilisés, sur la période choisie (7 jours / 30 jours / tout).

## [1.7.0] - 2026-07-30

### Ajouté
- Export CSV de l'Historique, en plus du PDF (respecte les filtres actifs) — pour qui veut analyser ses pesées dans un tableur.

## [1.6.1] - 2026-07-30

### Modifié
- Le message de confirmation après une pesée (et le lien "Annuler" associé) reste affiché 8 secondes au lieu de 4, pour laisser le temps de le repérer et l'utiliser.

### Corrigé
- Deux pesées enregistrées rapprochées pouvaient voir le message de confirmation de la seconde disparaître prématurément, coupé par le minuteur de la première.

## [1.6.0] - 2026-07-30

### Ajouté
- Un lien "Annuler" apparaît à côté du message de confirmation après l'enregistrement d'une pesée sur l'écran Peser, pour supprimer immédiatement une pesée faite par erreur sans repasser par l'Historique.

## [1.5.0] - 2026-07-30

### Ajouté
- Les sélecteurs de récipient/aliment/recette et la recherche Ciqual regroupent maintenant leurs résultats par catégorie (ingrédients vs recettes, groupe alimentaire Anses) quand on parcourt la liste sans rechercher.
- La page Réglages → Mises à jour affiche désormais l'historique des versions publiées, sous le bouton de vérification.

### Ajouté
- Recherche vocale disponible sur tous les sélecteurs (récipient, aliment, recette, ratio), et plus seulement sur le champ nom de l'écran ingrédient.

### Corrigé
- Deux boutons de recherche vocale montés en même temps sur le même écran (ex. champ nom + sélecteur Ciqual) pouvaient tous les deux recevoir le résultat d'une même dictée, l'un des deux silencieusement en arrière-plan.

## [1.3.0] - 2026-07-30

### Ajouté
- Le widget d'accueil Android affiche désormais le résumé du jour (glucides totaux, et dose totale si le calcul de dose est activé) en plus du raccourci "Peser". Le widget se rafraîchit immédiatement après l'enregistrement d'une pesée, sans attendre son cycle périodique.

## [1.2.3] - 2026-07-30

### Modifié
- Les mises à jour ont désormais leur propre page (`Réglages → Mises à jour`) au lieu d'être affichées en ligne sur le menu principal.

### Corrigé
- Le bouton "Rechercher une mise à jour" passait sur 3 lignes au lieu de 2 pendant la vérification (résolu par le passage à sa propre page).
- Widget Android : ajout d'un rafraîchissement périodique (30 min) en filet de sécurité si le premier rendu échoue au moment de l'ajout (probable restriction de démarrage en arrière-plan sur certains téléphones, ex. Honor/Magic OS — peut nécessiter d'autoriser manuellement GlucoDose dans le gestionnaire de démarrage du téléphone).

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

[Unreleased]: https://github.com/Forthtilliath/glucodose/compare/v1.2.3...HEAD
[1.2.3]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.3
[1.2.2]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.2
[1.2.1]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.1
[1.2.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.0
[1.1.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.1.0
[1.0.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.0.0
