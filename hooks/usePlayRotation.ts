import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AccessibilityInfo, Animated, type LayoutChangeEvent } from "react-native";

const DIRECTION_SETTLE_MS = 180;
const FADE_OUT_MS = 90;
const FADE_IN_MS = 140;

export function usePlayRotation(
  enabled: boolean,
  requestedRotation: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const [rotation, setRotation] = useState(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setLayout((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  }, []);
  const swapsAxes = rotation === 90 || rotation === 270;
  const expectedWidth = swapsAxes ? viewportHeight : viewportWidth;
  const expectedHeight = swapsAxes ? viewportWidth : viewportHeight;
  const layoutReady =
    Math.abs(layout.width - expectedWidth) < 1 &&
    Math.abs(layout.height - expectedHeight) < 1;
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(true);

  if (!enabled && rotation !== 0) setRotation(0);

  useEffect(() => {
    if (!enabled) return;
    let subscribed = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      preferenceChanged = true;
      setReduceMotion(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (subscribed && !preferenceChanged) setReduceMotion(value);
    }).catch(() => {
      // Keep the transition without a fade when the preference is unavailable.
    });
    return () => {
      subscribed = false;
      subscription.remove();
    };
  }, [enabled]);

  useLayoutEffect(() => {
    if (!enabled) {
      opacity.setValue(1);
      return;
    }

    let animation: Animated.CompositeAnimation | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    if (requestedRotation !== rotation) {
      timer = setTimeout(() => {
        animation = Animated.timing(opacity, {
          toValue: 0,
          duration: reduceMotion ? 0 : FADE_OUT_MS,
          useNativeDriver: true,
        });
        animation.start(({ finished }) => {
          if (finished) setRotation(requestedRotation);
        });
      }, DIRECTION_SETTLE_MS);
    } else if (layoutReady) {
      // Wait for the measured bounds, then give the Skia surfaces time to draw.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          animation = Animated.timing(opacity, {
            toValue: 1,
            duration: reduceMotion ? 0 : FADE_IN_MS,
            useNativeDriver: true,
          });
          animation.start();
        });
      });
    }

    return () => {
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      animation?.stop();
    };
  }, [enabled, layoutReady, opacity, reduceMotion, requestedRotation, rotation]);

  return { rotation: enabled ? rotation : 0, opacity, onLayout };
}
