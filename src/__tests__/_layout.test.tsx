import renderer, { act } from "react-test-renderer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import RootLayout from "../app/_layout";

// IMPORTANT : ce test doit rester en dehors de src/app/ — Expo Router scanne
// récursivement ce dossier pour générer les routes, et un fichier de test qui
// y traînerait serait chargé comme une route dans le bundle de PRODUCTION,
// plantant immédiatement au démarrage sur `jest.mock(...)` (qui n'existe pas
// hors de Jest) : "ReferenceError: Property 'jest' doesn't exist". C'est
// exactement ce qui est arrivé en plaçant initialement ce fichier dans
// src/app/_layout.test.tsx.
//
// _layout.tsx importe la vraie base (expo-sqlite, indisponible en Jest), les
// migrations générées et expo-router/expo-quick-actions : tout est mocké ici
// pour isoler ce qu'on veut vérifier — la présence du GestureHandlerRootView
// à la racine, sans laquelle le swipe-to-delete des listes ne fonctionne pas
// du tout (régression déjà survenue une fois : le wrapper avait été considéré
// comme ajouté sans jamais l'être réellement).
jest.mock("@/db/client", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({}) }) }) },
}));
jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: () => ({ data: [] }),
}));
jest.mock("@/db/repository", () => ({
  recordUpdateCheck: () => Promise.resolve(),
  dismissUpdateVersion: () => Promise.resolve(),
}));
jest.mock("@/lib/appUpdate", () => ({
  fetchLatestRelease: () => Promise.resolve(null),
  compareVersions: () => 0,
}));
jest.mock("../../drizzle/migrations", () => ({}));
jest.mock("drizzle-orm/expo-sqlite/migrator", () => ({
  useMigrations: () => ({ success: true, error: null }),
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock("expo-quick-actions", () => ({
  setItems: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  initial: null,
}));
jest.mock("@/lib/useAutoBackup", () => ({ useAutoBackup: () => {} }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  DarkTheme: {},
  DefaultTheme: {},
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    { Screen: () => null }
  ),
}));

describe("RootLayout", () => {
  it("est enveloppé dans un GestureHandlerRootView, requis pour le swipe-to-delete", () => {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<RootLayout />);
    });
    expect(() => tree?.root.findByType(GestureHandlerRootView)).not.toThrow();
  });
});
