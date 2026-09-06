import {
  MultipleLinePlayButton,
  OneLinePlayButton,
} from "@/assets/svg/playOptionButton";
import { PlayResumeButton } from "@/assets/svg/playResumeButton";
import { ProDebugFab } from "@/components/dev/proDebugFab";
import { RewardAdDebugFab } from "@/components/dev/rewardAdDebugFab";
import { SheetFetchDebugPanel } from "@/components/dev/sheetFetchDebugPanel";
import { LedBannerFullScreen } from "@/components/ledBannerFullScreen";
import PreviewPanel from "@/components/previewPanel";
import { RewardAdModal } from "@/components/rewardAdModal";
import { BackgroundSection } from "@/components/settings/backgroundSection";
import { EffectSection } from "@/components/settings/effectSection";
import { TextSection } from "@/components/settings/textSection";
import { btnStyles } from "@/constants/btnStyles";
import { styles, toolbarStyles } from "@/constants/styles";
import { TabType, useSettings } from "@/contexts/settingsContext";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import * as amplitude from "@amplitude/analytics-react-native";
import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { KeyboardAvoidingView, KeyboardToolbar } from "react-native-keyboard-controller";
import { initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";


function DismissButton(props: any) {
  const isDark = useColorScheme() === "dark";
  const color = isDark ? "#ffffff" : "#000000";
  return (
    <TouchableOpacity onPress={props.onPress} style={props.style}>
      <Text allowFontScaling={false} style={[styles.accessoryClose, { color }]}>✔</Text>
    </TouchableOpacity>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { config, ui, updateConfig, updateUI, textSectionLabel, activatePro, openRewardAdModal } =
    useSettings();
  const { playOption } = config.content;
  const { isPlaying, activeTab, rewardAdVisible } = ui;
  const {
    loaded: rewardAdLoaded,
    failed: rewardAdFailed,
    show: showRewardedAd,
  } = useRewardedAd(activatePro);

  // 실측한 플레이바 폭에 비례해 버튼 크기 키우기 (1.6배 제한)
  const [playBarScale, setPlayBarScale] = useState(1);
  const onPlayBarLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const measuredWidth = e.nativeEvent.layout.width;
    const scale = Math.min(1.6, Math.max(1, measuredWidth / 372));
    setPlayBarScale((prev) => (prev === scale ? prev : scale));
  }, []);
  const playBarSizes = useMemo(
    () => ({
      icon: 53 * playBarScale,
      barHeight: 63 * playBarScale,
      barRadius: 20 * playBarScale,
    }),
    [playBarScale],
  );

  useEffect(() => {
    if (!isPlaying) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, []);

  const handlePlay = async () => {
    amplitude.track("Play_clicked", {
      play_mode: playOption,
      font: config.appearance.font,
      fontSize: config.appearance.fontSize,
      textMoveSpeed: config.motion.textMoveSpeed,
      letterSpacing: config.appearance.letterSpacing,
      lineSpacing: config.appearance.lineSpacing,
      textColor: config.appearance.textSelectedColor,
      outLine: config.appearance.outLine,
      dropShadow: config.appearance.dropShadow,
      backgroundColor: config.background.backgroundColor,
      backgroundBlur: config.background.backgroundBlur,
      has_photo: config.background.backgroundImageUri != null,
      effects: config.appearance.effectSelectedItems.join(","),
      backgroundEffect: config.appearance.backgroundEffectPreset,
    });
    await ScreenOrientation.unlockAsync();
    updateUI({ isPlaying: true });
  };

  const handleStop = async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
    updateUI({ isPlaying: false });
  };

  const handleTabPress = (tab: TabType) => {
    if (tab === "TEXT") {
      amplitude.track("Text_clicked", {
        font: config.appearance.font,
        fontSize: config.appearance.fontSize,
        textMoveSpeed: config.motion.textMoveSpeed,
        letterSpacing: config.appearance.letterSpacing,
        lineSpacing: config.appearance.lineSpacing,
        textColor: config.appearance.textSelectedColor,
        outLine: config.appearance.outLine,
        dropShadow: config.appearance.dropShadow,
      });
    } else if (tab === "BACKGROUND") {
      amplitude.track("BG_clicked", {
        backgroundColor: config.background.backgroundColor,
        backgroundBlur: config.background.backgroundBlur,
        has_photo: config.background.backgroundImageUri != null,
      });
    } else if (tab === "EFFECT") {
      amplitude.track("Effects_clicked", {
        effects: config.appearance.effectSelectedItems.join(","),
        backgroundEffect: config.appearance.backgroundEffectPreset,
        gradientPreset: config.appearance.effectSelectedItems.includes("Gradient")
          ? config.appearance.gradientBackgroundPreset
          : null,
      });
    }
    updateUI({ activeTab: tab });
  };

  const toolbarBtn = "#ffffff";

  const cursorUpRef = useRef<(() => void) | null>(null);
  const cursorDownRef = useRef<(() => void) | null>(null);
  const onCursorMovers = useCallback((up: () => void, down: () => void) => {
    cursorUpRef.current = up;
    cursorDownRef.current = down;
  }, []);

  const undoRef = useRef<(() => void) | null>(null);
  const redoRef = useRef<(() => void) | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const onUndoRedoControl = useCallback((undo: () => void, redo: () => void) => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, []);
  const onUndoRedoStateChange = useCallback((u: boolean, r: boolean) => {
    setCanUndo(u);
    setCanRedo(r);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: isPlaying ? 0 : (initialWindowMetrics?.insets.bottom ?? 0) }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <PreviewPanel
          onCursorMovers={onCursorMovers}
          onUndoRedoControl={onUndoRedoControl}
          onUndoRedoStateChange={onUndoRedoStateChange}
        />
        
        <View
          id="playBarContainer"
          onLayout={onPlayBarLayout}
          style={[
            styles.playBarContainer,
            { height: playBarSizes.barHeight, borderRadius: playBarSizes.barRadius },
          ]}
        >
          {/* one line play button */}
          <TouchableOpacity
            style={[btnStyles.playBarSideSlot, { width: playBarSizes.icon }]}
            onPress={() => {
              amplitude.track("OneL_clicked");
              updateConfig("content", { playOption: "one" });
            }}
          >
            <OneLinePlayButton isActive={playOption === "one"} size={playBarSizes.icon} />
          </TouchableOpacity>
          {/* multiple line play button */}
          <TouchableOpacity
            style={[btnStyles.playBarSideSlot, { width: playBarSizes.icon }]}
            onPress={() => {
              amplitude.track("ThreeL_clicked");
              updateConfig("content", { playOption: "multi" });
            }}
          >
            <MultipleLinePlayButton isActive={playOption === "multi"} size={playBarSizes.icon} />
          </TouchableOpacity>
          {/* stop/resume button */}
          <TouchableOpacity
            style={btnStyles.playResumeButton}
            onPress={handlePlay}
          >
            <PlayResumeButton isPlaying={isPlaying} height={playBarSizes.icon} />
          </TouchableOpacity>
          {/* settings button */}
          <TouchableOpacity
            style={[btnStyles.playBarSideSlot, { width: playBarSizes.icon }]}
            onPress={() => {
              amplitude.track("Setting_clicked");
              router.push("/settings" as Href);
            }}
            accessibilityLabel={textSectionLabel("settingsTitle")}
          >
            <Image
              source={require("@/assets/images/icon_config_DT_xxhdpi.png")}
              style={[
                btnStyles.playBarSettingsImage,
                { width: playBarSizes.icon, height: playBarSizes.icon },
              ]}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        {/* tab container */}
        <View id="tabContainer" style={styles.tabContainer}>
          {(
            [
              { id: "TEXT" as const, labelKey: "tabText" as const },
              { id: "BACKGROUND" as const, labelKey: "tabBackground" as const },
              { id: "EFFECT" as const, labelKey: "tabEffects" as const },
            ] satisfies readonly {
              id: TabType;
              labelKey: "tabText" | "tabBackground" | "tabEffects";
            }[]
          ).map(({ id, labelKey }) => (
            <TouchableOpacity
              key={id}
              style={[styles.tab, activeTab === id && styles.activeTab]}
              onPress={() => handleTabPress(id)}
            >
              <Text
                style={[styles.tabText, activeTab === id && styles.activeTabText]}
                allowFontScaling={false}
              >
                {textSectionLabel(labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {activeTab === "TEXT" && <TextSection />}
          {activeTab === "BACKGROUND" && <BackgroundSection />}
          {activeTab === "EFFECT" && <EffectSection />}
        </View>
        
        <RewardAdModal
          visible={rewardAdVisible}
          onClose={() => updateUI({ rewardAdVisible: false })}
          adReady={rewardAdLoaded}
          adFailed={rewardAdFailed}
          onWatchAd={showRewardedAd}
        />
        {/* fullscreen LED banner modal */}
        <LedBannerFullScreen
          visible={isPlaying}
          onClose={handleStop}
        />
        {__DEV__ ? (
          <>
            <RewardAdDebugFab onOpen={openRewardAdModal} />
            <ProDebugFab />
            <SheetFetchDebugPanel />
          </>
        ) : null}
      </KeyboardAvoidingView>
      {Platform.OS === "android" && (
        <KeyboardToolbar>
          <KeyboardToolbar.Content>
            <View style={toolbarStyles.cursorNavContainer}>
              <TouchableOpacity
                onPress={() => undoRef.current?.()}
                style={toolbarStyles.cursorNavButton}
                disabled={!canUndo}
                accessible={false}
                focusable={false}
              >
                <Text allowFontScaling={false} style={[toolbarStyles.cursorNavText, { color: toolbarBtn, opacity: canUndo ? 1 : 0.3 }]}>↩</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => redoRef.current?.()}
                style={toolbarStyles.cursorNavButton}
                disabled={!canRedo}
                accessible={false}
                focusable={false}
              >
                <Text allowFontScaling={false} style={[toolbarStyles.cursorNavText, { color: toolbarBtn, opacity: canRedo ? 1 : 0.3 }]}>↪</Text>
              </TouchableOpacity>
            </View>
          </KeyboardToolbar.Content>
          <KeyboardToolbar.Done button={DismissButton} />
        </KeyboardToolbar>
      )}
    </View>
  );
}
