import { useSyncExternalStore } from "react";
export const WEB_AD_DIAGNOSTICS = __DEV__ && process.env.EXPO_PUBLIC_WEB_AD_DIAGNOSTICS === "1";
type State = "loading" | "ready" | "load-failed" | "show-failed";
let state: State = "loading";
let outcome: "success" | "failure" = "success";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const notify = () => listeners.forEach(fn => fn());
export const useWebAdState = () => useSyncExternalStore(subscribe, () => state, () => state);
export function selectWebAdState(next: State, result: "success" | "failure" = "success") {
  if (!WEB_AD_DIAGNOSTICS) throw new Error("Web ad diagnostics are disabled");
  outcome = result; state = next; notify();
}
export const isWebAdReady = () => WEB_AD_DIAGNOSTICS && state === "ready";
export function consumeWebAd(): boolean {
  if (!isWebAdReady()) return false;
  const earned = outcome === "success";
  state = earned ? "loading" : "show-failed"; notify();
  return earned;
}
