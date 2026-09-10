import { recordAdEvent } from "./adTrace";
import { WEB_AD_DIAGNOSTICS, getWebAdState, getWebAdOutcome, selectWebAdState, subscribeWebAdState } from "./webAdDiagnostics.web";

export type DiagnosticAdEvent = "LOADED" | "OPENED" | "EARNED" | "CLOSED" | "ERROR";
// Explicit web diagnostics only. No native SDK or analytics payload changes.
export function createRewardedAd(listener: (event: DiagnosticAdEvent) => void) {
  if (!WEB_AD_DIAGNOSTICS) throw new Error("Web ad diagnostics are disabled");
  let disposed = false;
  let loaded = false;
  let generation = 0;
  let previousState: string | null = null;
  const emit = (event: DiagnosticAdEvent) => {
    if (disposed) return;
    recordAdEvent("rewarded", event, { diagnostic: true });
    listener(event);
  };
  const sync = () => {
    const state = getWebAdState();
    if (state === "ready") {
      if (!loaded) { loaded = true; emit("LOADED"); }
    } else {
      loaded = false;
      if (state !== "showing") generation += 1;
      if (state === "load-failed" && previousState !== state) emit("ERROR");
    }
    previousState = state;
  };
  const unsubscribe = subscribeWebAdState(sync);
  sync();
  return {
    show() {
      if (disposed || !loaded || getWebAdState() !== "ready") return;
      loaded = false;
      const token = ++generation;
      if (getWebAdOutcome() === "failure") {
        selectWebAdState("show-failed");
        emit("ERROR");
        return;
      }
      selectWebAdState("showing");
      const current = () => !disposed && token === generation && getWebAdState() === "showing";
      queueMicrotask(() => {
        if (!current()) return;
        emit("OPENED");
        queueMicrotask(() => {
          if (!current()) return;
          emit("EARNED");
          queueMicrotask(() => {
            if (!current()) return;
            emit("CLOSED");
            if (current()) selectWebAdState("loading");
          });
        });
      });
    },
    dispose() { disposed = true; generation += 1; unsubscribe(); },
  };
}