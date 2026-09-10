import { useSettingsLocalization } from "./settings/useSettingsLocalization";
import {
  type BannerConfig, type PresetSnapshot, PRESET_SLOT_COUNT, DEFAULT_BANNER_CONFIG,
  PRESET_AUTOSAVE_DEBOUNCE_MS, normalizePreviewTextMaxLines, nonProSanitize,
  presetFromConfig, configFromPreset, blankPresetSnapshot, normalizePresetSlot,
} from "./settings/presetModel";
// Preserve existing consumer imports while keeping pure settings rules independent.
export { type BannerConfig, type PresetSnapshot, PRESET_SLOT_COUNT,
  PREVIEW_TEXT_MAX_LINES, normalizePreviewTextMaxLines } from "./settings/presetModel";
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
import { readAppLanguage, writeAppLanguage } from "@/utils/appLanguageStorage";

import {
  persistPresetSlotsSnapshot,
  readPresetSlotsJson,
} from "@/utils/presetStorage";
import { readProModeExpiry, writeProModeExpiry } from "@/utils/proModeStorage";
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
  const { isPremium, entitlement } = usePremium();
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

  const {
    resolvedAppLocale, sheetParseResult, sheetStringsLoading, sheetStringsError,
    refetchSheetStrings, sheetStringsRevision, textSectionLabel,
    effectSectionLabel, effectChipLabel, rewardAdLabel,
  } = useSettingsLocalization(ui.appLanguage);
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
  const isProActive = isPremium || (ui.proMode !== null && Date.now() < ui.proMode);
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
  }, [isProActive, entitlement]);

  const activatePro = useCallback(() => {
    setUI((prev) => ({ ...prev, proMode: Date.now() + 2 * 60 * 60 * 1000 }));
  }, []);

  const openRewardAdModal = useCallback(() => {
    if (isPremium) return;
    setUI((prev) => ({ ...prev, rewardAdVisible: true }));
  }, [isPremium]);

  useEffect(() => {
    if (isPremium) updateUI({ rewardAdVisible: false });
  }, [isPremium, updateUI]);

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
