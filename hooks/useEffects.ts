import { getPixelFontIdForLocale } from "@/constants/appFonts";
import { glowColorToSkiaRgba } from "@/constants/colorPalette";
import {
  GRADIENT_BACKDROP_IDS,
  type GradientBackdropId,
} from "@/constants/gradientBackgroundPresets";
import {
  hasPixelLedEffect,
  pixelGlyphPanelPadCells,
  resolveContentUpscaleFactor,
  resolvePixelBackgroundShaderSizePx,
  resolvePixelShaderSizePx,
  resolvePixelTextShaderUniforms,
} from "@/constants/pixelLed";
import {
  useSettingsAppearance,
  useSettingsContent,
  useSettingsLocalizationContext,
} from "@/contexts/settingsContext";
import { computeEffectSpace } from "@/utils/recordTile";
import { useMemo } from "react";

type EffectsInput = {
  fontSizePx?: number;
};

/** Skia마퀴효과용 */
export function useEffects(input: EffectsInput = {}) {
  const { appearance } = useSettingsAppearance();
  const { content } = useSettingsContent();
  const { resolvedAppLocale } = useSettingsLocalizationContext();
  const {
    effectSelectedItems,
    gradientBackgroundPreset,
    outLine,
    glowIntensity,
    glowColor,
    dropShadow,
    pixelColorMix,
  } = appearance;
  const { playOption } = content;

  const isPixelEffect = hasPixelLedEffect(effectSelectedItems);
  const isPixelTextDots = isPixelEffect;
  const isGlowEffect = effectSelectedItems.includes("Glow");
  const showGradientBackdrop =
    effectSelectedItems.includes("Gradient") &&
    GRADIENT_BACKDROP_IDS.includes(gradientBackgroundPreset as GradientBackdropId);

  const pixelPlay = { playOption };
  const pixelShaderSize = isPixelEffect
    ? resolvePixelShaderSizePx({ ...pixelPlay, fontSizePx: input.fontSizePx })
    : 1;
  const pixelBackgroundShaderSize = isPixelEffect
    ? resolvePixelBackgroundShaderSizePx(pixelPlay)
    : 1;

  const pixelContentUpscaleFactor = isPixelEffect
    ? resolveContentUpscaleFactor({ ...pixelPlay, fontSizePx: input.fontSizePx })
    : 1;
  const pixelTextShaderUniforms = resolvePixelTextShaderUniforms();
  const pixelMaskDilateRadius = 0;
  const pixelMaskErodeRadius = 0;
  const pixelGlyphPadCells = isPixelEffect
    ? pixelGlyphPanelPadCells(pixelShaderSize)
    : 1;
  const skiaStrokeWidthPx =
    outLine > 0
      ? Math.round(2 + ((outLine - 1) / 99) * 14)
      : 0;
  const pixelOutlineRings =
    isPixelTextDots && outLine > 0
      ? Math.max(1, Math.min(4, Math.floor((outLine - 1) / 25) + 1))
      : 0;
  const isPixelColorMix = isPixelTextDots && isPixelEffect && pixelColorMix;

  const glowBlurRadius = useMemo(
    () => Math.max(2, Math.min(18, 2 + (glowIntensity / 100) * 16)),
    [glowIntensity],
  );
  const glowLayerColor = useMemo(
    () => glowColorToSkiaRgba(glowColor, glowIntensity),
    [glowColor, glowIntensity],
  );
  const effectSpacePx = useMemo(
    () =>
      computeEffectSpace({
        isGlowEffect,
        glowBlurRadius,
        strokeWidthPx: skiaStrokeWidthPx,
        dropShadow,
      }),
    [isGlowEffect, glowBlurRadius, skiaStrokeWidthPx, dropShadow],
  );

  return {
    isPixelEffect,
    isPixelTextDots,
    pixelSkiaFontOverride: isPixelEffect
      ? getPixelFontIdForLocale(resolvedAppLocale)
      : null,
    isGlowEffect,
    showGradientBackdrop,
    pixelShaderSize,
    pixelBackgroundShaderSize,
    pixelTextShaderUniforms,
    pixelMaskDilateRadius,
    pixelMaskErodeRadius,
    pixelGlyphPadCells,
    pixelContentUpscaleFactor,
    skiaStrokeWidthPx,
    pixelOutlineRings,
    isPixelColorMix,
    glowBlurRadius,
    glowLayerColor,
    effectSpacePx,
  };
}
