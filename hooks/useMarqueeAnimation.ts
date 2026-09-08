import { useSettings } from "@/contexts/settingsContext";
import {
  buildMarqueeDisplayText,
  normalizeOneLineJoinMode,
  resolveMarqueeJoinSpacerPx,
} from "@/utils/viewMode";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export interface UseMarqueeAnimationParams {
  isActive?: boolean;
  /** Style B(lineClear)*/
  viewportWidthPx?: number;
  /** 타일 끝 여유(글로우·stroke)*/
  effectBleedPx?: number;
}

export type { OneLineJoinMode } from "@/utils/viewMode";

type TextLayoutEvent = {
  nativeEvent: { lines: { width: number }[] };
};

/**
 * 애니메이션에서 재사용할 `translateX` shared value와 표시 텍스트를 제공할 겁니다.
 */
export function useMarqueeAnimation({
  isActive = true,
  viewportWidthPx = 0,
  effectBleedPx = 0,
}: UseMarqueeAnimationParams = {}) {
  const { config } = useSettings();
  const { previewText: text, playOption, oneLineJoinMode: oneLineJoinModeRaw } = config.content;
  const speed = config.motion.textMoveSpeed;
  const translateX = useSharedValue(0);
  const totalShiftRef = useRef(0);
  const [textWidth, setTextWidth] = useState(0);
  const oneLineJoinMode = normalizeOneLineJoinMode(oneLineJoinModeRaw);

  const displayText = buildMarqueeDisplayText({
    text,
    playOption,
    oneLineJoinMode,
  });
  const spacer = resolveMarqueeJoinSpacerPx({
    oneLineJoinMode,
    viewportWidthPx,
  });

  useEffect(() => {
    if (speed === 0 || textWidth === 0) {
      cancelAnimation(translateX);
      translateX.value = 0;
      totalShiftRef.current = 0;
      return;
    }

    if (!isActive) {
      cancelAnimation(translateX);
      return;
    }

    const totalShift = textWidth + spacer + effectBleedPx;
    const duration = (totalShift / (speed * 3)) * 1000;

    // translate 0으로 이동하지 않고, 현재 진행 정도에 맞춰 복구
    const prevTotalShift = totalShiftRef.current;
    const currentValue = translateX.value;
    const progress =
      prevTotalShift > 0
        ? (((-currentValue) / prevTotalShift) % 1 + 1) % 1
        : 0;
    const startValue = -progress * totalShift;
    const remainingDuration = duration * (1 - progress);

    totalShiftRef.current = totalShift;

    cancelAnimation(translateX);
    translateX.value = startValue;
    translateX.value = withTiming(
      -totalShift,
      { duration: remainingDuration, easing: Easing.linear },
      (finished) => {
        "worklet";
        if (finished) {
          translateX.value = 0;
          translateX.value = withRepeat(
            withTiming(-totalShift, { duration, easing: Easing.linear }),
            -1,
            false,
          );
        }
      },
    );
    return () => cancelAnimation(translateX);
  }, [
    isActive,
    translateX,
    speed,
    text,
    playOption,
    oneLineJoinMode,
    textWidth,
    spacer,
    effectBleedPx,
  ]);

  const textWidthRef = useRef(textWidth);
  textWidthRef.current = textWidth;

  const onTextLayout = useCallback((e: TextLayoutEvent) => {
    const widths = e.nativeEvent.lines.map((l) => l.width);
    const maxLineWidth = widths.length > 0 ? Math.max(...widths) : 0;
    if (maxLineWidth !== textWidthRef.current) {
      setTextWidth(maxLineWidth);
    }
  }, []);

  return {
    displayText,
    translateX,
    onTextLayout,
    SPACER: spacer,
  };
}
