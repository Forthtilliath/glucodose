import { downloadAndInstallApk as downloadAndInstallApkBase } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import {
  fetchLatestRelease as fetchLatestReleaseBase,
  fetchReleaseHistory as fetchReleaseHistoryBase,
} from "@forthtilliath/expo-release-updates/githubReleases";

export { compareVersions } from "@forthtilliath/expo-release-updates/compareVersions";
export type {
  LatestRelease,
  ReleaseHistoryEntry,
} from "@forthtilliath/expo-release-updates/githubReleases";

const REPO = { owner: "Forthtilliath", repo: "glucodose" };
const APK_FILE_NAME = "glucodose-update.apk";

export function fetchLatestRelease() {
  return fetchLatestReleaseBase(REPO);
}

// Historique des releases (notes de version), affiché dans Réglages en plus
// de la vérification de mise à jour — même source que le CHANGELOG.md du
// dépôt, puisque les notes GitHub sont recopiées depuis lui à chaque release.
export function fetchReleaseHistory(limit = 10) {
  return fetchReleaseHistoryBase({ ...REPO, limit });
}

export function downloadAndInstallApk(apkUrl: string, onProgress?: (fraction: number) => void) {
  return downloadAndInstallApkBase({ apkUrl, fileName: APK_FILE_NAME, onProgress });
}
