import { downloadAndInstallApk as downloadAndInstallApkBase } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import {
  fetchLatestRelease as fetchLatestReleaseBase,
  fetchReleaseHistory as fetchReleaseHistoryBase,
} from "@forthtilliath/expo-release-updates/githubReleases";

import { downloadAndInstallApk, fetchLatestRelease, fetchReleaseHistory } from "./appUpdate";

jest.mock("@forthtilliath/expo-release-updates/githubReleases", () => ({
  ...jest.requireActual("@forthtilliath/expo-release-updates/githubReleases"),
  fetchLatestRelease: jest.fn(),
  fetchReleaseHistory: jest.fn(),
}));
jest.mock("@forthtilliath/expo-release-updates/downloadAndInstallApk", () => ({
  downloadAndInstallApk: jest.fn(),
}));

const REPO = { owner: "Forthtilliath", repo: "glucodose" };

describe("appUpdate", () => {
  beforeEach(() => {
    (fetchReleaseHistoryBase as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetchLatestRelease interroge le dépôt glucodose", async () => {
    await fetchLatestRelease();
    expect(fetchLatestReleaseBase).toHaveBeenCalledWith({ ...REPO, requireVerifiedApk: true });
  });

  it("fetchLatestRelease et fetchReleaseHistory transmettent les notes telles quelles", async () => {
    // ChangelogNotes (expo-release-updates-ui 0.6) rend lui-même citations, italique et code.
    (fetchLatestReleaseBase as jest.Mock).mockResolvedValueOnce({ version: "2.0.0", notes: "> *Note*", apkUrl: "" });
    (fetchReleaseHistoryBase as jest.Mock).mockResolvedValueOnce([{ version: "2.0.0", notes: "- `code`" }]);

    expect((await fetchLatestRelease())?.notes).toBe("> *Note*");
    expect((await fetchReleaseHistory())[0].notes).toBe("- `code`");
  });

  it("fetchReleaseHistory interroge le dépôt glucodose avec une limite par défaut de 10", async () => {
    await fetchReleaseHistory();
    expect(fetchReleaseHistoryBase).toHaveBeenCalledWith({ ...REPO, limit: 10 });
  });

  it("fetchReleaseHistory transmet une limite personnalisée", async () => {
    await fetchReleaseHistory(3);
    expect(fetchReleaseHistoryBase).toHaveBeenCalledWith({ ...REPO, limit: 3 });
  });

  it("downloadAndInstallApk vérifie l'empreinte et limite le téléchargement aux releases du dépôt", async () => {
    const onProgress = jest.fn();
    const apkUrl = "https://github.com/Forthtilliath/glucodose/releases/download/v2.0.0/GlucoDose-2.0.0.apk";
    await downloadAndInstallApk(apkUrl, onProgress, "e".repeat(64));
    expect(downloadAndInstallApkBase).toHaveBeenCalledWith({
      apkUrl,
      fileName: "glucodose-update.apk",
      onProgress,
      expectedSha256: "e".repeat(64),
      allowedUrlPrefix: "https://github.com/Forthtilliath/glucodose/releases/download/",
    });
  });

  it("downloadAndInstallApk refuse une release sans empreinte, sans rien télécharger", async () => {
    await expect(downloadAndInstallApk("https://github.com/x.apk")).rejects.toThrow("Empreinte");
    expect(downloadAndInstallApkBase).not.toHaveBeenCalled();
  });
});
