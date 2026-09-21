import type { RemoteFontFaceSet, RemoteFontSource } from "@/constants/remoteFonts";

const downloadedFonts = new Map<string, string>();
const inFlightDownloads = new Map<string, Promise<string>>();

export interface RemoteFontDownloadOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

export function isRemoteFontDownloaded(source: RemoteFontSource): boolean {
  return downloadedFonts.has(source.fileName);
}

async function readResponseWithProgress(
  response: Response,
  onProgress?: (fraction: number) => void,
): Promise<Blob> {
  const total = Number(response.headers.get("content-length") ?? -1);
  if (!onProgress || !response.body || total <= 0) return response.blob();

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.slice().buffer);
    received += value.byteLength;
    onProgress(received / total);
  }
  return new Blob(chunks);
}

export async function ensureRemoteFontDownloaded(
  source: RemoteFontSource,
  options?: RemoteFontDownloadOptions,
): Promise<string> {
  const downloaded = downloadedFonts.get(source.fileName);
  if (downloaded) return downloaded;

  const pending = inFlightDownloads.get(source.fileName);
  if (pending) return pending;

  const promise = fetch(source.url, { signal: options?.signal })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Remote font download failed (${response.status}): ${source.url}`,
        );
      }
      const blob = await readResponseWithProgress(response, options?.onProgress);
      const uri = URL.createObjectURL(blob);
      downloadedFonts.set(source.fileName, uri);
      return uri;
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
