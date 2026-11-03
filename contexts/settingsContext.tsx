import { AppState } from "react-native";
import type { StorageStartupState } from "./startupContext";
import { usePresetPersistence } from "./settings/usePresetPersistence";
import { useSettingsLocalization } from "./settings/useSettingsLocalization";
import {
  type BannerConfig, DEFAULT_BANNER_CONFIG, normalizePreviewTextMaxLines, nonProSanitize,
} from "./settings/presetModel";
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
  type AppLanguagePreference,
  type AppLocaleKey,
} from "@/constants/language";
import {
  hasPixelLedEffect,
} from "@/constants/pixelLed";
import type { GoogleSheetParseResult } from "@/hooks/useGoogleSheets";
import type { EffectSectionLabelKey } from "@/language/effectSectionLabels";
import type { RewardAdLabelKey } from "@/language/rewardAdLabels";

import type { TextSectionLabelKey } from "@/language/textSectionLabels";

import { usePremium } from "@/contexts/premiumContext";
import { writeProModeExpiry, PRO_REWARD_DURATION_MS } from "@/utils/proModeStorage";
import { getRelLineSpacing } from "@/utils/textSizing";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Preserve existing consumer imports while keeping pure settings rules independent.
export { type BannerConfig, type PresetSnapshot, PRESET_SLOT_COUNT,
  PREVIEW_TEXT_MAX_LINES, normalizePreviewTextMaxLines } from "./settings/presetModel";

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
// UI State
export type TabType = "TEXT" | "BACKGROUND" | "EFFECT";
interface UIState {
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
// Settings values are split by change frequency so unrelated updates do not
// invalidate every consumer.
interface SettingsContextValue {
  config: BannerConfig;
  ui: UIState;
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
  loadPreset: (index: number) => void;
  sheetParseResult: GoogleSheetParseResult | null;
  sheetStringsLoading: boolean;
  sheetStringsError: Error | null;
  refetchSheetStrings: () => Promise<void>;
  textSectionLabel: (key: TextSectionLabelKey) => string;
  effectSectionLabel: (key: EffectSectionLabelKey) => string;
  effectChipLabel: (effectId: string) => string;
  rewardAdLabel: (key: RewardAdLabelKey) => string;
  sheetStringsRevision: number;
  lastFontByLocale: Partial<Record<AppLocaleKey, string>>;
}

type RestContextValue = Omit<SettingsContextValue, "config"> & {
  config: Omit<BannerConfig, "content">;
};

interface AppearanceContextValue {
  appearance: BannerConfig["appearance"];
  fontItems: { label: string; value: string }[];
  effectItems: string[];
  lastFontByLocale: Partial<Record<AppLocaleKey, string>>;
}
interface BackgroundContextValue {
  background: BannerConfig["background"];
}
interface MotionContextValue {
  motion: BannerConfig["motion"];
}
interface ContentContextValue {
  content: BannerConfig["content"];
}
interface UIContextValue {
  ui: UIState;
  isProActive: boolean;
}
interface LocalizationContextValue {
  resolvedAppLocale: AppLocaleKey;
  sheetParseResult: GoogleSheetParseResult | null;
  sheetStringsLoading: boolean;
  sheetStringsError: Error | null;
  refetchSheetStrings: () => Promise<void>;
  textSectionLabel: (key: TextSectionLabelKey) => string;
  effectSectionLabel: (key: EffectSectionLabelKey) => string;
  effectChipLabel: (effectId: string) => string;
  rewardAdLabel: (key: RewardAdLabelKey) => string;
  sheetStringsRevision: number;
}
interface SettingsActionsContextValue {
  updateConfig: SettingsContextValue["updateConfig"];
  updateUI: SettingsContextValue["updateUI"];
  activatePro: () => void;
  openRewardAdModal: () => void;
  handleTextChange: (text: string) => void;
  loadPreset: (index: number) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);
const BackgroundContext = createContext<BackgroundContextValue | null>(null);
const MotionContext = createContext<MotionContextValue | null>(null);
const ContentContext = createContext<ContentContextValue | null>(null);
const UIContext = createContext<UIContextValue | null>(null);
const LocalizationContext = createContext<LocalizationContextValue | null>(null);
const SettingsActionsContext =
  createContext<SettingsActionsContextValue | null>(null);

function useRequiredContext<T>(
  context: React.Context<T | null>,
  hookName: string,
): T {
  const value = useContext(context);
  if (!value) {
    throw new Error(`${hookName} must be used within SettingsProvider`);
  }
  return value;
}

export const useSettingsAppearance = () => {
  const value = useRequiredContext(AppearanceContext, "useSettingsAppearance");
  const { updateConfig } = useRequiredContext(
    SettingsActionsContext,
    "useSettingsAppearance",
  );
  return useMemo(() => ({ ...value, updateConfig }), [value, updateConfig]);
};

export const useSettingsBackground = () => {
  const value = useRequiredContext(BackgroundContext, "useSettingsBackground");
  const { updateConfig } = useRequiredContext(
    SettingsActionsContext,
    "useSettingsBackground",
  );
  return useMemo(() => ({ ...value, updateConfig }), [value, updateConfig]);
};

export const useSettingsMotion = () => {
  const value = useRequiredContext(MotionContext, "useSettingsMotion");
  const { updateConfig } = useRequiredContext(
    SettingsActionsContext,
    "useSettingsMotion",
  );
  return useMemo(() => ({ ...value, updateConfig }), [value, updateConfig]);
};

export const useSettingsContent = () => {
  const value = useRequiredContext(ContentContext, "useSettingsContent");
  const { updateConfig, handleTextChange } = useRequiredContext(
    SettingsActionsContext,
    "useSettingsContent",
  );
  return useMemo(
    () => ({ ...value, updateConfig, handleTextChange }),
    [value, updateConfig, handleTextChange],
  );
};

export const useSettingsUI = () => {
  const value = useRequiredContext(UIContext, "useSettingsUI");
  const {
    updateUI,
    activatePro,
    openRewardAdModal,
    loadPreset,
  } = useRequiredContext(SettingsActionsContext, "useSettingsUI");
  return useMemo(
    () => ({
      ...value,
      updateUI,
      activatePro,
      openRewardAdModal,
      loadPreset,
    }),
    [value, updateUI, activatePro, openRewardAdModal, loadPreset],
  );
};

export const useSettingsLocalizationContext = () =>
  useRequiredContext(LocalizationContext, "useSettingsLocalizationContext");

/**
 * Compatibility hook for existing consumers that need several settings groups.
 * Prefer the domain hooks above for focused consumers.
 */
const useSettingsRest = (): RestContextValue => {
  const appearance = useRequiredContext(AppearanceContext, "useSettingsRest");
  const background = useRequiredContext(BackgroundContext, "useSettingsRest");
  const motion = useRequiredContext(MotionContext, "useSettingsRest");
  const ui = useRequiredContext(UIContext, "useSettingsRest");
  const localization = useRequiredContext(
    LocalizationContext,
    "useSettingsRest",
  );
  const actions = useRequiredContext(SettingsActionsContext, "useSettingsRest");

  return useMemo(
    () => ({
      ...actions,
      ...localization,
      ui: ui.ui,
      isProActive: ui.isProActive,
      fontItems: appearance.fontItems,
      effectItems: appearance.effectItems,
      lastFontByLocale: appearance.lastFontByLocale,
      config: {
        appearance: appearance.appearance,
        background: background.background,
        motion: motion.motion,
      },
    }),
    [actions, localization, ui, appearance, background, motion],
  );
};

export const useSettings = (): SettingsContextValue => {
  const rest = useSettingsRest();
  const { content } = useRequiredContext(ContentContext, "useSettings");
  return useMemo(
    () => ({
      ...rest,
      config: { ...rest.config, content },
    }),
    [rest, content],
  );
};

export function SettingsProvider({ children, onStartupStateChange }: {
  children: React.ReactNode;
  onStartupStateChange: (state: StorageStartupState) => void;
}) {
  const { isPremium, entitlement } = usePremium();
  const [config, setConfig] = useState<BannerConfig>(DEFAULT_BANNER_CONFIG);

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

  const {
    resolvedAppLocale, sheetParseResult, sheetStringsLoading, sheetStringsError,
    refetchSheetStrings, sheetStringsRevision, textSectionLabel,
    effectSectionLabel, effectChipLabel, rewardAdLabel,
  } = useSettingsLocalization(ui.appLanguage);
  /** 프리셋 저장/로드 시 최신 state용 */
  const configRef = useRef(config);
  const activePresetRef = useRef(ui.activePreset);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    activePresetRef.current = ui.activePreset;
  }, [ui.activePreset]);

  const lineSpacingMax = Math.floor(getRelLineSpacing({
    requestedLineSpacingPx: 40, fontSizePercent: config.appearance.fontSize,
  }));
  if (ui.lineSpacingSliderMax !== lineSpacingMax) {
    setUI({ ...ui, lineSpacingSliderMax: lineSpacingMax });
  }

  const isProActiveRef = useRef(false);

  const applyRestoredPreferences = useCallback((
    storedAppLanguage: AppLanguagePreference | null,
    storedProModeExpiry: number | null,
  ) => {
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
  }, []);

  const { presetsStorageReady, storageLoadFailed, retryStorage, selectPreset } = usePresetPersistence({
    config, configRef, setConfig, activePreset: ui.activePreset, activePresetRef,
    appLanguage: ui.appLanguage, proMode: ui.proMode, applyRestoredPreferences,
  });

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

  const loadPreset = useCallback((slot: number) => {
    const raw = selectPreset(slot);
    if (!raw) return;
    const nextConfig = isProActiveRef.current ? raw : nonProSanitize(raw);
    setConfig(nextConfig);
    setUI((u) => ({ ...u, activePreset: slot }));
  }, [selectPreset]);

  //Preset 불러올 시 pro mode에 따른  적용
  const [proClock, setProClock] = useState(() => Date.now());
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const now = Date.now();
      setProClock(now);
      setUI((previous) => previous.proMode !== null && previous.proMode <= now
        ? { ...previous, proMode: null } : previous);
    });
    return () => subscription.remove();
  }, []);
  const isProActive = isPremium || (ui.proMode !== null && proClock < ui.proMode);
  const prevIsProActiveRef = useRef(isProActive);
  useEffect(() => {
    const prev = prevIsProActiveRef.current;
    // A failed ownership query must not erase the last Pro configuration.
    if (entitlement !== "unknown" || isProActive) prevIsProActiveRef.current = isProActive;
    isProActiveRef.current = isProActive;
    if (prev && !isProActive && entitlement === "free") {
      setConfig((current) => nonProSanitize(current));
      if (activePresetRef.current >= 1) {
        loadPreset(0);
      }
    }
  }, [isProActive, entitlement, loadPreset]);

  const activatePro = useCallback(() => {
    setUI((prev) => ({ ...prev, proMode: Date.now() + PRO_REWARD_DURATION_MS }));
  }, []);

  const openRewardAdModal = useCallback(() => {
    if (isPremium) return;
    setUI((prev) => ({ ...prev, rewardAdVisible: true }));
  }, [isPremium]);

  if (isPremium && ui.rewardAdVisible) setUI({ ...ui, rewardAdVisible: false });

  useEffect(() => {
    if (ui.proMode === null) return;
    const now = Date.now();
    // Synchronize a persisted entitlement deadline with the external clock.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProClock(now);
    const remaining = ui.proMode - now;
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


  // Approved font/locale/bold synchronization: update only when the resolved values differ.
  const appearance = config.appearance;
  const pixelActive = hasPixelLedEffect(appearance.effectSelectedItems);
  const pixelFont = getPixelFontIdForLocale(resolvedAppLocale);
  let nextFont = normalizeFontId(appearance.font);
  if (!nextFont || (isFontHiddenFromPicker(nextFont) && !(pixelActive && nextFont === pixelFont))) {
    nextFont = getDefaultForLocale(resolvedAppLocale);
  }
  if (pixelActive) nextFont = pixelFont;
  else if (!fontBelongsToLocale(nextFont, resolvedAppLocale)) {
    const remembered = normalizeFontId(appearance.fontByLocale[resolvedAppLocale] ?? "");
    nextFont = remembered && fontBelongsToLocale(remembered, resolvedAppLocale) && !isFontHiddenFromPicker(remembered)
      ? remembered : getDefaultForLocale(resolvedAppLocale);
  }
  const removeBold = !supportsBold(nextFont) &&
    (appearance.fontWeight === "bold" || appearance.effectSelectedItems.includes("Bold"));
  const rememberFont = fontBelongsToLocale(nextFont, resolvedAppLocale) &&
    appearance.fontByLocale[resolvedAppLocale] !== nextFont;
  if (appearance.font !== nextFont || removeBold || rememberFont) {
    setConfig({ ...config, appearance: { ...appearance, font: nextFont,
      ...(removeBold ? { fontWeight: "normal", effectSelectedItems: appearance.effectSelectedItems.filter(e => e !== "Bold") } : {}),
      ...(rememberFont ? { fontByLocale: { ...appearance.fontByLocale, [resolvedAppLocale]: nextFont } } : {}),
    } });
  }

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
  const appearanceValue = useMemo<AppearanceContextValue>(
    () => ({
      appearance: config.appearance,
      fontItems,
      effectItems,
      lastFontByLocale: config.appearance.fontByLocale,
    }),
    [config.appearance, fontItems, effectItems],
  );
  const backgroundValue = useMemo<BackgroundContextValue>(
    () => ({ background: config.background }),
    [config.background],
  );
  const motionValue = useMemo<MotionContextValue>(
    () => ({ motion: config.motion }),
    [config.motion],
  );
  const contentValue = useMemo<ContentContextValue>(
    () => ({ content: config.content }),
    [config.content],
  );
  const uiValue = useMemo<UIContextValue>(
    () => ({ ui, isProActive }),
    [ui, isProActive],
  );
  const localizationValue = useMemo<LocalizationContextValue>(
    () => ({
      resolvedAppLocale,
      sheetParseResult,
      sheetStringsLoading,
      sheetStringsError,
      refetchSheetStrings,
      textSectionLabel,
      effectSectionLabel,
      effectChipLabel,
      rewardAdLabel,
      sheetStringsRevision,
    }),
    [
      resolvedAppLocale,
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
  const actionsValue = useMemo<SettingsActionsContextValue>(
    () => ({
      updateConfig,
      updateUI,
      activatePro,
      openRewardAdModal,
      handleTextChange,
      loadPreset,
    }),
    [
      updateConfig,
      updateUI,
      activatePro,
      openRewardAdModal,
      handleTextChange,
      loadPreset,
    ],
  );

  useEffect(() => {
    onStartupStateChange({ ready: presetsStorageReady, failed: storageLoadFailed,
      locale: resolvedAppLocale, retry: retryStorage });
  }, [presetsStorageReady, storageLoadFailed, resolvedAppLocale, retryStorage, onStartupStateChange]);

  return (
    <SettingsActionsContext.Provider value={actionsValue}>
      <LocalizationContext.Provider value={localizationValue}>
        <UIContext.Provider value={uiValue}>
          <MotionContext.Provider value={motionValue}>
            <BackgroundContext.Provider value={backgroundValue}>
              <AppearanceContext.Provider value={appearanceValue}>
                <ContentContext.Provider value={contentValue}>
                  {presetsStorageReady ? children : null}
                </ContentContext.Provider>
              </AppearanceContext.Provider>
            </BackgroundContext.Provider>
          </MotionContext.Provider>
        </UIContext.Provider>
      </LocalizationContext.Provider>
    </SettingsActionsContext.Provider>
  );
}
