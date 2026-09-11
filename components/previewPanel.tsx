import { useHeartBackgroundScroll } from "@/hooks/useHeartBackgroundScroll";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { isSignBoardPreset } from "@/constants/signBoardPresets";
import { DeleteAllButton } from "@/assets/svg/deleteAllButton";
import { GradientBackdrop } from "@/components/skia/GradientBackdrop";
import { btnStyles } from "@/constants/btnStyles";
import { type GradientBackdropId } from "@/constants/gradientBackgroundPresets";
import {
  CONTENTS_INPUT_FONT_SIZE,
  styles,
  toolbarStyles,
} from "@/constants/styles";
import {
  normalizePreviewTextMaxLines,
  PREVIEW_TEXT_MAX_LINES,
  useSettings,
} from "@/contexts/settingsContext";
import { useBackgroundAnimation } from "@/hooks/useBackgroundAnimation";
import { useBlinkOpacityStyle } from "@/hooks/useBlinkOpacityStyle";
import { useEffects } from "@/hooks/useEffects";
import { usePlaybackActive } from "@/hooks/usePlaybackActive";
import { useMarqueeAnimation } from "@/hooks/useMarqueeAnimation";
import { usePreviewPanelCanvas } from "@/hooks/usePreviewPanelCanvas";
import {
  resolveSpeechCanvasFallback,
  useSpeechBubble,
} from "@/hooks/useSpeechBubble";
import { useTextHistory, type TextSnapshot } from "@/hooks/useTextHistory";
import { useTextInput } from "@/hooks/useTextInput";
import { useTextMetrics } from "@/hooks/useTextMetrics";
import { resolveBubbleCanvasOpts } from "@/utils/skiaBubbleTextLayout";
import { getSizingPolicy } from "@/utils/textSizing";
import { Canvas } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { LinearGradient as LinearGradientExpo } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View
} from "react-native";
import { BackgroundEffectLayer } from "./animation/BackgroundEffectLayer";
import { useMarqueeCanvasProps } from "./animation/useMarqueeCanvasProps";
import { buildPixelBackground } from "./animation/buildPixelBackground";
import { MarqueeCanvas } from "./animation/MarqueeCanvas";
import { PixelBackgroundCanvas } from "./animation/PixelBackgroundCanvas";

const inputAccessoryViewID = "doneAccessory";
const EDITOR_DISPLAY_HEIGHT_RATIO = 0.31;
const INPUT_AREA_VERTICAL_SPACE = 12;

type LayoutEvent = {
  nativeEvent: { layout: { height: number; width: number } };
};

type PreviewPanelProps = {
  onCursorMovers?: (up: () => void, down: () => void) => void;
  onUndoRedoControl?: (undo: () => void, redo: () => void) => void;
  onUndoRedoStateChange?: (canUndo: boolean, canRedo: boolean) => void;
};

//  이전/새 텍스트를 비교해 편집이 끝난 위치(캐럿)를 커서 위치로
function afterEdit(oldText: string, newText: string): number {
  const maxPrefix = Math.min(oldText.length, newText.length);
  let prefixLen = 0;
  while (prefixLen < maxPrefix && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (
    oldEnd > prefixLen &&
    newEnd > prefixLen &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  return newEnd;
}

const LOCK_ICON = require("@/assets/images/icon_lock_type2.png");

export default function PreviewPanel({ onCursorMovers, onUndoRedoControl, onUndoRedoStateChange }: PreviewPanelProps) {
  const [previewBox, setPreviewBox] = useState({ width: 0, height: 0 });
  const previewHeight = previewBox.height;
  const [inputScrollViewportW, setInputScrollViewportW] = useState(0);

  const {
    config,
    handleTextChange,
    updateConfig,
    ui,
    loadPreset,
    isProActive,
    openRewardAdModal,
  } = useSettings();
  const { activePreset } = ui;

  const { previewText } = config.content;
  const { textSelectedColor, gradientBackgroundPreset, dropShadow } =
    config.appearance;
  const { backgroundColor, backgroundImageUri, backgroundBlur } =
    config.background;
  const hasBgPhoto =
    backgroundImageUri != null && backgroundImageUri.length > 0;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPortrait = windowHeight >= windowWidth;

  const isAnimationActive = usePlaybackActive(!ui.isPlaying);
  const backgroundEdgeEffectAnim = useBackgroundAnimation(isAnimationActive);
  const sizingPolicy = useMemo(
    () => getSizingPolicy({ effectId: backgroundEdgeEffectAnim.id }),
    [backgroundEdgeEffectAnim.id],
  );

  const speechBubble = useSpeechBubble({
    speechBubbleId: sizingPolicy.speechBubbleId,
    effectId: backgroundEdgeEffectAnim.id,
    // The editor preview uses the landscape artwork even on a portrait phone.
    isPortrait: isSignBoardPreset(backgroundEdgeEffectAnim.id) ? false : isPortrait,
    basisWidthPx: previewBox.width,
    viewportHeight: previewHeight,
  });

  const { effectiveLineSpacing, previewFontSize } = useTextMetrics({
    mode: "preview",
    previewHeight,
    sizingPolicy,
    isSpeechBgActive: speechBubble.isActive,
    speechMaxHeight: speechBubble.maxTextHeight,
  });

  const effects = useEffects({ fontSizePx: previewFontSize });

  const backgroundTranslateX = useHeartBackgroundScroll(isAnimationActive);

  const marqueeViewportWidthPx =
    speechBubble.speechBoxPx?.widthPx ?? previewBox.width;

  const { displayText, translateX, onTextLayout, SPACER } = useMarqueeAnimation(
    {
      isActive: isAnimationActive,
      viewportWidthPx: marqueeViewportWidthPx,
      effectBleedPx: effects.effectSpacePx,
    },
  );

  const canvasFallback = useMemo(
    () => resolveSpeechCanvasFallback(speechBubble.speechBoxPx, previewBox),
    [speechBubble.speechBoxPx, previewBox],
  );

  const canvas = usePreviewPanelCanvas({
    displayText,
    translateX,
    onTextLayout,
    previewFontSize,
    appearanceFontOverride: effects.pixelSkiaFontOverride,
    lineSpacingPx: effectiveLineSpacing,
    fallbackLayout: canvasFallback,
    isPixelMode: effects.isPixelEffect,
    speechBubbleLayout: resolveBubbleCanvasOpts({
      isSpeechActive: speechBubble.isActive,
      isPixelEffect: effects.isPixelEffect,
      pixelShaderSize: effects.pixelShaderSize,
      speechBubbleId: sizingPolicy.speechBubbleId,
    }),
  });

  const { opacity: blinkOpacity } = useBlinkOpacityStyle(isAnimationActive);

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
        width: previewBox.width,
        height: previewBox.height,
        effects,
        hasBgPhoto,
        backgroundColor,
        backgroundImageUri: backgroundImageUri ?? null,
        gradientBackgroundPreset,
        backgroundEffect: backgroundEdgeEffectAnim,
        translateX: backgroundTranslateX,
        isPortrait,
        mode: "preview",
      }),
    [
      previewBox.width,
      previewBox.height,
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

  const onPreviewLayout = useCallback((e: LayoutEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPreviewBox((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  const onInputScrollLayout = useCallback((e: LayoutEvent) => {
    const { width } = e.nativeEvent.layout;
    setInputScrollViewportW((prev) => (prev === width ? prev : width));
  }, []);

  const textInputRef = useRef<TextInput>(null);

  const {
    displayInputText,
    inputHorizontalCanvasWidth,
    needsHorizontalScroll,
    inputScrollRef,
    handleMeasureLayout,
    measureOffscreenStyle,
    onInputScroll,
    inputViewportHeightPx,
    inputFontFamily,
    moveCursorUp,
    moveCursorDown,
  } = useTextInput({ inputScrollViewportW, textInputRef });

  const previewContainerHeight =
    Math.round(windowHeight * EDITOR_DISPLAY_HEIGHT_RATIO) +
    inputViewportHeightPx +
    INPUT_AREA_VERTICAL_SPACE;

  const history = useTextHistory(previewText);

  useEffect(() => {
    onCursorMovers?.(moveCursorUp, moveCursorDown);
  }, [onCursorMovers, moveCursorUp, moveCursorDown]);

  useEffect(() => {
    onUndoRedoStateChange?.(history.canUndo, history.canRedo);
  }, [history.canUndo, history.canRedo, onUndoRedoStateChange]);

  const handleUndo = useCallback(() => {
    const snapshot = history.undo();
    if (!snapshot) return;
    updateConfig("content", { previewText: snapshot.text });
    const safeStart = Math.min(snapshot.sel.start, snapshot.text.length);
    const safeEnd = Math.min(snapshot.sel.end, snapshot.text.length);
    setForcedSnapshot({ text: snapshot.text, sel: { start: safeStart, end: safeEnd } });
  }, [history, updateConfig]);

  const handleRedo = useCallback(() => {
    const snapshot = history.redo();
    if (!snapshot) return;
    updateConfig("content", { previewText: snapshot.text });
    const safeStart = Math.min(snapshot.sel.start, snapshot.text.length);
    const safeEnd = Math.min(snapshot.sel.end, snapshot.text.length);
    setForcedSnapshot({ text: snapshot.text, sel: { start: safeStart, end: safeEnd } });
  }, [history, updateConfig]);

  useEffect(() => {
    onUndoRedoControl?.(handleUndo, handleRedo);
  }, [onUndoRedoControl, handleUndo, handleRedo]);

  const isDark = useColorScheme() === "dark";
  const toolbarBg = isDark ? "#2c2c2e" : "#f1f1f1";
  const toolbarBtn = isDark ? "#ffffff" : "#2c2c2c";

  const setPreviewText = (text: string) =>
    updateConfig("content", { previewText: text });
  const inputSelectionRef = useRef({ start: 0, end: 0 });
  const [forcedSnapshot, setForcedSnapshot] = useState<TextSnapshot | undefined>(undefined);

  // onPreviewTextChange 내에서 항상 최신 displayInputText를 참조
  const displayInputTextRef = useRef(displayInputText);
  displayInputTextRef.current = displayInputText;

  const lineCount = previewText.replace(/\r\n?/g, "\n").split("\n").length;
  const atMaxLines = lineCount >= PREVIEW_TEXT_MAX_LINES;

  //3줄일 시 submit 버튼의 요청을 받지 않는다
  const [dynamicSubmitActive, setDynamicSubmitActive] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setDynamicSubmitActive(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setDynamicSubmitActive(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // 3줄일 때 onSubmitEditing 무시
  const handleSubmitEditing = () => { if (atMaxLines) return; };

  const onPreviewTextChange = (text: string) => {
    const currentText = displayInputTextRef.current;
    // iOS Japanese IME가 커서 이동 시에도 onChangeText를 발화하는 경우 차단
    // normalize()로 NFC/NFD 유니코드 정규화 차이도 같은 텍스트로 처리
    if (text.normalize() === currentText.normalize()) return;
    const next = normalizePreviewTextMaxLines(text);
    if (next === null) {
      // 붙여넣기 등으로 3줄 초과 시 되돌리기
      const revertSel = { ...inputSelectionRef.current };
      textInputRef.current?.setNativeProps({ text: currentText, selection: revertSel });
      setForcedSnapshot({ text: currentText, sel: revertSel });
      return;
    }
    setForcedSnapshot(undefined);
    handleTextChange(text);
    // onChangeText는 onSelectionChange보다 먼저 발화되므로 inputSelectionRef는
    // 아직 이전 글자 기준 커서 위치를 담고 있음 -> 변경 diff로 커서 위치를 직접 계산
    const caret = afterEdit(currentText, text);
    history.onTextChange(text, { start: caret, end: caret });
  };

  return (
    <View style={[styles.previewContainer, { height: previewContainerHeight }]}>
      {/* preview */}
      <View
        collapsable={false}
        style={[
          styles.preview,
          {
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor:
              effects.isPixelEffect ? undefined : backgroundColor,
          },
        ]}
        onLayout={onPreviewLayout}
      >
        {hasBgPhoto && !effects.isPixelEffect ? (
          <Image
            source={{ uri: backgroundImageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            blurRadius={backgroundBlur / 8}
          />
        ) : null}
        {effects.isPixelEffect &&
        previewBox.width > 0 &&
        previewBox.height > 0 ? (
          <PixelBackgroundCanvas {...pixelBackgroundProps} />
        ) : null}
        {!effects.isPixelEffect &&
        effects.showGradientBackdrop &&
        previewBox.width > 0 &&
        previewBox.height > 0 ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={{ flex: 1 }} opaque={false}>
              <GradientBackdrop
                key={`gradient-${gradientBackgroundPreset}`}
                preset={gradientBackgroundPreset as GradientBackdropId}
                width={previewBox.width}
                height={previewBox.height}
                blur={backgroundBlur / 8}
              />
            </Canvas>
          </View>
        ) : null}
        <BackgroundEffectLayer
          effect={backgroundEdgeEffectAnim}
          translateX={backgroundTranslateX}
          isPortrait={isPortrait}
          mode="preview"
          suppressPixelManagedBackgrounds={effects.isPixelEffect}
          blurRadius={backgroundBlur / 8}
        />
        {speechBubble.speechTextBoxConfig ? (
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
              <MarqueeCanvas {...marqueeCanvasProps} />
            </View>
          </View>
        ) : (
          <View
            style={StyleSheet.absoluteFill}
            onLayout={canvas.onSkiaCanvasLayout}
          >
            <MarqueeCanvas {...marqueeCanvasProps} />
          </View>
        )}
      </View>

      {/* preset buttons */}
      <View style={styles.presetButtonsContainer}>
        {[1, 2, 3, 4, 5].map((num, index) => {
          const isLocked = !isProActive && num >= 2;
          return (
            <TouchableOpacity
              key={index}
              style={
                index === activePreset
                  ? btnStyles.presetButtonActive
                  : btnStyles.presetButton
              }
              onPress={() =>
                isLocked ? openRewardAdModal() : loadPreset(index)
              }
              accessibilityLabel={`Preset ${index + 1}`}
            >
              <LinearGradientExpo
                colors={
                  index === activePreset
                    ? ["white", "#CCCCCC"]
                    : ["white", "#727272"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0.1, y: 0.2 }}
                style={btnStyles.presetButtonGradient}
              >
                <Text
                  allowFontScaling={false}
                  style={
                    index === activePreset
                      ? btnStyles.presetButtonActiveText
                      : btnStyles.presetButtonText
                  }
                >
                  {num}
                </Text>
              </LinearGradientExpo>
              {isLocked && (
                <View style={btnStyles.presetButtonLockOverlay}>
                  <Image source={LOCK_ICON} style={btnStyles.presetButtonLockIcon} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* contents input container */}
      <View
        id="contentsInputContainer"
        style={[
          styles.contentsInputContainer,
          { height: inputViewportHeightPx },
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[styles.contentsInput, measureOffscreenStyle]}
          onTextLayout={handleMeasureLayout}
          pointerEvents="none"
        >
          {Platform.OS === "ios" && displayInputText.endsWith("\n")
            ? `${displayInputText} `
            : displayInputText || " "}
        </Text>
        <ScrollView
          ref={inputScrollRef}
          horizontal
          nestedScrollEnabled
          scrollEnabled={needsHorizontalScroll}
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={needsHorizontalScroll}
          scrollEventThrottle={16}
          onScroll={onInputScroll}
          style={{ flex: 0.9, height: inputViewportHeightPx }}
          contentContainerStyle={{ flexGrow: 1 }}
          onLayout={onInputScrollLayout}
          {...(Platform.OS === "ios"
            ? {
                scrollIndicatorInsets: { right: 1 },
                indicatorStyle: "white" as const,
              }
            : {})}
          {...(Platform.OS === "android" ? { persistentScrollbar: true } : {})}
        >
          <TextInput
            ref={textInputRef}
            editable
            allowFontScaling={false}
            multiline={true}
            scrollEnabled={false}
            style={[
              styles.contentsInput,
              {
                flex: 0,
                width: inputHorizontalCanvasWidth,
                paddingTop: 2,
                paddingBottom: 2,
                fontSize: CONTENTS_INPUT_FONT_SIZE,
                fontFamily: inputFontFamily,
              },
            ]}
            placeholder="Enter your text here"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            textContentType="none"
            importantForAutofill="no"
            value={forcedSnapshot?.text ?? displayInputText}
            selection={forcedSnapshot?.sel}
            submitBehavior={dynamicSubmitActive ? (atMaxLines ? "submit" : "newline") : "newline"}
            onSubmitEditing={handleSubmitEditing}
            onChangeText={onPreviewTextChange}
            onSelectionChange={(e) => {
              const { start, end } = e.nativeEvent.selection;
              inputSelectionRef.current = { start, end };
              if (forcedSnapshot !== undefined) setForcedSnapshot(undefined);
            }}
            textAlignVertical="top"
            inputAccessoryViewID={Platform.OS === "ios" ? inputAccessoryViewID : undefined}
          />
        </ScrollView>
        
        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID={inputAccessoryViewID}>
            <View style={[styles.accessoryBar, { backgroundColor: toolbarBg }]}>
              <View style={toolbarStyles.cursorNavContainer}>
                <TouchableOpacity
                  onPress={handleUndo}
                  style={toolbarStyles.cursorNavButton}
                  disabled={!history.canUndo}
                  accessible={false}
                  focusable={false}
                >
                  <MaterialIcons allowFontScaling={false} name="undo" size={styles.accessoryClose.fontSize} color={toolbarBtn} style={{ opacity: history.canUndo ? 1 : 0.3 }} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRedo}
                  style={toolbarStyles.cursorNavButton}
                  disabled={!history.canRedo}
                  accessible={false}
                  focusable={false}
                >
                  <MaterialIcons allowFontScaling={false} name="redo" size={styles.accessoryClose.fontSize} color={toolbarBtn} style={{ opacity: history.canRedo ? 1 : 0.3 }} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={Keyboard.dismiss} hitSlop={8}>
                <MaterialIcons
                  allowFontScaling={false}
                  name="check"
                  size={styles.accessoryClose.fontSize}
                  color={toolbarBtn}
                  style={{ opacity: 1 }}
                />
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
        <View
          id="contentsInputResetButtonContainer"
          style={styles.contentsInputResetButtonContainer}
        >
          <TouchableOpacity
            onPress={() => {
              history.commitSnapshot(previewText, inputSelectionRef.current);
              setPreviewText("");
              history.onTextChange("", { start: 0, end: 0 });
            }}
            style={btnStyles.contentsInputResetButton}
          >
            <DeleteAllButton />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
