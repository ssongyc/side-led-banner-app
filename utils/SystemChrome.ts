import { NavigationBar } from "expo-navigation-bar";
import { Platform } from "react-native";

export function configureAndroidNavigationBarHidden() {
  if (Platform.OS !== "android") return;
  NavigationBar.setHidden(true);
}

export function hideAndroidNavigationBar() {
  if (Platform.OS !== "android") return;
  NavigationBar.setHidden(true);
}
