import { downloadAndInstallApk as downloadAndInstallApkBase } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import {
  fetchLatestRelease as fetchLatestReleaseBase,
  fetchReleaseHistory as fetchReleaseHistoryBase,
} from "@forthtilliath/expo-release-updates/githubReleases";

import { downloadAndInstallApk, fetchLatestRelease, fetchReleaseHistory, simplifyReleaseNotes } from "./appUpdate";

jest.mock("@forthtilliath/expo-release-updates/githubReleases", () => ({
  fetchLatestRelease: jest.fn(),
  fetchReleaseHistory: jest.fn(),
}));
jest.mock("@forthtilliath/expo-release-updates/downloadAndInstallApk", () => ({
  downloadAndInstallApk: jest.fn(),
}));

const REPO = { owner: "Forthtilliath", repo: "glucodose" };

describe("simplifyReleaseNotes", () => {
  it("retire citations, italique et code, mais garde titres, puces et gras", () => {
    const notes = [
      "> **Mise à jour manuelle obligatoire.** Android refuse l'installation.",
      "> 1. Dans l'app : *Réglages → Sauvegarde*.",
      "> 3. Installe `GlucoDose-1.15.0.apk` ci-dessous.",
      "### Sécurité",
      "- Un **point** et *un autre* : 2 * 3 = 6",
    ].join("\n");

    expect(simplifyReleaseNotes(notes)).toBe(
      [
        "**Mise à jour manuelle obligatoire.** Android refuse l'installation.",
        "1. Dans l'app : Réglages → Sauvegarde.",
        "3. Installe GlucoDose-1.15.0.apk ci-dessous.",
        "### Sécurité",
        "- Un **point** et un autre : 2 * 3 = 6",
      ].join("\n")
    );
  });
});

describe("appUpdate", () => {
  beforeEach(() => {
    (fetchReleaseHistoryBase as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetchLatestRelease interroge le dépôt glucodose", async () => {
    await fetchLatestRelease();
    expect(fetchLatestReleaseBase).toHaveBeenCalledWith(REPO);
  });

  it("fetchLatestRelease et fetchReleaseHistory simplifient les notes", async () => {
    (fetchLatestReleaseBase as jest.Mock).mockResolvedValueOnce({ version: "2.0.0", notes: "> *Note*", apkUrl: "" });
    (fetchReleaseHistoryBase as jest.Mock).mockResolvedValueOnce([{ version: "2.0.0", notes: "- `code`" }]);

    expect((await fetchLatestRelease())?.notes).toBe("Note");
    expect((await fetchReleaseHistory())[0].notes).toBe("- code");
  });

  it("fetchReleaseHistory interroge le dépôt glucodose avec une limite par défaut de 10", async () => {
    await fetchReleaseHistory();
    expect(fetchReleaseHistoryBase).toHaveBeenCalledWith({ ...REPO, limit: 10 });
  });

  it("fetchReleaseHistory transmet une limite personnalisée", async () => {
    await fetchReleaseHistory(3);
    expect(fetchReleaseHistoryBase).toHaveBeenCalledWith({ ...REPO, limit: 3 });
  });

  it("downloadAndInstallApk utilise un nom de fichier fixe", async () => {
    const onProgress = jest.fn();
    await downloadAndInstallApk("https://example.com/app.apk", onProgress);
    expect(downloadAndInstallApkBase).toHaveBeenCalledWith({
      apkUrl: "https://example.com/app.apk",
      fileName: "glucodose-update.apk",
      onProgress,
    });
  });
});
