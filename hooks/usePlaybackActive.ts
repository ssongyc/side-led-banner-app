import { StartupVisibilityContext } from "@/contexts/startupContext";
import { useIsFocused } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { AppState } from "react-native";

/** Retain the screen state while its animation producers are paused. */
export function usePlaybackActive(visible: boolean) {
  const isFocused = useIsFocused();
  const startupVisible = useContext(StartupVisibilityContext);
  const [isForeground, setIsForeground] = useState(
    () => AppState.currentState === "active",
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsForeground(state === "active");
    });
    // Close the gap between initial snapshot and the external AppState subscription.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsForeground(AppState.currentState === "active");
    return () => subscription.remove();
  }, []);

  return visible && startupVisible && isFocused && isForeground;
}
