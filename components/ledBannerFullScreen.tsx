import { BackgroundEffectLayer } from "@/components/animation/BackgroundEffectLayer";
import { MarqueeCanvas } from "@/components/animation/MarqueeCanvas";
import { GradientBackdrop } from "@/components/skia/GradientBackdrop";
import { type GradientBackdropId } from "@/constants/gradientBackgroundPresets";
import { ledBannerFullScreenStyles as styles } from "@/constants/styles";
import {
  useSettingsAppearance,
  useSettingsBackground,
} from "@/contexts/settingsContext";
import { useBackgroundAnimation } from "@/hooks/useBackgroundAnimation";
import { useBlinkOpacityStyle } from "@/hooks/useBlinkOpacityStyle";
import { useEffects } from "@/hooks/useEffects";
import { useHeartBackgroundScroll } from "@/hooks/useHeartBackgroundScroll";
import { useMarqueeAnimation } from "@/hooks/useMarqueeAnimation";
import { usePlaybackActive } from "@/hooks/usePlaybackActive";
import { usePreviewPanelCanvas } from "@/hooks/usePreviewPanelCanvas";
import {
  resolveSpeechCanvasFallback,
  useSpeechBubble,
} from "@/hooks/useSpeechBubble";
import { useTextMetrics } from "@/hooks/useTextMetrics";
import { resolveBubbleCanvasOpts } from "@/utils/skiaBubbleTextLayout";
import {
  hideAndroidNavigationBar,
} from "@/utils/SystemChrome";
import { getSizingPolicy } from "@/utils/textSizing";
import { Canvas } from "@shopify/react-native-skia";
import { Image, type ImageLoadEventData } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { buildPixelBackground } from "./animation/buildPixelBackground";
import { PixelBackgroundCanvas } from "./animation/PixelBackgroundCanvas";
import { useMarqueeCanvasProps } from "./animation/useMarqueeCanvasProps";
import { PlaybackTextLayer } from "./PlaybackTextLayer";

interface LedBannerFullScreenProps {
  visible: boolean;
  onReady: () => void;
  onClose: () => void;
}

export const LedBannerFullScreen = ({
  visible,
  onReady,
  onClose,
}: LedBannerFullScreenProps) => {
  const { appearance } = useSettingsAppearance();
  const { background } = useSettingsBackground();
  const { textSelectedColor, gradientBackgroundPreset, dropShadow } = appearance;
  const { backgroundColor, backgroundImageUri, backgroundBlur } = background;
  const hasBgPhoto = backgroundImageUri != null && backgroundImageUri.length > 0;

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageWidth = stageSize.width > 0 ? stageSize.width : windowWidth;
  const stageHeight = stageSize.height > 0 ? stageSize.height : windowHeight;
  const isPortrait = stageHeight >= stageWidth;
  const [photoSize, setPhotoSize] = useState<{ uri: string; width: number; height: number } | null>(null);
  const onPhotoLoad = useCallback((event: ImageLoadEventData) => {
    if (!backgroundImageUri) return;
    const { width, height } = event.source;
    setPhotoSize({ uri: backgroundImageUri, width, height });
  }, [backgroundImageUri]);
  const photoTiles = useMemo(() => {
    if (!photoSize || photoSize.width <= 0 || photoSize.height <= 0) return null;
    const scale = Math.min(stageWidth / photoSize.width, stageHeight / photoSize.height);
    const tileWidth = photoSize.width * scale;
    const tileHeight = photoSize.height * scale;
    const originX = (stageWidth - tileWidth) / 2;
    const originY = (stageHeight - tileHeight) / 2;
    const countX = Math.ceil(originX / tileWidth);
    const countY = Math.ceil(originY / tileHeight);
    const tiles: { key: string; left: number; top: number; width: number; height: number }[] = [];
    for (let ix = -countX; ix <= countX; ix += 1) {
      for (let iy = -countY; iy <= countY; iy += 1) {
        const left = PixelRatio.roundToNearestPixel(originX + ix * tileWidth);
        const top = PixelRatio.roundToNearestPixel(originY + iy * tileHeight);
        tiles.push({
          key: `${ix}:${iy}`,
          left,
          top,
          width: PixelRatio.roundToNearestPixel(originX + (ix + 1) * tileWidth) - left,
          height: PixelRatio.roundToNearestPixel(originY + (iy + 1) * tileHeight) - top,
        });
      }
    }
    return tiles;
  }, [photoSize, stageWidth, stageHeight]);
  const readySent = useRef(false);
  useEffect(() => {
    if (!visible) readySent.current = false;
  }, [visible]);
  const reportReady = useCallback(() => {
    hideAndroidNavigationBar();
    if (!visible || readySent.current) return;
    readySent.current = true;
    onReady();
  }, [visible, onReady]);

  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  const onStageLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setStageSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
      if (width > 0 && height > 0 && Platform.OS !== "ios") reportReady();
    },
    [reportReady],
  );

  const isAnimationActive = usePlaybackActive(visible);
  useEffect(() => {
    if (!isAnimationActive) return;
    // Reapply after rotation/resume on the active Play window.
    hideAndroidNavigationBar();
  }, [isAnimationActive, windowWidth, windowHeight, stageWidth, stageHeight]);

  const backgroundEdgeEffectAnim = useBackgroundAnimation(isAnimationActive);
  const sizingPolicy = useMemo(
    () => getSizingPolicy({ effectId: backgroundEdgeEffectAnim.id }),
    [backgroundEdgeEffectAnim.id],
  );

  const speechBubble = useSpeechBubble({
    speechBubbleId: sizingPolicy.speechBubbleId,
    effectId: backgroundEdgeEffectAnim.id,
    isPortrait,
    basisWidthPx: stageWidth,
    viewportHeight: stageHeight,
  });

  const {
    effectiveLineSpacing,
    previewFontSize,
    fullscreenLineHeightRatio,
  } = useTextMetrics({
    mode: "fullscreen",
    sizingPolicy,
    isSpeechBgActive: speechBubble.isActive,
    speechMaxHeight: speechBubble.maxTextHeight,
    windowWidth: stageWidth,
    windowHeight: stageHeight,
    isPortrait,
  });

  const effects = useEffects({ fontSizePx: previewFontSize });

  const speechBubbleCanvasLayout = useMemo(
    () =>
      resolveBubbleCanvasOpts({
        isSpeechActive: speechBubble.isActive,
        isPixelEffect: effects.isPixelEffect,
        pixelShaderSize: effects.pixelShaderSize,
        speechBubbleId: sizingPolicy.speechBubbleId,
      }),
    [
      speechBubble.isActive,
      effects.isPixelEffect,
      effects.pixelShaderSize,
      sizingPolicy.speechBubbleId,
    ],
  );

  const backgroundTranslateX = useHeartBackgroundScroll(isAnimationActive);

  const marqueeViewportWidthPx =
    speechBubble.speechBoxPx?.widthPx ?? stageWidth;

  const { displayText, translateX, onTextLayout, SPACER } = useMarqueeAnimation({
    isActive: isAnimationActive,
    viewportWidthPx: marqueeViewportWidthPx,
    effectBleedPx: effects.effectSpacePx,
  });

  const { opacity: blinkOpacity } = useBlinkOpacityStyle(isAnimationActive);
  //가로 모드 시, 가장자리 <-> 노치 사이의 영역에 텍스트 잘림 방지
  const insets = useSafeAreaInsets();
  const rawTextShiftX = insets.left - insets.right;
  const textShiftX =
    effects.isPixelEffect && effects.pixelShaderSize > 0
      ? Math.sign(rawTextShiftX) *
        Math.ceil(Math.abs(rawTextShiftX) / effects.pixelShaderSize) *
        effects.pixelShaderSize
      : rawTextShiftX;

  const canvasFallback = useMemo(
    () =>
      resolveSpeechCanvasFallback(speechBubble.speechBoxPx, {
        width: stageWidth,
        height: stageHeight,
      }),
    [speechBubble.speechBoxPx, stageWidth, stageHeight],
  );

  const canvas = usePreviewPanelCanvas({
    displayText,
    translateX,
    onTextLayout,
    previewFontSize,
    appearanceFontOverride: effects.pixelSkiaFontOverride,
    lineSpacingPx: effectiveLineSpacing,
    fallbackLayout: canvasFallback,
    lineHeightRatio: fullscreenLineHeightRatio,
    isPixelMode: effects.isPixelEffect,
    speechBubbleLayout: speechBubbleCanvasLayout,
  });

  const marqueeCanvasProps = useMarqueeCanvasProps({
    canvas,
    effects,
    blinkOpacity,
    spacer: SPACER,
    previewTextColor: textSelectedColor,
    hasBgPhoto,
    dropShadow,
    backgroundColor,
  });

  const pixelBackgroundProps = useMemo(
    () =>
      buildPixelBackground({
        width: stageWidth,
        height: stageHeight,
        effects,
        hasBgPhoto,
        backgroundColor,
        backgroundImageUri: backgroundImageUri ?? null,
        gradientBackgroundPreset,
        backgroundEffect: backgroundEdgeEffectAnim,
        translateX: backgroundTranslateX,
        isPortrait,
        mode: "fullscreen",
      }),
    [
      stageWidth,
      stageHeight,
      effects,
      hasBgPhoto,
      backgroundColor,
      backgroundImageUri,
      gradientBackgroundPreset,
      backgroundEdgeEffectAnim,
      backgroundTranslateX,
      isPortrait,
    ],
  );

  const content = (
    <>
      <StatusBar hidden />
      <View
        style={[styles.root, { backgroundColor }]}
        onLayout={onStageLayout}
        onTouchStart={hideAndroidNavigationBar}
      >
        <View style={styles.layerPassThrough} pointerEvents="box-none">
          <View
            collapsable={false}
            style={[
              styles.flex,
              {
                // Cover newly exposed bounds while the GPU surface resizes.
                backgroundColor,
                justifyContent: "flex-start",
                overflow: "hidden",
              },
            ]}
            pointerEvents="box-none"
          >
            {hasBgPhoto && !effects.isPixelEffect ? (
              photoTiles && photoSize?.uri === backgroundImageUri ? (
                photoTiles.map(tile => (
                  <Image
                    key={tile.key}
                    source={{ uri: backgroundImageUri }}
                    style={{
                      position: "absolute",
                      left: tile.left,
                      top: tile.top,
                      width: tile.width,
                      height: tile.height,
                    }}
                    contentFit="cover"
                    blurRadius={backgroundBlur / 8}
                  />
                ))
              ) : (
                <Image
                  source={{ uri: backgroundImageUri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                  blurRadius={backgroundBlur / 8}
                  onLoad={onPhotoLoad}
                />
              )
            ) : null}
            {effects.isPixelEffect ? (
              <PixelBackgroundCanvas {...pixelBackgroundProps} isActive={isAnimationActive} />
            ) : null}
            {!effects.isPixelEffect && effects.showGradientBackdrop && stageWidth > 0 && stageHeight > 0 ? (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Canvas style={{ flex: 1 }} opaque={false}>
                  <GradientBackdrop
                    isActive={isAnimationActive}
                    key={`gradient-${gradientBackgroundPreset}`}
                    preset={gradientBackgroundPreset as GradientBackdropId}
                    width={stageWidth}
                    height={stageHeight}
                    blur={backgroundBlur / 8}
                  />
                </Canvas>
              </View>
            ) : null}
            <BackgroundEffectLayer
              effect={backgroundEdgeEffectAnim}
              translateX={backgroundTranslateX}
              isPortrait={isPortrait}
              mode="fullscreen"
              suppressPixelManagedBackgrounds={effects.isPixelEffect}
              blurRadius={backgroundBlur / 8}
            />
            <PlaybackTextLayer
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              layoutRevision={`${stageWidth}:${stageHeight}:${canvas.skiaCanvasLayout.width}:${canvas.skiaCanvasLayout.height}`}
            >
              {speechBubble.isActive ? (
                <View
                  style={{
                    ...StyleSheet.absoluteFill,
                    alignItems: "center",
                    ...(speechBubble.speechTextTop == null
                      ? { justifyContent: "center" }
                      : null),
                  }}
                  pointerEvents="none"
                >
                  <View
                    style={speechBubble.textContainerStyle!}
                    onLayout={canvas.onSkiaCanvasLayout}
                  >
                    <MarqueeCanvas
                      {...marqueeCanvasProps}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX: textShiftX }] },
                  ]}
                  onLayout={canvas.onSkiaCanvasLayout}
                >
                  <MarqueeCanvas
                    {...marqueeCanvasProps}
                  />
                </View>
              )}
            </PlaybackTextLayer>
          </View>
        </View>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close fullscreen"
        />
      </View>
    </>
  );

  // Android shares the Activity's rotation transaction with the editor instead
  // of resizing a Dialog window independently and exposing the editor beneath it.
  if (Platform.OS !== "ios") return visible ? content : null;
  return (
    <Modal
      visible={visible}
      onShow={reportReady}
      animationType="none"
      presentationStyle="fullScreen"
      backdropColor={backgroundColor}
      supportedOrientations={["portrait", "landscape"]}
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
};
