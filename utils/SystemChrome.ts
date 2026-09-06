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
