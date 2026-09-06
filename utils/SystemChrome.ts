import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";

export function configureAndroidNavigationBarHidden() {
  if (Platform.OS !== "android") return;
  void NavigationBar.setVisibilityAsync("hidden");
}

export function hideAndroidNavigationBar() {
  if (Platform.OS !== "android") return;
  void NavigationBar.setVisibilityAsync("hidden");
}

export function addAndroidNavigationBarHiddenListener(): (() => void) | undefined {
  if (Platform.OS !== "android") return undefined;
  const sub = NavigationBar.addVisibilityListener(({ visibility }) => {
    if (visibility === "visible") hideAndroidNavigationBar();
  });
  return () => sub.remove();
}
