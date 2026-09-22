import { isSignBoardPreset } from "@/constants/signBoardPresets";
import { DOT_MATRIX_BACKGROUND_SKSL } from "@/components/animation/backgroundDotShader";
import { PixelEffect1Background } from "@/components/animation/PixelEffect1Background";
import { PixelHeartBackground } from "@/components/animation/PixelHeartBackground";
import { PixelSpeechBubbleFrame } from "@/components/animation/PixelSpeechBubbleFrame";
import {
  resolveSpeechBubbleImageSource,
  type BackgroundEffectImageMode,
} from "@/components/animation/resolveBackgroundEffectImage";
import { GradientBackdrop } from "@/components/skia/GradientBackdrop";
import { type GradientBackdropId } from "@/constants/gradientBackgroundPresets";
import { pixelLedDotUniforms } from "@/constants/pixelLed";
import {
  isSpeechBubblePreset,
  SPEECH_BUBBLE_PRESETS,
} from "@/constants/speechBubblePresets";
import type { BackgroundEffectAnimationResult } from "@/hooks/useBackgroundAnimation";
import {
  Canvas,
  Group,
  Image,
  Paint,
  Rect,
  RuntimeShader,
  useImage,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { getCachedSkiaRuntimeEffect } from "@/utils/skiaRuntimeEffectCache";

const TABLET_MIN_SHORTEST_SIDE_DP = 600;

export type PixelBackgroundCanvasProps = {
  width: number;
  height: number;
  isPixelEffect: boolean;
  pixelShaderSize: number;
  showGradientBackdrop: boolean;
  gradientBackgroundPreset: string;
  hasBgPhoto: boolean;
  backgroundColor: string;
  backgroundImageUri?: string | null;
  backgroundEffect: BackgroundEffectAnimationResult;
  translateX: SharedValue<number>;
  isPortrait: boolean;
  mode: BackgroundEffectImageMode;
};

function PixelBackgroundImage({
  uri,
  width,
  height,
  fillViewport,
}: {
  uri: string;
  width: number;
  height: number;
  fillViewport: boolean;
}) {
  const image = useImage(uri);
  if (!image) return null;
  return (
    <>
      {fillViewport ? (
        <Image
          image={image}
          x={0}
          y={0}
          width={width}
          height={height}
          fit="cover"
        />
      ) : null}
      <Image image={image} x={0} y={0} width={width} height={height} fit="contain" />
    </>
  );
}

/** Pixel배경캔버스용 */
export function PixelBackgroundCanvas({
  width,
  height,
  isPixelEffect,
  pixelShaderSize,
  showGradientBackdrop,
  gradientBackgroundPreset,
  hasBgPhoto,
  backgroundColor,
  backgroundImageUri,
  backgroundEffect,
  translateX,
  isPortrait,
  mode,
  isActive,
}: PixelBackgroundCanvasProps & { isActive: boolean }) {
  const { width: winW, height: winH } = useWindowDimensions();
  const isTablet = Math.min(winW, winH) >= TABLET_MIN_SHORTEST_SIDE_DP;
  const isFullscreen = mode === "fullscreen";
  const isFullscreenPortrait = isFullscreen && isPortrait;
  const effectId = backgroundEffect.id;
  const isHeartBg = effectId === "heartBgA";
  const isEffect1 = effectId === "effect1";
  const isSpeechBg = isSpeechBubblePreset(effectId);
  const isPixelManagedSpeechBg = isSpeechBg && !isSignBoardPreset(effectId);
  const hasPhoto = hasBgPhoto && backgroundImageUri;
  const { backgroundShaderLayer, photoBackgroundShaderLayer } =
    usePixelDotShaderLayers(pixelShaderSize);

  const speechBubbleSource = useMemo(
    () =>
      isPixelManagedSpeechBg
        ? resolveSpeechBubbleImageSource(effectId, mode, isPortrait)
        : null,
    [isPixelManagedSpeechBg, effectId, mode, isPortrait],
  );

  const speechPreviewInset = useMemo(() => {
    if (!isPixelManagedSpeechBg || mode !== "preview") return 0;
    const preset = SPEECH_BUBBLE_PRESETS[effectId];
    const platformPreset = Platform.OS === "ios" ? preset.ios : preset.android;
    return (platformPreset.previewHeightBoostPx ?? 0) / 2;
  }, [isPixelManagedSpeechBg, effectId, mode]);

  if (!isPixelEffect || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width, height }} opaque={false}>
        {/* Layer 0: clean selected background; pixel gaps reveal this color. */}
        <Rect x={0} y={0} width={width} height={height} color={backgroundColor} />

        {/* Layer 1: 배경 사진 (있을 때만, pixel shader 적용) */}
        {hasPhoto ? (
          <Group layer={photoBackgroundShaderLayer}>
            <PixelBackgroundImage
              uri={backgroundImageUri!}
              width={width}
              height={height}
              fillViewport={isFullscreen}
            />
            {showGradientBackdrop ? (
              <GradientBackdrop
                isActive={isActive}
                key={`gradient-${gradientBackgroundPreset}`}
                preset={gradientBackgroundPreset as GradientBackdropId}
                width={width}
                height={height}
                opacity={0.4}
              />
            ) : null}
          </Group>
        ) : showGradientBackdrop ? (
          <Group layer={photoBackgroundShaderLayer}>
            <GradientBackdrop
              isActive={isActive}
              key={`gradient-${gradientBackgroundPreset}`}
              preset={gradientBackgroundPreset as GradientBackdropId}
              width={width}
              height={height}
              opacity={1}
            />
          </Group>
        ) : null}

        {/* Layer 2: 움직이는 이펙트; 투명 영역에는 선택한 배경이 보임 */}
        {isEffect1 && backgroundEffect.sources != null ? (
          <Group layer={backgroundShaderLayer}>
            <PixelEffect1Background
              sources={backgroundEffect.sources}
              width={width}
              height={height}
              isFullscreenPortrait={isFullscreenPortrait}
            />
          </Group>
        ) : null}

        {/* 하트 배경은 도트 셰이더 없음 */}
        {isHeartBg && backgroundEffect.imageSource != null ? (
          <PixelHeartBackground
            heartSource={backgroundEffect.imageSource}
            width={width}
            height={height}
            translateX={translateX}
            isTablet={isTablet}
            isFullscreen={isFullscreen}
            isFullscreenPortrait={isFullscreenPortrait}
            isPortrait={isPortrait}
          />
        ) : null}

        {isPixelManagedSpeechBg && speechBubbleSource != null ? (
          <PixelSpeechBubbleFrame
            source={speechBubbleSource}
            width={width}
            height={height}
            previewInset={speechPreviewInset}
            pixelShaderSize={pixelShaderSize}
            useWhiteDots={!showGradientBackdrop}
          />
        ) : null}
      </Canvas>
    </View>
  );
}

function usePixelDotShaderLayers(dotSize: number) {
  const backgroundSource = useMemo(
    () =>
      getCachedSkiaRuntimeEffect(
        DOT_MATRIX_BACKGROUND_SKSL,
        "Failed to compile dot matrix background shader.",
      ),
    [],
  );
  const pixelDotUniforms = useMemo(() => pixelLedDotUniforms(dotSize), [dotSize]);
  const backgroundShaderLayer = useMemo(
    () => (
      <Paint>
        <RuntimeShader
          source={backgroundSource}
          uniforms={pixelDotUniforms}
        />
      </Paint>
    ),
    [backgroundSource, pixelDotUniforms],
  );
  const photoBackgroundShaderLayer = useMemo(
    () => (
      <Paint>
        <RuntimeShader
          source={backgroundSource}
          uniforms={pixelDotUniforms}
        />
      </Paint>
    ),
    [backgroundSource, pixelDotUniforms],
  );
  return { backgroundShaderLayer, photoBackgroundShaderLayer };
}
