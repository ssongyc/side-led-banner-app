import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, type LayoutChangeEvent } from "react-native";

const DIRECTION_SETTLE_MS = 180;
const FADE_OUT_MS = 90;
const FADE_IN_MS = 140;
const BACKGROUND_SETTLE_MS = 160;
const BACKGROUND_TURN_DEGREES = 8;

export function usePlayRotation(
  enabled: boolean,
  requestedRotation: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const [{ rotation, backgroundTurn }, setScene] = useState({
    rotation: 0,
    backgroundTurn: 0,
  });
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
  const [textOpacity] = useState(() => new Animated.Value(1));
  const [backgroundProgress] = useState(() => new Animated.Value(1));
  const previousRotation = useRef(0);
  const [reduceMotion, setReduceMotion] = useState(true);

  if (!enabled && rotation !== 0) setScene({ rotation: 0, backgroundTurn: 0 });

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
    if (previousRotation.current !== rotation) {
      previousRotation.current = rotation;
      backgroundProgress.setValue(enabled && !reduceMotion ? 0 : 1);
    }
  }, [backgroundProgress, enabled, reduceMotion, rotation]);

  useLayoutEffect(() => {
    if (!enabled) {
      textOpacity.setValue(1);
      backgroundProgress.setValue(1);
      return;
    }

    let animation: Animated.CompositeAnimation | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    if (requestedRotation !== rotation) {
      timer = setTimeout(() => {
        animation = Animated.timing(textOpacity, {
          toValue: 0,
          duration: reduceMotion ? 0 : FADE_OUT_MS,
          useNativeDriver: true,
        });
        animation.start(({ finished }) => {
          if (!finished) return;
          const turn = ((requestedRotation - rotation + 540) % 360) - 180;
          setScene({
            rotation: requestedRotation,
            backgroundTurn: -Math.sign(turn) * BACKGROUND_TURN_DEGREES,
          });
        });
      }, DIRECTION_SETTLE_MS);
    } else if (layoutReady) {
      // Wait for the measured bounds, then give the Skia surfaces time to draw.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          animation = Animated.sequence([
            Animated.timing(backgroundProgress, {
              toValue: 1,
              duration: reduceMotion || backgroundTurn === 0 ? 0 : BACKGROUND_SETTLE_MS,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: reduceMotion ? 0 : FADE_IN_MS,
              useNativeDriver: true,
            }),
          ]);
          animation.start();
        });
      });
    }

    return () => {
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      animation?.stop();
    };
  }, [
    backgroundProgress,
    backgroundTurn,
    enabled,
    layoutReady,
    reduceMotion,
    requestedRotation,
    rotation,
    textOpacity,
  ]);

  // Keep all four corners covered while the background settles. Using the
  // angle in radians bounds sin(angle) throughout the interpolated turn.
  const aspect =
    Math.max(expectedWidth, expectedHeight) / Math.max(1, Math.min(expectedWidth, expectedHeight));
  const coverScale = 1 + aspect * Math.abs(backgroundTurn) * Math.PI / 180;
  return {
    rotation: enabled ? rotation : 0,
    textOpacity,
    backgroundRotate: backgroundProgress.interpolate({
      inputRange: [0, 1], outputRange: [backgroundTurn + "deg", "0deg"],
    }),
    backgroundScale: backgroundProgress.interpolate({
      inputRange: [0, 1], outputRange: [coverScale, 1],
    }),
    onLayout,
  };
}
