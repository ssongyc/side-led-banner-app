import { getNativeAdAppId } from "./AdClient";
import Constants from "expo-constants";
import { Platform } from "react-native";
import profiles from "@/advertising.config.json";

export function getAdConfiguration() {
  if (Platform.OS !== "android" && Platform.OS !== "ios") throw new Error("Native ads require Android or iOS");
  const config = Constants.expoConfig?.extra?.advertising;
  if (!config || (config.profile !== "test" && config.profile !== "production")) throw new Error("Missing or invalid advertising profile");
  const profile: "test" | "production" = config.profile;
  const expected = profiles[profile][Platform.OS];
  const actual = config[Platform.OS];
  if (!actual || actual.platform !== Platform.OS || actual.appId !== expected.appId || actual.banner !== expected.banner || actual.rewarded !== expected.rewarded) {
    throw new Error("Advertising platform/profile mismatch");
  }
  const nativeAppId: string = getNativeAdAppId();
  if (nativeAppId !== expected.appId) throw new Error("Native AdMob App ID does not match the JS advertising profile");
  return { ...expected, profile };
}
