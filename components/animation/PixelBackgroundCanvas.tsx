import {
  BACKGROUND_PHOTO_MARGIN_BLUR,
  getBackgroundPhotoZoomFrame,
  type BackgroundPhotoViewMode,
} from "@/utils/backgroundPhotoLayout";
import { isSignBoardPreset } from "@/constants/signBoardPresets";
import {
  DOT_MATRIX_BACKGROUND_SKSL,
  DOT_MATRIX_PHOTO_BACKGROUND_SKSL,
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
  Blur,
  Canvas,
  Fill,
  Group,
  Image,
  ImageShader,
  Paint,
  Rect,
  RuntimeShader,
  useImage,
} from "@shopify/react-native-skia";
import { useCallback, useMemo } from "react";
import { Platform, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import { useDerivedValue, useSharedValue, type SharedValue } from "react-native-reanimated";
import { getCachedSkiaRuntimeEffect } from "@/utils/skiaRuntimeEffectCache";

const TABLET_MIN_SHORTEST_SIDE_DP = 600;

export type PixelBackgroundCanvasProps = {
  width: number;
  height: number;
  isPixelEffect: boolean;
  pixelShaderSize: number;
  showGradientBackdrop: boolean;
  gradientBackgroundPreset: string;
  backgroundColor: string;
  backgroundImageUri: string | null;
  backgroundPhotoViewMode: BackgroundPhotoViewMode;
  backgroundEffect: BackgroundEffectAnimationResult;
  translateX: SharedValue<number>;
  isPortrait: boolean;
  mode: BackgroundEffectImageMode;
};

function PixelBackgroundImage({
  uri,
  width,
  height,
  viewMode,
}: {
  uri: string;
  width: number;
  height: number;
  viewMode: BackgroundPhotoViewMode;
}) {
  const image = useImage(uri);
  if (!image) return null;
  if (viewMode === "repeat") {
    return (
      <Rect x={0} y={0} width={width} height={height}>
        <ImageShader
          image={image}
          fit="contain"
          rect={{ x: 0, y: 0, width, height }}
          tx="repeat"
          ty="repeat"
        />
      </Rect>
    );
  }
  const frame = getBackgroundPhotoZoomFrame(width, height, image.width(), image.height());
  return (
    <>
      {frame ? (
        <Group
          layer={(
            <Paint>
              <Blur blur={BACKGROUND_PHOTO_MARGIN_BLUR} mode="clamp" />
            </Paint>
          )}
        >
          <Image image={image} x={0} y={0} width={width} height={height} fit="cover" />
        </Group>
      ) : null}
      <Image image={image} {...(frame ?? { x: 0, y: 0, width, height })} fit="cover" />
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
  backgroundColor,
  backgroundImageUri,
  backgroundPhotoViewMode,
  backgroundEffect,
  translateX,
  isPortrait,
  mode,
  isActive,
}: PixelBackgroundCanvasProps & { isActive: boolean }) {
  const { width: winW, height: winH } = useWindowDimensions();
  const isTablet = Math.min(winW, winH) >= TABLET_MIN_SHORTEST_SIDE_DP;
  const isFullscreen = mode === "fullscreen";
  const surfaceSize = useSharedValue({ width: 0, height: 0 });
  const onSurfaceLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    surfaceSize.set({ width, height });
  }, [surfaceSize]);
  // Wrapper layout is in canvas coordinates. Canvas.onSize uses a measurement
  // that includes Play's parent rotation and swaps the axes on quarter turns.
  // Keep the last scene covering the surface until the scene dimensions update.
  const surfaceTransform = useDerivedValue(() => [
    { scaleX: isFullscreen && width > 0 && surfaceSize.value.width > 0 ? surfaceSize.value.width / width : 1 },
    { scaleY: isFullscreen && height > 0 && surfaceSize.value.height > 0 ? surfaceSize.value.height / height : 1 },
  ], [isFullscreen, width, height]);
  const isFullscreenPortrait = isFullscreen && isPortrait;
  const effectId = backgroundEffect.id;
  const isHeartBg = effectId === "heartBgA";
  const isEffect1 = effectId === "effect1";
  const isSpeechBg = isSpeechBubblePreset(effectId);
  const isPixelManagedSpeechBg = isSpeechBg && !isSignBoardPreset(effectId);
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
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={isFullscreen ? onSurfaceLayout : undefined}
    >
      <Canvas
        style={isFullscreen ? StyleSheet.absoluteFill : { width, height }}
        opaque={false}
      >
        {/* Selected background remains visible outside photo/effect coverage. */}
        <Fill color={backgroundColor} />
        <Group transform={surfaceTransform}>

        {/* Layer 1: 배경 사진 (있을 때만, pixel shader 적용) */}
        {backgroundImageUri ? (
          <Group layer={photoBackgroundShaderLayer}>
            <PixelBackgroundImage
              uri={backgroundImageUri}
              width={width}
              height={height}
              viewMode={backgroundPhotoViewMode}
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
          <Group layer={backgroundShaderLayer}>
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
        </Group>
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
  const photoSource = useMemo(
    () =>
      getCachedSkiaRuntimeEffect(
        DOT_MATRIX_PHOTO_BACKGROUND_SKSL,
        "Failed to compile photo dot matrix background shader.",
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
          source={photoSource}
          uniforms={pixelDotUniforms}
        />
      </Paint>
    ),
    [photoSource, pixelDotUniforms],
  );
  return { backgroundShaderLayer, photoBackgroundShaderLayer };
}
