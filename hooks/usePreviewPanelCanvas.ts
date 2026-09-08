import type { SkFont, SkTextBlob } from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import {
  APP_FONT_FACE_SETS,
  fontBelongsToLocale,
  getDefaultForLocale,
  resolveFontFaceSet,
} from "@/constants/appFonts";
import { useSettings } from "@/contexts/settingsContext";
import { useCachedSkiaFont, useResolvedFontAssetRef } from "@/hooks/useCachedSkiaFont";
import { useSkiaAppearanceFont } from "@/hooks/useSkiaAppearanceFont";
import {
  buildMarqueeTextBlob,
  buildMarqueeTextBlobs,
} from "@/utils/buildMarqueeTextBlob";
import {
  BUBBLE_MAX_ROWS,
  BUBBLE_SAFE,
  bubbleGlyphs,
  bubbleLayouts,
  bubbleRows,
  type BubbleCanvasOpts,
} from "@/utils/skiaBubbleTextLayout";

type TextLayoutEvent = {
  nativeEvent: { lines: { width: number }[] };
};

import { layoutSkiaLine, type SkiaLineLayout } from "@/utils/skiaLineLayout";

/** CJK문자 판별하는 용  */
function isCJKChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

/** 마퀴 타일은 텍스트 너비 기준(고정). 프레임 가운데 정렬 x는 별도 오프셋으로 복원합니다. */
function normalizeGlyphsForMarquee(
  glyphs: { x: number; y: number; text: string }[],
): { glyphs: { x: number; y: number; text: string }[]; offsetX: number } {
  if (glyphs.length === 0) return { glyphs, offsetX: 0 };
  const minX = Math.min(...glyphs.map((g) => g.x));
  if (minX === 0) return { glyphs, offsetX: 0 };
  return {
    offsetX: minX,
    glyphs: glyphs.map((g) => ({ ...g, x: g.x - minX })),
  };
}

function lineLayoutsToGlyphs(
  font: SkFont,
  lineLayouts: SkiaLineLayout[],
  previewFontSize: number,
  canvasHeight: number,
  lineHeightRatio: number,
): { x: number; y: number; text: string }[] {
  const lineHeightPx = previewFontSize * lineHeightRatio;
  const m = font.getMetrics();
  const verticalCenterOffset = (m.ascent + m.descent) / 2;
  const n = lineLayouts.length;

  const out: { x: number; y: number; text: string }[] = [];
  for (let lineIndex = 0; lineIndex < n; lineIndex++) {
    const baselineY =
      canvasHeight / 2 +
      (lineIndex - (n - 1) / 2) * lineHeightPx -
      verticalCenterOffset;

    for (const g of lineLayouts[lineIndex]!.glyphs) {
      out.push({ x: g.x, y: baselineY, text: g.text });
    }
  }
  return out;
}

export interface UsePreviewPanelCanvasParams {
  displayText: string;
  translateX: SharedValue<number>;
  onTextLayout: (e: TextLayoutEvent) => void;
  previewFontSize: number;
  appearanceFontOverride?: string | null;
  lineSpacingPx?: number;
  fallbackLayout?: { width: number; height: number };
  lineHeightRatio?: number;
  speechBubbleLayout?: BubbleCanvasOpts | null;
  isPixelMode?: boolean;
}

const PIXEL_ZH_HANS_ASSET = APP_FONT_FACE_SETS.fusion_pixel_zh_hans.regular as number;
const PIXEL_ZH_HANT_ASSET = APP_FONT_FACE_SETS.fusion_pixel_zh_hant.regular as number;

function isHangulChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables (조합된 음절)
    (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo (조합용)
    (code >= 0x3130 && code <= 0x318f) || // Hangul Compatibility Jamo (단독 자모: ㄱ, ㅏ 등)
    (code >= 0xa960 && code <= 0xa97f) || // Hangul Jamo Extended-A
    (code >= 0xd7b0 && code <= 0xd7ff) // Hangul Jamo Extended-B
  );
}

function isJapaneseKanaChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x3040 && code <= 0x309f) ||  // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) ||  // Katakana
    (code >= 0xff65 && code <= 0xff9f)     // 반각 Katakana
  );
}

/** CJKFont선택용 */
function pickBestCJKFont(
  ch: string,
  cnFont: SkFont | null,
  twFont: SkFont | null,
  fallback: SkFont,
): SkFont {
  if (!isCJKChar(ch)) return fallback;
  if (cnFont) {
    const ids = cnFont.getGlyphIDs(ch, 1);
    if (ids.length > 0 && ids[0] !== 0) return cnFont;
  }
  if (twFont) {
    const ids = twFont.getGlyphIDs(ch, 1);
    if (ids.length > 0 && ids[0] !== 0) return twFont;
  }
  return fallback;
}

export function usePreviewPanelCanvas({
  displayText,
  translateX,
  onTextLayout,
  previewFontSize,
  appearanceFontOverride,
  lineSpacingPx,
  fallbackLayout,
  lineHeightRatio = 1.2,
  speechBubbleLayout = null,
  isPixelMode = false,
}: UsePreviewPanelCanvasParams) {
  const { config, resolvedAppLocale, lastFontByLocale } = useSettings();
  const { font: appearanceFont, fontWeight, letterSpacing } = config.appearance;
  const { playOption } = config.content;
  const skiaAppearanceFont = appearanceFontOverride ?? appearanceFont;
  const skiaFont = useSkiaAppearanceFont(
    skiaAppearanceFont,
    fontWeight,
    previewFontSize,
  );
  const pixelZhHansFont = useCachedSkiaFont(isPixelMode ? PIXEL_ZH_HANS_ASSET : null, previewFontSize);
  const pixelZhHantFont = useCachedSkiaFont(isPixelMode ? PIXEL_ZH_HANT_ASSET : null, previewFontSize);

  /**
   * 선택된 폰트 자체가 원래 어떤 스크립트용인지로 판단(=앱 UI 언어가 아니라).
   * 앱 언어와 선택 폰트의 언어가 다를 수 있어(예를 들어 UI는 영어인데 이전에 한글 폰트를 골랐던 경우,
   * 혹은 그 반대) `resolvedAppLocale` 기준으로 폴백 로드 여부를 정하면 실제로는 글리프가 없는
   * 문자가 그대로 선택 폰트로 그려져 사라지는 문제가 있었음.
   */
  const selectedFontIsKo = fontBelongsToLocale(skiaAppearanceFont, "ko");
  const selectedFontIsJa = fontBelongsToLocale(skiaAppearanceFont, "ja");
  const selectedFontIsZhTC = fontBelongsToLocale(skiaAppearanceFont, "zhTC");
  const selectedFontIsZhSC = fontBelongsToLocale(skiaAppearanceFont, "zhSC");

  /**
   * 폴백 폰트는 각 스크립트의 고정 기본 폰트가 아니라, 그 스크립트에서 마지막으로 선택했던
   * 폰트를 따라감. 예) 한글 폰트를 "Jua"로 바꾼 뒤 언어를 영어로 바꾸고 영어 폰트를 골라도
   * 텍스트 속 한글은 계속 "Jua"로 렌더링됨.
   */
  const jaFallbackAsset = resolveFontFaceSet(
    lastFontByLocale.ja ?? getDefaultForLocale("ja"),
  ).regular;
  const koFallbackAsset = resolveFontFaceSet(
    lastFontByLocale.ko ?? getDefaultForLocale("ko"),
  ).regular;
  const tcFallbackAsset = resolveFontFaceSet(
    lastFontByLocale.zhTC ?? getDefaultForLocale("zhTC"),
  ).regular;
  const scFallbackAsset = resolveFontFaceSet(
    lastFontByLocale.zhSC ?? getDefaultForLocale("zhSC"),
  ).regular;

  // 픽셀 모드 아닐 때 로케일 폴백 폰트 — 선택 폰트가 해당 스크립트가 아닐 때만 로드
  const jaFallbackRef = useResolvedFontAssetRef(!isPixelMode && !selectedFontIsJa ? jaFallbackAsset : null);
  const koFallbackRef = useResolvedFontAssetRef(!isPixelMode && !selectedFontIsKo ? koFallbackAsset : null);
  const tcFallbackRef = useResolvedFontAssetRef(!isPixelMode && !selectedFontIsZhTC ? tcFallbackAsset : null);
  const scFallbackRef = useResolvedFontAssetRef(!isPixelMode && !selectedFontIsZhSC ? scFallbackAsset : null);
  const jaFallbackFont = useCachedSkiaFont(jaFallbackRef, previewFontSize);
  const koFallbackFont = useCachedSkiaFont(koFallbackRef, previewFontSize);
  const tcFallbackFont = useCachedSkiaFont(tcFallbackRef, previewFontSize);
  const scFallbackFont = useCachedSkiaFont(scFallbackRef, previewFontSize);

  // 문자별 폰트 선택기: 선택 폰트는 자기 스크립트 문자에만 적용하고, 나머지는 해당 스크립트의 폴백 폰트를 사용
  const localeCharFontPicker = useMemo((): ((ch: string) => SkFont) | null => {
    if (!skiaFont || isPixelMode) return null;
    const font = skiaFont;
    return (ch) => {
      if (isHangulChar(ch)) return selectedFontIsKo ? font : (koFallbackFont ?? font);
      if (isJapaneseKanaChar(ch)) return selectedFontIsJa ? font : (jaFallbackFont ?? font);
      if (isCJKChar(ch)) {
        if (selectedFontIsZhTC || selectedFontIsZhSC || selectedFontIsJa) {
          return font;
        }
        return resolvedAppLocale === "zhSC" ? (scFallbackFont ?? font) : (tcFallbackFont ?? font);
      }
      return font;
    };
  }, [
    skiaFont,
    isPixelMode,
    selectedFontIsKo,
    selectedFontIsJa,
    selectedFontIsZhTC,
    selectedFontIsZhSC,
    resolvedAppLocale,
    jaFallbackFont,
    koFallbackFont,
    tcFallbackFont,
    scFallbackFont,
  ]);

  const [skiaCanvasLayout, setSkiaCanvasLayout] = useState({
    width: 0,
    height: 0,
  });

  // 말풍선 ON/OFF 시 onLayout이 다른 View로 옮겨져 재측정이 안 될 수 있음 → stale 높이로 위쪽 붙음
  useEffect(() => {
    setSkiaCanvasLayout({ width: 0, height: 0 });
  }, [speechBubbleLayout != null]);

  const hasCanvasLayout =
    skiaCanvasLayout.width > 0 && skiaCanvasLayout.height > 0;
  const fbW = fallbackLayout?.width ?? 0;
  const fbH = fallbackLayout?.height ?? 0;
  const drawW = hasCanvasLayout ? skiaCanvasLayout.width : fbW;
  const drawH = hasCanvasLayout ? skiaCanvasLayout.height : fbH;

  const useBubbleLayout =
    speechBubbleLayout != null && hasCanvasLayout;

  const skiaLineLayouts = useMemo((): SkiaLineLayout[] | null => {
    if (!skiaFont) return null;

    const rows = useBubbleLayout || playOption !== "one"
      ? bubbleRows({
          text: displayText,
          maxRows: speechBubbleLayout?.maxRows ?? BUBBLE_MAX_ROWS,
          playOption,
        })
      : (displayText.length > 0 ? [displayText] : []);

    const getCharFont: ((ch: string) => SkFont) | undefined =
      isPixelMode && (pixelZhHansFont || pixelZhHantFont)
        ? (ch) => pickBestCJKFont(ch, pixelZhHansFont, pixelZhHantFont, skiaFont)
        : (localeCharFontPicker ?? undefined);

    if (useBubbleLayout) {
      return bubbleLayouts(skiaFont, rows, letterSpacing, getCharFont);
    }

    return rows.map((line) => layoutSkiaLine(skiaFont, line, letterSpacing, getCharFont));
  }, [
    displayText,
    skiaFont,
    letterSpacing,
    useBubbleLayout,
    speechBubbleLayout,
    playOption,
    isPixelMode,
    pixelZhHansFont,
    pixelZhHantFont,
    localeCharFontPicker,
  ]);

  const resolvedLineHeightRatio =
    lineSpacingPx != null
      ? lineHeightRatio + lineSpacingPx / Math.max(1, previewFontSize)
      : lineHeightRatio;

  const marqueePeriodPx = useMemo(() => {
    if (!skiaLineLayouts || skiaLineLayouts.length === 0) return 0;
    return skiaLineLayouts.reduce((max, row) => Math.max(max, row.width), 0);
  }, [skiaLineLayouts]);

  const skiaGlyphLayout = useMemo(() => {
    if (!skiaFont || !skiaLineLayouts || drawH <= 0) {
      return {
        glyphPositions: [] as { x: number; y: number; text: string }[],
        marqueeOffsetX: 0,
      };
    }

    const frameGlyphs = useBubbleLayout
      ? bubbleGlyphs({
          font: skiaFont,
          rows: skiaLineLayouts,
          frameWidth: drawW,
          frameHeight: drawH,
          safeWRatio:
            speechBubbleLayout!.safeWRatio ?? BUBBLE_SAFE.widthRatio,
          lineGapPx: lineSpacingPx,
          edgeInsetPx: speechBubbleLayout!.edgeInsetPx,
        })
      : lineLayoutsToGlyphs(
          skiaFont,
          skiaLineLayouts,
          previewFontSize,
          drawH,
          resolvedLineHeightRatio,
        );

    const { glyphs: glyphPositions, offsetX: marqueeOffsetX } =
      useBubbleLayout
        ? normalizeGlyphsForMarquee(frameGlyphs)
        : { glyphs: frameGlyphs, offsetX: 0 };

    return { glyphPositions, marqueeOffsetX };
  }, [
    skiaFont,
    skiaLineLayouts,
    previewFontSize,
    drawH,
    drawW,
    resolvedLineHeightRatio,
    useBubbleLayout,
    speechBubbleLayout,
    lineSpacingPx,
  ]);

  const skiaTextWidth = marqueePeriodPx;
  const marqueeOffsetX = useSharedValue(0);

  useEffect(() => {
    marqueeOffsetX.value = skiaGlyphLayout.marqueeOffsetX;
  }, [skiaGlyphLayout.marqueeOffsetX, marqueeOffsetX]);

  const skiaTextBlobs = useMemo((): SkTextBlob[] | null => {
    if (!skiaFont || skiaGlyphLayout.glyphPositions.length === 0) return null;
    if (isPixelMode) {
      const blobs = buildMarqueeTextBlobs(
        skiaGlyphLayout.glyphPositions,
        (ch) => pickBestCJKFont(ch, pixelZhHansFont, pixelZhHantFont, skiaFont),
      );
      return blobs.length > 0 ? blobs : null;
    }
    if (localeCharFontPicker) {
      const blobs = buildMarqueeTextBlobs(skiaGlyphLayout.glyphPositions, localeCharFontPicker);
      return blobs.length > 0 ? blobs : null;
    }
    const blob = buildMarqueeTextBlob(skiaFont, skiaGlyphLayout.glyphPositions);
    return blob ? [blob] : null;
  }, [skiaFont, skiaGlyphLayout.glyphPositions, isPixelMode, pixelZhHansFont, pixelZhHantFont, localeCharFontPicker]);

  const skiaMarqueeTransform = useDerivedValue(() => [
    { translateX: translateX.value + marqueeOffsetX.value },
  ]);

  useEffect(() => {
    if (marqueePeriodPx <= 0) return;
    onTextLayout({
      nativeEvent: { lines: [{ width: marqueePeriodPx }] },
    });
  }, [marqueePeriodPx, onTextLayout]);

  const onSkiaCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSkiaCanvasLayout({ width, height });
  };

  return {
    skiaFont,
    skiaTextWidth,
    skiaTextBlob: skiaTextBlobs?.[0] ?? null,
    skiaTextBlobs: skiaTextBlobs ?? undefined,
    skiaGlyphPositions: skiaGlyphLayout.glyphPositions,
    skiaMarqueeTransform,
    marqueeOffsetX,
    skiaCanvasLayout: { width: drawW, height: drawH },
    onSkiaCanvasLayout,
  };
}
