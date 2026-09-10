import { useSettingsRest } from "@/contexts/settingsContext";
import { useEffect } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";

/** Heart tiles have their own phase; text wrapping must never reset it. */
export function useHeartBackgroundScroll(isActive: boolean) {
  const { config } = useSettingsRest();
  const speed = config.motion.textMoveSpeed;
  const enabled = config.appearance.backgroundEffectPreset === "heartBgA";
  const translateX = useSharedValue(0);
  const running = enabled && isActive && speed > 0;
  const { setActive } = useFrameCallback((frame) => {
    if (!running || frame.timeSincePreviousFrame == null) return;
    // Same logical pixels/second as the text, independent of its loop length.
    translateX.value -= (speed * 3 * frame.timeSincePreviousFrame) / 1000;
  }, false);

  useEffect(() => {
    if (!enabled || speed === 0) translateX.value = 0;
    setActive(running);
    return () => setActive(false);
  }, [enabled, speed, running, setActive, translateX]);

  return translateX;
}
