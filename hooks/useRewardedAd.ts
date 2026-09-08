import { getPremiumSnapshot } from "@/utils/ApiClient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

const AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3506417530430977/4076706298",
  android: "ca-app-pub-3506417530430977/6499152286",
});

const LOAD_RETRY_DELAYS_MS = [3000, 6000] as const;
const AD_VALID_MS = 60 * 60 * 1000;
type SlotName = "current" | "next";
type SlotState = "idle" | "loading" | "loaded" | "showing" | "failed";

type RewardedSlot = {
  ad: RewardedAd | null;
  attempt: number;
  loadedAt: number | null;
  retryableLoad: boolean;
  state: SlotState;
  retryTimer: ReturnType<typeof setTimeout> | null;
  unsubs: Array<() => void>;
};

const createEmptySlot = (): RewardedSlot => ({
  ad: null,
  attempt: 0,
  loadedAt: null,
  retryableLoad: false,
  state: "idle",
  retryTimer: null,
  unsubs: [],
});

let slots: Record<SlotName, RewardedSlot> = {
  current: createEmptySlot(),
  next: createEmptySlot(),
};

let terminalLoadFailed = false;
let openedCurrentAd = false;
let earnedRewardCurrentAd = false;
let rewardGrantedCurrentAd = false;
let nextLoadRequestedForCurrentShow = false;
const subscribers = new Set<() => void>();
const rewardSubscribers = new Set<() => void>();

type DebugEvent = {
  attempt: number;
  event: string;
  platform: string;
  slot: SlotName;
  state: SlotState;
  timestamp: string;
};
const debugTrace: DebugEvent[] = [];

function trace(slotName: SlotName, event: string) {
  if (!__DEV__) return;
  const slot = slots[slotName];
  const item = {
    attempt: slot.attempt,
    event,
    platform: Platform.OS,
    slot: slotName,
    state: slot.state,
    timestamp: new Date().toISOString(),
  };
  debugTrace.push(item);
  if (debugTrace.length > 80) debugTrace.shift();
  console.debug("[rewardedAd]", item);
}

function resolveSlotName(ad: RewardedAd): SlotName | null {
  if (slots.current.ad === ad) return "current";
  if (slots.next.ad === ad) return "next";
  return null;
}

function notifySubscribers() {
  subscribers.forEach((listener) => listener());
}

function notifyRewardEarned() {
  rewardSubscribers.forEach((listener) => listener());
}

function getRewardedAdConfigurationError(): Error | null {
  return AD_UNIT_ID
    ? null
    : new Error(`Rewarded ad is not configured for ${Platform.OS}.`);
}

function clearSlotRetryTimer(slot: RewardedSlot) {
  if (!slot.retryTimer) return;
  clearTimeout(slot.retryTimer);
  slot.retryTimer = null;
}

function disposeSlot(slotName: SlotName) {
  const slot = slots[slotName];
  clearSlotRetryTimer(slot);
  slot.unsubs.forEach((unsubscribe) => unsubscribe());
  slots[slotName] = createEmptySlot();
}

function createRewardedAd(slotName: SlotName): RewardedAd {
  const adUnitId = AD_UNIT_ID;
  if (!adUnitId) {
    throw new Error(`Rewarded ad is not configured for ${Platform.OS}.`);
  }

  const slot = slots[slotName];
  slot.unsubs.forEach((unsubscribe) => unsubscribe());
  slot.unsubs = [];
  const ad = RewardedAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });
  slot.ad = ad;

  slot.unsubs = [
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      const activeSlotName = resolveSlotName(ad);
      if (!activeSlotName) return;
      const activeSlot = slots[activeSlotName];
      if (activeSlot.state !== "loading" || activeSlot.retryTimer) return;
      clearSlotRetryTimer(activeSlot);
      activeSlot.state = "loaded";
      activeSlot.loadedAt = Date.now();
      if (activeSlotName === "current") terminalLoadFailed = false;
      trace(activeSlotName, "loaded");
      notifySubscribers();
    }),
    ad.addAdEventListener(AdEventType.OPENED, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current") return;
      openedCurrentAd = true;
      trace(activeSlotName, "opened");
      if (!nextLoadRequestedForCurrentShow) {
        nextLoadRequestedForCurrentShow = true;
        loadNextSlotOnce();
      }
    }),
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current") return;
      earnedRewardCurrentAd = true;
      trace(activeSlotName, "earned_reward");
    }),
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current") return;
      trace(activeSlotName, "closed");
      if (
        openedCurrentAd &&
        earnedRewardCurrentAd &&
        !rewardGrantedCurrentAd
      ) {
        rewardGrantedCurrentAd = true;
        notifyRewardEarned();
      }
      promoteNextSlotToCurrent();
      notifySubscribers();
    }),
    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      const activeSlotName = resolveSlotName(ad);
      if (!activeSlotName) return;
      if (__DEV__) console.warn("[rewardedAd] ad error", error);
      handleSlotError(activeSlotName);
    }),
  ];

  return ad;
}

function requestSlotLoad(slotName: SlotName) {
  if (getPremiumSnapshot().entitlement !== "free") return;
  const slot = slots[slotName];
  slot.attempt += 1;
  slot.retryableLoad = true;
  slot.state = "loading";
  slot.loadedAt = null;
  trace(slotName, "load_request");
  notifySubscribers();
  try { createRewardedAd(slotName).load(); } catch { handleSlotError(slotName); }
}

function handleSlotError(slotName: SlotName) {
  const slot = slots[slotName];
  // Ignore repeated failure callbacks while a retry is already scheduled.
  if (slot.retryTimer || slot.state === "failed") return;

  if (slot.state === "showing") {
    terminalLoadFailed = true;
    slot.state = "failed";
    slot.loadedAt = null;
    trace(slotName, "show_failed");
    notifySubscribers();
    return;
  }

  if (!slot.retryableLoad) {
    terminalLoadFailed = true;
    slot.state = "failed";
    slot.loadedAt = null;
    trace(slotName, "promoted_next_failed");
    notifySubscribers();
    return;
  }

  const retryDelay = LOAD_RETRY_DELAYS_MS[slot.attempt - 1];
  if (retryDelay == null) {
    if (slotName === "current") terminalLoadFailed = true;
    slot.state = "failed";
    slot.loadedAt = null;
    trace(slotName, "terminal_load_failed");
    notifySubscribers();
    return;
  }

  trace(slotName, `retry_scheduled_${retryDelay}ms`);
  slot.retryTimer = setTimeout(() => {
    slot.retryTimer = null;
    const activeSlotName = slots.current === slot ? "current" : slots.next === slot ? "next" : null;
    if (!activeSlotName || slot.state !== "loading") return;
    requestSlotLoad(activeSlotName);
  }, retryDelay);
}

function isLoadedSlotExpired(slot: RewardedSlot) {
  return (
    slot.state === "loaded" &&
    slot.loadedAt != null &&
    Date.now() - slot.loadedAt > AD_VALID_MS
  );
}

function promoteNextSlotToCurrent() {
  disposeSlot("current");
  slots.current = slots.next;
  slots.next = createEmptySlot();
  openedCurrentAd = false;
  earnedRewardCurrentAd = false;
  rewardGrantedCurrentAd = false;
  nextLoadRequestedForCurrentShow = false;
  terminalLoadFailed = slots.current.state === "failed" && slots.current.retryableLoad && slots.current.attempt >= 3;
  trace("current", "next_promoted_to_current");
}

function loadNextSlotOnce() {
  const next = slots.next;
  if (next.state !== "idle") return;
  requestSlotLoad("next");
}

export function isRewardedAdShowing() {
  return slots.current.state === "showing";
}

export function suspendRewardedAds() {
  disposeSlot("current");
  disposeSlot("next");
  terminalLoadFailed = false;
  openedCurrentAd = false;
  earnedRewardCurrentAd = false;
  rewardGrantedCurrentAd = false;
  nextLoadRequestedForCurrentShow = false;
  notifySubscribers();
}

export function loadRewardedAd() {
  if (getPremiumSnapshot().entitlement !== "free") return;
  const configError = getRewardedAdConfigurationError();
  if (configError) {
    terminalLoadFailed = true;
    slots.current.state = "failed";
    if (__DEV__) console.error("[rewardedAd] load failed", configError);
    notifySubscribers();
    return;
  }

  const current = slots.current;
  if (isLoadedSlotExpired(current)) {
    trace("current", "loaded_ad_expired");
    disposeSlot("current");
    terminalLoadFailed = false;
  }

  const currentState = slots.current.state;
  if (
    currentState === "loading" ||
    currentState === "loaded" ||
    currentState === "showing"
  ) {
    trace("current", "load_reused_existing_cycle");
    return;
  }

  disposeSlot("current");
  terminalLoadFailed = false;
  requestSlotLoad("current");
}

function getLoadedState() {
  return getPremiumSnapshot().entitlement === "free" && slots.current.state === "loaded" &&
    slots.current.ad?.loaded === true && !isLoadedSlotExpired(slots.current);
}

function getFailedState() {
  return terminalLoadFailed || slots.current.state === "failed";
}

function getCanRetryState() {
  return getPremiumSnapshot().entitlement === "free" && terminalLoadFailed &&
    slots.current.state === "failed" && slots.current.retryableLoad && slots.current.attempt >= 3;
}

export function useRewardedAd(onRewardEarned: () => void) {
  const [loaded, setLoaded] = useState(getLoadedState);
  const [failed, setFailed] = useState(getFailedState);
  const [canRetry, setCanRetry] = useState(getCanRetryState);
  const onRewardEarnedRef = useRef(onRewardEarned);
  onRewardEarnedRef.current = onRewardEarned;

  useEffect(() => {
    const syncState = () => {
      setLoaded(getLoadedState());
      setFailed(getFailedState());
      setCanRetry(getCanRetryState());
    };
    const rewardListener = () => onRewardEarnedRef.current();
    subscribers.add(syncState);
    rewardSubscribers.add(rewardListener);
    syncState();

    return () => {
      subscribers.delete(syncState);
      rewardSubscribers.delete(rewardListener);
    };
  }, []);

  const show = useCallback(() => {
    if (getPremiumSnapshot().entitlement !== "free") return;
    const configError = getRewardedAdConfigurationError();
    if (configError) {
      terminalLoadFailed = true;
      slots.current.state = "failed";
      if (__DEV__) console.error("[rewardedAd] show failed", configError);
      notifySubscribers();
      return;
    }

    const current = slots.current;
    if (!current.ad || current.state !== "loaded" || !current.ad.loaded) {
      if (__DEV__) console.warn("[rewardedAd] show() called before ad loaded");
      return;
    }

    if (isLoadedSlotExpired(current)) {
      terminalLoadFailed = true;
      current.state = "failed";
      current.loadedAt = null;
      trace("current", "show_blocked_expired");
      notifySubscribers();
      return;
    }

    openedCurrentAd = false;
    earnedRewardCurrentAd = false;
    rewardGrantedCurrentAd = false;
    nextLoadRequestedForCurrentShow = false;
    current.retryableLoad = false;
    current.state = "showing";
    trace("current", "show_request");
    notifySubscribers();
    current.ad.show({ immersiveModeEnabled: Platform.OS === "android" });
  }, []);

  const retry = useCallback(() => {
    if (!getCanRetryState()) return;
    loadRewardedAd(); // Only load; a new enabled Watch Ad action is required to show.
  }, []);

  return { loaded, failed, show, canRetry, retry, isReady: getLoadedState };
}
