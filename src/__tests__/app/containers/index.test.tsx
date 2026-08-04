import { Alert } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

// IMPORTANT : ce test doit rester en dehors de src/app/ (voir
// glucodose-no-tests-in-app-dir en mémoire) — Expo Router scanne ce dossier
// pour générer les routes, et un fichier de test qui s'y trouverait serait
// chargé comme une route dans le bundle de PRODUCTION.
//
// La logique de requête/écriture DB est déjà testée à fond dans
// src/db/repository.test.ts sur une vraie base ; ce test-ci se concentre sur
// ce que ce fichier-là ne couvre pas : le rendu et les interactions de
// l'écran lui-même. useLiveQuery est donc mocké pour retourner des données
// fixes plutôt que de rebrancher une vraie base.
const mockContainers = [
  { id: 1, name: "Bol bleu", tareWeightG: 120, photoUri: null, notes: "assiette du placard" },
  { id: 2, name: "Grand bol", tareWeightG: 200, photoUri: "file:///bol.jpg", notes: null },
];

jest.mock("@/db/client", () => ({
  db: { select: () => ({ from: () => ({ orderBy: () => ({}) }) }) },
}));
jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: () => ({ data: mockContainers }),
}));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
const mockDeleteContainer = jest.fn();
jest.mock("@/db/repository", () => ({
  deleteContainer: (...args: unknown[]) => mockDeleteContainer(...args),
}));

import ContainersScreen from "@/app/(tabs)/containers/index";

describe("ContainersScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockDeleteContainer.mockClear();
  });

  it("affiche chaque récipient avec son nom et sa tare", async () => {
    const { getByText } = await render(<ContainersScreen />);
    expect(getByText("Bol bleu")).toBeTruthy();
    expect(getByText("Grand bol")).toBeTruthy();
    expect(getByText("120 g")).toBeTruthy();
  });

  it("navigue vers l'édition au tap sur une ligne", async () => {
    const { getByLabelText } = await render(<ContainersScreen />);
    fireEvent.press(getByLabelText("Récipient Bol bleu, tare 120 g. Modifier."));
    expect(mockPush).toHaveBeenCalledWith("/containers/1");
  });

  it("demande confirmation puis supprime au swipe + confirmation", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const confirmButton = buttons?.find((b) => b.text === "Supprimer");
      confirmButton?.onPress?.();
    });

    const { getByLabelText } = await render(<ContainersScreen />);
    fireEvent.press(getByLabelText("Supprimer le récipient Bol bleu"));

    expect(alertSpy).toHaveBeenCalledWith(
      'Supprimer "Bol bleu" ?',
      "Cette action est définitive.",
      expect.anything()
    );
    expect(mockDeleteContainer).toHaveBeenCalledWith(1, null);

    alertSpy.mockRestore();
  });

  it("affiche le bouton d'ajout d'un récipient", async () => {
    const { getByLabelText } = await render(<ContainersScreen />);
    expect(getByLabelText("Ajouter un récipient")).toBeTruthy();
  });
});
