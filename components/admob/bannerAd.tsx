import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppState, Platform, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useIsFocused } from "expo-router/react-navigation";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "@/contexts/premiumContext";
import { AdaptiveBannerAd } from "@/ads/AdClient";
import { getAdConfiguration } from "@/ads/adConfiguration";
import { recordAdEvent } from "@/ads/adTrace";
import { initializeMobileAds, retryMobileAdsInitialization, useMobileAdsState, useMobileAdsLoadDelayed } from "@/ads/initializeMobileAds";
import { getBannerPlacement } from "@/ads/bannerState";

const REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true };
type Props = { style?: StyleProp<ViewStyle>; unavailableLabel: string };
type Placement = { owner: symbol; label: string };
const PlacementContext = createContext<{
  height: number;
  attach: (owner: symbol, label: string) => void;
  detach: (owner: symbol) => void;
} | null>(null);

// Settings reserves layout only. The native ad stays under the app-root provider.
export default function BannerAdComponent({ style, unavailableLabel }: Props) {
  const placement = useContext(PlacementContext);
  const focused = useIsFocused();
  const owner = useRef(Symbol("settings-banner-slot"));
  const attach = placement?.attach;
  const detach = placement?.detach;
  useLayoutEffect(() => {
    if (!focused || !attach || !detach) return;
    const token = owner.current;
    attach(token, unavailableLabel);
    return () => detach(token);
  }, [focused, attach, detach, unavailableLabel]);
  return <View style={[{ height: placement?.height ?? 50, flexShrink: 0 }, style]} />;
}

export function BannerPlacementProvider({ children }: { children: React.ReactNode }) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [height, setHeight] = useState(50);
  const attach = useCallback((owner: symbol, label: string) => setPlacement({ owner, label }), []);
  const detach = useCallback((owner: symbol) => setPlacement(current => current?.owner === owner ? null : current), []);
  const { rewardAdLabel } = useSettingsLocalizationContext();
  const pathname = usePathname();
  const { adsAllowed } = usePremium();
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const width = Math.floor(viewport.width - insets.left - insets.right);
  const visible = !!placement && pathname === "/settings" && adsAllowed;
  // Settle resize events without creating a placement/budget for every pixel.
  const [settledWidth, setSettledWidth] = useState(width);
  useEffect(() => {
    if (width <= 0) return;
    const timer = setTimeout(() => setSettledWidth(width), 250);
    return () => clearTimeout(timer);
  }, [width]);
  const orientation = viewport.width > viewport.height ? "landscape" : "portrait";
  const [slots, setSlots] = useState<{ id: string; width: number; height: number }[]>([]);
  useEffect(() => {
    if (!visible || width <= 0 || width !== settledWidth) return;
    setSlots(current => {
      const slot = current.find(value => value.id === orientation);
      if (!slot) return [...current, { id: orientation, width, height: 50 }];
      return slot.width === width ? current : current.map(value => value.id === orientation ? { ...value, width } : value);
    });
  }, [visible, width, settledWidth, orientation]);
  useEffect(() => { setHeight(slots.find(slot => slot.id === orientation)?.height ?? 50); }, [orientation, slots]);
  return <PlacementContext.Provider value={{ height, attach, detach }}>
    <View style={{ flex: 1 }}>
      {children}
      {slots.map(slot => <PersistentBanner key={slot.id} placementId={`settings-${slot.id}`} adsAllowed={adsAllowed}
        adaptiveWidth={slot.width} availableWidth={slot.id === orientation ? width : slot.width}
        visible={visible && slot.id === orientation}
        resizeSettled={width === settledWidth && slot.width === width}
        delayedLabel={rewardAdLabel("rewardAdDelayed")}
        unavailableLabel={placement?.label ?? ""} onHeight={height => setSlots(current =>
          current.map(value => value.id === slot.id && value.height !== height ? { ...value, height } : value))}
        bottom={insets.bottom + 12} left={insets.left} right={insets.right} />)}

    </View>
  </PlacementContext.Provider>;
}

function PersistentBanner({ placementId, adaptiveWidth, availableWidth, resizeSettled, adsAllowed, visible, delayedLabel, unavailableLabel, onHeight, bottom, left, right }: {
  placementId: string; adaptiveWidth: number; availableWidth: number; resizeSettled: boolean; adsAllowed: boolean;
  visible: boolean; delayedLabel: string; unavailableLabel: string; onHeight: (height: number) => void;
  bottom: number; left: number; right: number;
}) {
  const { discardLoadedBanner, initializationFailed, beginInitializationRecovery, getBannerState, subscribeBannerState, claimBanner, releaseBanner, requestBanner, bannerLoaded, bannerFailed } = getBannerPlacement(placementId);
  const sdkState = useMobileAdsState();
  const sdkDelayed = useMobileAdsLoadDelayed();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const eligible = visible && foreground;
  const canRequest = useRef(false);
  useLayoutEffect(() => {
    canRequest.current = eligible;
    return () => { canRequest.current = false; };
  }, [eligible]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", value => setForeground(value === "active"));
    return () => subscription.remove();
  }, []);
  const state = useSyncExternalStore(subscribeBannerState, getBannerState, getBannerState);
  const token = useRef(Symbol("settings-banner"));
  const [owned, setOwned] = useState(false);
  const [width, setWidth] = useState(adaptiveWidth ?? 0);
  // Keep an issued native request alive while hidden until its real callback.
  // Dispose settled inventory on ad removal or confirmed width overflow.
  // A narrower valid creative fits a larger host unchanged. Only an actual
  // width overflow is incompatible; a rotation alone never retires inventory.
  const sizeChanged = width > adaptiveWidth;
  const fitsViewport = width <= availableWidth;
  useEffect(() => {
    if (state.phase === "loading") return;
    if (adsAllowed && (!visible || !resizeSettled)) return;
    if (!adsAllowed || sizeChanged) {
      if (state.phase === "loaded") recordAdEvent("banner", "inventory_retired", {
        placementId, requestId: state.requestId, reason: adsAllowed ? "width_overflow" : "entitlement",
        requestedWidth: width, availableWidth: adaptiveWidth,
      });
      discardLoadedBanner(token.current);
    }
    if (sizeChanged) setWidth(adaptiveWidth);
  }, [adsAllowed, visible, resizeSettled, sizeChanged, adaptiveWidth, state.phase, owned]);
  const [, redraw] = useState(0);
  const [config] = useState(() => { try { return getAdConfiguration(); } catch { return null; } });
  const startedAt = useRef(0);
  const requestedAtUtc = useRef<string | null>(null);
  const lastRequest = useRef(0);
  const sdkFailedAt = useRef<number | null>(null);
  const sdkFailed = sdkState === "failed" || sdkState === "configuration" || !config;
  useEffect(() => {
    const owner = token.current;
    setOwned(claimBanner(owner));
    return () => releaseBanner(owner);
  }, []);
  useEffect(() => {
    if (eligible) void initializeMobileAds().catch(() => { /* Shared state carries failure. */ });
  }, [eligible]);
  useEffect(() => {
    if (owned && sdkState === "failed") initializationFailed(token.current);
  }, [owned, sdkState, state.phase]);
  useEffect(() => {
    if (!eligible || !owned || !config || sdkState !== "failed" || state.dueAt === null || state.extraUsed) return;
    const timer = setTimeout(() => {
      if (!canRequest.current || AppState.currentState !== "active" || !beginInitializationRecovery(token.current)) return;
      retryMobileAdsInitialization();
      traceBanner("initialization_extra_cycle_started", { placementId });
      void initializeMobileAds().catch(() => { /* Shared state reports the genuine result. */ });
    }, Math.max(0, state.dueAt - performance.now()));
    return () => clearTimeout(timer);
  }, [eligible, owned, config, sdkState, state.dueAt, state.extraUsed]);
  useEffect(() => {
    if (!eligible || !owned || sdkState !== "ready" || !config || width <= 0 || sizeChanged || !resizeSettled) return;
    if (state.phase === "idle") {
      if (canRequest.current && AppState.currentState === "active") requestBanner(token.current);
      return;
    }
    if (state.dueAt === null) return;
    const id = setTimeout(() => {
      if (canRequest.current && AppState.currentState === "active") requestBanner(token.current);
    }, Math.max(0, state.dueAt - performance.now()));
    return () => clearTimeout(id);
  }, [eligible, owned, sdkState, config, width, state.phase, state.dueAt, sizeChanged, resizeSettled]);
  useEffect(() => {
    if (!eligible) return;
    if (!sdkFailed) sdkFailedAt.current = null;
    else if (sdkFailedAt.current === null) sdkFailedAt.current = performance.now();
    const until = sdkFailed ? sdkFailedAt.current! + 10_000 : state.messageUntil;
    if (until <= performance.now()) return;
    const id = setTimeout(() => redraw(value => value + 1), until - performance.now());
    return () => clearTimeout(id);
  }, [eligible, sdkFailed, state.messageUntil]);
  useEffect(() => {
    if (!owned || state.phase !== "loading" || lastRequest.current === state.requestId) return;
    lastRequest.current = state.requestId;
    startedAt.current = performance.now();
    requestedAtUtc.current = new Date().toISOString();
    traceBanner("view_request", { attempt: state.attempt, requestId: state.requestId, width, profile: config?.profile });
  }, [owned, state.phase, state.requestId, state.attempt, width, config]);
  useEffect(() => {
    if (!eligible || state.phase !== "loading") return;
    const remaining = 45000 - (performance.now() - startedAt.current);
    if (remaining <= 0) return;
    const timer = setTimeout(() => redraw(value => value + 1), remaining + 1);
    return () => clearTimeout(timer);
  }, [eligible, state.phase, state.requestId]);
  const delayed = sdkDelayed || (state.phase === "loading" && lastRequest.current === state.requestId && performance.now() - startedAt.current >= 45000);
  const unavailable = sdkFailed || state.phase === "failed";
  const messageVisible = sdkFailed ? sdkFailedAt.current === null || performance.now() < sdkFailedAt.current + 10_000 : performance.now() < state.messageUntil;
  function traceBanner(stage: string, detail: Record<string, unknown> = {}, error?: unknown) {
    recordAdEvent("banner", stage, { ...detail, placementId, requestId: state.requestId, state: state.phase }, error);
  }
  const requestId = state.requestId;
  // Pin the request's width: layout/background changes must not issue an implicit SDK load.
  const requestSize = useRef({ requestId: 0, width: 0 });
  if (state.phase === "loading" && requestSize.current.requestId !== requestId) {
    requestSize.current = { requestId, width };
  }
  // Do not use display:none or conditionally remove the ad on blur: Fabric can
  // tear down that native view. Park this one view outside the viewport instead.
  return <>
    {eligible && ((!unavailable && delayed) || (unavailable && messageVisible)) ?
      <View pointerEvents="none" style={{ position: "absolute", left, right, bottom, alignItems: "center", minHeight: 50 }}>
        <Text allowFontScaling={false}>{unavailable ? unavailableLabel : delayedLabel}</Text>
      </View> : null}
    <View collapsable={false} removeClippedSubviews={false} pointerEvents={eligible && fitsViewport ? "auto" : "none"}
    accessibilityElementsHidden={!eligible || !fitsViewport} importantForAccessibility={eligible && fitsViewport ? "auto" : "no-hide-descendants"}
    style={{ position: "absolute", left: left + Math.max(0, availableWidth - width) / 2, width, bottom: eligible && fitsViewport ? bottom : -10000,
      opacity: eligible && fitsViewport ? 1 : 0, alignItems: "center", justifyContent: "center", minHeight: 50 }}
    onLayout={event => {
      onHeight(Math.max(50, event.nativeEvent.layout.height));
    }}>
    {owned && config && requestSize.current.width > 0 && (state.phase === "loading" || (adsAllowed && !sizeChanged && state.phase === "loaded")) ?
      <AdaptiveBannerAd key={requestId} unitId={config.banner} width={requestSize.current.width} requestOptions={REQUEST_OPTIONS}
        onSizeChange={size => traceBanner("size_changed", { ...size, attempt: state.attempt })}
        onAdImpression={() => {
          if (getBannerState().requestId !== requestId) return;
          traceBanner("impression", { requestId, attempt: state.attempt,
            placementEligible: canRequest.current, appState: AppState.currentState });
        }}
        onAdLoaded={size => {
          const refresh = getBannerState().phase === "loaded";
          if (!bannerLoaded(token.current, requestId)) return;
          traceBanner(refresh ? "sdk_refresh_complete" : "load_complete", {
            attempt: state.attempt, ...size, requestedAt: refresh ? null : requestedAtUtc.current,
            elapsedMs: refresh ? null : performance.now() - startedAt.current,
          });
        }}
        onAdFailedToLoad={error => {
          const current = getBannerState();
          if (current.requestId !== requestId) return;
          if (current.phase === "loaded") { traceBanner("sdk_refresh_failed", { attempt: state.attempt, requestedAt: null }, error); return; }
          if (!bannerFailed(token.current, requestId)) return;
          traceBanner("load_failed", { attempt: state.attempt, elapsedMs: performance.now() - startedAt.current }, error);
          const next = getBannerState();
          if (next.dueAt !== null) traceBanner(next.phase === "failed" ? "extra_cycle_scheduled" : "retry_scheduled", { attempt: next.attempt + 1, dueAt: next.dueAt });
        }} /> : null}
  </View></>;
}
