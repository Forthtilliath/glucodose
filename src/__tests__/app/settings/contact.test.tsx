import { Linking } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import ContactScreen from "@/app/(tabs)/settings/contact";

// IMPORTANT : ce test doit rester en dehors de src/app/ (voir
// glucodose-no-tests-in-app-dir en mémoire) — Expo Router scanne ce dossier
// pour générer les routes, et un fichier de test qui s'y trouverait serait
// chargé comme une route dans le bundle de PRODUCTION.

describe("ContactScreen", () => {
  it("ouvre Buy Me a Coffee au tap sur \"M'offrir un café\"", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    const screen = await render(<ContactScreen />);
    await fireEvent.press(screen.getByLabelText("M'offrir un café sur Buy Me a Coffee"));

    expect(openURLSpy).toHaveBeenCalledWith("https://buymeacoffee.com/forthtilliath");

    openURLSpy.mockRestore();
  });

  it("propose aussi de contacter par email et de partager l'app", async () => {
    const screen = await render(<ContactScreen />);
    expect(screen.getByText("Me contacter")).toBeTruthy();
    expect(screen.getByText("Partager l’app")).toBeTruthy();
    expect(screen.getByText("M’offrir un café")).toBeTruthy();
  });
});
