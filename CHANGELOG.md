# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet suit le [Semantic Versioning](https://semver.org/lang/fr/) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

### Ajouté
- Recettes : un ingrédient s'ajoute directement depuis la table Ciqual (il rejoint ta liste d'aliments à l'enregistrement), ou se saisit à la main juste pour la recette (« Légumes », 6 g de glucides pour 100 g), sans devoir le créer avant dans l'onglet Aliments.
- Recettes : champ facultatif « Poids du plat cuit ». Les glucides pour 100 g d'un plat qui perd de l'eau à la cuisson (quiche, gratin) ou en absorbe (riz, pâtes) sont calculés sur le plat cuit.
- Historique : toucher une pesée ouvre sa fiche de détail, d'où on peut aussi la supprimer.

### Modifié
- Les mises à jour intégrées vérifient l'empreinte du fichier téléchargé et son origine (les releases GitHub de GlucoDose) avant de l'installer.
- L'écran Aide décrit les vraies étapes d'une pesée (un aliment par pesée, recettes pour les plats composés).
- L'import d'une sauvegarde est vérifié plus strictement : longueur des textes, format des dates et nombre de lignes sont bornés. Un fichier modifié ou démesuré est refusé en entier, avec un message qui dit ce qui ne va pas.

### Corrigé
- Recettes : un ingrédient archivé s'affichait « Aliment introuvable » en modifiant la recette, et comptait pour 0 g de glucides si on la réenregistrait (glucides pour 100 g sous-estimés). Il garde maintenant son nom et sa valeur.
- Un nombre tapé avec une virgule (« 1,8 ») était lu sans sa partie décimale (1) : glycémie, ratio, cible, facteur de sensibilité et poids sont maintenant lus correctement, avec une virgule comme avec un point.
- L'exemple du champ « Glycémie actuelle » correspond à l'unité choisie (il affichait « 12 » même en g/L).

## [1.17.0] - 2026-10-18

### Ajouté
- Une alerte prévient dès que la sauvegarde Google Drive échoue (espace Google plein, accès retiré…), et une pastille reste sur l'onglet Réglages tant que le problème dure : plus besoin d'ouvrir l'écran Sauvegarde pour s'en rendre compte. Une simple coupure de connexion n'alerte qu'au bout d'un jour.

### Modifié
- Messages d'erreur de la sauvegarde plus clairs : ils disent ce qui bloque et quoi faire, depuis quand les envois échouent, avec le détail technique à transmettre en cas de besoin.
- « Sauvegarder maintenant » confirme l'envoi, ou explique pourquoi il a échoué.
- Photos réduites à 320 px (environ 15 Ko au lieu de 100 à 200 Ko), largement assez pour leur affichage en vignette : sauvegardes bien plus légères. Les photos déjà enregistrées sont réduites à la prochaine sauvegarde.

### Corrigé
- Relier un compte Google n'affiche plus « Sauvegarde automatique activée » quand le premier envoi échoue.
- Une sauvegarde de plus de 5 Mo (avec beaucoup de photos) n'est plus refusée par Google Drive.

### Sécurité
- Un fichier de plus de 50 Mo est refusé à l'import avant d'être lu (assez pour une sauvegarde de la 1.16 avec environ 180 photos).

## [1.16.1] - 2026-10-18

### Sécurité
- L'app ne demande plus de permissions inutiles : stockage externe, superposition à d'autres apps, empreinte digitale et biométrie. L'appareil photo, le micro (recherche vocale) et l'installation des mises à jour restent autorisés.

## [1.16.0] - 2026-10-13

### Important
- **Venant de la 1.14.0 ou avant, les photos sont perdues à la mise à jour** : la désinstallation obligatoire (nouvelle clé de signature) les efface, et les sauvegardes de ces versions ne contenaient pas les images. Il faut les rajouter à la main. Désormais, elles sont dans la sauvegarde.

### Ajouté
- Les photos des récipients et des aliments sont incluses dans la sauvegarde (fichier exporté et Google Drive, chiffrées comme le reste) : elles reviennent avec une restauration, après une réinstallation ou sur un nouveau téléphone.

### Modifié
- Les photos sont réduites (800 px) à l'enregistrement, pour garder une sauvegarde légère. Les photos déjà enregistrées sont réduites à la prochaine sauvegarde.

### Corrigé
- Réglages → Mises à jour : notes de version lisibles en mode sombre (titres et passages en gras).
- Notes de version : les citations, l'italique et le code ne s'affichent plus avec leurs symboles bruts.
- Le lien vers une photo disparue est effacé au démarrage : le récipient ou l'aliment propose à nouveau d'ajouter une photo.

### Sécurité
- Une sauvegarde importée ne peut plus faire lire ni supprimer un fichier de l'app autre qu'une photo, et chaque photo importée est vérifiée (type d'image, taille) avant d'être écrite.

## [1.15.1] - 2026-10-13

### Corrigé
- Popup de mise à jour : les notes de version défilent désormais au lieu de sortir de l'écran.
- Popup de mise à jour : texte lisible en mode sombre.
- « Ignorer » une mise à jour est bien mémorisé : la popup ne revient qu'à la version suivante.

## [1.15.0] - 2026-10-13

### Sécurité
- L'APK est désormais signé avec une clé propre à GlucoDose, et non plus avec la clé de debug publique commune à toutes les apps React Native (avec laquelle n'importe qui pouvait signer une fausse mise à jour). **Mise à jour impossible par-dessus l'ancienne version** : exporter une sauvegarde (Réglages → Sauvegarde et restauration), désinstaller l'app, installer la nouvelle version puis importer la sauvegarde.
- Dépendances mises à jour pour corriger des failles connues (Expo 57.0.28, React Native 0.86.3).
- Les sauvegardes sont chiffrées (fichiers exportés et copie Google Drive) avec une clé générée par l'app : rien à retenir. Les anciens exports en clair restent importables.
- La sauvegarde automatique d'Android est désactivée : elle copiait la base en clair hors du téléphone.
- Un fichier de sauvegarde modifié ou corrompu est rejeté en entier (chaque ligne est validée), sans rien importer.

### Ajouté
- Sauvegarde automatique sur Google Drive (dossier privé de l'app) après chaque modification, et restauration depuis Drive sur un nouveau téléphone.
- Annulation de la dernière restauration.
- Clé de secours, pour relire un fichier exporté sur un autre téléphone sans Google Drive.

### Modifié
- Le calcul de dose d'insuline est désactivé par défaut sur une nouvelle installation : l'app affiche d'abord les glucides, et la dose s'active dans Réglages → Dose et correction. Une installation existante garde son réglage.
- APK plus léger : il n'embarque plus le code natif des émulateurs (x86), seulement celui des téléphones (ARM).
- L'ancienne sauvegarde automatique locale (fichier en clair dans l'app) est remplacée par la sauvegarde Drive chiffrée, et supprimée.
- « À propos » et « Mentions légales » précisent que la sauvegarde Google Drive est facultative (rien n'est envoyé sans relier son compte) et chiffrée.

## [1.14.0] - 2026-10-09

### Modifié
- Les fichiers exportés (sauvegarde JSON, historique PDF et CSV) portent un nom parlant avec le type, la date, l'heure et la version de l'app, ex. `glucodose-sauvegarde-20261008-0902-v1.14.0.json`. Le PDF n'est plus nommé par un identifiant aléatoire, et la date suit l'heure locale.
- La sauvegarde JSON indique la version de l'app qui l'a produite.

### Corrigé
- L'heure des pesées tient compte du fuseau horaire (historique, détail d'une pesée, exports PDF et CSV, statistiques) : elle s'affichait en UTC, soit 2 h de moins en heure d'été française.

## [1.13.1] - 2026-10-08

### Modifié
- La bannière de nouvelle version propose « Installer » et « Ignorer » : « Installer » ferme la bannière et lance directement le téléchargement (avec sa progression), sans passer par l'écran Mises à jour.

## [1.13.0] - 2026-10-08

### Ajouté
- Avertissement sur l'écran de pesée quand le poids brut saisi est inférieur à la tare du récipient.
- Lien « Buy me a coffee » dans Réglages → Contact pour soutenir le projet.

### Modifié
- Écrans de Réglages (menu, thème, mises à jour, sauvegarde, contact, à propos, confidentialité) harmonisés avec une présentation commune.
- Après l'enregistrement d'une pesée, un écran de résultat dédié affiche la dose/les glucides avec une notification « Pesée enregistrée », et le lien « Annuler cette pesée » est placé sous le résultat (il n'est plus collé au message de confirmation).

### Corrigé
- Les noms longs (aliment, récipient, ratio) repoussaient hors de l'écran la flèche du sélecteur sur l'écran de pesée, et collaient à la valeur affichée à droite dans l'Historique et la liste des ratios.
- La bannière de nouvelle version se ferme au toucher, et l'écran Mises à jour lance la vérification automatiquement (le bouton de recherche disparaît une fois une mise à jour trouvée).
- L'effet de toucher sur les onglets du bas débordait de leur zone sur Android.

## [1.12.0] - 2026-08-04

### Ajouté
- Réglages → Apparence : choix du thème clair, sombre ou système (au lieu de suivre uniquement le thème du téléphone).
- Notification au lancement de l'app quand une nouvelle version est disponible, avec un aperçu de son contenu — en plus de la vérification manuelle déjà possible dans Réglages → Mises à jour.

### Corrigé
- Les noms longs sur l'écran Aliments (ex. entrées Ciqual) cassaient la mise en page de la ligne au lieu d'être tronqués.

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

[Unreleased]: https://github.com/Forthtilliath/glucodose/compare/v1.17.0...HEAD
[1.17.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.17.0
[1.16.1]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.16.1
[1.16.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.16.0
[1.15.1]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.15.1
[1.15.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.15.0
[1.14.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.14.0
[1.13.1]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.13.1
[1.13.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.13.0
[1.12.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.12.0
[1.2.3]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.3
[1.2.2]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.2
[1.2.1]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.1
[1.2.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.2.0
[1.1.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.1.0
[1.0.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.0.0
