# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le projet suit le [Semantic Versioning](https://semver.org/lang/fr/) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

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
- Voir [`UPGRADES.md`](./UPGRADES.md) pour le détail des corrections de robustesse/sécurité (validation des valeurs négatives, contraintes de clé étrangère SQLite, permission microphone superflue, etc.).

[Unreleased]: https://github.com/Forthtilliath/glucodose/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Forthtilliath/glucodose/releases/tag/v1.0.0
