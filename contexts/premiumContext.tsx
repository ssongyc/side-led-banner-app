import {
  getPremiumSnapshot, refreshPremium, subscribePremium,
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
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !isRewardedAdShowing()) void refreshPremium();
    });
    return () => subscription.remove();
  }, []);
  return children;
}
