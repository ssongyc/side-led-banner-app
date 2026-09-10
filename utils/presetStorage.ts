import AsyncStorage from "@react-native-async-storage/async-storage";

export const PRESET_SLOTS_STORAGE_KEY = "@led_banner_preset_slots_v1";

export async function readPresetSlotsJson(): Promise<string | null> {
  return AsyncStorage.getItem(PRESET_SLOTS_STORAGE_KEY);
}

async function writePresetSlotsJson(json: string): Promise<void> {
  await AsyncStorage.setItem(PRESET_SLOTS_STORAGE_KEY, json);
}

/** 슬롯 배열을 그대로 직렬로 저장장 */
export async function persistPresetSlotsSnapshot(
  slots: unknown[],
): Promise<void> {
  await writePresetSlotsJson(JSON.stringify(slots));
}
