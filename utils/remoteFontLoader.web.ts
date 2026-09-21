import type { RemoteFontFaceSet, RemoteFontSource } from "@/constants/remoteFonts";
import { fetchBinaryBlob } from "@/utils/ApiClient";
import {
  runRemoteFontDownload,
  type RemoteFontDownloadOptions,
} from "@/utils/remoteFontFlight";
import { isPlausibleFontFile } from "@/utils/remoteFontValidation";

export type { RemoteFontDownloadOptions } from "@/utils/remoteFontFlight";

const downloadedFonts = new Map<string, string>();

export function isRemoteFontDownloaded(source: RemoteFontSource): boolean {
  return downloadedFonts.has(source.fileName);
}

export async function ensureRemoteFontDownloaded(
  source: RemoteFontSource,
  options?: RemoteFontDownloadOptions,
): Promise<string> {
  const downloaded = downloadedFonts.get(source.fileName);
  if (downloaded) {
    options?.onProgress?.(1);
    return downloaded;
  }

  return runRemoteFontDownload(
    source.fileName,
    options,
    async (sharedOptions) => {
      const blob = await fetchBinaryBlob(source.url, sharedOptions);
      const signature = new Uint8Array(
        await blob.slice(0, 4).arrayBuffer(),
      );
      if (!isPlausibleFontFile(blob.size, signature)) {
        throw new Error(`Downloaded font is invalid: ${source.fileName}`);
      }
      const uri = URL.createObjectURL(blob);
      downloadedFonts.set(source.fileName, uri);
      sharedOptions.onProgress(1);
      return uri;
    },
  );
}

export function isRemoteFontSetDownloaded(set: RemoteFontFaceSet): boolean {
  return isRemoteFontDownloaded(set.regular) && isRemoteFontDownloaded(set.bold);
}

export async function ensureRemoteFontSetDownloaded(
  set: RemoteFontFaceSet,
  options?: RemoteFontDownloadOptions,
): Promise<{ regularUri: string; boldUri: string }> {
  const progress = options?.onProgress
    ? (() => {
        const fractions = { regular: 0, bold: 0 };
        return (key: "regular" | "bold") => (fraction: number) => {
          fractions[key] = fraction < 0 ? 0 : fraction;
          options.onProgress!((fractions.regular + fractions.bold) / 2);
        };
      })()
    : null;

  const [regularUri, boldUri] = await Promise.all([
    ensureRemoteFontDownloaded(set.regular, {
      signal: options?.signal,
      onProgress: progress?.("regular"),
    }),
    ensureRemoteFontDownloaded(set.bold, {
      signal: options?.signal,
      onProgress: progress?.("bold"),
    }),
  ]);
  return { regularUri, boldUri };
}
