import type { AppLocaleKey } from "@/constants/language";
import type { SpeechBubblePresetId } from "@/constants/speechBubblePresets";
import { backgroundColorPalette, textColorPalette } from "@/constants/colorPalette";
import { migrateLegacyEffectItems } from "@/constants/pixelLed";
import { normalizeOneLineJoinMode, type OneLineJoinMode } from "@/utils/viewMode";
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
  "nameBg",
  "locationBg",
  "todayBg",
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

export function nonProSanitize(cfg: BannerConfig): BannerConfig {
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
export const PRESET_AUTOSAVE_DEBOUNCE_MS = 500;

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

export function presetFromConfig(config: BannerConfig): PresetSnapshot {
  const { playOption: _p, ...contentRest } = config.content;
  return {
    content: { ...contentRest },
    appearance: dupAppearance(config.appearance),
    background: { ...config.background },
    motion: { ...config.motion },
  };
}

export function configFromPreset(
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

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
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
export function blankPresetSnapshot(): PresetSnapshot {
  return {
    ...presetFromConfig(DEFAULT_BANNER_CONFIG),
    content: {
      ...presetFromConfig(DEFAULT_BANNER_CONFIG).content,
      previewText: "",
    },
  };
}

/** 저장된 JSON과 기본값을 합쳐 필드 추가·누락에도 안전하게 복원 */
export function normalizePresetSlot(raw: unknown): PresetSnapshot {
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

