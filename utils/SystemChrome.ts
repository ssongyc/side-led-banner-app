import { requireNativeModule } from "expo-modules-core";
import { NavigationBar } from "expo-navigation-bar";
import { Platform } from "react-native";

type AndroidNavigationBarModule = {
  setHidden(hidden: boolean): Promise<void>;
};

export function configureAndroidNavigationBarHidden() {
  if (Platform.OS !== "android") return;
  // Preserve Expo's default for declarative navigation-bar components.
  NavigationBar.setHidden(true);
  hideAndroidNavigationBar();
}

export function hideAndroidNavigationBar() {
  if (Platform.OS !== "android") return;
  // Expo's JS setHidden caches the requested value, even when Android later
  // reveals the bars. Reapply to the Activity and registered Modal windows.
  const nativeBar =
    requireNativeModule<AndroidNavigationBarModule>("ExpoNavigationBar");
  void nativeBar.setHidden(true).catch((error: unknown) => {
    console.error("[SystemChrome] Failed to hide Android navigation bar", error);
  });
}
