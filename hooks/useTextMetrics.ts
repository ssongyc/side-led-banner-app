import {
  useSettingsAppearance,
  useSettingsContent,
} from "@/contexts/settingsContext";
import { useMemo } from "react";

import { useSkiaAppearanceFont } from "@/hooks/useSkiaAppearanceFont";
import { skiaRowHeightPx } from "@/utils/skiaTextBlockMetrics";
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  getFullscreenTextMetrics,
  getPreviewTextMetrics,
  getRelLineSpacing,
  getSizingPolicy,
  scaleFontSizeByHeight,
  type SkiaFontProbe,
} from "@/utils/textSizing";

type SizingPolicy = ReturnType<typeof getSizingPolicy>;

type TextMetricsBase = {
  sizingPolicy: SizingPolicy;
  isSpeechBgActive: boolean;
  speechMaxHeight: number;
};

type TextMetricsInput =
  | (TextMetricsBase & { mode: "preview"; previewHeight: number })
  | (TextMetricsBase & {
      mode: "fullscreen";
      windowWidth: number;
      windowHeight: number;
      isPortrait: boolean;
    });

function resolveHeightScaledFontSize(params: {
  fontSize: number;
  windowWidth: number;
  windowHeight: number;
  isPortrait: boolean;
  isSpeechBgActive: boolean;
  portraitFontBoost: number;
}): number {
  const landscapeHeight = Math.max(
    1,
    Math.min(params.windowWidth, params.windowHeight),
  );
  const scaled = scaleFontSizeByHeight({
    baseFontSize: params.fontSize,
    targetHeight: params.windowHeight,
    referenceHeight: landscapeHeight,
  });
  const portraitSized = params.isPortrait
    ? Math.max(FONT_SIZE_MIN, Math.floor(scaled * params.portraitFontBoost))
    : scaled;
  const atMaxSize = params.fontSize >= 100;
  if (!params.isSpeechBgActive && !params.isPortrait && atMaxSize) {
    return Math.max(FONT_SIZE_MIN, Math.floor(portraitSized * 2));
  }
  return Math.max(FONT_SIZE_MIN, portraitSized);
}

function resolveTextMetrics(
  input: TextMetricsInput,
  text: string,
  playOption: "one" | "multi",
  sizePct: number,
  effectiveLineSpacing: number,
  skiaFontProbe: SkiaFontProbe | undefined,
) {
  if (input.mode === "preview" && input.previewHeight <= 0) {
    return { lineCount: 1, fontSize: 100, height: 100 };
  }

  const baseFontSize =
    input.mode === "fullscreen"
      ? resolveHeightScaledFontSize({
          fontSize: sizePct,
          windowWidth: input.windowWidth,
          windowHeight: input.windowHeight,
          isPortrait: input.isPortrait,
          isSpeechBgActive: input.isSpeechBgActive,
          portraitFontBoost: input.sizingPolicy.portraitFontBoost,
        })
      : sizePct;

  if (input.mode === "fullscreen" || input.isSpeechBgActive) {
    return getFullscreenTextMetrics({
      displayText: text,
      baseFontSize,
      lineHeightRatio: input.sizingPolicy.fullscreenLineHeightRatio,
      lineSpacingPx: effectiveLineSpacing,
      maxHeight: input.speechMaxHeight,
      padding: input.isSpeechBgActive
        ? 0
        : input.sizingPolicy.speechTextHeightPadding,
      clampByMaxHeight: input.sizingPolicy.clampByMaxHeight,
      speechBg: input.isSpeechBgActive,
      playOption,
      sizePct,
      skiaFontProbe,
    });
  }

  return getPreviewTextMetrics({
    previewHeight: input.previewHeight,
    playOption,
    text,
    padding: input.sizingPolicy.previewPadding,
    lineHeightRatio: input.sizingPolicy.previewLineHeightRatio,
    lineSpacingPx: effectiveLineSpacing,
    fontSizePercent: sizePct,
    skiaFontProbe,
  });
}

const SKIA_PROBE_FONT_SIZE = FONT_SIZE_MAX;

export function useTextMetrics(input: TextMetricsInput) {
  const { appearance } = useSettingsAppearance();
  const { content } = useSettingsContent();
  const { font: appearanceFont, fontWeight, fontSize, lineSpacing } = appearance;
  const { previewText: text, playOption } = content;

  const probeFont = useSkiaAppearanceFont(
    appearanceFont,
    fontWeight,
    SKIA_PROBE_FONT_SIZE,
  );

  const skiaFontProbe = useMemo((): SkiaFontProbe | undefined => {
    if (!probeFont) return undefined;
    return {
      rowHeightPxAtProbe: skiaRowHeightPx(probeFont),
      probeFontSize: SKIA_PROBE_FONT_SIZE,
    };
  }, [probeFont]);

  const lineSpacingMax = useMemo(
    () => getRelLineSpacing({ requestedLineSpacingPx: 40, fontSizePercent: fontSize }),
    [fontSize],
  );

  const effectiveLineSpacing = useMemo(
    () => Math.min(Math.max(0, lineSpacing), lineSpacingMax),
    [lineSpacing, lineSpacingMax],
  );

  const referenceLineSpacing = useMemo(
    () =>
      getRelLineSpacing({
        requestedLineSpacingPx: lineSpacing,
        fontSizePercent: FONT_SIZE_MAX,
      }),
    [lineSpacing],
  );

  const metrics = useMemo(
    () =>
      resolveTextMetrics(
        input,
        text,
        playOption,
        fontSize,
        effectiveLineSpacing,
        skiaFontProbe,
      ),
    [input, text, playOption, fontSize, effectiveLineSpacing, skiaFontProbe],
  );

  const referenceMetrics = useMemo(
    () =>
      resolveTextMetrics(
        input,
        text,
        playOption,
        FONT_SIZE_MAX,
        referenceLineSpacing,
        skiaFontProbe,
      ),
    [input, text, playOption, referenceLineSpacing, skiaFontProbe],
  );

  return {
    effectiveLineSpacing,
    previewFontSize: metrics.fontSize,
    marqueeReferenceFontSize: referenceMetrics.fontSize,
    fullscreenLineHeightRatio: input.sizingPolicy.fullscreenLineHeightRatio,
  };
}
