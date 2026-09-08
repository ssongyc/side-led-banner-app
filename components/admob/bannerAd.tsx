import React, { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
} from "react-native-google-mobile-ads";

const BANNER_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3506417530430977/4875843768",
  android: "ca-app-pub-3506417530430977/9971880471",
});

const LOAD_RETRY_DELAYS_MS = [3000, 6000] as const;
const UNAVAILABLE_MESSAGE_DURATION_MS = 10_000;

type BannerAdComponentProps = {
  style?: any;
  unavailableLabel: string;
};

export default function BannerAdComponent({
  style,
  unavailableLabel,
}: BannerAdComponentProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(!BANNER_AD_UNIT_ID);
  const [unavailableVisible, setUnavailableVisible] = useState(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => setUnavailableVisible(false), UNAVAILABLE_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [failed]);

  const clearRetryTimer = () => {
    if (!retryTimerRef.current) return;
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  };

  if (!BANNER_AD_UNIT_ID) {
    if (__DEV__) console.error(`[bannerAd] Banner ad is not configured for ${Platform.OS}.`);
    return (
      <View style={[{ alignItems: "center", minHeight: 50, justifyContent: "center" }, style]}>
        {unavailableVisible ? <Text allowFontScaling={false}>{unavailableLabel}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[{ alignItems: "center", minHeight: 50, justifyContent: "center" }, style]}>
      {failed ? (
        unavailableVisible ? <Text allowFontScaling={false}>{unavailableLabel}</Text> : null
      ) : (
        <BannerAd
          key={`${BANNER_AD_UNIT_ID}-${attempt}`}
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            clearRetryTimer();
            if (__DEV__) console.log("Banner ad loaded");
          }}
          onAdFailedToLoad={(error) => {
            if (__DEV__) console.error("Banner ad failed to load", error);
            clearRetryTimer();
            const retryDelay = LOAD_RETRY_DELAYS_MS[attempt];
            if (retryDelay == null) {
              setFailed(true);
              return;
            }
            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;
              setAttempt((currentAttempt) => currentAttempt + 1);
            }, retryDelay);
          }}
        />
      )}
    </View>
  );
}
