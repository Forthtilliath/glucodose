import { render } from "@testing-library/react-native";

import BackupScreen from "@/app/(tabs)/settings/backup";

// Hors de src/app/ : voir contact.test.tsx.

// Le vrai gestionnaire, avec la base et les modules natifs remplacés : ce
// test vérifie que l'écran partagé est bien branché (sections, chiffrement
// obligatoire), pas le comportement de la sauvegarde elle-même, couvert par
// les tests du paquet @forthtilliath/expo-backup.
jest.mock("@/db/client", () => ({ db: {} }));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-crypto", () => ({
  getRandomBytes: (length: number) => new Uint8Array(length),
}));

describe("BackupScreen", () => {
  it("affiche la sauvegarde Drive, la sauvegarde manuelle et le chiffrement obligatoire", async () => {
    const screen = await render(<BackupScreen />);

    expect(screen.getByLabelText("Connecter Google Drive")).toBeTruthy();
    expect(screen.getByLabelText("Exporter mes données")).toBeTruthy();
    expect(screen.getByLabelText("Importer une sauvegarde")).toBeTruthy();
    expect(screen.getByText(/Tes sauvegardes sont toujours chiffrées/)).toBeTruthy();
    expect(screen.getByLabelText("Afficher la clé de secours")).toBeTruthy();
    // Pas d'interrupteur : le chiffrement ne se désactive pas pour des données de santé.
    expect(screen.queryByLabelText("Chiffrer mes sauvegardes")).toBeNull();
  });
});
