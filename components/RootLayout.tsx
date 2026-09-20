import { BannerPlacementProvider } from "@/components/admob/bannerAd";
import { StartupRecovery } from "@/components/StartupRecovery";
import { STARTUP_RECOVERY_LABELS } from "@/language/startupRecoveryLabels";
import { SplashLoadingScreen } from "@/components/SplashLoadingScreen";
import {
  APP_THEME_FONT_ASSETS,
  buildEagerFontAssets,
} from "@/constants/appFonts";
import { PremiumLifecycle, usePremium } from "@/contexts/premiumContext";
import { SettingsProvider } from "@/contexts/settingsContext";
import { StartupPreviewContext, StartupVisibilityContext, type StorageStartupState } from "@/contexts/startupContext";
import { clearFailedSkiaTypefaces } from "@/hooks/useCachedSkiaFont";
import { loadRewardedAd, suspendRewardedAds } from "@/hooks/useRewardedAd";
import { deviceLocaleToAppLocale } from "@/language/deviceLocale";
import { createDeferredFontPreloadTasks } from "@/utils/fontPreload";
import {
  configureAndroidNavigationBarHidden,
  hideAndroidNavigationBar,
} from "@/utils/SystemChrome";
import { suspendMobileAdsInitialization } from "@/ads/initializeMobileAds";
import { disableAppTextScaling } from "@/utils/TextScaling";
import { initializeAnalytics, flushAnalytics } from "@/utils/ApiClient";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router";
import { loadAsync } from "expo-font";
import { useKeepAwake } from 'expo-keep-awake';
import { useLocales } from "expo-localization";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState, Platform, StyleSheet, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ReducedMotionConfig, ReduceMotion } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

disableAppTextScaling();

SplashScreen.setOptions({ fade: false, duration: 0 });
SplashScreen.preventAutoHideAsync();

function PremiumAwareAds() {
  const { adsAllowed } = usePremium();
  useEffect(() => {
    if (!adsAllowed) {
      suspendRewardedAds();
      suspendMobileAdsInitialization();
      return;
    }
    loadRewardedAd();
    return () => {
      suspendRewardedAds();
      suspendMobileAdsInitialization();
    };
  }, [adsAllowed]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useKeepAwake();

  // 기기 언어의 폰트 5개만 부팅 시 즉시 로드
  const locales = useLocales();
  const deviceAppLocale = useMemo(
    () => deviceLocaleToAppLocale(locales[0] ?? { languageCode: "en" }),
    [locales],
  );
  const eagerFontAssets = useMemo(
    () => ({ ...buildEagerFontAssets(deviceAppLocale), ...APP_THEME_FONT_ASSETS }),
    [deviceAppLocale],
  );
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontsFailed, setFontsFailed] = useState(false);
  const [preparationAttempt, setPreparationAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setFontsFailed(false);
    void loadAsync(eagerFontAssets).then(() => {
      if (!cancelled) setFontsLoaded(true);
    }).catch(error => {
      if (!cancelled) setFontsFailed(true);
      if (__DEV__) console.error("[startup] UI fonts failed", error);
    });
    return () => { cancelled = true; };
  }, [eagerFontAssets, preparationAttempt]);

  useEffect(() => {
    configureAndroidNavigationBarHidden();
    const stateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") hideAndroidNavigationBar();
    });
    // Reapply on host-window return; this cannot control external Play windows.
    const focusSubscription = Platform.OS === "android"
      ? AppState.addEventListener("focus", hideAndroidNavigationBar)
      : undefined;
    return () => {
      stateSubscription.remove();
      focusSubscription?.remove();
    };
  }, []);

  const pathname = usePathname();
  const [storageStartup, setStorageStartup] = useState<StorageStartupState | null>(null);
  const [loaderLaidOut, setLoaderLaidOut] = useState(false);
  const [loaderImageReady, setLoaderImageReady] = useState(false);
  const [loaderImageFailed, setLoaderImageFailed] = useState(false);
  const [mainLaidOut, setMainLaidOut] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [startupComplete, setStartupComplete] = useState(false);
  const [preparationTimedOut, setPreparationTimedOut] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [splashFailed, setSplashFailed] = useState(false);
  const [splashAttempt, setSplashAttempt] = useState(0);
  const retrySplash = useCallback(() => {
    setSplashFailed(false);
    setSplashAttempt(attempt => attempt + 1);
  }, []);

  const recoveryVisible = !!storageStartup?.failed || fontsFailed || preparationTimedOut || loaderImageFailed;

  // Hand off to the already mounted React loader, independently of storage/fonts.
  // The same loader remains in place while the real screen mounts underneath it.
  useEffect(() => {
    if (splashDismissed || splashFailed || !loaderLaidOut || (!loaderImageReady && !recoveryVisible)) return;
    let cancelled = false;
    void SplashScreen.hideAsync().then(() => {
      if (!cancelled) setSplashDismissed(true);
    }).catch(error => {
      if (cancelled) return;
      setSplashFailed(true);
      if (__DEV__) console.error("[Splash] Native splash dismissal failed", error);
      if (Platform.OS !== "web") {
        const labels = STARTUP_RECOVERY_LABELS[deviceAppLocale];
        Alert.alert(labels.title, labels.splash, [{ text: labels.retry, onPress: retrySplash }],
          { cancelable: false });
      }
    });
    return () => { cancelled = true; };
  }, [loaderLaidOut, loaderImageReady, recoveryVisible, splashDismissed, splashFailed, splashAttempt, deviceAppLocale, retrySplash]);

  const [preparedLocale, setPreparedLocale] = useState<string | null>(null);
  const startupLocale = storageStartup?.ready ? storageStartup.locale : null;
  useEffect(() => {
    if (startupComplete || !startupLocale) return;
    let cancelled = false;
    // Saved-language UI/input fonts stay on the critical path. Expo shares in-flight loads.
    void loadAsync(buildEagerFontAssets(startupLocale)).then(() => {
      if (!cancelled) setPreparedLocale(startupLocale);
    }).catch(error => {
      if (!cancelled) setFontsFailed(true);
      if (__DEV__) console.error("[startup] saved-language fonts failed", error);
    });
    return () => { cancelled = true; };
  }, [startupComplete, startupLocale, preparationAttempt]);

  const isReady = fontsLoaded && !!storageStartup?.ready && preparedLocale === startupLocale && mainLaidOut &&
    (pathname !== "/" || previewReady);
  useEffect(() => {
    if (startupComplete || !isReady || !splashDismissed || recoveryVisible) return;
    // Allow committed layout/font updates to reach a frame before uncovering the screen.
    let secondFrame: number | undefined;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setStartupComplete(true));
    });
    return () => {
      cancelAnimationFrame(frame);
      if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
    };
  }, [startupComplete, isReady, splashDismissed, recoveryVisible]);

  useEffect(() => {
    if (startupComplete || storageStartup?.failed || fontsFailed) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const updateTimer = (state: string) => {
      if (timer !== undefined) clearTimeout(timer);
      if (state === "active") timer = setTimeout(() => setPreparationTimedOut(true), 30000);
    };
    updateTimer(Platform.OS === "web" ? "active" : AppState.currentState);
    const subscription = AppState.addEventListener("change", updateTimer);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      subscription.remove();
    };
  }, [startupComplete, storageStartup?.failed, fontsFailed, preparationAttempt]);

  useEffect(() => {
    if (!startupComplete) return;
    let cancelled = false;
    let inFlight = false;
    let foreground = Platform.OS === "web" || AppState.currentState === "active";
    let idleTask: ReturnType<typeof requestIdleCallback> | undefined;
    const queue: Array<() => Promise<unknown>> = [async () => {
      const tasks = await createDeferredFontPreloadTasks(deviceAppLocale);
      if (!cancelled) queue.push(...tasks);
    }];
    const schedule = () => {
      if (cancelled || !foreground || inFlight || idleTask !== undefined || queue.length === 0) return;
      idleTask = requestIdleCallback(() => {
        idleTask = undefined;
        if (cancelled || !foreground) return;
        const task = queue.shift();
        if (!task) return;
        inFlight = true;
        void task().catch(error => {
          if (__DEV__) console.warn("[fonts] optional preload failed", error);
        }).finally(() => {
          inFlight = false;
          schedule();
        });
      });
    };
    const subscription = AppState.addEventListener("change", state => {
      foreground = state === "active";
      if (!foreground && idleTask !== undefined) {
        cancelIdleCallback(idleTask);
        idleTask = undefined;
      }
      schedule();
    });
    schedule();
    return () => {
      cancelled = true;
      queue.length = 0;
      if (idleTask !== undefined) cancelIdleCallback(idleTask);
      subscription.remove();
    };
  }, [startupComplete, deviceAppLocale]);

  const retryPreparation = () => {
    clearFailedSkiaTypefaces();
    setPreviewReady(false);
    setMainLaidOut(false);
    setPreparationTimedOut(false);
    setLoaderImageFailed(false);
    if (!storageStartup?.ready) storageStartup?.retry();
    setPreparationAttempt(attempt => attempt + 1);
  };

  useEffect(() => {
    if (!fontsLoaded) return;

    const task = requestIdleCallback(() => {
      void initializeAnalytics();
    });

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") flushAnalytics();
    });

    return () => {
      cancelIdleCallback(task);
      sub.remove();
    };
  }, [fontsLoaded]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* 배너 스크롤/깜빡임은 앱의 핵심 기능이므로 iOS '동작 줄이기' 설정을 따르지 않음 */}
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <SafeAreaProvider onTouchStart={hideAndroidNavigationBar}>
      <PremiumLifecycle>
      <PremiumAwareAds />
      <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <View style={{ flex: 1 }} pointerEvents={startupComplete ? "auto" : "none"}
        accessibilityElementsHidden={!startupComplete}
        importantForAccessibility={startupComplete ? "auto" : "no-hide-descendants"}>
      <SettingsProvider onStartupStateChange={setStorageStartup}>
        <BannerPlacementProvider>
        <KeyboardProvider>
        <StartupVisibilityContext.Provider value={startupComplete}>
        <StartupPreviewContext.Provider value={setPreviewReady}>
        {fontsLoaded ? (
          <View key={preparationAttempt} style={{ flex: 1 }} onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            setMainLaidOut(width > 0 && height > 0);
          }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen
              name="openSourceInfo"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="sunnyList"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="credits"
              options={{ headerShown: false }}
            />
          </Stack>
          </View>
        ) : null}
        </StartupPreviewContext.Provider>
        </StartupVisibilityContext.Provider>
        </KeyboardProvider>
        </BannerPlacementProvider>
      </SettingsProvider>
      </View>
      {!startupComplete && (
        <View style={StyleSheet.absoluteFill} onLayout={() => setLoaderLaidOut(true)}>
          {splashFailed ? (
            <StartupRecovery locale={deviceAppLocale} kind="splash" onRetry={retrySplash} />
          ) : storageStartup?.failed ? (
            <StartupRecovery locale={storageStartup.locale} kind="storage" onRetry={retryPreparation} />
          ) : fontsFailed || preparationTimedOut || loaderImageFailed ? (
            <StartupRecovery locale={storageStartup?.locale ?? deviceAppLocale}
              kind="preparation" onRetry={retryPreparation} />
          ) : (
            <SplashLoadingScreen onImageLoad={() => setLoaderImageReady(true)}
              onImageError={() => setLoaderImageFailed(true)} />
          )}
        </View>
      )}
      <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} hidden={Platform.OS === "android"} />
      </View>
      </PremiumLifecycle>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
