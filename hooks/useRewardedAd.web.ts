import { useCallback } from "react";

const WEB_AD_ERROR = "Rewarded ads are not supported on web.";

export function isRewardedAdShowing() { return false; }

export function suspendRewardedAds() { /* No native ads exist on web. */ }

export function loadRewardedAd() {
  if (__DEV__) console.error(`[rewardedAd] ${WEB_AD_ERROR}`);
}

export function useRewardedAd(_onRewardEarned: () => void) {
  const show = useCallback(() => {
    if (__DEV__) console.error(`[rewardedAd] ${WEB_AD_ERROR}`);
  }, []);

  return { loaded: false, failed: true, show };
}
