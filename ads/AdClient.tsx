import { requireNativeModule } from "expo-modules-core";
import React from "react";
import { Platform, TurboModuleRegistry, type TurboModule } from "react-native";
import mobileAds, { BannerAd, BannerAdSize, RewardedAd, AdEventType, RewardedAdEventType, type BannerAdProps } from "react-native-google-mobile-ads";

export type RewardedAdHandle = ReturnType<typeof RewardedAd.createForAdRequest>;
export const rewardedAdEvents = {
  loaded: RewardedAdEventType.LOADED, opened: AdEventType.OPENED,
  earnedReward: RewardedAdEventType.EARNED_REWARD, closed: AdEventType.CLOSED, error: AdEventType.ERROR,
} as const;
export const initializeAdSdk = () => mobileAds().initialize();
export const getNativeAdAppId = (): string => {
  const rewardedModule = TurboModuleRegistry.get<TurboModule & {
    rewardedDispose?: (requestId: number) => void;
  }>("RNGoogleMobileAdsRewardedModule");
  if (typeof rewardedModule?.rewardedDispose !== "function") {
    throw new Error("Rewarded cleanup native API is missing; rebuild this app");
  }
  return requireNativeModule("LedPopAdImmersive").getAppId();
};
export const disposeRewardedAd = (ad: RewardedAdHandle) => ad.dispose();
export const createNativeRewardedAd = (unitId: string) => RewardedAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true });
export async function beginRewardedPresentation(token: number) {
  if (Platform.OS === "android") await requireNativeModule("LedPopAdImmersive").begin(token);
}
export async function endRewardedPresentation(token: number) {
  if (Platform.OS === "android") await requireNativeModule("LedPopAdImmersive").end(token);
}
export const showRewardedAd = (ad: RewardedAdHandle) => ad.show({ immersiveModeEnabled: Platform.OS === "android" });
export function AdaptiveBannerAd(props: Omit<BannerAdProps, "size"> & { width: number }) {
  return <BannerAd {...props} size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER} />;
}