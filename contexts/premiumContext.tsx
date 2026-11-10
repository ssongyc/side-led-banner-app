import {
  getPremiumSnapshot, refreshPremium, requestForegroundPremiumRefresh, subscribePremium,
} from "@/utils/ApiClient";
import { isRewardedAdShowing } from "@/hooks/useRewardedAd";
import React, { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";

export function usePremium() {
  const snapshot = useSyncExternalStore(subscribePremium, getPremiumSnapshot, getPremiumSnapshot);
  return {
    ...snapshot,
    isPremium: snapshot.entitlement === "owned",
    adsAllowed: snapshot.entitlement === "free",
  };
}

export function PremiumLifecycle({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void refreshPremium();
    let appState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (state) => {
      const returned = state === "active" && appState !== "active";
      appState = state;
      if (returned && !isRewardedAdShowing()) requestForegroundPremiumRefresh();
    });
    return () => subscription.remove();
  }, []);
  return children;
}
