<div align="center">

# 🩺 Dose Insuline

**Calculateur de dose d'insuline au repas — pesée, aliments, recettes et correction, sans calculette.**

![Expo SDK](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Drizzle%20ORM-003B57?logo=sqlite&logoColor=white)
![Platform](https://img.shields.io/badge/Plateforme-Android%20%7C%20iOS-lightgrey)
![Local first](https://img.shields.io/badge/Données-100%25%20locales-16a34a)

</div>

---

> [!CAUTION]
> **Ceci n'est pas un dispositif médical.** C'est un outil personnel d'aide au calcul, construit pour un usage individuel. Les ratios insuline/glucides, le facteur de sensibilité et les valeurs glucidiques saisies doivent provenir de ton équipe soignante (diététicien·ne, diabétologue). Vérifie toujours une dose avant de l'injecter. En cas de doute, fie-toi à ton jugement clinique et à celui de ton équipe de soins, jamais uniquement à cette application.

## Pourquoi cette app

À chaque repas, gérer un diabète sous insuline demande de :

1. peser chaque aliment (et donc connaître le poids à vide du récipient utilisé),
2. convertir ce poids en glucides,
3. convertir ces glucides en unités d'insuline via son ratio personnel,
4. éventuellement ajouter une correction si la glycémie est trop haute.

Cette app remplace la calculette : elle mémorise les poids de récipients, les valeurs glucidiques des aliments et recettes déjà utilisés, et fait tous les calculs à la volée pendant la pesée.

## Fonctionnalités

| Écran | Rôle |
|---|---|
| **⚖️ Peser** | Flux principal : choisir un récipient (ou une tare manuelle) → peser → poids net automatique → choisir l'aliment → choisir le ratio → dose repas + correction optionnelle affichées en direct, avant enregistrement dans l'historique |
| **🍽️ Aliments** | CRUD des ingrédients simples (glucides/100g) et des recettes composées. Une recette calcule ses glucides/100g à partir de ses composants pesés, puis devient réutilisable **exactement comme un ingrédient** dans l'écran Peser |
| **📦 Récipients** | CRUD des récipients avec leur poids à vide, et une **photo** (prise ou choisie en galerie) pour les repérer d'un coup d'œil dans le sélecteur |
| **⚙️ Réglages** | Ratios insuline/glucides (un ou plusieurs, ex. un par repas), glycémie cible et facteur de sensibilité pour la dose de correction, unité (mmol/L ou g/L) |
| **🕘 Historique** | Journal des pesées enregistrées, avec le détail dose repas / dose de correction |

### La méthode de calcul

```
glucides pesés   = poids net (poids brut − tare) × (glucides pour 100g de l'aliment) / 100
dose repas       = glucides pesés ÷ ratio insuline/glucides
dose correction  = max(0, (glycémie actuelle − glycémie cible) ÷ facteur de sensibilité)
dose totale      = dose repas + dose correction
```

Point de conception important : **une valeur de glucides/100g est une propriété stable de l'aliment**, alors que le **ratio insuline/glucides est un paramètre personnel** qui peut varier selon le repas (phénomène de l'aube le matin, activité physique, etc.) et évoluer dans le temps. Les deux sont donc stockés séparément — modifier un ratio n'oblige pas à rééditer tous les aliments.

Chaque pesée enregistrée **fige** (snapshot) toutes les valeurs utilisées au moment du calcul (glucides/100g, ratio, cible, facteur). Modifier un aliment ou un réglage plus tard ne change jamais rétroactivement une dose déjà calculée.

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 57) + [Expo Router](https://docs.expo.dev/router/introduction/) (navigation par fichiers) |
| Langage | TypeScript strict |
| Base de données | SQLite embarqué (`expo-sqlite`) via [Drizzle ORM](https://orm.drizzle.team/docs/get-started/expo-new) — schéma typé, migrations versionnées, requêtes réactives (`useLiveQuery`) |
| Photos | `expo-image-picker` (caméra / galerie) + `expo-file-system` (stockage permanent hors cache) |
| État & data | Pas de state manager global : react hooks + requêtes SQL réactives suffisent, pas de réseau à gérer |
| Données | 100% locales, aucun backend, aucun compte utilisateur |

## Modèle de données

```mermaid
erDiagram
    CONTAINERS {
        int id PK
        text name
        real tareWeightG
        text photoUri
    }
    FOODS {
        int id PK
        text name
        text type "ingredient | recipe"
        real carbsPer100g
        real totalWeightG "recette uniquement"
        real totalCarbsG "recette uniquement"
    }
    RECIPE_COMPONENTS {
        int id PK
        int recipeFoodId FK
        int componentFoodId FK
        real weightG
        real carbsG
    }
    INSULIN_RATIOS {
        int id PK
        text label
        real carbsGramsPerUnit
    }
    SETTINGS {
        int id PK "singleton"
        text glycemiaUnit
        real targetGlycemia
        real sensitivityFactor
    }
    WEIGHINGS {
        int id PK
        int foodId FK
        int containerId FK
        int ratioId FK
        real netWeightG
        real carbsG
        real mealInsulinUnits
        real correctionInsulinUnits
        real totalInsulinUnits
        text weighedAt
    }

    FOODS ||--o{ RECIPE_COMPONENTS : "composée de"
    FOODS ||--o{ RECIPE_COMPONENTS : "utilisé comme composant"
    FOODS ||--o{ WEIGHINGS : "pesé lors de"
    CONTAINERS ||--o{ WEIGHINGS : "tare utilisée"
    INSULIN_RATIOS ||--o{ WEIGHINGS : "ratio appliqué"
```

## Structure du projet

```
src/
├── app/                          # Écrans (Expo Router)
│   ├── _layout.tsx               # Layout racine : migrations DB + splash screen
│   └── (tabs)/                   # Navigation par onglets
│       ├── index.tsx             # Peser
│       ├── foods/                # Aliments (liste, ingrédient, recette)
│       ├── containers/           # Récipients
│       ├── settings/             # Réglages (ratios, correction)
│       └── history/              # Historique
├── db/
│   ├── schema.ts                 # Schéma Drizzle (source de vérité)
│   ├── client.ts                 # Connexion SQLite + Drizzle
│   └── repository.ts             # Toutes les écritures (create/update/delete)
├── lib/
│   ├── insulin.ts                # Formules de calcul, seule source de vérité
│   └── photos.ts                 # Stockage permanent des photos de récipients
├── components/
│   └── PickerModal.tsx           # Sélecteur générique (recherche + miniature)
└── theme/
    └── colors.ts

drizzle/                          # Migrations SQL générées (versionnées)
drizzle.config.ts
```

## Démarrer le projet

### Prérequis

- Node.js ≥ 20
- L'app [Expo Go](https://expo.dev/go) sur ton téléphone (Android/iOS), **ou** un [build de développement](https://docs.expo.dev/develop/development-builds/introduction/) — voir ci-dessous

### Installation

```bash
npm install
npx expo start
```

Scanner le QR code affiché avec Expo Go, ou lancer un simulateur iOS (`i`) / émulateur Android (`a`) depuis le terminal.

> [!IMPORTANT]
> La fonctionnalité photo des récipients utilise un module natif (`expo-image-picker`) avec des permissions caméra/galerie configurées via un plugin Expo. **Expo Go seul ne suffit pas** pour tester cette fonctionnalité — il faut un build de développement (`npx expo run:android`, ou `eas build --profile development`). Le reste de l'app fonctionne normalement dans Expo Go.

### Scripts disponibles

| Commande | Effet |
|---|---|
| `npm run start` | Démarre le serveur de développement Expo |
| `npm run android` / `npm run ios` / `npm run web` | Démarre en ciblant une plateforme précise |
| `npm run lint` | Lint du projet |
| `npx tsc --noEmit` | Vérification TypeScript |
| `npx drizzle-kit generate` | Génère une migration SQL après modification de `src/db/schema.ts` |

### Base de données & migrations

Le schéma (`src/db/schema.ts`) est la source de vérité. Après toute modification :

```bash
npx drizzle-kit generate
```

génère un fichier SQL dans `drizzle/`, appliqué automatiquement au démarrage de l'app (écran de chargement le temps de la migration). Les migrations sont versionnées avec le code — ne jamais les modifier a posteriori une fois publiées, toujours en générer de nouvelles.

## Idées pour la suite

- Export / import JSON pour sauvegarder ou transférer sa base entre téléphones
- Photos également sur les aliments/recettes
- Historique filtrable par aliment ou par période

## Licence

Projet personnel à usage individuel — pas de licence de distribution définie.
