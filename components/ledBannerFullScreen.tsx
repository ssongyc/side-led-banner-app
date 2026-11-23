import { BackgroundPhotoLayer } from "@/components/animation/BackgroundPhotoLayer";
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
import { usePlayRotation } from "@/hooks/usePlayRotation";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Modal,
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
  usesSensorRotation: boolean;
  onReady: () => void;
  onClose: () => void;
}

export const LedBannerFullScreen = ({
  visible,
  usesSensorRotation,
  onReady,
  onClose,
}: LedBannerFullScreenProps) => {
  const { appearance } = useSettingsAppearance();
  const { background } = useSettingsBackground();
  const { textSelectedColor, gradientBackgroundPreset, dropShadow } = appearance;
  const { backgroundColor, backgroundImageUri, backgroundBlur, backgroundPhotoViewMode } = background;

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const viewportWidth = stageSize.width > 0 ? stageSize.width : windowWidth;
  const viewportHeight = stageSize.height > 0 ? stageSize.height : windowHeight;
  const [deviceRotation, setDeviceRotation] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!visible) setDeviceRotation(0);
  }, [visible]);
  const onDeviceRotation = useCallback(
    ({ nativeEvent }: { nativeEvent: { degrees: number } }) => {
      if (visible) setDeviceRotation(nativeEvent.degrees);
    },
    [visible],
  );
  // Android reports the sensor angle relative to the current display rotation.
  const rotatesContent =
    usesSensorRotation && (Platform.OS === "android" || viewportHeight >= viewportWidth);
  const {
    rotation: contentRotation,
    textOpacity,
    backgroundRotate,
    backgroundScale,
    onLayout: onRotatedLayout,
  } = usePlayRotation(visible && rotatesContent, deviceRotation, viewportWidth, viewportHeight);
  const swapsAxes = contentRotation === 90 || contentRotation === 270;
  const stageWidth = swapsAxes ? viewportHeight : viewportWidth;
  const stageHeight = swapsAxes ? viewportWidth : viewportHeight;
  const isPortrait = stageHeight >= stageWidth;
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
  // Map the window's safe-area edges to the rotated content before shifting text.
  const insets = useSafeAreaInsets();
  const rawTextShiftX = [
    insets.left - insets.right,
    insets.top - insets.bottom,
    insets.right - insets.left,
    insets.bottom - insets.top,
  ][contentRotation / 90] ?? 0;
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
    fixedLayout: rotatesContent ? canvasFallback : undefined,
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
    dropShadow,
    backgroundColor,
  });

  const pixelBackgroundProps = useMemo(
    () =>
      buildPixelBackground({
        width: stageWidth,
        height: stageHeight,
        effects,
        backgroundColor,
        backgroundImageUri: backgroundImageUri ?? null,
        backgroundPhotoViewMode,
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
      backgroundColor,
      backgroundImageUri,
      backgroundPhotoViewMode,
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
        <View
          onLayout={rotatesContent ? onRotatedLayout : undefined}
          style={rotatesContent
            ? {
                position: "absolute",
                left: (viewportWidth - stageWidth) / 2,
                top: (viewportHeight - stageHeight) / 2,
                width: stageWidth,
                height: stageHeight,
                transform: [{ rotate: `${contentRotation}deg` }],
              }
            : styles.layerPassThrough}
          pointerEvents="box-none"
        >
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
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                rotatesContent && {
                  transform: [{ rotate: backgroundRotate }, { scale: backgroundScale }],
                },
              ]}
            >
              {backgroundImageUri && !effects.isPixelEffect ? (
                <BackgroundPhotoLayer
                  key={backgroundImageUri}
                  uri={backgroundImageUri}
                  width={stageWidth}
                  height={stageHeight}
                  blurRadius={backgroundBlur / 8}
                  viewMode={backgroundPhotoViewMode}
                />
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
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, rotatesContent && { opacity: textOpacity }]}
            >
              <PlaybackTextLayer
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
                layoutRevision={`${stageWidth}:${stageHeight}:${canvas.skiaCanvasLayout.width}:${canvas.skiaCanvasLayout.height}`}
                rotationMode={usesSensorRotation && isAnimationActive ? "device" : "paused"}
                onDeviceRotation={usesSensorRotation ? onDeviceRotation : undefined}
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
            </Animated.View>
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
