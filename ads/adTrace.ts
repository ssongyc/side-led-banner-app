import Constants from "expo-constants";
import { Platform } from "react-native";

type Trace = { timestamp: string; platform: string; placement: string; stage: string; [key: string]: unknown };
const events: Trace[] = [];
const buildNumber = (Platform.OS === "ios" ? Constants.platform?.ios?.buildNumber
  : Platform.OS === "android" ? Constants.platform?.android?.versionCode : undefined) ?? "unmeasured";
const appVersion = Constants.expoConfig?.version ?? "unmeasured";
// Never infer a source revision from a mutable working tree at runtime.
const gitSha = typeof Constants.expoConfig?.extra?.gitSha === "string"
  ? Constants.expoConfig.extra.gitSha : "unmeasured";
export function recordAdEvent(placement: string, stage: string, detail: Record<string, unknown> = {}, error?: unknown) {
  const e = error as { code?: unknown; message?: unknown; domain?: unknown } | undefined;
  const item: Trace = { ...detail, timestamp: new Date().toISOString(), platform: Platform.OS, placement, stage, buildNumber, appVersion, versionSource: "expo-config", gitSha,
    ...(error === undefined ? {} : { errorCode: e?.code ?? null, errorMessage: e?.message ?? String(error), errorDomain: e?.domain ?? null }) };
  events.push(item);
  if (events.length > 120) events.shift();
  if (__DEV__) console.info("[LEDPOP Ads]", JSON.stringify(item));
}
export function getAdTrace() { return events.slice(); }
