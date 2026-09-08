import {
  isSpeechBubblePreset,
  SPEECH_BUBBLE_PRESETS,
} from "@/constants/speechBubblePresets";
import type {
  BackgroundEffectAnimationResult,
  BackgroundEffectId,
} from "@/hooks/useBackgroundAnimation";
import { Image } from "expo-image";
import React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { HeartBackgroundTicker } from "./HeartBackgroundTicker";
import { resolveEffect1EdgeStyle } from "./resolveBackgroundEffectImage";

type BackgroundEffectLayerMode = "preview" | "fullscreen";

interface BackgroundEffectLayerProps {
  effect: BackgroundEffectAnimationResult;
  translateX: SharedValue<number>;
  isPortrait: boolean;
  mode: BackgroundEffectLayerMode;
  /** PixelSkia배경용 */
  suppressPixelManagedBackgrounds?: boolean;
  blurRadius?: number;
}

type EffectProps = BackgroundEffectLayerProps & {
  isTablet: boolean;
  isFullscreen: boolean;
  isFullscreenPortrait: boolean;
  suppressPixelManagedBackgrounds: boolean;
  blurRadius: number;
};

type EffectRenderer = (props: EffectProps) => React.ReactNode;

const HEART_BG_B_SOURCE = require("@/assets/images/Heart_BG_B.png");
const HEART_BG_PAD_LANDSCAPE_SOURCE = require("@/assets/images/Heart_BG_H_12.9.png");
const HEART_BG_PAD_PORTRAIT_SOURCE = require("@/assets/images/Heart_BG_V_12.9.png");
// 태블릿/패드 판별 기준 (Material/Apple HIG 공통: 짧은 변 600dp 이상)
const TABLET_MIN_SHORTEST_SIDE_DP = 600;

function renderNone() {
  return null;
}

function renderEffect1({
  effect,
  isFullscreenPortrait,
  suppressPixelManagedBackgrounds,
  blurRadius,
}: EffectProps): React.ReactNode {
  if (suppressPixelManagedBackgrounds) {
    return null;
  }
  if (effect.id !== "effect1" || !effect.sources) {
    return null;
  }

  const effect1EdgeStyle = resolveEffect1EdgeStyle(isFullscreenPortrait);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Image
        source={effect.sources.left}
        style={{ position: "absolute", left: 0, ...effect1EdgeStyle }}
        contentFit="fill"
        blurRadius={blurRadius}
      />
      <Image
        source={effect.sources.right}
        style={{ position: "absolute", right: 0, ...effect1EdgeStyle }}
        contentFit="fill"
        blurRadius={blurRadius}
      />
    </View>
  );
}

function renderHeartBackground({
  effect,
  isTablet,
  isFullscreen,
  isFullscreenPortrait,
  isPortrait,
  translateX,
  suppressPixelManagedBackgrounds,
  blurRadius,
}: EffectProps): React.ReactNode {
  if (suppressPixelManagedBackgrounds) {
    return null;
  }
  if (effect.id !== "heartBgA" || !effect.imageSource) {
    return null;
  }

  if (isTablet && isFullscreen) {
    const padHeartSource = isPortrait
      ? HEART_BG_PAD_PORTRAIT_SOURCE
      : HEART_BG_PAD_LANDSCAPE_SOURCE;
    return (
      <Image
        source={padHeartSource}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
        blurRadius={blurRadius}
      />
    );
  }

  const heartSource = isFullscreenPortrait ? HEART_BG_B_SOURCE : effect.imageSource;
  return <HeartBackgroundTicker source={heartSource} translateX={translateX} blurRadius={blurRadius} />;
}

function renderSpeechBubble({
  effect,
  isPortrait,
  mode,
  suppressPixelManagedBackgrounds,
  blurRadius,
}: EffectProps): React.ReactNode {
  if (suppressPixelManagedBackgrounds) {
    return null;
  }
  if (!isSpeechBubblePreset(effect.id)) {
    return null;
  }

  const preset = SPEECH_BUBBLE_PRESETS[effect.id];
  const platformPreset = Platform.OS === "ios" ? preset.ios : preset.android;
  const source =
    mode === "preview"
      ? preset.previewSource
      : isPortrait
        ? preset.fullscreenPortraitSource
        : preset.fullscreenLandscapeSource;
  const previewInset = (platformPreset.previewHeightBoostPx ?? 0) / 2;
  const imageStyle =
    mode === "preview" && previewInset > 0
      ? {
          ...StyleSheet.absoluteFillObject,
          top: -previewInset,
          bottom: -previewInset,
        }
      : StyleSheet.absoluteFillObject;

  return <Image source={source} style={imageStyle} contentFit="fill" blurRadius={blurRadius} />;
}

const effectRenderers: Record<BackgroundEffectId, EffectRenderer> = {
  none: renderNone,
  effect1: renderEffect1,
  heartBgA: renderHeartBackground,
  speechBg1: renderSpeechBubble,
  speechBg2: renderSpeechBubble,
  nameBg: renderSpeechBubble,
  locationBg: renderSpeechBubble,
  todayBg: renderSpeechBubble,
};

/** 배경이펙트레이어용 */
export function BackgroundEffectLayer({
  effect,
  translateX,
  isPortrait,
  mode,
  suppressPixelManagedBackgrounds = false,
  blurRadius = 0,
}: BackgroundEffectLayerProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const isTablet = Math.min(winW, winH) >= TABLET_MIN_SHORTEST_SIDE_DP;
  const isFullscreen = mode === "fullscreen";
  const isFullscreenPortrait = isFullscreen && isPortrait;
  const renderEffect = effectRenderers[effect.id];

  return renderEffect({
    effect,
    translateX,
    isPortrait,
    mode,
    isTablet,
    isFullscreen,
    isFullscreenPortrait,
    suppressPixelManagedBackgrounds,
    blurRadius,
  });
}
