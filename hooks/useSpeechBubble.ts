import { SPEECH_BUBBLE_PRESETS } from "@/constants/speechBubblePresets";
import {
  getSizingPolicy,
  resolveFullscreenMaxHeight,
  resolveSpeechBoxPx,
  resolveSpeechTextTopOffset,
} from "@/utils/textSizing";
import { useEffect, useMemo } from "react";
import type { ViewStyle } from "react-native";
import { Platform } from "react-native";

type SpeechBubbleId = NonNullable<
  ReturnType<typeof getSizingPolicy>["speechBubbleId"]
>;

type SpeechBubbleInput = {
  speechBubbleId: SpeechBubbleId | null;
  effectId: string;
  isPortrait: boolean;
  basisWidthPx: number;
  viewportHeight: number;
};

/** 말풍선 배경일 때 텍스트 박스 크기·위치·캔버스 fallback */
export function useSpeechBubble(input: SpeechBubbleInput) {
  const isActive = input.speechBubbleId != null;

  const speechPresetPlatform = isActive
    ? Platform.OS === "ios"
      ? SPEECH_BUBBLE_PRESETS[input.speechBubbleId!].ios
      : SPEECH_BUBBLE_PRESETS[input.speechBubbleId!].android
    : null;

  const speechTextBoxConfig = isActive
    ? input.isPortrait
      ? speechPresetPlatform!.textBox.portrait
      : speechPresetPlatform!.textBox.landscape
    : null;

  const maxTextHeight = useMemo(() => {
    if (input.viewportHeight <= 0) return 0;
    return resolveFullscreenMaxHeight({
      effectId: input.effectId,
      isPortrait: input.isPortrait,
      viewportHeight: input.viewportHeight,
    });
  }, [input.effectId, input.isPortrait, input.viewportHeight]);

  const speechBoxPx = useMemo(() => {
    if (
      !speechTextBoxConfig ||
      input.basisWidthPx <= 0 ||
      maxTextHeight <= 0
    ) {
      return null;
    }
    return resolveSpeechBoxPx({
      boxWidth: speechTextBoxConfig.width,
      basisWidthPx: input.basisWidthPx,
      maxHeightPx: maxTextHeight,
    });
  }, [speechTextBoxConfig, input.basisWidthPx, maxTextHeight]);

  const speechTextTop = useMemo(() => {
    if (!isActive || input.viewportHeight <= 0) return null;
    return resolveSpeechTextTopOffset({
      effectId: input.effectId,
      isPortrait: input.isPortrait,
      viewportHeight: input.viewportHeight,
    });
  }, [isActive, input.effectId, input.isPortrait, input.viewportHeight]);

  const textContainerStyle: ViewStyle | null = useMemo(() => {
    if (!isActive || !speechBoxPx || !speechTextBoxConfig) return null;
    const left = Math.max(
      0,
      (input.basisWidthPx - speechBoxPx.widthPx) / 2,
    );
    const base: ViewStyle = {
      position: "absolute",
      left,
      width: speechBoxPx.widthPx,
      height: speechBoxPx.heightPx,
    };
    if (speechTextTop != null) {
      return { ...base, top: speechTextTop };
    }
    return {
      ...base,
      top: Math.max(
        0,
        (input.viewportHeight - speechBoxPx.heightPx) / 2 +
          speechTextBoxConfig.yOffset,
      ),
    };
  }, [
    isActive,
    speechBoxPx,
    speechTextBoxConfig,
    speechTextTop,
    input.basisWidthPx,
    input.viewportHeight,
  ]);

  useEffect(() => {
    if (!__DEV__ || !isActive || !speechTextBoxConfig || !speechBoxPx) {
      return;
    }
    const orient = input.isPortrait ? "portrait" : "landscape";
    const pct =
      input.basisWidthPx > 0
        ? ((speechBoxPx.widthPx / input.basisWidthPx) * 100).toFixed(1)
        : "?";
    console.log("[SpeechBubble layout]", {
      preset: input.speechBubbleId,
      platform: Platform.OS,
      orient,
      configuredWidth: speechTextBoxConfig.width,
      basisWidthPx: Math.round(input.basisWidthPx),
      textBoxWidthPx: Math.round(speechBoxPx.widthPx),
      textBoxHeightPx: Math.round(speechBoxPx.heightPx),
      resolvedWidthPct: `${pct}%`,
      leftInsetPx: Math.round(
        Math.max(0, (input.basisWidthPx - speechBoxPx.widthPx) / 2),
      ),
    });
  }, [
    isActive,
    input.speechBubbleId,
    input.isPortrait,
    input.basisWidthPx,
    speechTextBoxConfig,
    speechBoxPx,
  ]);

  return {
    isActive,
    speechTextBoxConfig,
    speechBoxPx,
    maxTextHeight,
    speechTextTop,
    textContainerStyle,
    /** preset 문자열 (예: "82%") — 가로/세로 확인용 */
    configuredTextBoxWidth: speechTextBoxConfig?.width ?? null,
    layoutOrientation: input.isPortrait
      ? ("portrait" as const)
      : ("landscape" as const),
  };
}

export function resolveSpeechCanvasFallback(
  speechBoxPx: { widthPx: number; heightPx: number } | null,
  fallback: { width: number; height: number },
) {
  if (speechBoxPx) {
    return { width: speechBoxPx.widthPx, height: speechBoxPx.heightPx };
  }
  return fallback;
}
