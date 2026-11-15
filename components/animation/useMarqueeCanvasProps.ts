import { useTilePicture } from "@/hooks/useTilePicture";
import type { useEffects } from "@/hooks/useEffects";
import type { usePreviewPanelCanvas } from "@/hooks/usePreviewPanelCanvas";
import type { SharedValue } from "react-native-reanimated";
import type { MarqueeCanvasProps } from "./MarqueeCanvas";

type SkiaEffects = ReturnType<typeof useEffects>;

export function useMarqueeCanvasProps(params: {
  canvas: ReturnType<typeof usePreviewPanelCanvas>;
  effects: SkiaEffects;
  blinkOpacity: number | SharedValue<number>;
  spacer: number;
  previewTextColor: string;
  dropShadow: number;
  backgroundColor: string;
}): MarqueeCanvasProps {
  const { canvas, effects, blinkOpacity, spacer, previewTextColor, dropShadow, backgroundColor } = params;
  // Keep the current picture/shader with the screen, across child Canvas remounts.
  // useTilePicture replaces it when text, geometry or appearance changes.
  const tilePaints = useTilePicture({
    blob: canvas.skiaTextBlob,
    textBlobs: canvas.skiaTextBlobs,
    textWidthPx: canvas.skiaTextWidth,
    spacerPx: spacer,
    canvasWidthPx: canvas.skiaCanvasLayout.width,
    canvasHeightPx: canvas.skiaCanvasLayout.height,
    previewTextColor,
    glowLayerColor: effects.glowLayerColor,
    isGlowEffect: effects.isGlowEffect,
    isPixelEffect: effects.isPixelTextDots,
    isPixelColorMix: effects.isPixelTextDots && effects.isPixelColorMix,
    pixelShaderSize: effects.pixelShaderSize,
    pixelGlyphPadCells: effects.pixelGlyphPadCells,
    glowBlurRadius: effects.glowBlurRadius,
    strokeWidthPx: effects.skiaStrokeWidthPx,
    dropShadow,
    // More blur makes the shadow softer. Reverse only the enabled range (1–100).
    dropShadowBlur: dropShadow > 0
      ? Math.round(((101 - dropShadow) / 100) * 5)
      : 0,
    glyphPositions: canvas.skiaGlyphPositions,
    font: canvas.skiaFont,
    backgroundColor,
    pixelMaskDilateRadius: effects.pixelMaskDilateRadius,
    pixelMaskErodeRadius: effects.pixelMaskErodeRadius,
    pixelContentUpscaleFactor: effects.pixelContentUpscaleFactor,
  });
  return {
    tilePaints,
    canvas,
    isPixelEffect: effects.isPixelEffect,
    isPixelTextDots: effects.isPixelTextDots,
    pixelShaderSize: effects.pixelShaderSize,
    pixelTextShaderUniforms: effects.pixelTextShaderUniforms,
    blinkOpacity,
    isGlowEffect: effects.isGlowEffect,
    pixelOutlineRings: effects.pixelOutlineRings,
    previewTextColor,
    backgroundColor,
  };
}
