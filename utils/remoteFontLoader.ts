import type { RemoteFontFaceSet, RemoteFontSource } from "@/constants/remoteFonts";
import { Directory, File, Paths } from "expo-file-system";

const remoteFontsDir = new Directory(Paths.cache, "remote-fonts");
const inFlightDownloads = new Map<string, Promise<string>>();

export interface RemoteFontDownloadOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

export function isRemoteFontDownloaded(source: RemoteFontSource): boolean {
  return new File(remoteFontsDir, source.fileName).exists;
}

export async function ensureRemoteFontDownloaded(
  source: RemoteFontSource,
  options?: RemoteFontDownloadOptions,
): Promise<string> {
  if (!remoteFontsDir.exists) {
    remoteFontsDir.create({ intermediates: true, idempotent: true });
  }
  const file = new File(remoteFontsDir, source.fileName);
  if (file.exists) return file.uri;

  const pending = inFlightDownloads.get(source.fileName);
  if (pending) return pending;

  const promise = File.downloadFileAsync(source.url, file, {
    idempotent: true,
    signal: options?.signal,
    onProgress: options?.onProgress
      ? ({ bytesWritten, totalBytes }) => {
          options.onProgress!(totalBytes > 0 ? bytesWritten / totalBytes : -1);
        }
      : undefined,
  })
    .then((downloaded) => downloaded.uri)
    .catch((err) => {
      // 취소/실패 시 downloadFileAsync가 목적지에 남겨둔 불완전한 파일을 지워서,
      // 다음 시도 때 exists 체크만으로 손상된 파일을 완료된 것으로 오인하지 않게 함.
      if (file.exists) {
        try {
          file.delete();
        } catch {
          // ignore cleanup failure
        }
      }
      throw err;
    })
    .finally(() => {
      inFlightDownloads.delete(source.fileName);
    });
  inFlightDownloads.set(source.fileName, promise);
  return promise;
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
