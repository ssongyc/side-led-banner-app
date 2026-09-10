import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { AdaptiveBannerAd } from "@/ads/AdClient";
import { getAdConfiguration } from "@/ads/adConfiguration";
import { recordAdEvent } from "@/ads/adTrace";
import { initializeMobileAds, useMobileAdsState } from "@/ads/initializeMobileAds";
import { getBannerState, subscribeBannerState, claimBanner, releaseBanner, requestBanner, bannerLoaded, bannerFailed } from "@/ads/bannerState";

const REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true };
type Props = { style?: StyleProp<ViewStyle>; unavailableLabel: string };
export default function BannerAdComponent({ style, unavailableLabel }: Props) {
  const sdkState = useMobileAdsState();
  const state = useSyncExternalStore(subscribeBannerState, getBannerState, getBannerState);
  const token = useRef(Symbol("settings-banner"));
  const [owned, setOwned] = useState(false);
  const [width, setWidth] = useState(0);
  const [, redraw] = useState(0);
  const [config] = useState(() => { try { return getAdConfiguration(); } catch { return null; } });
  const startedAt = useRef(0);
  const lastRequest = useRef(0);
  const sdkFailedAt = useRef<number | null>(null);
  const sdkFailed = sdkState === "failed" || sdkState === "configuration" || !config;
  useEffect(() => {
    const owner = token.current;
    setOwned(claimBanner(owner));
    void initializeMobileAds().catch(() => { /* Shared state carries failure. */ });
    return () => releaseBanner(owner);
  }, []);
  useEffect(() => {
    if (!owned || sdkState !== "ready" || !config || width <= 0) return;
    if (state.phase === "idle") { requestBanner(token.current); return; }
    if (state.dueAt === null) return;
    const id = setTimeout(() => requestBanner(token.current), Math.max(0, state.dueAt - Date.now()));
    return () => clearTimeout(id);
  }, [owned, sdkState, config, width, state.phase, state.dueAt]);
  useEffect(() => {
    if (!sdkFailed) sdkFailedAt.current = null;
    else if (sdkFailedAt.current === null) sdkFailedAt.current = Date.now();
    const until = sdkFailed ? sdkFailedAt.current! + 10_000 : state.messageUntil;
    if (until <= Date.now()) return;
    const id = setTimeout(() => redraw(value => value + 1), until - Date.now());
    return () => clearTimeout(id);
  }, [sdkFailed, state.messageUntil]);
  useEffect(() => {
    if (!owned || state.phase !== "loading" || lastRequest.current === state.requestId) return;
    lastRequest.current = state.requestId;
    startedAt.current = Date.now();
    recordAdEvent("banner", "view_request", { attempt: state.attempt, requestId: state.requestId, width, profile: config?.profile });
  }, [owned, state.phase, state.requestId, state.attempt, width, config]);
  const unavailable = sdkFailed || state.phase === "failed";
  const messageVisible = sdkFailed ? sdkFailedAt.current === null || Date.now() < sdkFailedAt.current + 10_000 : Date.now() < state.messageUntil;
  const requestId = state.requestId;
  return <View style={[{ alignItems: "center", justifyContent: "center", minHeight: 50, flexShrink: 0 }, style]}
    onLayout={event => { const next = Math.floor(event.nativeEvent.layout.width); setWidth(current => current === next ? current : next); }}>
    {unavailable ? (messageVisible ? <Text allowFontScaling={false}>{unavailableLabel}</Text> : null) :
      owned && sdkState === "ready" && config && width > 0 && (state.phase === "loading" || state.phase === "loaded") ?
      <AdaptiveBannerAd key={requestId} unitId={config.banner} width={width} requestOptions={REQUEST_OPTIONS}
        onSizeChange={size => recordAdEvent("banner", "size_changed", { ...size, attempt: state.attempt })}
        onAdLoaded={size => {
          const refresh = getBannerState().phase === "loaded";
          if (!bannerLoaded(token.current, requestId)) return;
          recordAdEvent("banner", refresh ? "sdk_refresh_complete" : "load_complete", {
            attempt: state.attempt, ...size, requestedAt: refresh ? null : new Date(startedAt.current).toISOString(),
            elapsedMs: refresh ? null : Date.now() - startedAt.current,
          });
        }}
        onAdFailedToLoad={error => {
          const current = getBannerState();
          if (current.requestId !== requestId) return;
          if (current.phase === "loaded") { recordAdEvent("banner", "sdk_refresh_failed", { attempt: state.attempt, requestedAt: null }, error); return; }
          if (!bannerFailed(token.current, requestId)) return;
          recordAdEvent("banner", "load_failed", { attempt: state.attempt, elapsedMs: Date.now() - startedAt.current }, error);
          const next = getBannerState();
          if (next.dueAt !== null) recordAdEvent("banner", next.phase === "failed" ? "extra_cycle_scheduled" : "retry_scheduled", { attempt: next.attempt + 1, dueAt: next.dueAt });
        }} /> : null}
  </View>;
}