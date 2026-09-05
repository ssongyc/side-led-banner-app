import { SplashLoadingScreen } from "@/components/SplashLoadingScreen";
import {
  APP_THEME_FONT_ASSETS,
  buildEagerFontAssets,
  getFontAssetIds,
  getSkiaFontAssets,
} from "@/constants/appFonts";
import { SettingsProvider } from "@/contexts/settingsContext";
import { preloadSkiaTypefaces } from "@/hooks/useCachedSkiaFont";
import { loadRewardedAd } from "@/hooks/useRewardedAd";
import { deviceLocaleToAppLocale } from "@/language/deviceLocale";
import {
  collectPriorityFontIds,
  loadFontIds,
  loadRemainingFonts,
  prefetchRemoteFonts,
} from "@/utils/fontPreload";
import { configureAndroidNavigationBarHidden } from "@/utils/SystemChrome";
import { disableAppTextScaling } from "@/utils/TextScaling";
import * as amplitude from "@amplitude/analytics-react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { useKeepAwake } from 'expo-keep-awake';
import { useLocales } from "expo-localization";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { AppState, InteractionManager, Platform } from "react-native";
import mobileAds from "react-native-google-mobile-ads";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ReducedMotionConfig, ReduceMotion } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

disableAppTextScaling();

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded] = useFonts(eagerFontAssets);

  // 필요한 폰트를 우선 로드하고, 그 다음 나머지는 백그라운드로 로드
  useEffect(() => {
    if (!fontsLoaded) return;
    let cancelled = false;
    collectPriorityFontIds(deviceAppLocale).then((priorityIds) => {
      if (cancelled) return;
      preloadSkiaTypefaces(getFontAssetIds(priorityIds));
      prefetchRemoteFonts(priorityIds);
      loadFontIds(priorityIds)
        .then(() => (cancelled ? undefined : loadRemainingFonts(priorityIds)))
        .catch((err) => {
          if (__DEV__) console.warn("[fonts] font preload failed", err);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, deviceAppLocale]);

  useEffect(() => {
    preloadSkiaTypefaces(getSkiaFontAssets(deviceAppLocale));
  }, [deviceAppLocale]);

  useEffect(() => {
    configureAndroidNavigationBarHidden();
  }, []);

  //최소 0.75초 스플래쉬 강제
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 750);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const isReady = fontsLoaded && minTimeElapsed;

  useEffect(() => {
    const initializeAds = async () => {
      try {
        await mobileAds().initialize();
        loadRewardedAd();
      } catch (e) {
        if (__DEV__) console.warn("[App] MobileAds init failed:", e);
      }
    };
    initializeAds();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const task = InteractionManager.runAfterInteractions(() => {
      const initAmplitude = async () => {
        const key = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? "";
        if (!key) return;
        try {
          await amplitude.init(key, undefined, {
            disableCookies: true,
          }).promise;
          const deviceId = amplitude.getDeviceId();
          if (deviceId) amplitude.setUserId(deviceId);
        } catch (e) {
          if (__DEV__) console.warn("[App] Amplitude init failed:", e);
        }
      };

      initAmplitude();
    });

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") amplitude.flush();
    });

    return () => {
      task.cancel();
      sub.remove();
    };
  }, [isReady]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* 배너 스크롤/깜빡임은 앱의 핵심 기능이므로 iOS '동작 줄이기' 설정을 따르지 않음 */}
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <SafeAreaProvider>
      <SettingsProvider>
        <KeyboardProvider>
        {isReady ? (
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
        ) : (
          <SplashLoadingScreen />
        )}
        </KeyboardProvider>
        <StatusBar hidden={Platform.OS === "android"} />
      </SettingsProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
