import { uiThemeFontStyle } from "@/constants/appFonts";
import { effectSectionLockStyles as fxLock, styles } from "@/constants/styles";
import type { useSettingsRest } from "@/contexts/settingsContext";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

type Props = Pick<ReturnType<typeof useSettingsRest>,
  "config" | "updateConfig" | "effectSectionLabel" | "isProActive" | "openRewardAdModal"
>;

const LOCK_ICON = require("@/assets/images/icon_lock_type2.png");
const PRO_LOCKED_BG_EFFECTS = new Set([
  "effect1",
  "heartBgA",
  "speechBg1",
  "speechBg2",
  "nameBg",
  "locationBg",
  "todayBg",
]);

export function BackgroundEffects({ config, updateConfig, effectSectionLabel, isProActive, openRewardAdModal }: Props) {
  const { backgroundEffectPreset } = config.appearance;
  return (
    <>
      {/* effect - background effect select */}
      <View
        style={[styles.settingsRow, { borderBottomWidth: 0, marginBottom: 0 }]}
      >
        <Text style={styles.settingsRowLabel} allowFontScaling={false}>
          {effectSectionLabel("backgroundEffectHeading")}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.effectImageContainer}
        contentContainerStyle={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          paddingRight: 5,
          minHeight: 188,
        }}
      >
        <TouchableOpacity
          style={[
            styles.backgroundEffectCard,
            backgroundEffectPreset === "none" &&
              styles.backgroundEffectCardSelected,
          ]}
          onPress={() =>
            updateConfig("appearance", {
              backgroundEffectPreset: "none",
            })
          }
        >
          <View
            style={{
              height: 180,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                ...uiThemeFontStyle,
                fontSize: 16,
                fontWeight: "400",
                color:
                  backgroundEffectPreset === "none" ? "#FF6E00" : "#000000",
              }}
            >
              {effectSectionLabel("noEffect")}
            </Text>
          </View>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[
            styles.backgroundEffectCard,
            backgroundEffectPreset === "effect1" &&
              styles.backgroundEffectCardSelected,
          ]}
          onPress={() =>
            updateConfig("appearance", {
              backgroundEffectPreset:
                backgroundEffectPreset === "effect1" ? "none" : "effect1",
            })
          }
        >
          <Image
            source={require("@/assets/images/Effect_1_on_L.png")}
            style={[styles.effectImage, styles.backgroundEffectThumb]}
            resizeMode="contain"
          />
        </TouchableOpacity> */}
        {(
          [
            {
              preset: "effect1",
              src: require("@/assets/images/Effect_1_on_L.png"),
            },
            {
              preset: "heartBgA",
              src: require("@/assets/images/Heart_BG_B.png"),
            },
            {
              preset: "speechBg1",
              src: require("@/assets/images/Speech_BG_1_B.png"),
            },
            {
              preset: "speechBg2",
              src: require("@/assets/images/Speech_BG_2_B.png"),
            },
            { preset: "nameBg", src: require("@/assets/images/Name_BG_1_B.png") },
            { preset: "locationBg", src: require("@/assets/images/Location_BG_1_B.png") },
            { preset: "todayBg", src: require("@/assets/images/Today_BG_1_B.png") },
          ] as const
        ).map(({ preset, src }) => {
          const isLocked = !isProActive && PRO_LOCKED_BG_EFFECTS.has(preset);
          return (
            <TouchableOpacity
              key={preset}
              style={[
                styles.backgroundEffectCard,
                !isLocked &&
                  backgroundEffectPreset === preset &&
                  styles.backgroundEffectCardSelected,
              ]}
              onPress={() => {
                if (isLocked) {
                  openRewardAdModal();
                  return;
                }
                updateConfig("appearance", {
                  backgroundEffectPreset:
                    backgroundEffectPreset === preset ? "none" : preset,
                });
              }}
            >
              <Image
                source={src}
                style={[styles.effectImage, styles.backgroundEffectThumb]}
                resizeMode="contain"
              />
              {isLocked && (
                <View style={fxLock.cardOverlay}>
                  <Image source={LOCK_ICON} style={fxLock.cardIcon} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}
