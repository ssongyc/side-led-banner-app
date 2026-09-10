import { SIGN_BOARD_TEXT_LAYOUT } from "@/constants/signBoardPresets";
import { isSpeechBubblePreset } from "@/constants/speechBubblePresets";
import { countRows } from "@/utils/skiaBubbleTextLayout";
import {
  maxFontSizeForAvailableHeight,
  skiaTextBlockHeightPx,
} from "@/utils/skiaTextBlockMetrics";

export const SKIA_BLOCK_HEIGHT_SAFETY_PX = 2;

export type SkiaFontProbe = {
  rowHeightPxAtProbe: number;
  probeFontSize: number;
};

export const FONT_SIZE_MIN = 20;
export const FONT_SIZE_MAX = 100;
const PREVIEW_VERTICAL_TEXT_PADDING = {
  default: 0,
  speechBg1: 12,
  speechBg2: 24,
  nameBg: 0,
  locationBg: 0,
  todayBg: 0,
} as const;
/** Speech BG 없을 때: 뷰포트 세로 대비 텍스트 영역 비율 */
export const DEFAULT_MAX_TEXT_HEIGHT_RATIO = {
  portrait: 0.5,
  landscape: 1,
} as const;

/**
 * 말풍선 원본 아트보드(px) 기준 텍스트 박스 layout.
 * landscape 전체화면: top·height = viewportHeight × 비율
 */
export const SPEECH_BG_TEXT_LAYOUT = {
  nameBg: SIGN_BOARD_TEXT_LAYOUT,
  locationBg: SIGN_BOARD_TEXT_LAYOUT,
  todayBg: SIGN_BOARD_TEXT_LAYOUT,
  speechBg1: {
    portrait: {
      /** 393px 아트보드 — landscape와 동일 상단 64px 이후 텍스트 영역 */
      textHeightRatio: 264.5 / 393,
      topOffsetRatio: 64 / 393,
    },
    landscape: {
      /** 393px 중 텍스트 264.5px, 위 64px / 아래 64.5px */
      textHeightRatio: 264.5 / 393,
      topOffsetRatio: 64 / 393,
    },
  },
  speechBg2: {
    portrait: {
      /** 852px 말풍선 바디 y=20~759(center=45.7%), textHeight 0.751 기준 중앙정렬 offset = 70/852 */
      textHeightRatio: 389 / 518,
      topOffsetRatio: 70 / 852 as number | null,
    },
    landscape: {
      /** 538px 말풍선 바디 y=20~448(height=428), 위 20px / 아래 90px */
      textHeightRatio: 385 / 518,
      topOffsetRatio: 28 / 518,
    },
  },
} as const;

type SpeechBubbleId = keyof typeof SPEECH_BG_TEXT_LAYOUT;

function getSpeechTextLayout(
  speechBubbleId: SpeechBubbleId,
  isPortrait: boolean,
) {
  return isPortrait
    ? SPEECH_BG_TEXT_LAYOUT[speechBubbleId].portrait
    : SPEECH_BG_TEXT_LAYOUT[speechBubbleId].landscape;
}

function getSpeechBubbleId(effectId: string): SpeechBubbleId | null {
  return isSpeechBubblePreset(effectId) ? effectId : null;
}

export function resolveFullscreenMaxHeight(params: {
  effectId: string;
  isPortrait: boolean;
  viewportHeight: number;
}): number {
  const { effectId, isPortrait, viewportHeight } = params;
  const height = Math.max(1, viewportHeight);
  const speechBubbleId = getSpeechBubbleId(effectId);
  const ratio =
    speechBubbleId == null
      ? isPortrait
        ? DEFAULT_MAX_TEXT_HEIGHT_RATIO.portrait
        : DEFAULT_MAX_TEXT_HEIGHT_RATIO.landscape
      : getSpeechTextLayout(speechBubbleId, isPortrait).textHeightRatio;
  return Math.max(1, Math.floor(height * ratio));
}

/** landscape 등: 원본 top 비율. null이면 preset `yOffset`(중앙+translateY) 사용 */
export function resolveSpeechTextTopOffset(params: {
  effectId: string;
  isPortrait: boolean;
  viewportHeight: number;
}): number | null {
  const { effectId, isPortrait, viewportHeight } = params;
  const speechBubbleId = getSpeechBubbleId(effectId);
  if (speechBubbleId == null) return null;
  const topOffsetRatio = getSpeechTextLayout(speechBubbleId, isPortrait).topOffsetRatio;
  if (topOffsetRatio == null) return null;
  return Math.max(0, Math.floor(Math.max(1, viewportHeight) * topOffsetRatio));
}

export function getSizingPolicy(params: { effectId: string }) {
  const { effectId } = params;
  const speechBubbleId = getSpeechBubbleId(effectId);
  const previewPadding =
    speechBubbleId == null
      ? PREVIEW_VERTICAL_TEXT_PADDING.default
      : PREVIEW_VERTICAL_TEXT_PADDING[speechBubbleId];
  return {
    speechBubbleId,
    previewLineHeightRatio: 1.2,
    fullscreenLineHeightRatio: 1.16,
    speechTextHeightPadding: 24,
    portraitFontBoost: 0.8,
    previewPadding,
    clampByMaxHeight: true,
  };
}

export function getRelLineSpacing(params: {
  requestedLineSpacingPx: number;
  fontSizePercent: number;
}) {
  const { requestedLineSpacingPx, fontSizePercent } = params;
  const requested = Math.max(0, requestedLineSpacingPx);
  const clampedFontSize = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, fontSizePercent));
  const t = (clampedFontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN);
  return requested * (1 - t);
}

function resolveMaxFontSizeForBox(params: {
  availableHeight: number;
  lineCount: number;
  lineHeightRatio: number;
  lineSpacingPx: number | undefined;
  skiaFontProbe?: SkiaFontProbe;
  interLineGapPx?: number;
}): number {
  const {
    availableHeight,
    lineCount,
    lineHeightRatio,
    lineSpacingPx,
    skiaFontProbe,
    interLineGapPx = 0,
  } = params;

  const safeHeight = Math.max(
    1,
    availableHeight - SKIA_BLOCK_HEIGHT_SAFETY_PX,
  );

  const ratioMax = Math.max(
    1,
    lineSpacingPx == null
      ? Math.floor(safeHeight / (lineHeightRatio * lineCount))
      : Math.floor(
          (safeHeight - interLineGapPx * Math.max(0, lineCount - 1)) /
            (lineHeightRatio * lineCount),
        ),
  );

  if (!skiaFontProbe) {
    return ratioMax;
  }

  const skiaMax = maxFontSizeForAvailableHeight({
    rowHeightPxAtProbe: skiaFontProbe.rowHeightPxAtProbe,
    probeFontSize: skiaFontProbe.probeFontSize,
    lineCount,
    lineGapPx: interLineGapPx,
    availableHeightPx: safeHeight,
  });

  return Math.min(ratioMax, skiaMax);
}

function fontSizeFromSliderPercent(params: {
  maxFontSizeForBox: number;
  sizePct: number;
}): number {
  const { maxFontSizeForBox, sizePct } = params;
  const clampedPct = Math.max(
    FONT_SIZE_MIN,
    Math.min(FONT_SIZE_MAX, sizePct),
  );
  return Math.max(
    1,
    Math.min(
      maxFontSizeForBox,
      Math.floor(maxFontSizeForBox * (clampedPct / FONT_SIZE_MAX)),
    ),
  );
}

export function getPreviewTextMetrics(params: {
  previewHeight: number;
  fontSizePercent?: number;
  playOption: "one" | "multi";
  text: string;
  padding?: number;
  lineHeightRatio?: number;
  lineSpacingPx?: number;
  maxLines?: number;
  fallbackFontSize?: number;
  skiaFontProbe?: SkiaFontProbe;
}) {
  const {
    previewHeight,
    fontSizePercent,
    playOption,
    text,
    padding = 0,
    lineHeightRatio = 1.2,
    lineSpacingPx,
    maxLines = 3,
    fallbackFontSize = 100,
    skiaFontProbe,
  } = params;

  if (previewHeight === 0) {
    return { lineCount: 1, fontSize: fallbackFontSize, height: fallbackFontSize };
  }
  const lineCount = countRows(text, playOption, maxLines);
  const availableHeight = Math.max(1, previewHeight - padding);
  const requestedLineSpacingPx = Math.max(0, lineSpacingPx ?? 0);
  const effectiveLineHeightRatio = lineHeightRatio;

  const sliderPct = fontSizePercent ?? FONT_SIZE_MAX;

  if (lineSpacingPx == null) {
    const maxFontSizeForBox = resolveMaxFontSizeForBox({
      availableHeight,
      lineCount,
      lineHeightRatio: effectiveLineHeightRatio,
      lineSpacingPx: undefined,
      skiaFontProbe,
    });
    const fontSize = fontSizeFromSliderPercent({
      maxFontSizeForBox,
      sizePct: sliderPct,
    });
    const rawH = computeRawTextBlockHeight({
      fontSize,
      lineCount,
      lineHeightRatio: effectiveLineHeightRatio,
      interLineGapPx: 0,
      padding,
      skiaFontProbe,
    });
    const fillBox = sliderPct >= FONT_SIZE_MAX;
    const height = fillBox ? previewHeight : rawH;
    return { lineCount, fontSize, height };
  }

  const maxFontSizeForBoxInitial = resolveMaxFontSizeForBox({
    availableHeight,
    lineCount,
    lineHeightRatio: effectiveLineHeightRatio,
    lineSpacingPx,
    skiaFontProbe,
    interLineGapPx: 0,
  });
  let fontSize = fontSizeFromSliderPercent({
    maxFontSizeForBox: maxFontSizeForBoxInitial,
    sizePct: sliderPct,
  });

  let lineBodyPx = fontSize * effectiveLineHeightRatio * lineCount;
  let gapBudgetPx = Math.max(0, availableHeight - lineBodyPx);
  let interLineGapPx =
    lineCount > 1
      ? Math.min(
          requestedLineSpacingPx,
          Math.floor(gapBudgetPx / (lineCount - 1)),
        )
      : 0;

  const maxFontSizeForBox = resolveMaxFontSizeForBox({
    availableHeight,
    lineCount,
    lineHeightRatio: effectiveLineHeightRatio,
    lineSpacingPx,
    skiaFontProbe,
    interLineGapPx,
  });
  fontSize = fontSizeFromSliderPercent({
    maxFontSizeForBox,
    sizePct: sliderPct,
  });

  lineBodyPx = fontSize * effectiveLineHeightRatio * lineCount;
  gapBudgetPx = Math.max(0, availableHeight - lineBodyPx);
  interLineGapPx =
    lineCount > 1
      ? Math.min(
          requestedLineSpacingPx,
          Math.floor(gapBudgetPx / (lineCount - 1)),
        )
      : 0;

  const rawH = computeRawTextBlockHeight({
    fontSize,
    lineCount,
    lineHeightRatio: effectiveLineHeightRatio,
    interLineGapPx,
    padding,
    skiaFontProbe,
  });
  const fillBox = sliderPct >= FONT_SIZE_MAX;
  const height = fillBox ? previewHeight : rawH;
  return { lineCount, fontSize, height };
}

function computeRawTextBlockHeight(params: {
  fontSize: number;
  lineCount: number;
  lineHeightRatio: number;
  interLineGapPx: number;
  padding: number;
  skiaFontProbe?: SkiaFontProbe;
}): number {
  const {
    fontSize,
    lineCount,
    lineHeightRatio,
    interLineGapPx,
    padding,
    skiaFontProbe,
  } = params;

  if (skiaFontProbe) {
    const rowH =
      (skiaFontProbe.rowHeightPxAtProbe / skiaFontProbe.probeFontSize) *
      fontSize;
    return Math.max(
      1,
      Math.ceil(
        skiaTextBlockHeightPx(rowH, lineCount, interLineGapPx) + padding,
      ),
    );
  }

  return Math.max(
    1,
    Math.ceil(
      fontSize * lineHeightRatio * lineCount +
        interLineGapPx * Math.max(0, lineCount - 1) +
        padding,
    ),
  );
}

export function scaleFontSizeByHeight(params: {
  baseFontSize: number;
  targetHeight: number;
  referenceHeight: number;
}) {
  const { baseFontSize, targetHeight, referenceHeight } = params;
  if (referenceHeight <= 0) return Math.max(1, Math.floor(baseFontSize));
  const scaled = baseFontSize * (Math.max(1, targetHeight) / referenceHeight);
  return Math.max(1, Math.floor(scaled));
}

function resolvePctWidthPx(
  width: number | string,
  basisPx: number,
): number {
  if (basisPx <= 0) return 0;
  if (typeof width === "number") return width;
  const trimmed = width.trim();
  if (trimmed.endsWith("%")) {
    return basisPx * (parseFloat(trimmed) / 100);
  }
  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveSpeechBoxPx(params: {
  boxWidth: number | string;
  basisWidthPx: number;
  maxHeightPx: number;
}) {
  const { boxWidth, basisWidthPx, maxHeightPx } = params;
  return {
    widthPx: resolvePctWidthPx(boxWidth, basisWidthPx),
    heightPx: Math.max(1, maxHeightPx),
  };
}

export function getFullscreenTextMetrics(params: {
  displayText: string;
  baseFontSize: number;
  lineHeightRatio: number;
  lineSpacingPx?: number;
  maxHeight: number;
  padding: number;
  clampByMaxHeight: boolean;
  speechBg?: boolean;
  playOption?: "one" | "multi";
  sizePct?: number;
  skiaFontProbe?: SkiaFontProbe;
}) {
  const {
    displayText,
    baseFontSize,
    lineHeightRatio,
    lineSpacingPx,
    maxHeight,
    padding,
    clampByMaxHeight,
    speechBg = false,
    playOption = "multi",
    sizePct = baseFontSize,
    skiaFontProbe,
  } = params;

  const lineCount = countRows(displayText, playOption);
  const availableHeight = Math.max(1, maxHeight - padding);
  const requestedLineSpacingPx = Math.max(0, lineSpacingPx ?? 0);
  const effectiveLineHeightRatio = lineHeightRatio;
  const maxLineSpacingPx =
    lineCount > 1
      ? Math.max(
          0,
          Math.floor(
            (availableHeight -
              Math.max(1, baseFontSize) * effectiveLineHeightRatio * lineCount) /
              (lineCount - 1),
          ),
        )
      : requestedLineSpacingPx;
  const interLineGapPx = Math.min(requestedLineSpacingPx, maxLineSpacingPx);
  const maxFontSizeByHeight = resolveMaxFontSizeForBox({
    availableHeight,
    lineCount,
    lineHeightRatio: effectiveLineHeightRatio,
    lineSpacingPx,
    skiaFontProbe,
    interLineGapPx,
  });
  const fontSize = clampByMaxHeight
    ? fontSizeFromSliderPercent({
        maxFontSizeForBox: maxFontSizeByHeight,
        sizePct,
      })
    : baseFontSize;

  const rawHeight = computeRawTextBlockHeight({
    fontSize,
    lineCount,
    lineHeightRatio: effectiveLineHeightRatio,
    interLineGapPx,
    padding,
    skiaFontProbe,
  });
  const fillBox =
    speechBg || (clampByMaxHeight && sizePct >= FONT_SIZE_MAX);
  const height = fillBox ? maxHeight : Math.min(rawHeight, maxHeight);

  return { lineCount, fontSize, height };
}
