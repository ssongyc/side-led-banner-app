import type { RemoteFontFaceSet, RemoteFontSource } from "@/constants/remoteFonts";
import { downloadBinaryFile } from "@/utils/ApiClient";
import {
  runRemoteFontDownload,
  type RemoteFontDownloadOptions,
} from "@/utils/remoteFontFlight";
import { isPlausibleFontFile } from "@/utils/remoteFontValidation";
import { Directory, File, FileMode, Paths } from "expo-file-system";

export type { RemoteFontDownloadOptions } from "@/utils/remoteFontFlight";

const remoteFontsDir = new Directory(Paths.cache, "remote-fonts");

function deleteIfPresent(file: File): void {
  if (!file.exists) return;
  try {
    file.delete();
  } catch {
    // A later file operation will report the actionable error.
  }
}

function isUsableFontFile(file: File): boolean {
  if (!file.exists || file.size < 1024) return false;
  let handle: ReturnType<File["open"]> | null = null;
  try {
    handle = file.open(FileMode.ReadOnly);
    return isPlausibleFontFile(file.size, handle.readBytes(4));
  } catch {
    return false;
  } finally {
    handle?.close();
  }
}

export function isRemoteFontDownloaded(source: RemoteFontSource): boolean {
  return isUsableFontFile(new File(remoteFontsDir, source.fileName));
}

export async function ensureRemoteFontDownloaded(
  source: RemoteFontSource,
  options?: RemoteFontDownloadOptions,
): Promise<string> {
  if (!remoteFontsDir.exists) {
    remoteFontsDir.create({ intermediates: true, idempotent: true });
  }

  const file = new File(remoteFontsDir, source.fileName);
  if (isUsableFontFile(file)) {
    options?.onProgress?.(1);
    return file.uri;
  }
  deleteIfPresent(file);

  return runRemoteFontDownload(
    source.fileName,
    options,
    async (sharedOptions) => {
      // Android writes downloads directly to their destination. A separate
      // .part file prevents an interrupted response becoming a cache entry.
      const temporaryFile = new File(
        remoteFontsDir,
        `${source.fileName}.part`,
      );
      deleteIfPresent(temporaryFile);

      try {
        const downloaded = await downloadBinaryFile(
          source.url,
          temporaryFile,
          sharedOptions,
        );
        if (!isUsableFontFile(downloaded)) {
          throw new Error(`Downloaded font is invalid: ${source.fileName}`);
        }
        downloaded.moveSync(file, { overwrite: true });
        sharedOptions.onProgress(1);
        return file.uri;
      } catch (error) {
        deleteIfPresent(temporaryFile);
        throw error;
      }
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
