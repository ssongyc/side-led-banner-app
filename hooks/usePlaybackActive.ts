import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

/** Retain the screen state while its animation producers are paused. */
export function usePlaybackActive(visible: boolean) {
  const isFocused = useIsFocused();
  const [isForeground, setIsForeground] = useState(
    () => AppState.currentState === "active",
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsForeground(state === "active");
    });
    setIsForeground(AppState.currentState === "active");
    return () => subscription.remove();
  }, []);

  return visible && isFocused && isForeground;
}
