// Sessions outlive route changes; each iOS orientation/width retains its own budget.
type Phase = "idle" | "loading" | "loaded" | "waiting" | "failed" | "stopped";
type Snapshot = { phase: Phase; attempt: number; requestId: number; dueAt: number | null; messageUntil: number; extraUsed: boolean };
function createBannerPlacement() {
  let state: Snapshot = { phase: "idle", attempt: 0, requestId: 0, dueAt: null, messageUntil: 0, extraUsed: false };
  let owner: symbol | null = null;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<Snapshot>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const getBannerState = () => state;
  const subscribeBannerState = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
  function claimBanner(token: symbol) {
    if (owner && owner !== token) return false;
    owner = token;
    return true;
  }
  function requestBanner(token: symbol) {
    if (owner !== token || state.phase === "loading" || state.phase === "loaded" || state.phase === "stopped") return;
    if (state.phase !== "idle" && (state.dueAt === null || performance.now() < state.dueAt)) return;
    const extra = state.phase === "failed";
    if (extra && state.extraUsed) return;
    update({ phase: "loading", attempt: state.attempt + 1, requestId: state.requestId + 1,
      dueAt: null, messageUntil: 0, extraUsed: state.extraUsed || extra });
  }
  function bannerLoaded(token: symbol, requestId: number) {
    if (owner !== token || state.requestId !== requestId || (state.phase !== "loading" && state.phase !== "loaded")) return false;
    update({ phase: "loaded", dueAt: null, messageUntil: 0 });
    return true;
  }
  function bannerFailed(token: symbol, requestId: number) {
    if (owner !== token || state.requestId !== requestId || state.phase !== "loading") return false;
    const delay = [6000, 12000][(state.attempt - 1) % 3];
    const now = performance.now();
    if (delay !== undefined) update({ phase: "waiting", dueAt: now + delay });
    else update({ phase: "failed", messageUntil: now + 10_000,
      dueAt: state.extraUsed ? null : now + 70_000 });
    return true;
  }
  function releaseBanner(token: symbol) {
    if (owner !== token) return;
    owner = null;
    // Only the root host's actual teardown releases ownership. Screen exits never
    // call this: their in-flight native view and callbacks remain alive.
    if (state.phase === "loading" || state.phase === "loaded") {
      update({ phase: "stopped", dueAt: null, messageUntil: 0 });
    }
  }

  return { getBannerState, subscribeBannerState, claimBanner, requestBanner, bannerLoaded, bannerFailed, releaseBanner };
}

const placements = new Map<string, ReturnType<typeof createBannerPlacement>>();
export function getBannerPlacement(id: string) {
  let placement = placements.get(id);
  if (!placement) { placement = createBannerPlacement(); placements.set(id, placement); }
  return placement;
}
