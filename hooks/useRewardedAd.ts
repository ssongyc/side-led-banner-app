import { useEffect, useRef, useState } from "react";
import { getAdSnapshot, subscribeRewardedState, showRewarded, retryRewarded, isRewardedReady } from "@/ads/rewardedState";
export { isRewardedAdShowing, suspendRewardedAds, loadRewardedAd } from "@/ads/rewardedState";

export function useRewardedAd(onRewardEarned: () => void) {
  const [snapshot, setSnapshot] = useState(getAdSnapshot);
  const reward = useRef(onRewardEarned);
  reward.current = onRewardEarned;
  useEffect(() => {
    const sync = () => setSnapshot(getAdSnapshot());
    const unsubscribe = subscribeRewardedState(sync, () => reward.current());
    sync();
    return unsubscribe;
  }, []);
  return { ...snapshot, show: showRewarded, retry: retryRewarded, isReady: isRewardedReady };
}