// @expo/vector-icons met à jour son état de façon asynchrone après le
// chargement de la police (setState hors du cycle de render), en dehors de
// tout contrôle de nos composants — Jest le signale comme un warning "act()"
// sur chaque test qui affiche une icône. Sans impact réel (comportement
// normal en production), filtré ici pour ne pas noyer les vrais warnings.
// SwipeableRow (react-native-kit) s'appuie sur ReanimatedSwipeable : le module
// natif de Reanimated/Worklets n'existe pas sous Jest, on charge leurs mocks officiels.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("inside a test was not wrapped in act")) {
    return;
  }
  originalConsoleError(...args);
};
