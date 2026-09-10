import { useCallback, useEffect, useMemo } from "react";
import { useLocales } from "expo-localization";
import { APP_LOCALE_KEYS, type AppLanguagePreference, type AppLocaleKey } from "@/constants/language";
import { useGoogleSheets, SETTINGS_SHEET_CSV_URL, SETTINGS_SHEET_LOCALE_ORDER, type GoogleSheetLocaleRow } from "@/hooks/useGoogleSheets";
import { deviceLocaleToAppLocale } from "@/language/deviceLocale";
import { effectChipLabel as resolveEffectChipLabel, tEffectSectionLabel, type EffectSectionLabelKey } from "@/language/effectSectionLabels";
import { tRewardAdLabel, type RewardAdLabelKey } from "@/language/rewardAdLabels";
import { tTextSectionLabel, type TextSectionLabelKey } from "@/language/textSectionLabels";
import { ensureLocaleFontsLoaded } from "@/utils/fontPreload";
/** 시트 B~F 셀 내용이 바뀌면 같이 바뀌는 정수*/
function sheetRowsLayoutRevision(rows: GoogleSheetLocaleRow[]): number {
  let h = 0;
  for (const r of rows) {
    h = (h * 47 + r.sheetRow) | 0;
    for (const k of APP_LOCALE_KEYS) {
      const s = r.locales[k] ?? "";
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
      }
    }
  }
  return h;
}

export function useSettingsLocalization(appLanguage: AppLanguagePreference) {
  /**스프레드 시트 데이터 */
  const {
    data: sheetData,
    loading: sheetStringsLoading,
    error: sheetStringsError,
    refetch: refetchSheetStrings,
  } = useGoogleSheets();

  const { data: settingsSheetData } = useGoogleSheets(
    SETTINGS_SHEET_CSV_URL,
    SETTINGS_SHEET_LOCALE_ORDER,
  );

  /** 기기 로케일 */
  const locales = useLocales();
  const primaryLocale = locales[0];
  /** 기기 로케일을 AppLocaleKey (ko, en, ja, zhTC, zhSC)로 변환 */
  const deviceAppLocale = useMemo(
    () => deviceLocaleToAppLocale(primaryLocale ?? { languageCode: "en" }),
    [
      primaryLocale?.languageTag,
      primaryLocale?.languageCode,
      primaryLocale?.languageScriptCode,
      primaryLocale?.regionCode,
    ],
  );

  const resolvedAppLocale: AppLocaleKey =
    appLanguage === "system" ? deviceAppLocale : appLanguage;

  /** 언어가 부팅 시 미리 로드되지 않은 언어로 바뀌면 그 로케일 폰트를 로드 */
  useEffect(() => {
    ensureLocaleFontsLoaded(resolvedAppLocale).catch((err) => {
      if (__DEV__) console.warn("[fonts] locale font load failed", err);
    });
  }, [resolvedAppLocale]);

  const sheetParseResult = sheetData ?? null;
  const sheetRows = sheetData?.rows ?? null;
  const settingsSheetRows = settingsSheetData?.rows ?? null;

  const sheetStringsRevision = useMemo(
    () =>
      sheetData?.rows?.length ? sheetRowsLayoutRevision(sheetData.rows) : 0,
    [sheetData],
  );

  const textSectionLabel = useCallback(
    (key: TextSectionLabelKey) =>
      tTextSectionLabel(key, resolvedAppLocale, sheetRows, settingsSheetRows),
    [resolvedAppLocale, sheetRows, settingsSheetRows],
  );

  const effectSectionLabel = useCallback(
    (key: EffectSectionLabelKey) =>
      tEffectSectionLabel(key, resolvedAppLocale, sheetRows),
    [resolvedAppLocale, sheetRows],
  );

  const effectChipLabel = useCallback(
    (effectId: string) =>
      resolveEffectChipLabel(effectId, resolvedAppLocale, sheetRows),
    [resolvedAppLocale, sheetRows],
  );

  const rewardAdLabel = useCallback(
    (key: RewardAdLabelKey) =>
      tRewardAdLabel(key, resolvedAppLocale, sheetRows),
    [resolvedAppLocale, sheetRows],
  );

  return { resolvedAppLocale, sheetParseResult, sheetStringsLoading, sheetStringsError,
    refetchSheetStrings, sheetStringsRevision, textSectionLabel, effectSectionLabel,
    effectChipLabel, rewardAdLabel };
}