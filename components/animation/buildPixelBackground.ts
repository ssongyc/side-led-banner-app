import type { BackgroundPhotoViewMode } from "@/utils/backgroundPhotoLayout";
import type { BackgroundEffectAnimationResult } from "@/hooks/useBackgroundAnimation";
import type { useEffects } from "@/hooks/useEffects";
import type { SharedValue } from "react-native-reanimated";
import type { BackgroundEffectImageMode } from "./resolveBackgroundEffectImage";
import type { PixelBackgroundCanvasProps } from "./PixelBackgroundCanvas";

type SkiaEffects = ReturnType<typeof useEffects>;

export function buildPixelBackground(params: {
  width: number;
  height: number;
  effects: SkiaEffects;
  backgroundColor: string;
  backgroundImageUri: string | null;
  backgroundPhotoViewMode: BackgroundPhotoViewMode;
  gradientBackgroundPreset: string;
  backgroundEffect: BackgroundEffectAnimationResult;
  translateX: SharedValue<number>;
  isPortrait: boolean;
  mode: BackgroundEffectImageMode;
}): PixelBackgroundCanvasProps {
  return {
    width: params.width,
    height: params.height,
    isPixelEffect: params.effects.isPixelEffect,
    pixelShaderSize: params.effects.pixelBackgroundShaderSize,
    showGradientBackdrop: params.effects.showGradientBackdrop,
    gradientBackgroundPreset: params.gradientBackgroundPreset,
    backgroundColor: params.backgroundColor,
    backgroundImageUri: params.backgroundImageUri,
    backgroundPhotoViewMode: params.backgroundPhotoViewMode,
    backgroundEffect: params.backgroundEffect,
    translateX: params.translateX,
    isPortrait: params.isPortrait,
    mode: params.mode,
  };
}
