import {
  fontDownloadModalStyles as styles,
  WATCH_AD_BUTTON_COLORS,
} from "@/constants/styles";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
import { fontDownloadLabel } from "@/language/fontDownloadLabels";
import {
  cancelFontDownload,
  getFontDownloadPromptSnapshot,
  subscribeFontDownloadPrompt,
} from "@/utils/remoteFontDownloadPrompt";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BackHandler,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FontDownloadModal() {
  const { resolvedAppLocale } = useSettingsLocalizationContext();
  const insets = useSafeAreaInsets();
  const { visible, progress, status } = useSyncExternalStore(
    subscribeFontDownloadPrompt,
    getFontDownloadPromptSnapshot,
  );

  const [mounted, setMounted] = useState(visible);
  const overlayOpacity = useSharedValue(visible ? 1 : 0);
  const wasVisibleRef = useRef(visible);

  const handleFullyClosed = useCallback(() => setMounted(false), []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      overlayOpacity.value = withTiming(1, { duration: 180 });
    } else if (wasVisibleRef.current) {
      overlayOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) scheduleOnRN(handleFullyClosed);
      });
    }
    wasVisibleRef.current = visible;
  }, [visible, overlayOpacity, handleFullyClosed]);

  useEffect(() => {
    if (!mounted) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      cancelFontDownload();
      return true;
    });
    return () => sub.remove();
  }, [mounted]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!mounted) return null;

  const percent = progress < 0 ? null : Math.round(progress * 100);
  const failed = status === "failed";

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingTop: 12 + insets.top,
          paddingBottom: 12 + insets.bottom,
          paddingLeft: 12 + insets.left,
          paddingRight: 12 + insets.right,
        },
        overlayStyle,
      ]}
      pointerEvents={visible ? "auto" : "none"}
      accessibilityViewIsModal={visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    >
      <Pressable
        style={[styles.dim, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        onPress={cancelFontDownload}
      />
      <View style={styles.card}>
        <View style={styles.body}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={cancelFontDownload}
            accessibilityRole="button"
            accessibilityLabel={fontDownloadLabel(
              "close",
              resolvedAppLocale,
            )}
          >
            <Ionicons name="close" size={22} color="#8A8A8A" />
          </TouchableOpacity>

          <Text
            style={styles.title}
            allowFontScaling={false}
            accessibilityLiveRegion={failed ? "assertive" : "polite"}
          >
            {fontDownloadLabel(
              failed ? "fontDownloadFailed" : "fontDownloadTitle",
              resolvedAppLocale,
            )}
          </Text>

          {failed ? (
            <Text style={styles.errorText} allowFontScaling={false}>
              {fontDownloadLabel(
                "fontDownloadFailedMessage",
                resolvedAppLocale,
              )}
            </Text>
          ) : (
            <>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={WATCH_AD_BUTTON_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(100, percent ?? 0),
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText} allowFontScaling={false}>
                {percent == null ? "" : `${percent}%`}
              </Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
