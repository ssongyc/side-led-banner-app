import { useCallback } from "react";
import { WEB_AD_DIAGNOSTICS, useWebAdState, isWebAdReady, consumeWebAd, selectWebAdState } from "@/utils/webAdDiagnostics.web";
export function isRewardedAdShowing() { return false; }
export function suspendRewardedAds() { /* No native ad instances on web. */ }
export function loadRewardedAd() { /* A diagnostic result must be selected explicitly. */ }
export function useRewardedAd(onRewardEarned: () => void) {
  const state = useWebAdState();
  const show = useCallback(() => { if (consumeWebAd()) onRewardEarned(); }, [onRewardEarned]);
  const canRetry = WEB_AD_DIAGNOSTICS && (state === "load-failed" || state === "show-failed");
  const retry = useCallback(() => { if (canRetry) selectWebAdState("loading"); }, [canRetry]);
  return { loaded: isWebAdReady(), failed: !WEB_AD_DIAGNOSTICS || state === "load-failed" || state === "show-failed",
    showFailed: WEB_AD_DIAGNOSTICS && state === "show-failed", show, canRetry, retry, isReady: isWebAdReady };
}
