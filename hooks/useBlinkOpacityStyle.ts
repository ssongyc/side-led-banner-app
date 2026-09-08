import { useSettingsRest } from "@/contexts/settingsContext";
import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/** blinkSpeed 1 - 10 */
function blinkHalfCycleMs(speed: number) {
  const s = Math.min(10, Math.max(1, speed));
  const slow = 900;
  const fast = 80;
  return Math.round(slow - ((s - 1) / 9) * (slow - fast));
}

const BLINK_EASING = Easing.inOut(Easing.ease);

export function useBlinkOpacityStyle(isActive = true) {
  const { config } = useSettingsRest();
  const active = config.appearance.effectSelectedItems.includes("Blink");
  const blinkSpeed = config.appearance.blinkSpeed;
  // One linear cycle retains both direction and easing progress across a pause.
  const phase = useSharedValue(0);
  const opacity = useDerivedValue(() => {
    return phase.value <= 1
      ? 1 - BLINK_EASING(phase.value)
      : BLINK_EASING(phase.value - 1);
  });

  useEffect(() => {
    cancelAnimation(phase);
    if (!active) {
      phase.value = 0;
      return;
    }
    if (!isActive) return;

    const duration = blinkHalfCycleMs(blinkSpeed) * 2;
    const progress = phase.value / 2;
    phase.value = withTiming(
      2,
      { duration: duration * (1 - progress), easing: Easing.linear },
      (finished) => {
        "worklet";
        if (!finished) return;
        phase.value = 0;
        phase.value = withRepeat(
          withTiming(2, { duration, easing: Easing.linear }),
          -1,
          false,
        );
      },
    );
    return () => cancelAnimation(phase);
  }, [active, blinkSpeed, isActive, phase]);

  return { opacity };
}
