import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { dismissUpdateVersion } from "@/db/repository";
import { downloadAndInstallApk } from "@/lib/appUpdate";

import { UpdateNotifier } from "./UpdateNotifier";

jest.mock("@/db/client", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({}) }) }) },
}));
jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: () => ({ data: [] }),
}));
jest.mock("@/db/repository", () => ({
  recordUpdateCheck: jest.fn(() => Promise.resolve()),
  dismissUpdateVersion: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/lib/appUpdate", () => ({
  fetchLatestRelease: () =>
    Promise.resolve({ version: "99.0.0", notes: "", apkUrl: "https://example.test/app.apk" }),
  compareVersions: () => 1,
  downloadAndInstallApk: jest.fn(),
}));

const mockDownload = downloadAndInstallApk as jest.Mock;

describe("UpdateNotifier", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
