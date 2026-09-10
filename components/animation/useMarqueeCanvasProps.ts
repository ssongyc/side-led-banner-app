import { useTilePicture } from "@/hooks/useTilePicture";
import type { useEffects } from "@/hooks/useEffects";
import type { usePreviewPanelCanvas } from "@/hooks/usePreviewPanelCanvas";
import type { SharedValue } from "react-native-reanimated";
import type { MarqueeCanvasProps } from "./MarqueeCanvas";

type SkiaEffects = ReturnType<typeof useEffects>;
type BuiltMarqueeCanvasProps = MarqueeCanvasProps;

export function useMarqueeCanvasProps(params: {
  canvas: ReturnType<typeof usePreviewPanelCanvas>;
  effects: SkiaEffects;
  blinkOpacity: number | SharedValue<number>;
  spacer: number;
  previewTextColor: string;
  hasBgPhoto: boolean;
  dropShadow: number;
  backgroundColor: string;
}): BuiltMarqueeCanvasProps {
  const props = {
    canvas: params.canvas,
    isPixelEffect: params.effects.isPixelEffect,
    isPixelTextDots: params.effects.isPixelTextDots,
    isPixelColorMix: params.effects.isPixelColorMix,
    pixelShaderSize: params.effects.pixelShaderSize,
    pixelTextShaderUniforms: params.effects.pixelTextShaderUniforms,
    pixelMaskDilateRadius: params.effects.pixelMaskDilateRadius,
    pixelMaskErodeRadius: params.effects.pixelMaskErodeRadius,
    pixelGlyphPadCells: params.effects.pixelGlyphPadCells,
    pixelContentUpscaleFactor: params.effects.pixelContentUpscaleFactor,
    hasBgPhoto: params.hasBgPhoto,
    blinkOpacity: params.blinkOpacity,
    spacer: params.spacer,
    isGlowEffect: params.effects.isGlowEffect,
    glowBlurRadius: params.effects.glowBlurRadius,
    glowLayerColor: params.effects.glowLayerColor,
    skiaStrokeWidthPx: params.effects.skiaStrokeWidthPx,
    pixelOutlineRings: params.effects.pixelOutlineRings,
    dropShadow: params.dropShadow,
    previewTextColor: params.previewTextColor,
    backgroundColor: params.backgroundColor,
  };
  // Keep the current picture/shader with the screen, across child Canvas remounts.
  // useTilePicture replaces it when text, geometry or appearance changes.
  const tilePaints = useTilePicture({
    blob: props.canvas.skiaTextBlob,
    textBlobs: props.canvas.skiaTextBlobs,
    textWidthPx: props.canvas.skiaTextWidth,
    spacerPx: props.spacer,
    canvasWidthPx: props.canvas.skiaCanvasLayout.width,
    canvasHeightPx: props.canvas.skiaCanvasLayout.height,
    previewTextColor: props.previewTextColor,
    glowLayerColor: props.glowLayerColor,
    isGlowEffect: props.isGlowEffect,
    isPixelEffect: props.isPixelTextDots,
    isPixelColorMix: props.isPixelTextDots && props.isPixelColorMix,
    pixelShaderSize: props.pixelShaderSize,
    pixelGlyphPadCells: props.pixelGlyphPadCells,
    glowBlurRadius: props.glowBlurRadius,
    strokeWidthPx: props.skiaStrokeWidthPx,
    dropShadow: props.dropShadow,
    dropShadowBlur: Math.round((props.dropShadow / 100) * 5),
    glyphPositions: props.canvas.skiaGlyphPositions,
    font: props.canvas.skiaFont,
    backgroundColor: props.backgroundColor,
    pixelMaskDilateRadius: props.pixelMaskDilateRadius,
    pixelMaskErodeRadius: props.pixelMaskErodeRadius,
    pixelContentUpscaleFactor: props.pixelContentUpscaleFactor,
  });
  return { ...props, tilePaints };

}
