import type { RemoteFontFaceSet, RemoteFontSource } from "@/constants/remoteFonts";

const downloadedFonts = new Map<string, string>();
const inFlightDownloads = new Map<string, Promise<string>>();

export async function ensureRemoteFontDownloaded(
  source: RemoteFontSource,
): Promise<string> {
  const downloaded = downloadedFonts.get(source.fileName);
  if (downloaded) return downloaded;

  const pending = inFlightDownloads.get(source.fileName);
  if (pending) return pending;

  const promise = fetch(source.url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Remote font download failed (${response.status}): ${source.url}`,
        );
      }
      const uri = URL.createObjectURL(await response.blob());
      downloadedFonts.set(source.fileName, uri);
      return uri;
    })
    .finally(() => {
      inFlightDownloads.delete(source.fileName);
    });
  inFlightDownloads.set(source.fileName, promise);
  return promise;
}

export async function ensureRemoteFontSetDownloaded(
  set: RemoteFontFaceSet,
): Promise<{ regularUri: string; boldUri: string }> {
  const [regularUri, boldUri] = await Promise.all([
    ensureRemoteFontDownloaded(set.regular),
    ensureRemoteFontDownloaded(set.bold),
  ]);
  return { regularUri, boldUri };
}
