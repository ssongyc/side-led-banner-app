import { FireworksBurst } from "./rewardAdModal/FireworksBurst";
import { RewardBenefits } from "./rewardAdModal/RewardBenefits";
import { adUnavailableReason, shouldTrackAdInteraction } from "@/utils/adAvailability";
import { appFontFamilyForText } from "@/constants/appFonts";
import { rewardAdModalStyles as styles } from "@/constants/styles";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import { trackAnalyticsEvent } from "@/utils/ApiClient";
import { REWARD_AD_STATUS_TEXTS, REWARD_AD_BUTTON_TEXTS } from "@/language/rewardAdLabels";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef } from "react";
import {
  AppState,
  BackHandler,
  Image as NativeImage,
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  type TextStyle,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WATCH_AD_BUTTON = require("../assets/images/Watch_Ad_Button.png");
const PLAY_BG = require("../assets/images/Play_Bg.png");
const PRO_BADGE = require("../assets/images/PRO_Badge.png");

// Overlapping, in-flow invisible copies reserve the tallest variant in the first
// native layout pass. No onLayout/setState resize after the popup is displayed.
function ReservedAdText({ text, variants, textStyle }: {
  text: string;
  variants: readonly string[];
  textStyle: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.reservedText}>
      <View style={styles.reservedTextRow} pointerEvents="none"
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        {[...variants, text].map((variant, index) => (
          <Text key={index} allowFontScaling={false}
            style={[textStyle, styles.reservedTextCopy]}>{variant}</Text>
        ))}
      </View>
      <Text style={[textStyle, styles.reservedTextVisible]} allowFontScaling={false}
        accessibilityLiveRegion="polite">{text}</Text>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  adReady?: boolean;
  adFailed?: boolean;
  adFailure?: 'unavailable' | 'load' | 'show' | 'open-timeout' | 'expiry' | 'configuration' | 'initialization' | 'consent' | null;
  adShowFailed?: boolean;
  adDelayed?: boolean;
  adExpired?: boolean;
  onWatchAd?: () => void;
  canRetry?: boolean;
  onRetry?: () => void;
  isAdReady?: () => boolean;
};

export function RewardAdModal({
  visible,
  onClose,
  adReady = false,
  adFailed = false,
  adFailure = null,
  adShowFailed = false,
  adDelayed = false,
  adExpired = false,
  onWatchAd,
  canRetry = false,
  onRetry,
  isAdReady,
}: Props) {
  const { rewardAdLabel, resolvedAppLocale } = useSettingsLocalizationContext();
  const insets = useSafeAreaInsets();
  const drag = useRef({ x: 0, y: 0, moved: false });
  const watchAdFontFamily =
    resolvedAppLocale === "ko" || resolvedAppLocale === "en"
      ? appFontFamilyForText("noto_sans_kr", "bold")
      : undefined;

  const overlayOpacity = useSharedValue(visible ? 1 : 0);
  const pendingAfterCloseRef = useRef<(() => void) | null>(null);
  const frameRef = useRef<number | null>(null);

  // `visible=false` already committed a null render. Only then may an ad open.
  useEffect(() => {
    if (visible || !pendingAfterCloseRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const after = pendingAfterCloseRef.current;
      pendingAfterCloseRef.current = null;
      if (AppState.currentState === "active") after?.();
    });
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [visible]);

  useEffect(() => {
    const cancelPending = () => {
      pendingAfterCloseRef.current = null;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") cancelPending();
    });
    return () => { sub.remove(); cancelPending(); };
  }, []);

  const handleCancel = useCallback(() => {
    pendingAfterCloseRef.current = null;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 180 });
    } else {
      // Do not retain a fading card after close. Reset only for the next open.
      overlayOpacity.value = 0;
    }
  }, [visible, overlayOpacity]);

  //mount 시, 현재 screen의 뒤로가기 이벤트 리스너 등록
  useEffect(() => {
    if (!visible) return;
    //true로 마지막에 등록된 handler 호출
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleCancel();
      return true;
    });
    return () => sub.remove();
  }, [visible, handleCancel]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const handleWatchAd = () => {
    if (drag.current.moved || !visible || !adReady || !onWatchAd || pendingAfterCloseRef.current || (isAdReady && !isAdReady())) return;
    if (shouldTrackAdInteraction()) trackAnalyticsEvent("WatchAd_clicked");
    // 닫힘 애니메이션이 실제로 끝난 뒤(추측 딜레이 아님) 광고를 띄운다.
    pendingAfterCloseRef.current = onWatchAd ?? null;
    onClose();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.root, { paddingTop: 12 + insets.top, paddingBottom: 12 + insets.bottom, paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }, overlayStyle]}
      pointerEvents={visible ? "auto" : "none"}
      accessibilityViewIsModal={visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    >
      <Pressable
        style={[styles.dim, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        onPress={handleCancel}
      />
      <FireworksBurst visible={visible} />

      <View style={styles.card}>
        <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}
          keyboardShouldPersistTaps="handled" canCancelContentTouches
          onTouchStart={event => {
            drag.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, moved: false };
          }}
          onTouchMove={event => {
            if (Math.hypot(event.nativeEvent.pageX - drag.current.x, event.nativeEvent.pageY - drag.current.y) > 8) drag.current.moved = true;
          }}
          onScrollBeginDrag={() => { drag.current.moved = true; }}
          showsVerticalScrollIndicator>
          <TouchableOpacity style={styles.closeButton}
            onPress={() => { if (!drag.current.moved) handleCancel(); }}
            accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={22} color="#8A8A8A" />
          </TouchableOpacity>
        <View style={styles.appIconContainer}>
          <Image
            source={PRO_BADGE}
            style={styles.appIconImage}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

          <View style={styles.contentContainer}>
            <Text
              style={styles.headerBadge}
              allowFontScaling={false}
            >
              {rewardAdLabel("rewardHeaderBadge")}
            </Text>

          <RewardBenefits rewardAdLabel={rewardAdLabel} />
        </View>

        <View style={styles.adStatusArea}>
          <ReservedAdText
            text={adUnavailableReason(resolvedAppLocale) ?? (adReady || adFailure === "consent" ? "" : rewardAdLabel(adFailure === "unavailable" ? "rewardAdUnavailable" : adFailure === "initialization" ? "rewardAdInitializationFailed" : adFailure === "configuration" ? "rewardAdConfigurationFailed" : adFailure === "open-timeout" ? "rewardAdOpenUnconfirmed" : adExpired ? "rewardAdExpired" : adShowFailed ? "rewardAdShowFailed" : adFailed ? "rewardAdLoadFailed" : adDelayed ? "rewardAdDelayed" : "rewardAdPreparing"))}
            variants={REWARD_AD_STATUS_TEXTS}
            textStyle={styles.adStatusText}
          />
        </View>

        <View style={styles.modalActions}>
          <View style={styles.adRetryArea}>
            {canRetry && onRetry && (
              <TouchableOpacity onPress={() => { if (!drag.current.moved && visible && canRetry) onRetry(); }}
                accessibilityRole="button" style={styles.adRetryButton}>
                <Text style={styles.adRetryText} allowFontScaling={false}>{rewardAdLabel("rewardAdRetry")}</Text>
              </TouchableOpacity>
            )}
          </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleWatchAd}
          disabled={!adReady}
          accessibilityRole="button"
          accessibilityLabel={rewardAdLabel(adReady ? "rewardWatchAd" : "rewardAdPreparingButton")}
          accessibilityState={{ disabled: !adReady }}
          style={[styles.ctaButton, !adReady && { opacity: 0.4 }]}
        >
          {Platform.OS === "ios" ? (
            <NativeImage
              source={WATCH_AD_BUTTON}
              style={styles.ctaButtonBg}
              resizeMode="stretch"
              capInsets={{ top: 27, left: 27, bottom: 27, right: 27 }}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Image
              source={WATCH_AD_BUTTON}
              style={styles.ctaButtonBg}
              contentFit="fill"
              accessibilityIgnoresInvertColors
            />
          )}
          <View style={styles.ctaButtonContent}>
            <Image
              source={PLAY_BG}
              style={styles.ctaPlayBg}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <ReservedAdText
              text={rewardAdLabel(adReady ? "rewardWatchAd" : "rewardAdPreparingButton")}
              variants={REWARD_AD_BUTTON_TEXTS}
              textStyle={[
                styles.ctaButtonText,
                watchAdFontFamily ? { fontFamily: watchAdFontFamily } : undefined,
              ]}
            />
          </View>
        </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}
