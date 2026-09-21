import {
  buildFontAssets,
  buildRemainingFontAssets,
  getAllDefaultFontIds,
  getEagerFontIdsForLocale,
  getFontAssetIds,
  getFontIdsInLocaleMap,
  type FontId,
} from "@/constants/appFonts";
import type { AppLocaleKey } from "@/constants/language";
import { loadTypeface, preloadSkiaTypefaces } from "@/hooks/useCachedSkiaFont";
import { readAppLanguage } from "@/utils/appLanguageStorage";
import { readPresetSlotsJson } from "@/utils/presetStorage";
import * as Font from "expo-font";

type PresetSlotLike = {
  appearance?: { fontByLocale?: Partial<Record<AppLocaleKey, string>> };
};

/** 저장된 앱 언어(없으면 기기 언어)로 현재 로케일 결정 */
async function resolveStoredLocale(device: AppLocaleKey): Promise<AppLocaleKey> {
  const pref = await readAppLanguage();
  return pref && pref !== "system" ? pref : device;
}

/** 저장된 프리셋들의 fontByLocale에서 쓰인 폰트 id 전부 */
async function readPresetFontIds(): Promise<FontId[]> {
  const json = await readPresetSlotsJson();
  if (!json) return [];
  try {
    const slots = JSON.parse(json) as PresetSlotLike[];
    return slots.flatMap((slot) => getFontIdsInLocaleMap(slot?.appearance?.fontByLocale));
  } catch {
    return [];
  }
}

/** 부팅 시 즉시 로드해야 할 폰트: 현재 로케일 + 모든 언어 default + 프리셋에서 쓰인 폰트 */
async function collectPriorityFontIds(device: AppLocaleKey): Promise<FontId[]> {
  const [locale, presetFontIds] = await Promise.all([
    resolveStoredLocale(device),
    readPresetFontIds(),
  ]);
  return Array.from(
    new Set([...getEagerFontIdsForLocale(locale), ...getAllDefaultFontIds(), ...presetFontIds]),
  );
}

const LOAD_RETRY_DELAYS_MS = [500, 1500, 3000];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 부팅 직후처럼 폰트 요청이 몰릴 때 개발 서버(Metro)가 일부 다운로드를
// 일시적으로 거부하는 경우가 있어, 실패 시 짧은 백오프로 재시도한다.
async function loadAssetsWithRetry(assets: Record<string, number>): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await Font.loadAsync(assets);
      return;
    } catch (err) {
      const delay = LOAD_RETRY_DELAYS_MS[attempt];
      if (delay == null) throw err;
      await wait(delay);
    }
  }
}

function loadFontIds(ids: FontId[]): Promise<void> {
  return loadAssetsWithRetry(buildFontAssets(ids));
}

const loadedLocales = new Set<AppLocaleKey>();

/** 언어를 특정 로케일로 전환할 때, 아직 안 실린 그 로케일 폰트를 로드 */
export function ensureLocaleFontsLoaded(locale: AppLocaleKey): Promise<void> {
  if (loadedLocales.has(locale)) return Promise.resolve();
  loadedLocales.add(locale);
  const ids = getEagerFontIdsForLocale(locale);
  preloadSkiaTypefaces(getFontAssetIds(ids));
  return loadFontIds(ids).catch((err) => {
    loadedLocales.delete(locale);
    throw err;
  });
}


/** Optional cache warming: the root runs one bounded unit per idle opportunity. */
export async function createDeferredFontPreloadTasks(device: AppLocaleKey): Promise<Array<() => Promise<unknown>>> {
  const priorityIds = await collectPriorityFontIds(device);
  const tasks: Array<() => Promise<unknown>> = [];
  const addTextFonts = (assets: Record<string, number>) => {
    const entries = Object.entries(assets);
    for (let index = 0; index < entries.length; index += 2) {
      const batch = entries.slice(index, index + 2);
      tasks.push(async () => {
        const missing = Object.fromEntries(batch.filter(([family]) => !Font.isLoaded(family)));
        if (Object.keys(missing).length > 0) await loadAssetsWithRetry(missing);
      });
    }
  };
  addTextFonts(buildFontAssets(priorityIds));
  for (const asset of new Set(getFontAssetIds([...getEagerFontIdsForLocale(device), ...priorityIds]))) {
    tasks.push(async () => {
      if (!await loadTypeface(asset)) throw new Error("Optional Skia font preload failed");
    });
  }
  addTextFonts(buildRemainingFontAssets(priorityIds));
  return tasks;
}
