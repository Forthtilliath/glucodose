import { fireEvent, render } from "@testing-library/react-native";

import WeighScreen from "@/app/(tabs)/index";

// IMPORTANT : ce test doit rester en dehors de src/app/ (voir
// glucodose-no-tests-in-app-dir en mémoire) — Expo Router scanne ce dossier
// pour générer les routes, et un fichier de test qui s'y trouverait serait
// chargé comme une route dans le bundle de PRODUCTION.
//
// Les formules de calcul (computeNetWeight, computeCarbsGrams...) sont déjà
// testées à fond dans src/lib/insulin.test.ts, et l'écriture en base dans
// src/db/repository.test.ts. Ce test-ci se concentre sur ce que ces deux-là
// ne couvrent pas : le rendu et les interactions de l'écran Peser lui-même
// — notamment l'avertissement "poids brut < tare" et l'appel à
// recordWeighing avec la charge utile attendue.
const mockContainers = [{ id: 1, name: "Bol bleu", tareWeightG: 150, photoUri: null }];
const mockFoods = [
  { id: 1, name: "Riz cuit", carbsPer100g: 28, type: "ingredient" as const, photoUri: null },
];
const mockRatios = [{ id: 1, label: "Repas", carbsGramsPerUnit: 10, position: 0 }];
const mockSettingsRow = {
  id: 1,
  targetGlycemia: null as number | null,
  sensitivityFactor: null as number | null,
  glycemiaUnit: "mmol/L" as const,
  showInsulinDose: true,
};

// db.select().from(X)... est mocké en un chaînage minimal qui se contente de
// mémoriser QUELLE table a été demandée (par référence, comparée au vrai
// schéma) pour que le mock de useLiveQuery ci-dessous puisse retourner les
// bonnes données fixes — sans se connecter à une vraie base.
jest.mock("@/db/client", () => {
  const schema = jest.requireActual("@/db/schema");
  function makeChain(tag: string | null): unknown {
    const self = {
      __tag: tag,
      from: (table: unknown) => {
        if (table === schema.containers) return makeChain("containers");
        if (table === schema.foods) return makeChain("foods");
        if (table === schema.weighings) return makeChain("weighings");
        if (table === schema.insulinRatios) return makeChain("insulinRatios");
        if (table === schema.settings) return makeChain("settings");
        return makeChain(tag);
      },
      where: () => self,
      orderBy: () => self,
      limit: () => self,
    };
    return self;
  }
  return { db: { select: () => makeChain(null) } };
});

const mockLiveData: Record<string, unknown[]> = {
  containers: mockContainers,
  foods: mockFoods,
  weighings: [],
  insulinRatios: mockRatios,
  settings: [mockSettingsRow],
};

jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: (query: { __tag: string | null }) => ({ data: mockLiveData[query.__tag ?? ""] ?? [] }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
}));

const mockRecordWeighing = jest.fn(async (..._args: unknown[]) => 42);
jest.mock("@/db/repository", () => ({
  recordWeighing: (...args: unknown[]) => mockRecordWeighing(...args),
  createIngredient: jest.fn(),
}));

jest.mock("@/lib/ciqual", () => ({ ALL_CIQUAL_FOODS: {}, CIQUAL_PICKER_ITEMS: [] }));

// Le vrai PickerModal embarque la recherche vocale (expo-speech-recognition,
// module natif) via VoiceSearchButton — remplacé par un double minimal qui
// se contente d'afficher les items et de déclencher onSelect au tap, pour
// tester la sélection sans tirer toute cette chaîne.
jest.mock("@forthtilliath/react-native-kit/components/picker/PickerModal", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  return {
    PickerModal: ({
      visible,
      items,
      onSelect,
      title,
    }: {
      visible: boolean;
      items: { id: number; label: string }[];
      onSelect: (item: { id: number; label: string }) => void;
      title: string;
    }) =>
      !visible ? null : (
        <View>
          <Text>{title}</Text>
          {items.map((item) => (
            <Pressable key={item.id} accessibilityLabel={item.label} onPress={() => onSelect(item)}>
              <Text>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ),
  };
});

// fireEvent renvoie une Promise dans cette version de testing-library (mode
// concurrent) : il faut l'attendre, sinon l'état mis à jour (sélection,
// saisie...) n'est pas garanti commité avant l'assertion suivante.
async function selectContainer(screen: Awaited<ReturnType<typeof render>>, label: string) {
  await fireEvent.press(screen.getByLabelText("Choisir un récipient, ou saisir une tare manuelle"));
  await fireEvent.press(await screen.findByLabelText(label));
}

async function selectFood(screen: Awaited<ReturnType<typeof render>>, label: string) {
  await fireEvent.press(screen.getByLabelText("Choisir un aliment"));
  await fireEvent.press(await screen.findByLabelText(label));
}

describe("WeighScreen (Peser)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRecordWeighing.mockClear();
  });

  it("n'affiche pas d'avertissement tare tant qu'aucun récipient n'est sélectionné", async () => {
    const screen = await render(<WeighScreen />);
    await fireEvent.changeText(screen.getByLabelText("Poids brut en grammes"), "50");
    expect(screen.queryByText(/inférieur à la tare/)).toBeNull();
  });

  it("affiche un avertissement si le poids brut est inférieur à la tare du récipient sélectionné", async () => {
    const screen = await render(<WeighScreen />);
    await selectContainer(screen, "Bol bleu");
    await fireEvent.changeText(screen.getByLabelText("Poids brut en grammes"), "100"); // < 150 g de tare
    expect(screen.getByText(/inférieur à la tare \(150 g\)/)).toBeTruthy();
  });

  it("n'affiche plus l'avertissement dès que le poids brut dépasse la tare", async () => {
    const screen = await render(<WeighScreen />);
    await selectContainer(screen, "Bol bleu");
    await fireEvent.changeText(screen.getByLabelText("Poids brut en grammes"), "300");
    expect(screen.queryByText(/inférieur à la tare/)).toBeNull();
  });

  it("enregistre la pesée avec le poids net et la tare du récipient, puis navigue vers le résultat", async () => {
    const screen = await render(<WeighScreen />);
    await selectContainer(screen, "Bol bleu");
    await fireEvent.changeText(screen.getByLabelText("Poids brut en grammes"), "350");
    await selectFood(screen, "Riz cuit");

    await fireEvent.press(screen.getByLabelText("Enregistrer la pesée"));

    expect(mockRecordWeighing).toHaveBeenCalledWith(
      expect.objectContaining({
        foodId: 1,
        containerId: 1,
        grossWeightG: 350,
        tareWeightG: 150,
        netWeightG: 200,
        carbsG: 56, // 200 g net × 28 g/100g
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/weighing-result/42");
  });
});
