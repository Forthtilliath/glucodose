import { downloadAndInstallApk as downloadAndInstallApkBase } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import {
  fetchLatestRelease as fetchLatestReleaseBase,
  fetchReleaseHistory as fetchReleaseHistoryBase,
  releaseDownloadUrlPrefix,
} from "@forthtilliath/expo-release-updates/githubReleases";

export { compareVersions } from "@forthtilliath/expo-release-updates/compareVersions";
export type {
  LatestRelease,
  ReleaseHistoryEntry,
} from "@forthtilliath/expo-release-updates/githubReleases";

const REPO = { owner: "Forthtilliath", repo: "glucodose" };
const APK_FILE_NAME = "glucodose-update.apk";

// Seules les versions dont GitHub donne l'empreinte SHA-256 de l'APK sont proposées : une release
// sans empreinte, ou dont l'APK est hors des releases du dépôt, est sautée au profit de la suivante.
export async function fetchLatestRelease() {
  return fetchLatestReleaseBase({ ...REPO, requireVerifiedApk: true });
}

// Historique des releases (notes de version), affiché dans Réglages en plus
// de la vérification de mise à jour — même source que le CHANGELOG.md du
// dépôt, puisque les notes GitHub sont recopiées depuis lui à chaque release.
export async function fetchReleaseHistory(limit = 10) {
  return fetchReleaseHistoryBase({ ...REPO, limit });
}

// Téléchargement limité aux releases du dépôt, et refusé si l'APK n'a pas l'empreinte annoncée par
// GitHub (l'installeur d'Android refuse en plus un APK signé avec une autre clé).
export function downloadAndInstallApk(apkUrl: string, onProgress?: (fraction: number) => void, apkSha256?: string) {
  if (!apkSha256) {
    return Promise.reject(new Error("Empreinte de la mise à jour absente : installation refusée."));
  }
  return downloadAndInstallApkBase({
    apkUrl,
    fileName: APK_FILE_NAME,
    onProgress,
    expectedSha256: apkSha256,
    allowedUrlPrefix: releaseDownloadUrlPrefix(REPO),
  });
}
