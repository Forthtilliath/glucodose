import { downloadAndInstallApk as downloadAndInstallApkBase } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import {
  fetchLatestRelease as fetchLatestReleaseBase,
  fetchReleaseHistory as fetchReleaseHistoryBase,
} from "@forthtilliath/expo-release-updates/githubReleases";

import { downloadAndInstallApk, fetchLatestRelease, fetchReleaseHistory } from "./appUpdate";

jest.mock("@forthtilliath/expo-release-updates/githubReleases", () => ({
  fetchLatestRelease: jest.fn(),
  fetchReleaseHistory: jest.fn(),
}));
jest.mock("@forthtilliath/expo-release-updates/downloadAndInstallApk", () => ({
  downloadAndInstallApk: jest.fn(),
}));

const REPO = { owner: "Forthtilliath", repo: "glucodose" };

describe("appUpdate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetchLatestRelease interroge le dépôt glucodose", async () => {
    await fetchLatestRelease();
    expect(fetchLatestReleaseBase).toHaveBeenCalledWith(REPO);
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
