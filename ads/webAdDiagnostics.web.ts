import { useSyncExternalStore } from "react";
export const WEB_AD_DIAGNOSTICS = __DEV__ && process.env.EXPO_PUBLIC_WEB_AD_DIAGNOSTICS === "1";
type State = "loading" | "ready" | "showing" | "load-failed" | "show-failed";
let state: State = "loading";
let outcome: "success" | "failure" = "success";
const listeners = new Set<() => void>();
export const subscribeWebAdState = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const notify = () => listeners.forEach(fn => fn());
export const useWebAdState = () => useSyncExternalStore(subscribeWebAdState, () => state, () => state);
export function selectWebAdState(next: State, result: "success" | "failure" = "success") {
  if (!WEB_AD_DIAGNOSTICS) throw new Error("Web ad diagnostics are disabled");
  outcome = result; state = next; notify();
}
export const isWebAdReady = () => WEB_AD_DIAGNOSTICS && state === "ready";
export const getWebAdState = () => state;
export const getWebAdOutcome = () => outcome;