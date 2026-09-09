import React, { useEffect, useRef, useState } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { getAdConfiguration } from "@/utils/adConfiguration";
import { recordAdEvent } from "@/utils/adTrace";
import { initializeMobileAds, useMobileAdsState } from "@/utils/initializeMobileAds";

const REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true };
const UNAVAILABLE_MESSAGE_MS = 10_000;
const EXTRA_CYCLE_WAIT_MS = 60_000;
type Props = { style?: StyleProp<ViewStyle>; unavailableLabel: string };
export default function BannerAdComponent({ style, unavailableLabel }: Props) {
  const sdkState = useMobileAdsState();
  const [width, setWidth] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [failed, setFailed] = useState(false);
  const [messageVisible, setMessageVisible] = useState(true);
  const [config] = useState(() => { try { return getAdConfiguration(); } catch { return null; } });
  const cycle = useRef({ alive: true, attempt: 1, handled: false, loaded: false, startedAt: Date.now() });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extraCycleUsed = useRef(false);
  const terminal = failed || sdkState === "failed" || sdkState === "configuration" || !config;
  useEffect(() => {
    cycle.current.alive = true;
    void initializeMobileAds().catch(() => { /* Shared state carries the failure. */ });
    return () => { cycle.current.alive = false; if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (!terminal) { setMessageVisible(true); return; }
    const id = setTimeout(() => setMessageVisible(false), UNAVAILABLE_MESSAGE_MS);
    return () => clearTimeout(id);
  }, [terminal]);
  useEffect(() => {
    if (!failed || sdkState !== "ready" || !config || extraCycleUsed.current) return;
    recordAdEvent("banner", "extra_cycle_scheduled", {
      delayMs: UNAVAILABLE_MESSAGE_MS + EXTRA_CYCLE_WAIT_MS,
    });
    const id = setTimeout(() => {
      const current = cycle.current;
      if (!current.alive || current.loaded || extraCycleUsed.current) return;
      extraCycleUsed.current = true;
      // Increasing identities reject callbacks from the previous cycle.
      current.attempt += 1;
      current.handled = false;
      recordAdEvent("banner", "extra_cycle_started", { attempt: current.attempt });
      setAttempt(current.attempt);
      setFailed(false);
    }, UNAVAILABLE_MESSAGE_MS + EXTRA_CYCLE_WAIT_MS);
    return () => clearTimeout(id);
  }, [failed, sdkState, config]);
  useEffect(() => {
    if (sdkState !== "ready" || terminal || width <= 0) return;
    cycle.current.startedAt = Date.now();
    recordAdEvent("banner", "view_request", { attempt, width, profile: config?.profile });
  }, [attempt, width, sdkState, terminal, config]);
  return <View style={[{ alignItems: "center", justifyContent: "center", minHeight: 50, flexShrink: 0 }, style]}
    onLayout={event => { const next = Math.floor(event.nativeEvent.layout.width); setWidth(current => current === next ? current : next); }}>
    {terminal ? (messageVisible ? <Text allowFontScaling={false}>{unavailableLabel}</Text> : null) :
      sdkState === "ready" && config && width > 0 ? <BannerAd key={attempt} unitId={config.banner}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER} width={width} requestOptions={REQUEST_OPTIONS}
        onSizeChange={size => recordAdEvent("banner", "size_changed", { ...size, attempt })}
        onAdLoaded={size => {
          const current = cycle.current;
          if (!current.alive || current.attempt !== attempt || (current.handled && !current.loaded)) return;
          const refresh = current.loaded;
          current.loaded = true; current.handled = true;
          if (timer.current) clearTimeout(timer.current); timer.current = null;
          recordAdEvent("banner", refresh ? "sdk_refresh_complete" : "load_complete", {
            attempt, ...size, requestedAt: refresh ? null : new Date(current.startedAt).toISOString(),
            elapsedMs: refresh ? null : Date.now() - current.startedAt,
          });
        }}
        onAdFailedToLoad={error => {
          const current = cycle.current;
          if (!current.alive || current.attempt !== attempt) return;
          if (current.loaded) { recordAdEvent("banner", "sdk_refresh_failed", { attempt, requestedAt: null }, error); return; }
          if (current.handled) return;
          current.handled = true;
          recordAdEvent("banner", "load_failed", { attempt, elapsedMs: Date.now() - current.startedAt }, error);
          const delay = [3000, 6000][(attempt - 1) % 3];
          if (delay === undefined) { setFailed(true); return; }
          recordAdEvent("banner", "retry_scheduled", { attempt: attempt + 1, delayMs: delay });
          timer.current = setTimeout(() => {
            timer.current = null;
            if (!current.alive) return;
            current.attempt += 1; current.handled = false;
            setAttempt(current.attempt);
          }, delay);
        }} /> : null}
  </View>;
}
