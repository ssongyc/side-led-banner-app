import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { createRewardedAd } from "@/ads/AdClient.web";
import { WEB_AD_DIAGNOSTICS, useWebAdState, isWebAdReady, selectWebAdState, getWebAdState } from "@/ads/webAdDiagnostics.web";
export function isRewardedAdShowing() { return WEB_AD_DIAGNOSTICS && getWebAdState() === "showing"; }
export function suspendRewardedAds() {
  if (isRewardedAdShowing()) selectWebAdState("loading");
}
export function loadRewardedAd(_options?: { restartFailed?: boolean }) { /* A diagnostic result must be selected explicitly. */ }
export function useRewardedAd(onRewardEarned: () => void) {
  const state = useWebAdState();
  const reward = useRef(onRewardEarned);
  reward.current = onRewardEarned;
  const client = useRef<ReturnType<typeof createRewardedAd> | null>(null);
  useEffect(() => {
    if (!WEB_AD_DIAGNOSTICS) return;
    let opened = false;
    let earned = false;
    let granted = false;
    const ad = createRewardedAd(event => {
      if (event === "LOADED") { opened = false; earned = false; granted = false; }
      if (event === "OPENED") opened = true;
      if (event === "EARNED" && opened) earned = true;
      if (event === "CLOSED" && opened && earned && !granted && AppState.currentState === "active") {
        granted = true;
        reward.current();
      }
      if (event === "ERROR") { opened = false; earned = false; }
    });
    client.current = ad;
    const subscription = AppState.addEventListener("change", next => {
      if (next !== "active") suspendRewardedAds();
    });
    return () => {
      ad.dispose(); client.current = null; subscription.remove(); suspendRewardedAds();
    };
  }, []);
  const show = useCallback(() => {
    if (AppState.currentState === "active") client.current?.show();
  }, []);
  const canRetry = WEB_AD_DIAGNOSTICS && (state === "load-failed" || state === "show-failed");
  const retry = useCallback(() => { if (canRetry) selectWebAdState("loading"); }, [canRetry]);
  return { loaded: isWebAdReady(), failed: !WEB_AD_DIAGNOSTICS || state === "load-failed" || state === "show-failed",
    showFailed: WEB_AD_DIAGNOSTICS && state === "show-failed", show, canRetry, retry, isReady: isWebAdReady };
}