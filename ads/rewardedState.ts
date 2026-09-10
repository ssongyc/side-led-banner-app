import { createNativeRewardedAd, rewardedAdEvents, beginRewardedPresentation, endRewardedPresentation, showRewardedAd, type RewardedAdHandle } from "./AdClient";
import { getAdConfiguration } from "@/ads/adConfiguration";
import { initializeMobileAds, getMobileAdsState, retryMobileAdsInitialization } from "@/ads/initializeMobileAds";
import { recordAdEvent } from "@/ads/adTrace";
import { getPremiumSnapshot } from "@/utils/ApiClient";
import { AppState, Platform } from "react-native";

const LOAD_RETRY_DELAYS_MS = [6000, 12000] as const;
const AD_VALID_MS = 60 * 60 * 1000;
type SlotName = "current" | "next";
type SlotState = "idle" | "loading" | "loaded" | "showing" | "failed";

type RewardedSlot = {
  ad: RewardedAdHandle | null;
  attempt: number;
  loadedAt: number | null;
  failure: "load" | "show" | "configuration" | "initialization" | null;
  state: SlotState;
  retryTimer: ReturnType<typeof setTimeout> | null;
  unsubs: Array<() => void>;
};

const createEmptySlot = (): RewardedSlot => ({
  ad: null,
  attempt: 0,
  loadedAt: null,
  failure: null,
  state: "idle",
  retryTimer: null,
  unsubs: [],
});

let slots: Record<SlotName, RewardedSlot> = {
  current: createEmptySlot(),
  next: createEmptySlot(),
};

let openedCurrentAd = false;
let earnedRewardCurrentAd = false;
let rewardGrantedCurrentAd = false;
let nextLoadRequestedForCurrentShow = false;
let immersiveFlow = 0;
let openWatchdog: ReturnType<typeof setTimeout> | null = null;
function clearOpenWatchdog() { if (openWatchdog) clearTimeout(openWatchdog); openWatchdog = null; }
const subscribers = new Set<() => void>();
const rewardSubscribers = new Set<() => void>();

function trace(slotName: SlotName, event: string) {
  const slot = slots[slotName];
  const item = {
    attempt: slot.attempt,
    event,
    platform: Platform.OS,
    slot: slotName,
    state: slot.state,
    timestamp: new Date().toISOString(),
  };
  recordAdEvent("rewarded", event, item);
}

function resolveSlotName(ad: RewardedAdHandle): SlotName | null {
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
  try { getAdConfiguration(); return null; } catch (error) { return error as Error; }
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

function endImmersiveAd(flow = immersiveFlow) {
  if (Platform.OS !== "android") return;
  try {
    void endRewardedPresentation(flow).catch((error: unknown) => recordAdEvent("rewarded", "immersive_end_failed", {}, error));
  } catch (error) { recordAdEvent("rewarded", "immersive_end_failed", {}, error); }
}

function markShowFailed() {
  clearOpenWatchdog();
  endImmersiveAd();
  disposeSlot("current");
  disposeSlot("next");
  slots.current.state = "failed";
  slots.current.failure = "show";
  openedCurrentAd = false;
  earnedRewardCurrentAd = false;
  rewardGrantedCurrentAd = false;
  nextLoadRequestedForCurrentShow = false;
  trace("current", "show_failed");
  notifySubscribers();
}

function createRewardedAd(slotName: SlotName): RewardedAdHandle {
  const adUnitId = getAdConfiguration().rewarded;

  const slot = slots[slotName];
  slot.unsubs.forEach((unsubscribe) => unsubscribe());
  slot.unsubs = [];
  const ad = createNativeRewardedAd(adUnitId);
  slot.ad = ad;

  slot.unsubs = [
    ad.addAdEventListener(rewardedAdEvents.loaded, () => {
      const activeSlotName = resolveSlotName(ad);
      if (!activeSlotName) return;
      const activeSlot = slots[activeSlotName];
      if (activeSlot.state !== "loading" || activeSlot.retryTimer) return;
      clearSlotRetryTimer(activeSlot);
      activeSlot.state = "loaded";
      activeSlot.loadedAt = Date.now();
      activeSlot.failure = null;
      trace(activeSlotName, "loaded");
      notifySubscribers();
    }),
    ad.addAdEventListener(rewardedAdEvents.opened, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current" || slots.current.state !== "showing") return;
      clearOpenWatchdog();
      openedCurrentAd = true;
      trace(activeSlotName, "opened");
      if (!nextLoadRequestedForCurrentShow) {
        nextLoadRequestedForCurrentShow = true;
        loadNextSlotOnce();
      }
    }),
    ad.addAdEventListener(rewardedAdEvents.earnedReward, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current" || slots.current.state !== "showing") return;
      earnedRewardCurrentAd = true;
      trace(activeSlotName, "earned_reward");
    }),
    ad.addAdEventListener(rewardedAdEvents.closed, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current" || slots.current.state !== "showing") return;
      clearOpenWatchdog();
      endImmersiveAd();
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
    ad.addAdEventListener(rewardedAdEvents.error, (error) => {
      const activeSlotName = resolveSlotName(ad);
      if (!activeSlotName) return;
      if (__DEV__) console.warn("[rewardedAd] ad error", error);
      recordAdEvent("rewarded", "sdk_error", { slot: activeSlotName }, error);
      handleSlotError(activeSlotName);
    }),
  ];

  return ad;
}

function requestSlotLoad(slotName: SlotName) {
  if (getPremiumSnapshot().entitlement !== "free") return;
  const slot = slots[slotName];
  slot.attempt += 1;
  slot.failure = null;
  slot.state = "loading";
  slot.loadedAt = null;
  trace(slotName, "load_request");
  notifySubscribers();
  try { createRewardedAd(slotName).load(); } catch (error) { recordAdEvent("rewarded", "load_threw", { slot: slotName }, error); handleSlotError(slotName); }
}

function handleSlotError(slotName: SlotName) {
  const slot = slots[slotName];
  // Ignore repeated failure callbacks while a retry is already scheduled.
  if (slot.retryTimer || slot.state === "failed") return;

  if (slot.state === "showing") {
    markShowFailed();
    return;
  }

  if (slot.state !== "loading") return;

  const retryDelay = LOAD_RETRY_DELAYS_MS[slot.attempt - 1];
  if (retryDelay == null) {
    slot.failure = "load";
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
  clearOpenWatchdog();
  if (slots.current.state === "showing") endImmersiveAd();
  disposeSlot("current");
  disposeSlot("next");
  openedCurrentAd = false;
  earnedRewardCurrentAd = false;
  rewardGrantedCurrentAd = false;
  nextLoadRequestedForCurrentShow = false;
  notifySubscribers();
}

export function loadRewardedAd() {
  if (getPremiumSnapshot().entitlement !== "free") return;
  // Screen re-entry must not restart a terminally failed cycle.
  if (slots.current.state === "failed") return;
  const configError = getRewardedAdConfigurationError();
  if (configError) {
    slots.current.failure = "configuration";
    slots.current.state = "failed";
    recordAdEvent("rewarded", "configuration_failed", {}, configError);
    notifySubscribers();
    return;
  }

  const current = slots.current;
  if (isLoadedSlotExpired(current)) {
    trace("current", "loaded_ad_expired");
    disposeSlot("current");
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
  const waitingSlot = slots.current;
  waitingSlot.state = "loading";
  notifySubscribers();
  void initializeMobileAds().then(() => {
    if (slots.current !== waitingSlot || getPremiumSnapshot().entitlement !== "free") return;
    requestSlotLoad("current");
  }).catch(error => {
    if (slots.current !== waitingSlot) return;
    waitingSlot.state = "failed";
    waitingSlot.failure = getMobileAdsState() === "configuration" ? "configuration" : "initialization";
    recordAdEvent("rewarded", "initialization_failed", {}, error);
    notifySubscribers();
  });
}

function getLoadedState() {
  return getPremiumSnapshot().entitlement === "free" && slots.current.state === "loaded" &&
    slots.current.ad?.loaded === true && !isLoadedSlotExpired(slots.current);
}

function getCanRetryState() {
  const current = slots.current;
  return getPremiumSnapshot().entitlement === "free" && current.state === "failed" &&
    (current.failure === "show" || current.failure === "initialization" || (current.failure === "load" && current.attempt >= 3));
}

export function getAdSnapshot() {
  return {
    loaded: getLoadedState(),
    failed: slots.current.state === "failed",
    showFailed: slots.current.failure === "show",
    canRetry: getCanRetryState(),
  };
}

export function subscribeRewardedState(onState: () => void, onReward: () => void) {
  subscribers.add(onState);
  rewardSubscribers.add(onReward);
  return () => { subscribers.delete(onState); rewardSubscribers.delete(onReward); };
}
export { getLoadedState as isRewardedReady };
export function showRewarded() {
    if (getPremiumSnapshot().entitlement !== "free") return;
    const configError = getRewardedAdConfigurationError();
    if (configError) {
      slots.current.failure = "configuration";
      slots.current.state = "failed";
      recordAdEvent("rewarded", "configuration_failed", {}, configError);
      notifySubscribers();
      return;
    }

    const current = slots.current;
    if (current.state === "showing" || current.state === "failed") return;
    if (!current.ad || current.state !== "loaded" || !current.ad.loaded || isLoadedSlotExpired(current)) {
      markShowFailed();
      return;
    }

    openedCurrentAd = false;
    earnedRewardCurrentAd = false;
    rewardGrantedCurrentAd = false;
    nextLoadRequestedForCurrentShow = false;
    current.failure = null;
    current.state = "showing";
    trace("current", "show_request");
    notifySubscribers();
    const ad = current.ad;
    const flow = ++immersiveFlow;
    const onShowError = (error?: unknown) => {
      recordAdEvent("rewarded", "show_failed", {}, error);
      if (slots.current.ad === ad && slots.current.state === "showing") markShowFailed();
    };
    void (async () => {
      let cancelled = false;
      const pendingSubscription = AppState.addEventListener("change", state => { if (state !== "active") cancelled = true; });
      try {
        await beginRewardedPresentation(flow);
        pendingSubscription.remove();
        if (cancelled || AppState.currentState !== "active" || slots.current.ad !== ad || slots.current.state !== "showing") {
          endImmersiveAd(flow);
          onShowError(new Error("Rewarded presentation cancelled"));
          return;
        }
        openWatchdog = setTimeout(() => {
          openWatchdog = null;
          if (!openedCurrentAd) onShowError(new Error("Rewarded ad did not open within 15 seconds"));
        }, 15_000);
        await showRewardedAd(ad);
      } catch (error) { onShowError(error); } finally { pendingSubscription.remove(); }
    })();
}

export function retryRewarded() {
    if (!getCanRetryState()) return;
    retryMobileAdsInitialization();
    disposeSlot("current");
    disposeSlot("next");
    loadRewardedAd(); // Only load; a new enabled Watch Ad action is required to show.
}

