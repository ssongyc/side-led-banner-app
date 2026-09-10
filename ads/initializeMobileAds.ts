import { useSyncExternalStore } from "react";
import { initializeAdSdk } from "./AdClient";
import { getAdConfiguration } from "./adConfiguration";
import { recordAdEvent } from "./adTrace";

type State = "idle" | "loading" | "ready" | "failed" | "configuration";
let state: State = "idle";
let pending: Promise<void> | null = null;
let lastError: unknown;
let timer: ReturnType<typeof setTimeout> | null = null;
let generation = 0;
let rejectPending: ((reason: unknown) => void) | null = null;
const listeners = new Set<() => void>();
const notify = (value: State) => { state = value; listeners.forEach(fn => fn()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useMobileAdsState = () => useSyncExternalStore(subscribe, () => state, () => state);
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
    const run = async (attempt: number) => {
      if (token !== generation) return;
      const startedAt = Date.now();
      recordAdEvent("sdk", "initialize_request", { attempt });
      try {
        const adapters = await initializeAdSdk();
        if (token !== generation) return;
        recordAdEvent("sdk", "adapter_status", { attempt, adapters });
        if (!adapters.some(adapter => adapter.state === 1)) {
          throw Object.assign(new Error("No ad adapter is ready after initialization"), { code: "adapters-not-ready" });
        }
        if (token !== generation) return;
        pending = null; rejectPending = null;
        notify("ready"); recordAdEvent("sdk", "initialize_complete", { attempt, elapsedMs: Date.now() - startedAt }); resolve();
      } catch (error) {
        if (token !== generation) return;
        recordAdEvent("sdk", "initialize_failed", { attempt, elapsedMs: Date.now() - startedAt }, error);
        const delay = [6000, 12000][attempt - 1];
        if (delay !== undefined) { timer = setTimeout(() => { timer = null; void run(attempt + 1); }, delay); return; }
        lastError = error; pending = null; rejectPending = null; notify("failed"); reject(error);
      }
    };
    void Promise.resolve().then(() => run(1));
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
  if (timer) clearTimeout(timer);
  timer = null; pending = null;
  rejectPending?.(new Error("Ads initialization cancelled")); rejectPending = null;
  notify("idle");
}
