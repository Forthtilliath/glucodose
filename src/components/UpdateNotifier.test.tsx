import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { dismissUpdateVersion } from "@/db/repository";
import { downloadAndInstallApk, fetchLatestRelease } from "@/lib/appUpdate";

import { UpdateNotifier } from "./UpdateNotifier";

jest.mock("@/db/client", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({}) }) }) },
}));
// Réglages lus en base, modifiables par test (updatedAt absent = pas encore lus).
let mockLiveQuery: { data: Record<string, unknown>[]; updatedAt?: Date } = { data: [] };
jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: () => mockLiveQuery,
}));
jest.mock("@/db/repository", () => ({
  recordUpdateCheck: jest.fn(() => Promise.resolve()),
  dismissUpdateVersion: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/lib/appUpdate", () => ({
  fetchLatestRelease: jest.fn(),
  compareVersions: () => 1,
  downloadAndInstallApk: jest.fn(),
}));

const mockDownload = downloadAndInstallApk as jest.Mock;
const mockFetch = fetchLatestRelease as jest.Mock;

describe("UpdateNotifier", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLiveQuery = { data: [], updatedAt: new Date() };
    mockFetch.mockResolvedValue({ version: "99.0.0", notes: "", apkUrl: "https://example.test/app.apk" });
  });

  it("attend la lecture des réglages avant de vérifier", async () => {
    mockLiveQuery = { data: [] };
    await render(<UpdateNotifier />);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("ne réaffiche pas une version déjà ignorée", async () => {
    mockLiveQuery = {
      data: [{ id: 1, lastUpdateCheckAt: null, dismissedUpdateVersion: "99.0.0" }],
      updatedAt: new Date(),
    };
    const screen = await render(<UpdateNotifier />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(screen.queryByText("Installer")).toBeNull();
  });

  it("affiche les notes de version dans une zone défilante", async () => {
    mockFetch.mockResolvedValue({
      version: "99.0.0",
      notes: "### Corrigé\n- Un **bug**",
      apkUrl: "https://example.test/app.apk",
    });
    const screen = await render(<UpdateNotifier />);
    expect(await screen.findByTestId("update-notes")).toBeTruthy();
    expect(screen.getByText("Corrigé")).toBeTruthy();
    // Premier rendu des notes : le rendu Markdown est chargé et compilé ici,
    // ce qui dépasse les 5 s par défaut sur la CI (sans cache Jest).
  }, 20000);

  it("propose « Installer » et « Ignorer »", async () => {
    const screen = await render(<UpdateNotifier />);
    expect(await screen.findByText("Installer")).toBeTruthy();
    expect(screen.getByText("Ignorer")).toBeTruthy();
  });

  it("« Installer » ferme la bannière et lance directement le téléchargement", async () => {
    mockDownload.mockReturnValue(new Promise(() => {}));
    const screen = await render(<UpdateNotifier />);
    await fireEvent.press(await screen.findByText("Installer"));

    expect(mockDownload).toHaveBeenCalledWith("https://example.test/app.apk", expect.any(Function));
    expect(screen.queryByText("Installer")).toBeNull();
    expect(screen.getByText(/Téléchargement de la version 99\.0\.0/)).toBeTruthy();
    expect(dismissUpdateVersion).not.toHaveBeenCalled();
  });

  it("« Ignorer » mémorise la version et ferme la bannière", async () => {
    const screen = await render(<UpdateNotifier />);
    await fireEvent.press(await screen.findByText("Ignorer"));

    expect(dismissUpdateVersion).toHaveBeenCalledWith("99.0.0");
    expect(screen.queryByText("Installer")).toBeNull();
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it("propose de réessayer si le téléchargement échoue", async () => {
    mockDownload.mockRejectedValueOnce(new Error("réseau")).mockReturnValue(new Promise(() => {}));
    const screen = await render(<UpdateNotifier />);
    await fireEvent.press(await screen.findByText("Installer"));

    expect(await screen.findByText(/a échoué/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Réessayer"));
    await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(2));
  });
});
