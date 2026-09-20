import { createNativeRewardedAd, rewardedAdEvents, beginRewardedPresentation, endRewardedPresentation, showRewardedAd, type RewardedAdHandle } from "./AdClient";
import { getAdConfiguration } from "@/ads/adConfiguration";
import { initializeMobileAds, getMobileAdsState, retryMobileAdsInitialization, isMobileAdsLoadDelayed, subscribeMobileAdsState } from "@/ads/initializeMobileAds";
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
  failure: "load" | "show" | "open-timeout" | "expiry" | "configuration" | "initialization" | null;
  state: SlotState;
  retryTimer: ReturnType<typeof setTimeout> | null;
  retryAt: number | null;
  pendingLoad: boolean;
  requestId: number;
  requestedAt: number | null;
  statusTimer: ReturnType<typeof setTimeout> | null;
  unsubs: Array<() => void>;
};

const createEmptySlot = (): RewardedSlot => ({
  ad: null,
  attempt: 0,
  loadedAt: null,
  failure: null,
  state: "idle",
  retryTimer: null,
  retryAt: null,
  pendingLoad: false,
  requestId: 0,
  requestedAt: null,
  statusTimer: null,
  unsubs: [],
});

let slots: Record<SlotName, RewardedSlot> = {
  current: createEmptySlot(),
  next: createEmptySlot(),
};

let requestSequence = 0;
let openedCurrentAd = false;
type RewardAttempt = { started: boolean; granted: boolean; grant: Array<() => void> };
const rewardAttempts = new WeakMap<RewardedAdHandle, RewardAttempt>();
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
    requestId: slot.requestId,
    elapsedMs: slot.requestedAt === null ? null : performance.now() - slot.requestedAt,
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

function getRewardedAdConfigurationError(): Error | null {
  try { getAdConfiguration(); return null; } catch (error) { return error as Error; }
}

function clearSlotRetryTimer(slot: RewardedSlot) {
  if (!slot.retryTimer) return;
  clearTimeout(slot.retryTimer);
  slot.retryTimer = null;
}

function clearStatusTimer(slot: RewardedSlot) {
  if (slot.statusTimer) clearTimeout(slot.statusTimer);
  slot.statusTimer = null;
}
function scheduleSlotStatus(slot: RewardedSlot) {
  clearStatusTimer(slot);
  if (AppState.currentState !== "active") return;
  const due = slot.state === "loaded" && slot.loadedAt !== null ? slot.loadedAt + AD_VALID_MS :
    slot.state === "loading" && slot.ad && slot.retryAt === null && slot.requestedAt !== null ? slot.requestedAt + 45000 : null;
  if (due === null || due <= performance.now()) return;
  slot.statusTimer = setTimeout(() => {
    slot.statusTimer = null;
    if (slots.current !== slot && slots.next !== slot) return;
    scheduleSlotStatus(slot);
    notifySubscribers();
  }, due - performance.now());
}
subscribeMobileAdsState(notifySubscribers);

function disposeSlot(slotName: SlotName) {
  const slot = slots[slotName];
  clearStatusTimer(slot);
  if (slot.ad) trace(slotName, `discard_${slot.state}`);
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
  promoteNextSlotToCurrent();
  if (slots.current.state === "idle") {
    slots.current.state = "failed";
    slots.current.failure = "show";
  }
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
  const rewardAttempt: RewardAttempt = { started: false, granted: false, grant: [] };
  rewardAttempts.set(ad, rewardAttempt);
  // Retain only this attempt's reward listener after dismissal/timeout.
  const unsubscribeReward = ad.addAdEventListener(rewardedAdEvents.earnedReward, () => {
    if (!rewardAttempt.started || rewardAttempt.granted) return;
    rewardAttempt.granted = true;
    unsubscribeReward();
    recordAdEvent("rewarded", "earned_reward", { attempt: slot.attempt, requestId: slot.requestId });
    rewardAttempt.grant.forEach(listener => listener());
    rewardAttempt.grant = [];
  });

  slot.unsubs = [
    () => { if (!rewardAttempt.started) unsubscribeReward(); },
    ad.addAdEventListener(rewardedAdEvents.loaded, () => {
      const activeSlotName = resolveSlotName(ad);
      if (!activeSlotName) return;
      const activeSlot = slots[activeSlotName];
      if (activeSlot.state !== "loading" || activeSlot.retryAt !== null) return;
      clearSlotRetryTimer(activeSlot);
      activeSlot.state = "loaded";
      activeSlot.loadedAt = performance.now();
      scheduleSlotStatus(activeSlot);
      activeSlot.failure = null;
      trace(activeSlotName, "loaded");
      notifySubscribers();
    }),
    ad.addAdEventListener(rewardedAdEvents.opened, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current" || slots.current.state !== "showing") return;
      if (openedCurrentAd) return;
      clearOpenWatchdog();
      openedCurrentAd = true;
      slots.current.failure = null;
      notifySubscribers();
      trace(activeSlotName, "opened");
      if (!nextLoadRequestedForCurrentShow) {
        nextLoadRequestedForCurrentShow = true;
        loadNextSlotOnce();
      }
    }),
    ad.addAdEventListener(rewardedAdEvents.closed, () => {
      const activeSlotName = resolveSlotName(ad);
      if (activeSlotName !== "current" || slots.current.state !== "showing") return;
      clearOpenWatchdog();
      endImmersiveAd();
      trace(activeSlotName, "closed");
      promoteNextSlotToCurrent();
      notifySubscribers();
    }),
    ad.addAdEventListener(rewardedAdEvents.error, (error) => {
      const activeSlotName = resolveSlotName(ad);
      if (!activeSlotName) return;
      if (__DEV__) console.warn("[rewardedAd] ad error", error);
      recordAdEvent("rewarded", "sdk_error", { slot: activeSlotName, requestId: slots[activeSlotName].requestId, attempt: slots[activeSlotName].attempt, state: slots[activeSlotName].state }, error);
      handleSlotError(activeSlotName);
    }),
  ];

  return ad;
}

function requestSlotLoad(slotName: SlotName) {
  if (getPremiumSnapshot().entitlement !== "free") return;
  const slot = slots[slotName];
  // Keep preparation/retry ownership while absent; no issued attempt is refunded.
  if (AppState.currentState !== "active") {
    slot.pendingLoad = true;
    slot.state = "loading";
    trace(slotName, "load_deferred_background");
    return;
  }
  slot.pendingLoad = false;
  slot.retryAt = null;
  slot.requestId = ++requestSequence;
  slot.requestedAt = performance.now();
  slot.attempt += 1;
  slot.failure = null;
  slot.state = "loading";
  slot.loadedAt = null;
  trace(slotName, "load_request");
  notifySubscribers();
  try { createRewardedAd(slotName).load(); scheduleSlotStatus(slot); } catch (error) { recordAdEvent("rewarded", "load_threw", { slot: slotName, requestId: slot.requestId, attempt: slot.attempt }, error); handleSlotError(slotName); }
}

function handleSlotError(slotName: SlotName) {
  const slot = slots[slotName];
  // Ignore repeated failure callbacks while a retry is already scheduled.
  if (slot.retryAt !== null || slot.state === "failed") return;

  if (slot.state === "showing") {
    markShowFailed();
    return;
  }

  if (slot.state !== "loading") return;

  const retryDelay = LOAD_RETRY_DELAYS_MS[slot.attempt - 1];
  if (retryDelay == null) {
    clearStatusTimer(slot);
    slot.failure = "load";
    slot.state = "failed";
    slot.loadedAt = null;
    trace(slotName, "terminal_load_failed");
    notifySubscribers();
    return;
  }

  clearStatusTimer(slot);
  slot.retryAt = performance.now() + retryDelay;
  trace(slotName, `retry_scheduled_${retryDelay}ms`);
  resumeSlotLoad(slot);
}

function resumeSlotLoad(slot: RewardedSlot) {
  if (AppState.currentState !== "active" || getPremiumSnapshot().entitlement !== "free") return;
  const name = slots.current === slot ? "current" : slots.next === slot ? "next" : null;
  if (!name || slot.retryTimer) return;
  if (slot.retryAt !== null) {
    const dueAt = slot.retryAt;
    slot.retryTimer = setTimeout(() => {
      slot.retryTimer = null;
      const activeName = slots.current === slot ? "current" : slots.next === slot ? "next" : null;
      if (!activeName || slot.state !== "loading" || slot.retryAt !== dueAt || AppState.currentState !== "active") return;
      requestSlotLoad(activeName);
    }, Math.max(0, dueAt - performance.now()));
  } else if (slot.pendingLoad) {
    requestSlotLoad(name);
  }
}

// One observer for the process-owned slots; promotion retains their deadlines.
AppState.addEventListener("change", state => {
  if (state !== "active") {
    clearSlotRetryTimer(slots.current);
    clearSlotRetryTimer(slots.next);
  } else {
    resumeSlotLoad(slots.current);
    resumeSlotLoad(slots.next);
  }
  scheduleSlotStatus(slots.current);
  scheduleSlotStatus(slots.next);
  notifySubscribers();
});

function isLoadedSlotExpired(slot: RewardedSlot) {
  return (
    slot.state === "loaded" &&
    slot.loadedAt != null &&
    performance.now() - slot.loadedAt >= AD_VALID_MS
  );
}

function promoteNextSlotToCurrent() {
  disposeSlot("current");
  slots.current = slots.next;
  slots.next = createEmptySlot();
  openedCurrentAd = false;
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
  nextLoadRequestedForCurrentShow = false;
  notifySubscribers();
}

export function loadRewardedAd(options?: { restartFailed?: boolean }) {
  if (getPremiumSnapshot().entitlement !== "free") return;
  // Only an explicit Settings entry may restart a retryable terminal failure.
  if (slots.current.state === "failed") {
    if (!options?.restartFailed || !getCanRetryState()) return;
    retryMobileAdsInitialization();
    disposeSlot("current");
    disposeSlot("next");
  }
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
  return AppState.currentState === "active" && getPremiumSnapshot().entitlement === "free" &&
    (isLoadedSlotExpired(current) || (current.state === "failed" &&
    (current.failure === "expiry" || current.failure === "show" || current.failure === "initialization" || (current.failure === "load" && current.attempt >= 3))));
}

export function getAdSnapshot() {
  return {
    delayed: isMobileAdsLoadDelayed() || (slots.current.state === "loading" && slots.current.ad !== null &&
      slots.current.retryAt === null && slots.current.requestedAt !== null && performance.now() - slots.current.requestedAt >= 45000),
    expired: slots.current.failure === "expiry" || isLoadedSlotExpired(slots.current),
    loaded: getLoadedState(),
    failed: slots.current.state === "failed" || slots.current.failure === "open-timeout" || isLoadedSlotExpired(slots.current),
    showFailed: slots.current.failure === "show" || slots.current.failure === "open-timeout",
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
    if (AppState.currentState !== "active" || current.state === "showing" || current.state === "failed") return;
    if (isLoadedSlotExpired(current)) {
      disposeSlot("current");
      slots.current.state = "failed";
      slots.current.failure = "expiry";
      trace("current", "loaded_ad_expired");
      notifySubscribers();
      return;
    }
    if (!current.ad || current.state !== "loaded" || !current.ad.loaded) return;

    openedCurrentAd = false;
    nextLoadRequestedForCurrentShow = false;
    current.failure = null;
    clearStatusTimer(current);
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
        if (cancelled || AppState.currentState !== "active" || slots.current.ad !== ad || slots.current.state !== "showing" ||
          getPremiumSnapshot().entitlement !== "free" || !ad.loaded || current.loadedAt === null || performance.now() - current.loadedAt >= AD_VALID_MS) {
          endImmersiveAd(flow);
          onShowError(new Error("Rewarded presentation cancelled"));
          return;
        }
        openWatchdog = setTimeout(() => {
          openWatchdog = null;
          if (!openedCurrentAd && slots.current.ad === ad && slots.current.state === "showing") {
            // A timeout is not evidence that the SDK window has closed.
            current.failure = "open-timeout";
            trace("current", "open_timeout");
            notifySubscribers();
          }
        }, 15_000);
        const rewardAttempt = rewardAttempts.get(ad);
        if (rewardAttempt) {
          rewardAttempt.started = true;
          rewardAttempt.grant = Array.from(rewardSubscribers);
        }
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

