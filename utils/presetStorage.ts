import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PresetSnapshot } from "@/contexts/settings/presetModel";
import { restoreBackgroundPhotoUri, serializeBackgroundPhotoUri } from "./backgroundPhotoStorage";

const PRESET_SLOTS_STORAGE_KEY = "@led_banner_preset_slots_v1";

export async function readPresetSlotsJson(): Promise<string | null> {
  return AsyncStorage.getItem(PRESET_SLOTS_STORAGE_KEY);
}

async function writePresetSlotsJson(json: string): Promise<void> {
  await AsyncStorage.setItem(PRESET_SLOTS_STORAGE_KEY, json);
}

export async function restorePresetBackgroundPhotos(
  slots: PresetSnapshot[],
): Promise<PresetSnapshot[]> {
  const pending = new Map<string, Promise<string>>();
  return Promise.all(slots.map(async slot => {
    const uri = slot.background.backgroundImageUri;
    if (!uri) return slot;
    let restored = pending.get(uri);
    if (!restored) {
      restored = restoreBackgroundPhotoUri(uri);
      pending.set(uri, restored);
    }
    return { ...slot, background: { ...slot.background, backgroundImageUri: await restored } };
  }));
}

/** Preserve the existing slot schema/key; only managed photo paths are relative. */
export async function persistPresetSlotsSnapshot(
  slots: PresetSnapshot[],
): Promise<void> {
  const stored = slots.map(slot => ({
    ...slot,
    background: {
      ...slot.background,
      backgroundImageUri: slot.background.backgroundImageUri
        ? serializeBackgroundPhotoUri(slot.background.backgroundImageUri)
        : slot.background.backgroundImageUri,
    },
  }));
  await writePresetSlotsJson(JSON.stringify(stored));
}
