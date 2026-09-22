import {
  isSpeechBubblePreset,
  SPEECH_BUBBLE_PRESETS,
  type SpeechBubblePresetId,
} from "@/constants/speechBubblePresets";
import type { BackgroundEffectId } from "@/hooks/useBackgroundAnimation";

const HEART_BG_B_SOURCE = require("@/assets/images/Heart_BG_B.png");
const HEART_BG_PAD_LANDSCAPE_SOURCE = require("@/assets/images/Heart_BG_H_12.9.png");
const HEART_BG_PAD_PORTRAIT_SOURCE = require("@/assets/images/Heart_BG_V_12.9.png");

export type BackgroundEffectImageMode = "preview" | "fullscreen";

type Effect1ImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function resolveHeartImageSource(params: {
  heartSource: number;
  isTablet: boolean;
  isFullscreen: boolean;
  isFullscreenPortrait: boolean;
  isPortrait: boolean;
}): number {
  if (params.isTablet && params.isFullscreen) {
    return params.isPortrait
      ? HEART_BG_PAD_PORTRAIT_SOURCE
      : HEART_BG_PAD_LANDSCAPE_SOURCE;
  }
  return params.isFullscreenPortrait ? HEART_BG_B_SOURCE : params.heartSource;
}

export function resolveSpeechBubbleImageSource(
  effectId: BackgroundEffectId,
  mode: BackgroundEffectImageMode,
  isPortrait: boolean,
): number | null {
  if (!isSpeechBubblePreset(effectId)) {
    return null;
  }
  const preset = SPEECH_BUBBLE_PRESETS[effectId as SpeechBubblePresetId];
  return mode === "preview"
    ? preset.previewSource
    : isPortrait
      ? preset.fullscreenPortraitSource
      : preset.fullscreenLandscapeSource;
}

/** 응원봉Skia배치용 */
export function resolveEffect1Rects(
  width: number,
  height: number,
  isFullscreenPortrait: boolean,
): { left: Effect1ImageRect; right: Effect1ImageRect } {
  if (isFullscreenPortrait) {
    const y = height * 0.375;
    const stickH = height * 0.25;
    const stickW = width * 0.5;
    return {
      left: { x: 0, y, width: stickW, height: stickH },
      right: { x: width - stickW, y, width: stickW, height: stickH },
    };
  }
  const stickW = width * 0.5;
  return {
    left: { x: 0, y: 0, width: stickW, height },
    right: { x: width - stickW, y: 0, width: stickW, height },
  };
}

/** 응원봉RN배치용 */
export function resolveEffect1EdgeStyle(isFullscreenPortrait: boolean) {
  return isFullscreenPortrait
    ? ({
        top: "37.5%" as const,
        bottom: "37.5%" as const,
        width: "50%" as const,
        height: "25%" as const,
      } as const)
    : ({
        top: 0 as const,
        bottom: 0 as const,
        width: "50%" as const,
        height: "100%" as const,
      } as const);
}
