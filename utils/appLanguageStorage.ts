import {
  APP_LOCALE_KEYS,
  type AppLanguagePreference,
  type AppLocaleKey,
} from "@/constants/language";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_LANGUAGE_STORAGE_KEY = "@led_banner_app_language_v1";

function isAppLocaleKey(value: string): value is AppLocaleKey {
  return (APP_LOCALE_KEYS as readonly string[]).includes(value);
}

function parseAppLanguagePreference(
  raw: string | null | undefined,
): AppLanguagePreference | null {
  if (!raw) return null;
  if (raw === "system") return "system";
  if (isAppLocaleKey(raw)) return raw;
  throw new Error(`Invalid saved app language: ${raw}`);
}

export async function readAppLanguage(): Promise<AppLanguagePreference | null> {
  const raw = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  return parseAppLanguagePreference(raw);
}

export async function writeAppLanguage(
  preference: AppLanguagePreference,
): Promise<void> {
  await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, preference);
}
