import { Platform } from "react-native";

type Trace = { timestamp: string; platform: string; placement: string; stage: string; [key: string]: unknown };
const events: Trace[] = [];
export function recordAdEvent(placement: string, stage: string, detail: Record<string, unknown> = {}, error?: unknown) {
  const e = error as { code?: unknown; message?: unknown; domain?: unknown } | undefined;
  const item: Trace = { ...detail, timestamp: new Date().toISOString(), platform: Platform.OS, placement, stage,
    ...(error === undefined ? {} : { errorCode: e?.code ?? null, errorMessage: e?.message ?? String(error), errorDomain: e?.domain ?? null }) };
  events.push(item);
  if (events.length > 120) events.shift();
  console.info("[LEDPOP Ads]", JSON.stringify(item));
}
export function getAdTrace() { return events.slice(); }
