import {
  fontBelongsToLocale,
  getDefaultForLocale,
  getFontItemsForLocale,
  getPixelFontIdForLocale,
  isFontHiddenFromPicker,
  normalizeFontId,
  supportsBold,
} from "@/constants/appFonts";
import {
  backgroundColorPalette,
  textColorPalette,
} from "@/constants/colorPalette";
import {
  APP_LOCALE_KEYS,
  type AppLanguagePreference,
  type AppLocaleKey,
} from "@/constants/language";
import {
  hasPixelLedEffect,
  migrateLegacyEffectItems,
} from "@/constants/pixelLed";
import type { SpeechBubblePresetId } from "@/constants/speechBubblePresets";
import {
  type GoogleSheetLocaleRow,
  type GoogleSheetParseResult,
  SETTINGS_SHEET_CSV_URL,
  SETTINGS_SHEET_LOCALE_ORDER,
  useGoogleSheets,
} from "@/hooks/useGoogleSheets";
import { deviceLocaleToAppLocale } from "@/language/deviceLocale";
import type { EffectSectionLabelKey } from "@/language/effectSectionLabels";
import {
  effectChipLabel as resolveEffectChipLabel,
  tEffectSectionLabel,
} from "@/language/effectSectionLabels";
import type { RewardAdLabelKey } from "@/language/rewardAdLabels";
import { tRewardAdLabel } from "@/language/rewardAdLabels";
import type { TextSectionLabelKey } from "@/language/textSectionLabels";
import { tTextSectionLabel } from "@/language/textSectionLabels";
import { readAppLanguage, writeAppLanguage } from "@/utils/appLanguageStorage";
import { ensureLocaleFontsLoaded } from "@/utils/fontPreload";
import {
  persistPresetSlotsSnapshot,
  readPresetSlotsJson,
} from "@/utils/presetStorage";
import { readProModeExpiry, writeProModeExpiry } from "@/utils/proModeStorage";
import { getRelLineSpacing } from "@/utils/textSizing";
import {
  normalizeOneLineJoinMode,
  type OneLineJoinMode,
} from "@/utils/viewMode";
import { useLocales } from "expo-localization";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

/**
 * SettingsContext 사용 매뉴얼
 * 값 가져오기 (Getter)
 * const { config, ui } = useSettings();
 * const { fontSize, font } = config.appearance; // 특정 그룹에서 추출
 * const { isPlaying } = ui; // UI 상태 추출
 * [Context 업데이트 함수 사용법 가이드]
 *
 * 값 수정하기 (Setter)
 * * 1. 직접 업데이트 (Direct Update)
 * - 특정 그룹의 여러 값을 동시에 변경할 때
 * 예) updateConfig("appearance", { fontSize: 30, textSelectedColor: "#FF0000" })
 * 예) updateUI({ activeTab: "BACKGROUND", isPlaying: true })
 *
 * * 2. 개별 세터 함수 정의 (Setter Pattern)
 * - 기존 useState의 set함수처럼 특정 필드 업데이트를 위한 함수를 미리 정의해두고 사용할 때
 * const setFontSize = (value: number) => updateConfig("appearance", { fontSize: value });
 * // <Slider onChange={setFontSize} />
 *
 */
//Banner content, appearance, background, motion 설정을 담는 context
export interface BannerConfig {
  content: {
    previewText: string;
    playOption: "one" | "multi";
    oneLineJoinMode: OneLineJoinMode;
    blurColor: string;
  };
  appearance: {
    font: string;
    /** 스크립트(locale)별 마지막으로 선택된 폰트 — 프리셋마다 독립적으로 저장·복원됨 */
    fontByLocale: Partial<Record<AppLocaleKey, string>>;
    fontSize: number;
    lineSpacing: number;
    letterSpacing: number;
    textSelectedColor: string;
    outLine: number;
    dropShadow: number;
    effectSelectedItems: string[];
    /** 효과 슬라이더 백업용 */
    effectParamValues: Partial<Record<string, number>>;
    blurIntensity: number;
    glowIntensity: number;
    glowColor: string;
    blinkSpeed: number;
    pixelColorMix: boolean;
    fontWeight: "normal" | "bold";
    /** Effect에서 Gradient 켰을 때 배경 물결 등 (wave만 구현) */
    gradientBackgroundPreset: string;
    /** 배경 가장자리 이미지 이펙트 프리셋 */
    backgroundEffectPreset:
      | "none"
      | "effect1"
      | "heartBgA"
      | SpeechBubblePresetId;
  };
  background: {
    backgroundColor: string;
    /** 사진 배경 uri · 없으면 단색만 */
    backgroundImageUri: string | null;
    backgroundBlur: number;
  };
  motion: {
    textMoveSpeed: number;
  };
}

/** 프리셋에 저장할 목록(playOption 제외) */
export type PresetSnapshot = {
  content: Omit<BannerConfig["content"], "playOption">;
  appearance: BannerConfig["appearance"];
  background: BannerConfig["background"];
  motion: BannerConfig["motion"];
};

export const PRESET_SLOT_COUNT = 5;

const PRO_LOCKED_EFFECTS = new Set(["Pixel", "Gradient", "Glow"]);
const PRO_LOCKED_BG_EFFECTS = new Set([
  "effect1",
  "heartBgA",
  "speechBg1",
  "speechBg2",
]);

// textColorPalette: 9개 열, 행내 index >= 4 잠금 (colorPicker.tsx 의 isLocked 조건과 동일)
function isTextColorProLocked(paletteIndex: number): boolean {
  if (paletteIndex < 0) return false;
  return paletteIndex % 9 >= 4;
}

const BG_ROW1_COUNT = 8; // COLS(9) - 1(photo button)
function isBgColorProLocked(paletteIndex: number): boolean {
  if (paletteIndex < 0) return false;
  if (paletteIndex < BG_ROW1_COUNT) {
    return paletteIndex >= 3;
  }
  return (paletteIndex - BG_ROW1_COUNT) % 9 >= 4;
}

function nonProSanitize(cfg: BannerConfig): BannerConfig {
  const a = { ...cfg.appearance };
  const bg = { ...cfg.background };
  a.effectSelectedItems = a.effectSelectedItems.filter(
    (e) => !PRO_LOCKED_EFFECTS.has(e),
  );
  if (PRO_LOCKED_BG_EFFECTS.has(a.backgroundEffectPreset)) {
    a.backgroundEffectPreset = "none";
  }
  if (isTextColorProLocked(textColorPalette.indexOf(a.textSelectedColor))) {
    a.textSelectedColor = textColorPalette[0]!;
  }
  if (isBgColorProLocked(backgroundColorPalette.indexOf(bg.backgroundColor))) {
    bg.backgroundColor = backgroundColorPalette[0]!;
  }
  a.fontSize = DEFAULT_BANNER_CONFIG.appearance.fontSize;
  return { ...cfg, appearance: a, background: bg };
}

/** 입력·미리보기 공통 최대 줄 수 */
export const PREVIEW_TEXT_MAX_LINES = 3;
const PRESET_AUTOSAVE_DEBOUNCE_MS = 500;

/** 3줄 초과 시 변경 거부 (`null`) — 줄을 자르거나 합치지 않음 */
export function normalizePreviewTextMaxLines(text: string): string | null {
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length <= PREVIEW_TEXT_MAX_LINES) {
    return normalized;
  }
  return null;
}

/** appearance만 deep copy용 (배열·맵 참조 끊기) */
function dupAppearance(
  appearance: BannerConfig["appearance"],
): BannerConfig["appearance"] {
  return {
    ...appearance,
    effectSelectedItems: [...appearance.effectSelectedItems],
    effectParamValues: { ...(appearance.effectParamValues ?? {}) },
    fontByLocale: { ...(appearance.fontByLocale ?? {}) },
  };
}

function presetFromConfig(config: BannerConfig): PresetSnapshot {
  const { playOption: _p, ...contentRest } = config.content;
  return {
    content: { ...contentRest },
    appearance: dupAppearance(config.appearance),
    background: { ...config.background },
    motion: { ...config.motion },
  };
}

function configFromPreset(
  snap: PresetSnapshot,
  playOption: BannerConfig["content"]["playOption"],
): BannerConfig {
  return {
    content: {
      ...snap.content,
      playOption,
      oneLineJoinMode: normalizeOneLineJoinMode(snap.content.oneLineJoinMode),
    },
    appearance: dupAppearance(snap.appearance),
    background: { ...snap.background },
    motion: { ...snap.motion },
  };
}

const DEFAULT_BANNER_CONFIG: BannerConfig = {
  content: {
    previewText: "Welcome to LED POP!\nby Sunny",
    playOption: "multi",
    oneLineJoinMode: "space6",
    blurColor: "",
  },
  appearance: {
    font: "noto_sans_kr",
    fontByLocale: {},
    fontSize: 50,
    lineSpacing: 10,
    letterSpacing: 10,
    textSelectedColor: "#000000",
    outLine: 0,
    dropShadow: 0,
    effectSelectedItems: [],
    effectParamValues: {
      Glow: 50,
      Blink: 5,
      Blur: 0,
    },
    blurIntensity: 0,
    glowIntensity: 50,
    fontWeight: "normal",
    glowColor: "#FFD700",
    blinkSpeed: 5,
    pixelColorMix: false,
    gradientBackgroundPreset: "wave",
    backgroundEffectPreset: "none",
  },
  background: {
    backgroundColor: "#FFFFFF",
    backgroundImageUri: null,
    backgroundBlur: 0,
  },
  motion: {
    textMoveSpeed: 30,
  },
};

/** 프리셋 2~5번 초기값: 기본 설정에서 텍스트만 비운 상태 */
function blankPresetSnapshot(): PresetSnapshot {
  return {
    ...presetFromConfig(DEFAULT_BANNER_CONFIG),
    content: {
      ...presetFromConfig(DEFAULT_BANNER_CONFIG).content,
      previewText: "",
    },
  };
}

/** 저장된 JSON과 기본값을 합쳐 필드 추가·누락에도 안전하게 복원 */
function normalizePresetSlot(raw: unknown): PresetSnapshot {
  const base = DEFAULT_BANNER_CONFIG;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return presetFromConfig(base);
  }
  const o = raw as Partial<PresetSnapshot>;

  const pct =
    o.content && typeof o.content === "object" && !Array.isArray(o.content)
      ? o.content
      : {};
  const appearancePartial: Partial<BannerConfig["appearance"]> =
    o.appearance &&
    typeof o.appearance === "object" &&
    !Array.isArray(o.appearance)
      ? (o.appearance as Partial<BannerConfig["appearance"]>)
      : {};

  const legacyLineSpacing =
    typeof (appearancePartial as { lineSpacing?: unknown }).lineSpacing ===
    "number"
      ? (appearancePartial as { lineSpacing: number }).lineSpacing
      : undefined;
  const legacyLetterSpacing =
    typeof (appearancePartial as { letterSpacing?: unknown }).letterSpacing ===
    "number"
      ? (appearancePartial as { letterSpacing: number }).letterSpacing
      : undefined;

  const appearance = dupAppearance({
    ...base.appearance,
    ...appearancePartial,
    lineSpacing: legacyLineSpacing ?? base.appearance.lineSpacing,
    letterSpacing: legacyLetterSpacing ?? base.appearance.letterSpacing,
    effectSelectedItems: Array.isArray(appearancePartial.effectSelectedItems)
      ? migrateLegacyEffectItems([...appearancePartial.effectSelectedItems])
      : base.appearance.effectSelectedItems,
    effectParamValues: {
      ...base.appearance.effectParamValues,
      ...appearancePartial.effectParamValues,
    },
    fontByLocale:
      appearancePartial.fontByLocale &&
      typeof appearancePartial.fontByLocale === "object" &&
      !Array.isArray(appearancePartial.fontByLocale)
        ? { ...base.appearance.fontByLocale, ...appearancePartial.fontByLocale }
        : base.appearance.fontByLocale,
  });

  const bgPartial =
    o.background &&
    typeof o.background === "object" &&
    !Array.isArray(o.background)
      ? o.background
      : {};
  const motionPartial =
    o.motion && typeof o.motion === "object" && !Array.isArray(o.motion)
      ? o.motion
      : {};

  return presetFromConfig({
    ...base,
    content: { ...base.content, ...pct },
    appearance,
    background: { ...base.background, ...bgPartial },
    motion: { ...base.motion, ...motionPartial },
  });
}

// UI State
export type TabType = "TEXT" | "BACKGROUND" | "EFFECT";
export interface UIState {
  isPlaying: boolean;
  activeTab: TabType;
  /** 선택된 프리셋 버튼 (0~4) */
  activePreset: number;
  /**
   * 설정 화면에서 언어 전환 UI를 붙일 때 `updateUI({ appLanguage: "ko" })` 등으로 갱신해주세요.
   */
  appLanguage: AppLanguagePreference;
  proMode: number | null;
  rewardAdVisible: boolean;
  /** 현재 폰트 크기 기준으로 설정 가능한 행간 슬라이더 최댓값 */
  lineSpacingSliderMax: number;
}
//여기서 제공할 config 및 업데이트 함수 정의
interface SettingsContextValue {
  config: BannerConfig;
  ui: UIState;
  /** `appLanguage === "system"`일 때 기기 로케일, 아니면 `appLanguage`와 동일 */
  resolvedAppLocale: AppLocaleKey;
  updateConfig: <K extends keyof BannerConfig>(
    group: K,
    updates: Partial<BannerConfig[K]>,
  ) => void;
  updateUI: (updates: Partial<UIState>) => void;
  isProActive: boolean;
  activatePro: () => void;
  openRewardAdModal: () => void;
  handleTextChange: (text: string) => void;
  fontItems: { label: string; value: string }[];
  effectItems: string[];
  /** playOption은 유지된 채로 이전 슬롯을 자동 저장합니다*/
  loadPreset: (index: number) => void;
  /** 파싱 전체(디버그용). */
  sheetParseResult: GoogleSheetParseResult | null;
  sheetStringsLoading: boolean;
  sheetStringsError: Error | null;
  refetchSheetStrings: () => Promise<void>;
  /** 시트 우선, 없으면 코드 fallback */
  textSectionLabel: (key: TextSectionLabelKey) => string;
  effectSectionLabel: (key: EffectSectionLabelKey) => string;
  effectChipLabel: (effectId: string) => string;
  rewardAdLabel: (key: RewardAdLabelKey) => string;
  /**
   * 게시 CSV 행·셀 내용이 바뀔 때마다 바뀜.
   */
  sheetStringsRevision: number;
  /** 스크립트(locale)별 마지막으로 선택된 폰트 — 다른 언어 폰트 선택 시 해당 스크립트 문자의 fallback으로 사용 */
  lastFontByLocale: Partial<Record<AppLocaleKey, string>>;
}
/** content(타이핑 경로)를 제외한 나머지 — 타이핑 시 재렌더되지 않아야 하는 컴포넌트가 구독 */
type RestContextValue = Omit<SettingsContextValue, "config"> & {
  config: Omit<BannerConfig, "content">;
};
/** previewText 등 content만 담음 — 타이핑할 때만 값이 바뀜 */
interface ContentContextValue {
  content: BannerConfig["content"];
}

const RestContext = createContext<RestContextValue | null>(null);
const ContentContext = createContext<ContentContextValue | null>(null);

/**
 * content(타이핑 경로)를 구독하지 않는 훅.
 * 배경/이펙트 패널처럼 previewText와 무관한 컴포넌트는 이 훅을 사용해야
 * 타이핑할 때마다 불필요하게 재렌더되지 않습니다.
 */
export const useSettingsRest = () => {
  const ctx = useContext(RestContext);
  if (!ctx)
    throw new Error("useSettingsRest must be used within SettingsProvider");
  return ctx;
};

/**
 * 기존 호환용 통합 훅 — rest + content를 모두 구독하므로, previewText가 바뀔 때도
 * appearance/background만 바뀔 때도 재렌더됩니다. content가 실제로 필요한 컴포넌트에서만 사용해주세요.
 */
export const useSettings = (): SettingsContextValue => {
  const rest = useContext(RestContext);
  const contentCtx = useContext(ContentContext);
  if (!rest || !contentCtx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return useMemo(
    () => ({
      ...rest,
      config: { ...rest.config, content: contentCtx.content },
    }),
    [rest, contentCtx],
  );
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
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

  const [config, setConfig] = useState<BannerConfig>(DEFAULT_BANNER_CONFIG);

  const [presetSlots, setPresetSlots] = useState<PresetSnapshot[]>(() =>
    Array.from({ length: PRESET_SLOT_COUNT }, (_, i) =>
      i === 0 ? presetFromConfig(DEFAULT_BANNER_CONFIG) : blankPresetSnapshot(),
    ),
  );

  /** AsyncStorage에서 슬롯 복원 완료 전에는 자식을 마운트하지 않음(로드 전 저장·조작 레이스 방지) */
  const [presetsStorageReady, setPresetsStorageReady] = useState(false);
  /** state 커밋 전에도 “복원 완료” 여부를 동기적으로 알기 위함(저장 콜백에서 사용) */
  const presetsStorageReadyRef = useRef(false);

  const [ui, setUI] = useState<UIState>({
    isPlaying: false,
    activeTab: "TEXT",
    activePreset: 0,
    appLanguage: "system",
    proMode: null,
    rewardAdVisible: false,
    lineSpacingSliderMax: Math.floor(
      getRelLineSpacing({ requestedLineSpacingPx: 40, fontSizePercent: 100 }),
    ),
  });

  const resolvedAppLocale: AppLocaleKey =
    ui.appLanguage === "system" ? deviceAppLocale : ui.appLanguage;

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

  /** 프리셋 저장/로드 시 최신 state용 */
  const configRef = useRef(config);
  const presetSlotsRef = useRef(presetSlots);
  const activePresetRef = useRef(ui.activePreset);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    presetSlotsRef.current = presetSlots;
  }, [presetSlots]);
  useEffect(() => {
    activePresetRef.current = ui.activePreset;
  }, [ui.activePreset]);

  useEffect(() => {
    const max = Math.floor(
      getRelLineSpacing({
        requestedLineSpacingPx: 40,
        fontSizePercent: config.appearance.fontSize,
      }),
    );
    setUI((prev) =>
      prev.lineSpacingSliderMax === max
        ? prev
        : { ...prev, lineSpacingSliderMax: max },
    );
  }, [config.appearance.fontSize]);

  const isProActiveRef = useRef(false);

  useEffect(() => {
    if (!presetsStorageReadyRef.current) return;
    const timeoutId = setTimeout(() => {
      const active = activePresetRef.current;
      setPresetSlots((prev) => {
        if (active < 0 || active >= PRESET_SLOT_COUNT) return prev;
        const next = [...prev];
        next[active] = presetFromConfig(configRef.current);
        void persistPresetSlotsSnapshot(next).catch((err) => {
          if (__DEV__) console.warn("[presets] autosave persist failed", err);
        });
        return next;
      });
    }, PRESET_AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [config, ui.activePreset]);

  useEffect(() => {
    if (!presetsStorageReadyRef.current) return;
    void writeAppLanguage(ui.appLanguage).catch((err) => {
      if (__DEV__) console.warn("[settings] appLanguage persist failed", err);
    });
  }, [ui.appLanguage]);

  useEffect(() => {
    if (!presetsStorageReadyRef.current) return;
    void writeProModeExpiry(ui.proMode).catch((err) => {
      if (__DEV__) console.warn("[settings] proMode persist failed", err);
    });
  }, [ui.proMode]);

  useEffect(() => {
    let cancelled = false;
    const blankSlots = Array.from({ length: PRESET_SLOT_COUNT }, (_, i) =>
      i === 0 ? presetFromConfig(DEFAULT_BANNER_CONFIG) : blankPresetSnapshot(),
    );
    (async () => {
      try {
        let storedAppLanguage: AppLanguagePreference | null = null;
        try {
          storedAppLanguage = await readAppLanguage();
        } catch (err) {
          if (__DEV__) console.error("[settings] saved appLanguage is invalid", err);
        }

        const [raw, storedProModeExpiry] = await Promise.all([
          readPresetSlotsJson(),
          readProModeExpiry(),
        ]);
        if (cancelled) return;

        if (storedAppLanguage) {
          setUI((prev) => ({ ...prev, appLanguage: storedAppLanguage }));
        }
        if (storedProModeExpiry !== null) {
          if (Date.now() < storedProModeExpiry) {
            setUI((prev) => ({ ...prev, proMode: storedProModeExpiry }));
          } else {
            void writeProModeExpiry(null).catch(() => {});
          }
        }
        let slots = blankSlots;
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed) && parsed.length === PRESET_SLOT_COUNT) {
            slots = parsed.map((item) => normalizePresetSlot(item));
          }
        }
        setPresetSlots(slots);
        const active = activePresetRef.current;
        if (active >= 0 && active < slots.length) {
          const chosen = slots[active];
          if (chosen) {
            setConfig(
              configFromPreset(chosen, configRef.current.content.playOption),
            );
          }
        }
      } catch {
        if (!cancelled) {
          setPresetSlots(blankSlots);
          const active = activePresetRef.current;
          if (active >= 0 && active < blankSlots.length) {
            const chosen = blankSlots[active];
            if (chosen) {
              setConfig(
                configFromPreset(chosen, configRef.current.content.playOption),
              );
            }
          }
          void persistPresetSlotsSnapshot(blankSlots).catch((err) => {
            if (__DEV__)
              console.warn("[presets] persist after load error", err);
          });
        }
      } finally {
        if (!cancelled) {
          presetsStorageReadyRef.current = true;
          setPresetsStorageReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // config 업데이트 함수
  const updateConfig = useCallback(
    <K extends keyof BannerConfig>(
      group: K,
      updates: Partial<BannerConfig[K]>,
    ) => {
      setConfig((prev) => {
        const keys = Object.keys(updates) as (keyof BannerConfig[K])[];
        if (keys.every((key) =>
          Object.prototype.hasOwnProperty.call(prev[group], key) &&
          Object.is(prev[group][key], updates[key]),
        )) return prev;
        return { ...prev, [group]: { ...prev[group], ...updates } };
      });
    },
    [],
  );

  const updateUI = useCallback((updates: Partial<UIState>) => {
    setUI((prev) => {
      const keys = Object.keys(updates) as (keyof UIState)[];
      if (keys.every((key) =>
        Object.prototype.hasOwnProperty.call(prev, key) &&
        Object.is(prev[key], updates[key]),
      )) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  //Preset 불러올 시 pro mode에 따른  적용
  const isProActive = ui.proMode !== null && Date.now() < ui.proMode;
  const prevIsProActiveRef = useRef(isProActive);
  useEffect(() => {
    const prev = prevIsProActiveRef.current;
    prevIsProActiveRef.current = isProActive;
    isProActiveRef.current = isProActive;
    if (prev && !isProActive) {
      setConfig((current) => nonProSanitize(current));
      if (activePresetRef.current >= 1) {
        loadPreset(0);
      }
    }
  }, [isProActive]);

  const activatePro = useCallback(() => {
    setUI((prev) => ({ ...prev, proMode: Date.now() + 2 * 60 * 60 * 1000 }));
  }, []);

  const openRewardAdModal = useCallback(() => {
    setUI((prev) => ({ ...prev, rewardAdVisible: true }));
  }, []);

  useEffect(() => {
    if (ui.proMode === null) return;
    const remaining = ui.proMode - Date.now();
    if (remaining <= 0) {
      setUI((prev) => ({ ...prev, proMode: null }));
      return;
    }
    const id = setTimeout(() => {
      setUI((prev) => ({ ...prev, proMode: null }));
    }, remaining);
    return () => clearTimeout(id);
  }, [ui.proMode]);

  const handleTextChange = useCallback(
    (text: string) => {
      const next = normalizePreviewTextMaxLines(text);
      if (next === null) return;
      if (next === configRef.current.content.previewText) return;
      updateConfig("content", { previewText: next });
    },
    [updateConfig],
  );

  const loadPreset = useCallback((slot: number) => {
    if (slot < 0 || slot >= PRESET_SLOT_COUNT) return;

    const cfg = configRef.current;
    const prev = activePresetRef.current;
    const slots = [...presetSlotsRef.current];

    if (prev !== slot) {
      slots[prev] = presetFromConfig(cfg);
    }

    const chosen = slots[slot];
    if (!chosen) return;

    if (presetsStorageReadyRef.current) {
      void persistPresetSlotsSnapshot(slots).catch((err) => {
        if (__DEV__) console.warn("[presets] loadPreset persist failed", err);
      });
    }
    setPresetSlots(slots);
    const raw = configFromPreset(chosen, cfg.content.playOption);
    const nextConfig = isProActiveRef.current ? raw : nonProSanitize(raw);
    setConfig(nextConfig);
    setUI((u) => ({ ...u, activePreset: slot }));
  }, []);

  useEffect(() => {
    const normalizedFont = normalizeFontId(config.appearance.font);
    const isPixelActive = hasPixelLedEffect(
      config.appearance.effectSelectedItems,
    );
    const pixelFontOk =
      isPixelActive &&
      normalizedFont === getPixelFontIdForLocale(resolvedAppLocale);
    if (
      normalizedFont &&
      (!isFontHiddenFromPicker(normalizedFont) || pixelFontOk)
    ) {
      if (config.appearance.font !== normalizedFont) {
        setConfig((prev) => ({
          ...prev,
          appearance: { ...prev.appearance, font: normalizedFont },
        }));
      }
      return;
    }

    setConfig((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        font: getDefaultForLocale(resolvedAppLocale),
      },
    }));
  }, [
    config.appearance.font,
    config.appearance.effectSelectedItems,
    resolvedAppLocale,
  ]);

  /** locale별 마지막으로 선택한 폰트 저장 */
  useEffect(() => {
    if (!fontBelongsToLocale(config.appearance.font, resolvedAppLocale)) return;
    if (
      config.appearance.fontByLocale[resolvedAppLocale] ===
      config.appearance.font
    )
      return;
    setConfig((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        fontByLocale: {
          ...prev.appearance.fontByLocale,
          [resolvedAppLocale]: prev.appearance.font,
        },
      },
    }));
  }, [
    config.appearance.font,
    config.appearance.fontByLocale,
    resolvedAppLocale,
  ]);

  /** 앱 언어가 바뀌면, 현재 폰트가 그 언어 폰트가 아닐 시 해당 언어에서 마지막으로 쓰던 폰트(없으면 기본값)로 전환 */
  useEffect(() => {
    const isPixelActive = hasPixelLedEffect(
      config.appearance.effectSelectedItems,
    );
    if (isPixelActive) return;
    if (fontBelongsToLocale(config.appearance.font, resolvedAppLocale)) return;
    const nextFont =
      config.appearance.fontByLocale[resolvedAppLocale] ??
      getDefaultForLocale(resolvedAppLocale);
    if (nextFont === config.appearance.font) return;
    setConfig((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, font: nextFont },
    }));
  }, [
    resolvedAppLocale,
    config.appearance.effectSelectedItems,
    config.appearance.font,
    config.appearance.fontByLocale,
  ]);

  /** 픽셀폰트용 */
  useEffect(() => {
    const isPixelActive = hasPixelLedEffect(
      config.appearance.effectSelectedItems,
    );
    const pixelFontId = getPixelFontIdForLocale(resolvedAppLocale);
    if (!isPixelActive || config.appearance.font === pixelFontId) {
      return;
    }
    setConfig((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        font: pixelFontId,
      },
    }));
  }, [
    config.appearance.effectSelectedItems,
    config.appearance.font,
    resolvedAppLocale,
  ]);

  useEffect(() => {
    if (supportsBold(config.appearance.font)) return;

    setConfig((prev) => {
      const needsFontWeight = prev.appearance.fontWeight === "bold";
      const needsEffectItems =
        prev.appearance.effectSelectedItems.includes("Bold");
      if (!needsFontWeight && !needsEffectItems) return prev;

      return {
        ...prev,
        appearance: {
          ...prev.appearance,
          fontWeight: "normal",
          effectSelectedItems: prev.appearance.effectSelectedItems.filter(
            (e) => e !== "Bold",
          ),
        },
      };
    });
  }, [config.appearance.font]);

  // font select state
  const fontItems = useMemo(
    () => getFontItemsForLocale(resolvedAppLocale),
    [resolvedAppLocale],
  );
  // effect items list
  const effectItems = useMemo(() => {
    const items = ["Bold", "Blink", "Pixel", "Glow", "Gradient"];
    const isPixelMode = config.appearance.effectSelectedItems.includes("Pixel");
    if (!supportsBold(config.appearance.font) && !isPixelMode) {
      return items.filter((e) => e !== "Bold");
    }
    return items;
  }, [config.appearance.font, config.appearance.effectSelectedItems]);
  // content는 별도 Context로 분리 — previewText 등이 바뀌어도 이쪽(appearance/background/motion/ui)
  // 구독하는 곳은 재렌더되지 않아야 함 ***성능
  const restConfig = useMemo(
    () => ({
      appearance: config.appearance,
      background: config.background,
      motion: config.motion,
    }),
    [config.appearance, config.background, config.motion],
  );

  const restValue = useMemo(
    () => ({
      config: restConfig,
      ui,
      resolvedAppLocale,
      updateConfig,
      updateUI,
      isProActive,
      activatePro,
      openRewardAdModal,
      handleTextChange,
      fontItems,
      effectItems,
      loadPreset,
      sheetParseResult,
      sheetStringsLoading,
      sheetStringsError,
      refetchSheetStrings,
      textSectionLabel,
      effectSectionLabel,
      effectChipLabel,
      rewardAdLabel,
      sheetStringsRevision,
      lastFontByLocale: restConfig.appearance.fontByLocale,
    }),
    [
      restConfig,
      ui,
      resolvedAppLocale,
      updateConfig,
      updateUI,
      isProActive,
      activatePro,
      openRewardAdModal,
      handleTextChange,
      fontItems,
      effectItems,
      loadPreset,
      sheetParseResult,
      sheetStringsLoading,
      sheetStringsError,
      refetchSheetStrings,
      textSectionLabel,
      effectSectionLabel,
      effectChipLabel,
      rewardAdLabel,
      sheetStringsRevision,
    ],
  );

  const contentValue = useMemo(
    () => ({ content: config.content }),
    [config.content],
  );

  return (
    <RestContext.Provider value={restValue}>
      <ContentContext.Provider value={contentValue}>
        {presetsStorageReady ? children : null}
      </ContentContext.Provider>
    </RestContext.Provider>
  );
}
