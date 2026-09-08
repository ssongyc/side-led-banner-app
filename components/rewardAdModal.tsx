import { appFontFamilyForText } from "@/constants/appFonts";
import { rewardAdModalStyles as styles } from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import * as amplitude from "@amplitude/analytics-react-native";
import { REWARD_AD_STATUS_TEXTS, REWARD_AD_BUTTON_TEXTS, type RewardAdLabelKey } from "@/language/rewardAdLabels";
import { Ionicons } from "@expo/vector-icons";
import { Canvas, Group, Path, Rect, Skia } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Pressable,
  ScrollView,
  type StyleProp,
  type TextStyle,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CHECK_ICON = require("../assets/images/Check.png");
const WATCH_AD_BUTTON = require("../assets/images/Watch_Ad_Button.png");
const PLAY_BG = require("../assets/images/Play_Bg.png");
const PRO_BADGE = require("../assets/images/PRO_Badge.png");

// FireworksBurst
const N = 45;

const createStarPath = (size: number) => {
  const path = Skia.Path.Make();
  const half = size / 2;
  const inner = size * 0.15;

  path.moveTo(0, -half);
  path.quadTo(0, 0, inner, -inner);
  path.lineTo(half, 0);
  path.quadTo(0, 0, inner, inner);
  path.lineTo(0, half);
  path.quadTo(0, 0, -inner, inner);
  path.lineTo(-half, 0);
  path.quadTo(0, 0, -inner, -inner);
  path.close();

  return path;
};

const PARTICLE_DATA = Array.from({ length: N }, (_, i) => {
  const angle = (i / N) * Math.PI * 2 + ((i * 13) % 5) * 0.15;
  const maxDistance = 140 + ((i * 73) % 160);
  const size = 10 + ((i * 23) % 14);
  const type = i % 2 === 0 ? "rect" : "star";
  const colors = [
    "#FF6B00",
    "#FF9E00",
    "#e59e6b",
    "#e7b22d",
    "#f3cf8d",
    "#ecc330",
  ];
  const color = colors[i % colors.length];
  const baseOpacity = 0.5 + ((i * 7) % 6) * 0.1;
  const rotationSpeed = ((i * 11) % 4) + 4;
  const spinDirection = i % 3 === 0 ? 1 : -1;

  return {
    angle,
    maxDistance,
    size,
    type,
    color,
    baseOpacity,
    rotationSpeed,
    spinDirection,
  };
});

type FireworkParticleProps = {
  particle: (typeof PARTICLE_DATA)[number];
  starPath: ReturnType<typeof createStarPath> | null;
  progress: SharedValue<number>;
  alpha: SharedValue<number>;
  centerX: number;
  centerY: number;
};

function FireworkParticle({
  particle,
  starPath,
  progress,
  alpha,
  centerX,
  centerY,
}: FireworkParticleProps) {
  const transform = useDerivedValue(() => {
    const currentDist = particle.maxDistance * progress.value;
    const x = centerX + Math.cos(particle.angle) * currentDist;
    const y = centerY + Math.sin(particle.angle) * currentDist;
    const rotation =
      progress.value * particle.rotationSpeed * particle.spinDirection;

    return [{ translateX: x }, { translateY: y }, { rotate: rotation }];
  });
  const opacity = useDerivedValue(
    () => alpha.value * particle.baseOpacity,
  );

  return (
    <Group transform={transform} opacity={opacity}>
      {particle.type === "rect" ? (
        <Rect
          x={-particle.size / 2}
          y={-particle.size / 2}
          width={particle.size}
          height={particle.size}
          color={particle.color}
        />
      ) : (
        <Path path={starPath!} color={particle.color} style="fill" />
      )}
    </Group>
  );
}

function FireworksBurst({ visible }: { visible: boolean }) {
  const { width: W, height: H } = useWindowDimensions();
  const cx = W / 2;
  const cy = H / 2;

  const progress = useSharedValue(0);
  const alpha = useSharedValue(0);

  const starPaths = useMemo(() => {
    return PARTICLE_DATA.map((p) =>
      p.type === "star" ? createStarPath(p.size) : null,
    );
  }, []);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      alpha.value = 0;

      progress.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.back(1.2)),
      });

      alpha.value = withSequence(
        withTiming(1, { duration: 50 }),
        withDelay(700, withTiming(0, { duration: 500 })),
      );
    } else {
      cancelAnimation(progress);
      cancelAnimation(alpha);
      progress.value = 0;
      alpha.value = 0;
    }
  }, [visible, progress, alpha]);

  return (
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {PARTICLE_DATA.map((particle, index) => (
        <FireworkParticle
          key={index}
          particle={particle}
          starPath={starPaths[index]}
          progress={progress}
          alpha={alpha}
          centerX={cx}
          centerY={cy}
        />
      ))}
    </Canvas>
  );
}

type BenefitRow = {
  labelKey: RewardAdLabelKey;
};

const BENEFIT_ROWS: BenefitRow[] = [
  { labelKey: "rewardBenefitTextSize" },
  { labelKey: "rewardBenefitColors" },
  { labelKey: "rewardBenefitEffects" },
  { labelKey: "rewardBenefitFavorites" },
  { labelKey: "rewardBenefitOutlineShadow" },
];

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
  onWatchAd,
  canRetry = false,
  onRetry,
  isAdReady,
}: Props) {
  const { rewardAdLabel, resolvedAppLocale } = useSettingsRest();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = Math.min(width, height) >= 600;
  const watchAdFontFamily =
    resolvedAppLocale === "ko" || resolvedAppLocale === "en"
      ? appFontFamilyForText("noto_sans_kr", "bold")
      : undefined;

  const [mounted, setMounted] = useState(visible);
  const overlayOpacity = useSharedValue(visible ? 1 : 0);
  const wasVisibleRef = useRef(visible);
  const pendingAfterCloseRef = useRef<(() => void) | null>(null);

  const frameRef = useRef<number | null>(null);
  const handleFullyClosed = useCallback(() => {
    setMounted(false);
  }, []);

  // Schedule only after React has committed removal of the overlay.
  useEffect(() => {
    if (mounted || !pendingAfterCloseRef.current) return;
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
  }, [mounted]);

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
      setMounted(true);
      overlayOpacity.value = withTiming(1, { duration: 180 });
    } else if (wasVisibleRef.current) {
      overlayOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) {
          scheduleOnRN(handleFullyClosed);
        }
      });
    }
    wasVisibleRef.current = visible;
  }, [visible, overlayOpacity, handleFullyClosed]);

  //mount 시, 현재 screen의 뒤로가기 이벤트 리스너 등록
  useEffect(() => {
    if (!mounted) return;
    //true로 마지막에 등록된 handler 호출
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleCancel();
      return true;
    });
    return () => sub.remove();
  }, [mounted, handleCancel]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const handleWatchAd = () => {
    if (!visible || !adReady || !onWatchAd || pendingAfterCloseRef.current || (isAdReady && !isAdReady())) return;
    amplitude.track("WatchAd_clicked");
    // 닫힘 애니메이션이 실제로 끝난 뒤(추측 딜레이 아님) 광고를 띄운다.
    pendingAfterCloseRef.current = onWatchAd ?? null;
    onClose();
  };

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.root, { paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }, overlayStyle]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Pressable
        style={[styles.dim, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        onPress={handleCancel}
      />
      <FireworksBurst visible={visible} />

      <View style={[styles.card, { maxWidth: isTablet ? 560 : 380 }]}>
        <View style={styles.appIconContainer}>
          <Image
            source={PRO_BADGE}
            style={styles.appIconImage}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color="#8A8A8A" />
          </TouchableOpacity>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator>
          <View style={styles.contentContainer}>
            <Text
              style={styles.headerBadge}
              allowFontScaling={false}
            >
              {rewardAdLabel("rewardHeaderBadge")}
            </Text>

          <View style={styles.benefitContainer}>
            {BENEFIT_ROWS.map(({ labelKey }) => (
              <View key={labelKey} style={styles.benefitRow}>
                <Image
                  source={CHECK_ICON}
                  style={styles.checkIcon}
                  contentFit="contain"
                  accessibilityIgnoresInvertColors
                />
                <Text style={styles.benefitText} allowFontScaling={false}>
                  {rewardAdLabel(labelKey)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.adStatusArea}>
          <ReservedAdText
            text={adReady ? "" : rewardAdLabel(adFailed ? "rewardAdLoadFailed" : "rewardAdPreparing")}
            variants={REWARD_AD_STATUS_TEXTS}
            textStyle={styles.adStatusText}
          />
        </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <View style={styles.adRetryArea}>
            {canRetry && onRetry && (
              <TouchableOpacity onPress={() => { if (visible && canRetry) onRetry(); }}
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
          <Image
            source={WATCH_AD_BUTTON}
            style={styles.ctaButtonBg}
            contentFit="fill"
            accessibilityIgnoresInvertColors
          />
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
      </View>
    </Animated.View>
  );
}
