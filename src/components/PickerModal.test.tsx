import { fireEvent, render } from "@testing-library/react-native";

// VoiceSearchButton (utilisé par PickerModal) importe le module natif
// expo-speech-recognition, absent sous Jest — non pertinent pour ces tests
// de regroupement/tri, donc mocké au minimum plutôt que de le tester ici.
jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: { requestPermissionsAsync: jest.fn(), start: jest.fn(), stop: jest.fn() },
  useSpeechRecognitionEvent: jest.fn(),
}));

import { PickerModal, type PickerItem } from "./PickerModal";

function item(id: number, label: string, group?: string): PickerItem {
  return { id, label, group };
}

describe("PickerModal", () => {
  it("affiche les résultats à plat sans groupe, comme avant", () => {
    const { getByText, queryByText } = render(
      <PickerModal
        visible
        title="Test"
        items={[item(1, "Pomme"), item(2, "Poire")]}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(getByText("Pomme")).toBeTruthy();
    expect(getByText("Poire")).toBeTruthy();
    // Aucun en-tête de section ne doit apparaître.
    expect(queryByText(/^(Ingrédients|Recettes|Récents)$/)).toBeNull();
  });

  it("regroupe les résultats par section, triées par ordre alphabétique par défaut", () => {
    const { getByText } = render(
      <PickerModal
        visible
        title="Test"
        items={[item(1, "Riz", "Recettes"), item(2, "Pomme", "Ingrédients")]}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(getByText("Ingrédients")).toBeTruthy();
    expect(getByText("Recettes")).toBeTruthy();
  });

  it("respecte groupOrder pour faire apparaître une section en premier", () => {
    const { getByText } = render(
      <PickerModal
        visible
        title="Test"
        items={[item(1, "Riz", "Ingrédients"), item(2, "Pomme", "Récents")]}
        onSelect={() => {}}
        onClose={() => {}}
        groupOrder={["Récents", "Ingrédients"]}
      />
    );
    expect(getByText("Récents")).toBeTruthy();
    expect(getByText("Ingrédients")).toBeTruthy();
  });

  it("masque les sections pendant une recherche active", () => {
    const { getByPlaceholderText, queryByText } = render(
      <PickerModal
        visible
        title="Test"
        items={[item(1, "Riz", "Recettes"), item(2, "Pomme", "Ingrédients")]}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    fireEvent.changeText(getByPlaceholderText("Rechercher…"), "Riz");
    expect(queryByText("Ingrédients")).toBeNull();
    expect(queryByText("Recettes")).toBeNull();
  });
});
