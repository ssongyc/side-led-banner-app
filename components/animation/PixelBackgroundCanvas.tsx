import { isSignBoardPreset } from "@/constants/signBoardPresets";
import {
  DOT_MATRIX_BACKGROUND_SKSL,
  DOT_MATRIX_PHOTO_BACKGROUND_SKSL,
  DOT_MATRIX_STATIC_OFF_SKSL,
  OFF_LED_UNIFORMS,
  resolveDefaultLedFromBackground,
} from "@/components/animation/backgroundDotShader";
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
  Skia,
  useImage,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

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
  fit = "cover",
}: {
  fit?: "cover" | "fill";
  uri: string | number;
  width: number;
  height: number;
}) {
  const image = useImage(uri);
  if (!image) return null;
  return (
    <Image image={image} x={0} y={0} width={width} height={height} fit={fit} />
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
}: PixelBackgroundCanvasProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const isTablet = Math.min(winW, winH) >= TABLET_MIN_SHORTEST_SIDE_DP;
  const isFullscreen = mode === "fullscreen";
  const isFullscreenPortrait = isFullscreen && isPortrait;
  const effectId = backgroundEffect.id;
  const isHeartBg = effectId === "heartBgA";
  const isEffect1 = effectId === "effect1";
  const isSpeechBg = isSpeechBubblePreset(effectId);
  const hasPhoto = hasBgPhoto && backgroundImageUri;
  const { backgroundShaderLayer, photoBackgroundShaderLayer, staticOffLayer } =
    usePixelDotShaderLayers(pixelShaderSize, backgroundColor);

  const speechBubbleSource = useMemo(
    () =>
      isSpeechBg ? resolveSpeechBubbleImageSource(effectId, mode, isPortrait) : null,
    [isSpeechBg, effectId, mode, isPortrait],
  );

  const speechPreviewInset = useMemo(() => {
    if (!isSpeechBg || mode !== "preview") return 0;
    const preset = SPEECH_BUBBLE_PRESETS[effectId];
    const platformPreset = Platform.OS === "ios" ? preset.ios : preset.android;
    return (platformPreset.previewHeightBoostPx ?? 0) / 2;
  }, [isSpeechBg, effectId, mode]);

  if (!isPixelEffect || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Canvas style={{ width, height }} opaque={false}>
        {/* Layer 0: 항상 최하단 — 꺼진 LED 격자 (배경 사진/이펙트 없는 영역에서 보임) */}
        <Group layer={staticOffLayer}>
          <Rect x={0} y={0} width={width} height={height} color={backgroundColor} />
        </Group>

        {/* Layer 1: 배경 사진 (있을 때만, pixel shader 적용) */}
        {hasPhoto ? (
          <Group layer={photoBackgroundShaderLayer}>
            <PixelBackgroundImage
              uri={backgroundImageUri!}
              width={width}
              height={height}
            />
            {showGradientBackdrop ? (
              <GradientBackdrop
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
              key={`gradient-${gradientBackgroundPreset}`}
              preset={gradientBackgroundPreset as GradientBackdropId}
              width={width}
              height={height}
              opacity={1}
            />
          </Group>
        ) : null}

        {/* Layer 2: 움직이는 이펙트 (투명 영역은 Layer 0 off-LED 격자가 비침) */}
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

        {isSignBoardPreset(effectId) && speechBubbleSource != null ? (
          <PixelBackgroundImage
            uri={speechBubbleSource}
            width={width}
            height={height}
            fit="fill"
          />
        ) : isSpeechBg && speechBubbleSource != null ? (
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

function usePixelDotShaderLayers(dotSize: number, backgroundColor: string) {
  const backgroundSource = useMemo(() => {
    const source = Skia.RuntimeEffect.Make(DOT_MATRIX_BACKGROUND_SKSL);
    if (!source) throw new Error("Failed to compile dot matrix background shader.");
    return source;
  }, []);
  const photoBackgroundSource = useMemo(() => {
    const source = Skia.RuntimeEffect.Make(DOT_MATRIX_PHOTO_BACKGROUND_SKSL);
    if (!source) throw new Error("Failed to compile photo background shader.");
    return source;
  }, []);
  const staticOffSource = useMemo(() => {
    const source = Skia.RuntimeEffect.Make(DOT_MATRIX_STATIC_OFF_SKSL);
    if (!source) throw new Error("Failed to compile static off LED shader.");
    return source;
  }, []);
  const pixelDotUniforms = useMemo(() => pixelLedDotUniforms(dotSize), [dotSize]);
  const defaultLedUniforms = useMemo(
    () => resolveDefaultLedFromBackground(backgroundColor),
    [backgroundColor],
  );
  const backgroundShaderLayer = useMemo(
    () => (
      <Paint>
        <RuntimeShader
          source={backgroundSource}
          uniforms={{ ...pixelDotUniforms, ...defaultLedUniforms }}
        />
      </Paint>
    ),
    [backgroundSource, pixelDotUniforms, defaultLedUniforms],
  );
  const photoBackgroundShaderLayer = useMemo(
    () => (
      <Paint>
        <RuntimeShader
          source={photoBackgroundSource}
          uniforms={pixelDotUniforms}
        />
      </Paint>
    ),
    [photoBackgroundSource, pixelDotUniforms],
  );
  const staticOffLayer = useMemo(
    () => (
      <Paint>
        <RuntimeShader
          source={staticOffSource}
          uniforms={{ ...pixelDotUniforms, ...OFF_LED_UNIFORMS }}
        />
      </Paint>
    ),
    [staticOffSource, pixelDotUniforms],
  );
  return { backgroundShaderLayer, photoBackgroundShaderLayer, staticOffLayer };
}
