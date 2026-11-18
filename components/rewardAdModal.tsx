import { ReservedText } from "@/components/ReservedText";
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
import { requireNativeModule, requireNativeViewManager } from "expo-modules-core";
import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  AppState,
  BackHandler,
  findNodeHandle,
  Image as NativeImage,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ViewProps,
} from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WATCH_AD_BUTTON = require("../assets/images/Watch_Ad_Button.png");
const PLAY_BG = require("../assets/images/Play_Bg.png");
const PRO_BADGE = require("../assets/images/PRO_Badge.png");
const RewardPopupSurface = Platform.OS === "web" ? null :
  requireNativeViewManager<ViewProps & React.RefAttributes<View>>("LedPopAdImmersive");
const popupSurfaceStyle = { position: "absolute", top: 0, left: 0, width: 1, height: 1 } as const;

type PopupDismissalModule = {
  observeRewardPopupDismissal(viewTag: number, token: number): Promise<void>;
  cancelRewardPopupObservation(token: number): Promise<void>;
  addListener(
    event: "rewardPopupDismissed",
    callback: (event: { token: number }) => void,
  ): { remove(): void };
};

let popupDismissalSequence = 0;

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
  onOpenShop?: () => void;
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
  onOpenShop,
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

  const overlayOpacity = useSharedValue(0);
  const openingStarted = useRef(false);
  const openingShop = useRef(false);
  const surfaceRef = useRef<View>(null);
  const pending = useRef<{
    controller: AbortController;
    closing: boolean;
    afterDismiss: () => void;
  } | null>(null);

  const cancelPending = useCallback(() => {
    const flow = pending.current;
    pending.current = null;
    flow?.controller.abort();
  }, []);

  useLayoutEffect(() => {
    if (visible || !pending.current?.closing) {
      cancelPending();
    } else if (Platform.OS === "web") {
      pending.current.afterDismiss();
    }
  }, [visible, cancelPending]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") cancelPending();
    });
    return () => { subscription.remove(); cancelPending(); };
  }, [cancelPending]);

  const handleCancel = useCallback(() => {
    cancelPending();
    onClose();
  }, [cancelPending, onClose]);

  useLayoutEffect(() => {
    if (visible) return;
    openingStarted.current = false;
    openingShop.current = false;
    cancelAnimation(overlayOpacity);
    overlayOpacity.value = 0;
  }, [visible, overlayOpacity]);

  const showAfterLayout = useCallback(() => {
    if (!visible || openingStarted.current) return;
    openingStarted.current = true;
    overlayOpacity.set(withTiming(1, { duration: 180 }));
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

  const handleOpenShop = () => {
    if (drag.current.moved || !visible || !onOpenShop || openingShop.current ||
        pending.current || AppState.currentState !== "active") return;
    openingShop.current = true;
    onClose();
    onOpenShop();
  };

  const handleWatchAd = async () => {
    if (drag.current.moved || !visible || !adReady || !onWatchAd || openingShop.current || pending.current ||
        AppState.currentState !== "active" || (isAdReady && !isAdReady())) return;
    const controller = new AbortController();
    const flow = {
      controller,
      closing: false,
      afterDismiss: () => {
        if (pending.current !== flow || !flow.closing) return;
        const frame = requestAnimationFrame(() => {
          if (pending.current !== flow) return;
          cancelPending();
          if (AppState.currentState === "active") onWatchAd();
        });
        controller.signal.addEventListener("abort", () => cancelAnimationFrame(frame), { once: true });
      },
    };
    pending.current = flow;

    try {
      if (Platform.OS !== "web") {
        const viewTag = findNodeHandle(surfaceRef.current);
        if (viewTag === null) throw new Error("Reward popup surface is unavailable");
        const native = requireNativeModule<PopupDismissalModule>("LedPopAdImmersive");
        const token = ++popupDismissalSequence;
        const subscription = native.addListener("rewardPopupDismissed", (event) => {
          if (event.token !== token) return;
          subscription.remove();
          flow.afterDismiss();
        });
        controller.signal.addEventListener("abort", () => {
          subscription.remove();
          void native.cancelRewardPopupObservation(token).catch((error) => {
            console.warn("[Ads] Reward popup observation cleanup failed", error);
          });
        }, { once: true });
        await native.observeRewardPopupDismissal(viewTag, token);
      }
      if (pending.current !== flow) return;
      if (AppState.currentState !== "active" || (isAdReady && !isAdReady())) {
        cancelPending();
        return;
      }
      if (shouldTrackAdInteraction()) trackAnalyticsEvent("WatchAd_clicked");
      flow.closing = true;
      onClose();
    } catch (error) {
      if (pending.current !== flow) return;
      cancelPending();
      console.warn("[Ads] Could not confirm reward popup dismissal", error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      onLayout={showAfterLayout}
      style={[styles.root, { zIndex: 10000, paddingTop: 12 + insets.top, paddingBottom: 12 + insets.bottom, paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }, overlayStyle]}
      pointerEvents={visible ? "auto" : "none"}
      accessibilityViewIsModal={visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    >
      {/* Keep native detachment tied to the overlay without hosting its visual children. */}
      {RewardPopupSurface && (
        <RewardPopupSurface ref={surfaceRef} style={popupSurfaceStyle} pointerEvents="none"
          importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
      )}
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
            <Text style={styles.rewardDescription} allowFontScaling={false}>
              {rewardAdLabel("rewardDescription")}
            </Text>

          <RewardBenefits rewardAdLabel={rewardAdLabel} />
        </View>

        <View style={styles.adStatusArea}>
          <ReservedText
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
            <ReservedText
              text={rewardAdLabel(adReady ? "rewardWatchAd" : "rewardAdPreparingButton")}
              variants={REWARD_AD_BUTTON_TEXTS}
              textStyle={[
                styles.ctaButtonText,
                watchAdFontFamily ? { fontFamily: watchAdFontFamily } : undefined,
              ]}
            />
          </View>
        </TouchableOpacity>
        {onOpenShop && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenShop}
            accessibilityRole="button"
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText} allowFontScaling={false}>
              {rewardAdLabel("rewardBuyPro")}
            </Text>
          </TouchableOpacity>
        )}
        </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}
