// One Settings placement per app process. Remounts retain its budget and deadlines.
type Phase = "idle" | "loading" | "loaded" | "waiting" | "failed" | "stopped";
type Snapshot = { phase: Phase; attempt: number; requestId: number; dueAt: number | null; messageUntil: number; extraUsed: boolean };
let state: Snapshot = { phase: "idle", attempt: 0, requestId: 0, dueAt: null, messageUntil: 0, extraUsed: false };
let owner: symbol | null = null;
const listeners = new Set<() => void>();
const update = (patch: Partial<Snapshot>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
export const getBannerState = () => state;
export const subscribeBannerState = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function claimBanner(token: symbol) {
  if (owner && owner !== token) return false;
  owner = token;
  return true;
}
export function requestBanner(token: symbol) {
  if (owner !== token || state.phase === "loading" || state.phase === "loaded" || state.phase === "stopped") return;
  if (state.phase !== "idle" && (state.dueAt === null || Date.now() < state.dueAt)) return;
  const extra = state.phase === "failed";
  if (extra && state.extraUsed) return;
  update({ phase: "loading", attempt: state.attempt + 1, requestId: state.requestId + 1,
    dueAt: null, messageUntil: 0, extraUsed: state.extraUsed || extra });
}
export function bannerLoaded(token: symbol, requestId: number) {
  if (owner !== token || state.requestId !== requestId || (state.phase !== "loading" && state.phase !== "loaded")) return false;
  update({ phase: "loaded", dueAt: null, messageUntil: 0 });
  return true;
}
export function bannerFailed(token: symbol, requestId: number) {
  if (owner !== token || state.requestId !== requestId || state.phase !== "loading") return false;
  const delay = [6000, 12000][(state.attempt - 1) % 3];
  const now = Date.now();
  if (delay !== undefined) update({ phase: "waiting", dueAt: now + delay });
  else update({ phase: "failed", messageUntil: now + 10_000,
    dueAt: state.extraUsed ? null : now + 70_000 });
  return true;
}
export function releaseBanner(token: symbol) {
  if (owner !== token) return;
  owner = null;
  if (state.phase === "loaded") {
    // A later visible placement may load anew after a confirmed success.
    update({ phase: "idle", attempt: 0, extraUsed: false, dueAt: null, messageUntil: 0 });
  } else if (state.phase === "loading") {
    // Destroyed requests consume their slot; do not replay it or invent a failure callback.
    const delay = [6000, 12000][(state.attempt - 1) % 3];
    update({ phase: delay === undefined ? "stopped" : "waiting",
      dueAt: delay === undefined ? null : Date.now() + delay });
  }
}