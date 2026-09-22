import AsyncStorage from "@react-native-async-storage/async-storage";

const PRO_MODE_STORAGE_KEY = "@led_banner_pro_mode_expiry_v1";

export async function readProModeExpiry(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(PRO_MODE_STORAGE_KEY);
  if (!raw) return null;
  const expiry = Number(raw);
  if (!Number.isFinite(expiry)) return null;
  return expiry;
}

export async function writeProModeExpiry(expiry: number | null): Promise<void> {
  if (expiry === null) {
    await AsyncStorage.removeItem(PRO_MODE_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(PRO_MODE_STORAGE_KEY, String(expiry));
}
