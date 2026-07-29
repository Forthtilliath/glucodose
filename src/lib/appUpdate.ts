import { File, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";

const GITHUB_REPO = "Forthtilliath/glucodose";
const LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export type LatestRelease = {
  version: string;
  notes: string;
  apkUrl: string;
};

// Compare deux versions "x.y.z" : -1 si a < b, 0 si égales, 1 si a > b.
export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) return numA > numB ? 1 : -1;
  }
  return 0;
}

export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  const response = await fetch(LATEST_RELEASE_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub a répondu ${response.status}`);

  const data = await response.json();
  const apkAsset = (data.assets ?? []).find((asset: { name: string }) => asset.name.endsWith(".apk"));
  if (!apkAsset) return null;

  return {
    version: String(data.tag_name ?? "").replace(/^v/, ""),
    notes: data.body ?? "",
    apkUrl: apkAsset.browser_download_url,
  };
}

export async function downloadAndInstallApk(
  apkUrl: string,
  onProgress?: (fraction: number) => void
): Promise<void> {
  const destination = new File(Paths.cache, "glucodose-update.apk");
  if (destination.exists) destination.delete();

  const task = File.createDownloadTask(apkUrl, destination, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) onProgress?.(bytesWritten / totalBytes);
    },
  });
  const file = await task.downloadAsync();
  if (!file) throw new Error("Le téléchargement a échoué.");

  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: file.contentUri,
    flags: 1,
    type: "application/vnd.android.package-archive",
  });
}
