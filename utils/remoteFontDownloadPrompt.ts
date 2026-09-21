import {
  APP_FONT_FACE_SETS,
  isRemoteFontMarker,
  type FontId,
} from "@/constants/appFonts";
import { REMOTE_FONT_FACE_SETS, type RemoteFontId } from "@/constants/remoteFonts";
import {
  ensureRemoteFontSetDownloaded,
  isRemoteFontSetDownloaded,
} from "@/utils/remoteFontLoader";

export interface FontDownloadPromptState {
  visible: boolean;
  progress: number;
  fontId: FontId | null;
}

let state: FontDownloadPromptState = { visible: false, progress: 0, fontId: null };
const listeners = new Set<() => void>();

function setState(next: Partial<FontDownloadPromptState>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeFontDownloadPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFontDownloadPromptSnapshot(): FontDownloadPromptState {
  return state;
}

function remoteIdForFont(fontId: FontId): RemoteFontId | null {
  const set = APP_FONT_FACE_SETS[fontId];
  return isRemoteFontMarker(set.regular) ? set.regular.remote : null;
}

let activeController: AbortController | null = null;

export function cancelFontDownload(): void {
  activeController?.abort();
  activeController = null;
  setState({ visible: false, progress: 0, fontId: null });
}

export async function requestFontDownload(fontId: FontId): Promise<boolean> {
  const remoteId = remoteIdForFont(fontId);
  if (!remoteId) return true;

  const remoteSet = REMOTE_FONT_FACE_SETS[remoteId];
  if (isRemoteFontSetDownloaded(remoteSet)) return true;

  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  setState({ visible: true, progress: 0, fontId });

  try {
    await ensureRemoteFontSetDownloaded(remoteSet, {
      signal: controller.signal,
      onProgress: (fraction) => {
        if (activeController === controller) setState({ progress: fraction });
      },
    });
    if (activeController !== controller) return false;
    activeController = null;
    setState({ visible: false, progress: 0, fontId: null });
    return true;
  } catch {
    if (activeController === controller) {
      activeController = null;
      setState({ visible: false, progress: 0, fontId: null });
    }
    return false;
  }
}
