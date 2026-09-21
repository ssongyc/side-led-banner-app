import {
  appFontFamilyForText,
  getDefaultForLocale,
} from "@/constants/appFonts";
import {
  CONTENTS_INPUT_FONT_SIZE,
  CONTENTS_INPUT_VIEWPORT_HEIGHT,
} from "@/constants/styles";
import {
  useSettingsContent,
  useSettingsLocalizationContext,
} from "@/contexts/settingsContext";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Platform, ScrollView, TextInput, TextLayoutEvent, useWindowDimensions } from "react-native";

const TEXT_MEASURE_OFFSCREEN_LEFT = -100_000;
const INPUT_WIDTH_CURSOR_PAD = 28;
const TEXT_INPUT_VERTICAL_PADDING = 0;

function stripLegacyInputMarkers(text: string): string {
  return text.replace(/↵/g, "");
}

export function useTextInput(params: {
  inputScrollViewportW: number;
  textInputRef: RefObject<TextInput | null>;
}) {
  const { inputScrollViewportW } = params;
  const { content } = useSettingsContent();
  const { resolvedAppLocale: appLocale } = useSettingsLocalizationContext();
  const { previewText } = content;
  const { width: windowWidth } = useWindowDimensions();

  // 텍스트인풋은 항상 언어별 기본 폰트로만 표시 + 3줄
  const inputFontFamily = appFontFamilyForText(
    getDefaultForLocale(appLocale),
    "normal",
    appLocale,
  );
  const inputViewportHeightPx = CONTENTS_INPUT_VIEWPORT_HEIGHT + TEXT_INPUT_VERTICAL_PADDING;

  const [measuredTextMaxW, setMeasuredTextMaxW] = useState(0);

  const inputScrollRef = useRef<ScrollView>(null);
  const inputScrollXRef = useRef(0);

  const displayInputText = previewText ? stripLegacyInputMarkers(previewText) : "";

  const longestLineWidth = useMemo(() => {
    if (!displayInputText) return 0;
    let maxChars = 0;
    for (const line of displayInputText.split("\n")) {
      if (line.length > maxChars) maxChars = line.length;
    }
    return maxChars * (CONTENTS_INPUT_FONT_SIZE * 0.72);
  }, [displayInputText]);

  const inputScrollViewportWResolved = useMemo(
    () =>
      inputScrollViewportW > 0
        ? inputScrollViewportW
        : Math.round(windowWidth * 0.45),
    [inputScrollViewportW, windowWidth],
  );

  const inputContentWidth = useMemo(() => {
    const measuredWidth = measuredTextMaxW + INPUT_WIDTH_CURSOR_PAD;
    const heuristicWidth = longestLineWidth + INPUT_WIDTH_CURSOR_PAD;
    return measuredTextMaxW > 0
      ? measuredWidth
      : Math.max(measuredWidth, heuristicWidth);
  }, [measuredTextMaxW, longestLineWidth]);

  const inputHorizontalCanvasWidth = useMemo(
    () => Math.max(inputScrollViewportWResolved, inputContentWidth),
    [inputScrollViewportWResolved, inputContentWidth],
  );

  const needsHorizontalScroll = useMemo(
    () =>
      inputScrollViewportWResolved > 0 &&
      inputContentWidth > inputScrollViewportWResolved,
    [inputContentWidth, inputScrollViewportWResolved],
  );

  const handleMeasureLayout = (e: TextLayoutEvent) => {
    const lines = e.nativeEvent.lines;
    if (lines.length === 0) return;

    const maxWidth = lines.reduce((widest, line) => Math.max(widest, line.width), 0);
    setMeasuredTextMaxW(maxWidth);
  };

  const resetInputScroll = useCallback(() => {
    if (inputScrollXRef.current === 0) return;
    inputScrollXRef.current = 0;
    inputScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, []);

  useLayoutEffect(() => {
    if (!needsHorizontalScroll) {
      resetInputScroll();
    }
  }, [needsHorizontalScroll, resetInputScroll]);

  const measureOffscreenStyle = useMemo(
    () => ({
      position: "absolute" as const,
      opacity: 0,
      left: TEXT_MEASURE_OFFSCREEN_LEFT,
      width: -TEXT_MEASURE_OFFSCREEN_LEFT,
      fontSize: CONTENTS_INPUT_FONT_SIZE,
      fontFamily: inputFontFamily,
      ...Platform.select({
        android: { includeFontPadding: false as const },
        default: {},
      }),
    }),
    [inputFontFamily],
  );

  const onInputScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    inputScrollXRef.current = e.nativeEvent.contentOffset.x;
  };

  const moveCursorUp = useCallback(() => {}, []);
  const moveCursorDown = useCallback(() => {}, []);

  return {
    displayInputText,
    inputHorizontalCanvasWidth,
    needsHorizontalScroll,
    inputViewportHeightPx,
    inputFontFamily,
    inputScrollRef,
    handleMeasureLayout,
    measureOffscreenStyle,
    onInputScroll,
    moveCursorUp,
    moveCursorDown,
  };
}
