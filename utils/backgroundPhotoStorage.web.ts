// Keep the existing browser picker/data-URI behavior; no native filesystem import.
export async function persistBackgroundPhoto(uri: string): Promise<string> {
  return uri;
}

export function serializeBackgroundPhotoUri(uri: string): string {
  return uri;
}

export async function restoreBackgroundPhotoUri(uri: string): Promise<string> {
  return uri;
}
