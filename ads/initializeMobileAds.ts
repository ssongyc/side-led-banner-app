import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { initializeAdSdk } from "./AdClient";
import { getAdConfiguration } from "./adConfiguration";
import { recordAdEvent } from "./adTrace";

type State = "idle" | "loading" | "ready" | "failed" | "configuration";
let state: State = "idle";
let pending: Promise<void> | null = null;
let lastError: unknown;
let timer: ReturnType<typeof setTimeout> | null = null;
let generation = 0;
let resumeInitialization: (() => void) | null = null;
let requestStarted: number | null = null;
let delayTimer: ReturnType<typeof setTimeout> | null = null;
const clearDelayTimer = () => { if (delayTimer) clearTimeout(delayTimer); delayTimer = null; };
export const isMobileAdsLoadDelayed = () => state === "loading" && requestStarted !== null && performance.now() - requestStarted >= 45000;
function scheduleDelayNotice() {
  clearDelayTimer();
  if (requestStarted === null || AppState.currentState !== "active") return;
  const remaining = 45000 - (performance.now() - requestStarted);
  if (remaining > 0) delayTimer = setTimeout(() => { delayTimer = null; scheduleDelayNotice(); notify(state); }, remaining);
}
AppState.addEventListener("change", value => {
  if (timer) clearTimeout(timer);
  timer = null;
  clearDelayTimer();
  if (value === "active") { resumeInitialization?.(); scheduleDelayNotice(); }
  notify(state);
});
let rejectPending: ((reason: unknown) => void) | null = null;
const listeners = new Set<() => void>();
const notify = (value: State) => { state = value; listeners.forEach(fn => fn()); };
export const subscribeMobileAdsState = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useMobileAdsState = () => useSyncExternalStore(subscribeMobileAdsState, () => state, () => state);
export const useMobileAdsLoadDelayed = () => useSyncExternalStore(subscribeMobileAdsState, isMobileAdsLoadDelayed, isMobileAdsLoadDelayed);
export const getMobileAdsState = () => state;
export function initializeMobileAds(): Promise<void> {
  if (state === "ready") return Promise.resolve();
  if (state === "failed" || state === "configuration") return Promise.reject(lastError);
  if (pending) return pending;
  try { getAdConfiguration(); } catch (error) { lastError = error; notify("configuration"); recordAdEvent("sdk", "configuration_failed", {}, error); return Promise.reject(error); }
  const token = ++generation;
  notify("loading");
  pending = new Promise<void>((resolve, reject) => {
    rejectPending = reject;
    let nextAttempt = 1;
    let dueAt = performance.now();
    let inFlight = false;
    const schedule = () => {
      if (token !== generation || inFlight || AppState.currentState !== "active" || timer) return;
      timer = setTimeout(() => { timer = null; void run(nextAttempt); }, Math.max(0, dueAt - performance.now()));
    };
    resumeInitialization = schedule;
    const run = async (attempt: number) => {
      if (token !== generation) return;
      if (AppState.currentState !== "active") return;
      inFlight = true;
      const startedAt = performance.now();
      requestStarted = startedAt;
      scheduleDelayNotice();
      recordAdEvent("sdk", "initialize_request", { attempt });
      try {
        const adapters = await initializeAdSdk();
        if (token !== generation) return;
        recordAdEvent("sdk", "adapter_status", { attempt, adapters });
        if (!adapters.some(adapter => adapter.state === 1)) {
          throw Object.assign(new Error("No ad adapter is ready after initialization"), { code: "adapters-not-ready" });
        }
        if (token !== generation) return;
        inFlight = false; requestStarted = null; clearDelayTimer(); resumeInitialization = null;
        pending = null; rejectPending = null;
        notify("ready"); recordAdEvent("sdk", "initialize_complete", { attempt, elapsedMs: performance.now() - startedAt }); resolve();
      } catch (error) {
        if (token !== generation) return;
        inFlight = false; requestStarted = null; clearDelayTimer();
        recordAdEvent("sdk", "initialize_failed", { attempt, elapsedMs: performance.now() - startedAt }, error);
        const delay = [6000, 12000][attempt - 1];
        if (delay !== undefined) { nextAttempt = attempt + 1; dueAt = performance.now() + delay; notify("loading"); schedule(); return; }
        resumeInitialization = null;
        lastError = error; pending = null; rejectPending = null; notify("failed"); reject(error);
      }
    };
    void Promise.resolve().then(schedule);
  });
  return pending;
}
export function retryMobileAdsInitialization() {
  if (state !== "failed") return;
  lastError = undefined; notify("idle");
}
export function suspendMobileAdsInitialization() {
  if (state !== "loading") return;
  generation += 1;
  resumeInitialization = null; requestStarted = null; clearDelayTimer();
  if (timer) clearTimeout(timer);
  timer = null; pending = null;
  rejectPending?.(new Error("Ads initialization cancelled")); rejectPending = null;
  notify("idle");
}
