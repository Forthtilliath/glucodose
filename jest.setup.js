// @expo/vector-icons met à jour son état de façon asynchrone après le
// chargement de la police (setState hors du cycle de render), en dehors de
// tout contrôle de nos composants — Jest le signale comme un warning "act()"
// sur chaque test qui affiche une icône. Sans impact réel (comportement
// normal en production), filtré ici pour ne pas noyer les vrais warnings.
// SwipeableRow (react-native-kit) s'appuie sur ReanimatedSwipeable : le module
// natif de Reanimated/Worklets n'existe pas sous Jest, on charge leurs mocks officiels.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
// Reanimated 4.7 : sous Jest, son initialisation native appelle
// setCSSEventHandler, que sa version JS (seule disponible ici) refuse (« not
// available in JSReanimated ») : on charge l'initialisation JS, sans cet appel.
jest.mock("react-native-reanimated/lib/module/initializers", () =>
  jest.requireActual("react-native-reanimated/lib/module/initializers.js")
);
// Depuis Gesture Handler 3, ReanimatedSwipeable s'appuie sur des API que le
// mock de Reanimated n'a pas (removeListener) et exige un GestureHandlerRootView.
// Les tests n'exercent pas le geste : la ligne et ses actions sont rendues
// telles quelles, le bouton « Supprimer » restant pressable.
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const { createElement } = require("react");
  const { View } = jest.requireActual("react-native");
  const methods = { close: () => {}, openLeft: () => {}, openRight: () => {}, reset: () => {} };
  return {
    __esModule: true,
    default: ({ children, renderLeftActions, renderRightActions }) =>
      createElement(
        View,
        null,
        renderLeftActions?.(undefined, undefined, methods),
        children,
        renderRightActions?.(undefined, undefined, methods)
      ),
  };
});
// Idem pour react-native-keyboard-controller (FormScrollView, KeyboardProvider).
jest.mock("react-native-keyboard-controller", () => require("react-native-keyboard-controller/jest"));
// jest-expo 58 remplace chaque police par `1` sans l'inscrire dans le registre
// d'assets que lit expo-asset : charger la police des icônes échoue alors
// (« Module "1" is missing from the asset registry »). Les tests n'ont pas
// besoin des polices : elles sont vues comme déjà chargées.
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("inside a test was not wrapped in act")) {
    return;
  }
  originalConsoleError(...args);
};
