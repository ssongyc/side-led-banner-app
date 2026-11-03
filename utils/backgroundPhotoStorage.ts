import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const PHOTO_REFERENCE_PREFIX = "ledpop-background-photo:";
const PHOTO_DIRECTORY = "background-photos";
const SAFE_FILE_NAME = /^[a-zA-Z0-9_.-]+$/;

function photoDirectory(): Directory {
  // Resolve lazily: an iOS update can change the application's container URL.
  return new Directory(Paths.document, PHOTO_DIRECTORY);
}

function managedFileName(uri: string): string | null {
  const prefix = `${photoDirectory().uri.replace(/\/$/, "")}/`;
  if (!uri.startsWith(prefix)) return null;
  const name = uri.slice(prefix.length);
  return SAFE_FILE_NAME.test(name) && name !== "." && name !== ".." ? name : null;
}

/** Copy the picker result without decoding, resizing or recompressing it. */
export async function persistBackgroundPhoto(uri: string): Promise<string> {
  const source = new File(uri);
  if (!source.exists || source.size <= 0) {
    throw new Error("Background photo source is missing or unreadable");
  }
  if (managedFileName(source.uri)) return source.uri;

  const directory = photoDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const extension = /\.[a-zA-Z0-9]{1,12}$/.exec(source.name)?.[0] ?? "";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
  const temporary = new File(directory, `${name}.part`);
  const destination = new File(directory, name);
  await source.copy(temporary);
  if (!temporary.exists || temporary.size !== source.size) {
    throw new Error("Background photo copy is incomplete");
  }
  await temporary.move(destination);
  return destination.uri;
}

/** Persist a container-independent name, while renderers keep normal file URIs. */
export function serializeBackgroundPhotoUri(uri: string): string {
  const name = managedFileName(uri);
  return name ? PHOTO_REFERENCE_PREFIX + name : uri;
}

function rebasedLegacyFile(uri: string): File | null {
  if (Platform.OS !== "ios") return null;
  const match = /\/Containers\/Data\/Application\/[^/]+\/(Documents|Library\/Caches)\/(.+)$/.exec(uri);
  if (!match) return null;
  const segments = match[2].split("/").map(segment => decodeURIComponent(segment));
  if (segments.some(segment => !segment || segment === "." || segment === ".." || /[/\\]/.test(segment))) {
    throw new Error("Invalid saved background photo path");
  }
  return new File(match[1] === "Documents" ? Paths.document : Paths.cache, ...segments);
}

export async function restoreBackgroundPhotoUri(uri: string): Promise<string> {
  if (uri.startsWith(PHOTO_REFERENCE_PREFIX)) {
    const name = uri.slice(PHOTO_REFERENCE_PREFIX.length);
    if (!SAFE_FILE_NAME.test(name) || name === "." || name === "..") {
      throw new Error("Invalid saved background photo reference");
    }
    const file = new File(photoDirectory(), name);
    if (!file.exists) console.warn("[background] Saved photo file is missing; reference retained");
    return file.uri;
  }
  if (!uri.startsWith("file://")) return uri;

  const original = new File(uri);
  const source = original.exists ? original : rebasedLegacyFile(uri);
  if (!source?.exists) {
    // A deleted legacy cache cannot be recreated. Never clear its reference or
    // reset the remaining preset just because this one file is unavailable.
    console.warn("[background] Legacy photo file is missing; saved settings retained");
    return uri;
  }
  return persistBackgroundPhoto(source.uri);
}
