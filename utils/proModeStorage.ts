import AsyncStorage from "@react-native-async-storage/async-storage";

const rewardExpiryQa = process.env.EXPO_PUBLIC_REWARD_EXPIRY_QA === "true";
export const PRO_REWARD_DURATION_MS = rewardExpiryQa ? 30_000 : 2 * 60 * 60 * 1000;
const PRO_MODE_STORAGE_KEY = rewardExpiryQa
  ? "@led_banner_qa_pro_mode_expiry_v1" : "@led_banner_pro_mode_expiry_v1";

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
