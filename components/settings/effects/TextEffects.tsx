import { getPixelFontIdForLocale } from "@/constants/appFonts";
import { btnStyles } from "@/constants/btnStyles";
import { DEFAULT_GRADIENT_BACKGROUND_PRESET_ID } from "@/constants/gradientBackgroundPresets";
import { hasPixelLedEffect } from "@/constants/pixelLed";
import { effectSectionLockStyles as fxLock, styles } from "@/constants/styles";
import type {
  BannerConfig,
  useSettingsAppearance,
  useSettingsLocalizationContext,
  useSettingsUI,
} from "@/contexts/settingsContext";
import type { EffectSectionLabelKey } from "@/language/effectSectionLabels";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SettingsSliderBlock, type SettingsSliderBlockProps } from "../settingsSliderBlock";

type Props = {
  config: Pick<BannerConfig, "appearance">;
  updateConfig: ReturnType<typeof useSettingsAppearance>["updateConfig"];
  effectItems: string[];
  effectSectionLabel: ReturnType<typeof useSettingsLocalizationContext>["effectSectionLabel"];
  effectChipLabel: ReturnType<typeof useSettingsLocalizationContext>["effectChipLabel"];
  resolvedAppLocale: ReturnType<typeof useSettingsLocalizationContext>["resolvedAppLocale"];
  isProActive: boolean;
  openRewardAdModal: ReturnType<typeof useSettingsUI>["openRewardAdModal"];
};

const LOCK_ICON = require("@/assets/images/icon_lock_type2.png");
const PRO_LOCKED_EFFECTS = new Set(["Pixel", "Gradient", "Glow"]);

const PRIMARY_EFFECT_CHIP_ROWS = [
  ["Bold", "Blink", "Pixel"],
  ["Glow", "Gradient"],
] as const;

function getSliderPropsForEffect(
  effect: string,
  values: {
    glowIntensity: number;
    blinkSpeed: number;
  },
  setters: {
    setGlowIntensity: (v: number) => void;
    setBlinkSpeed: (v: number) => void;
  },
  tEffect: (key: EffectSectionLabelKey) => string,
): Omit<SettingsSliderBlockProps, "containerStyle"> | null {
  switch (effect) {
    case "Glow":
    case "Pixel Glow":
      return {
        label: tEffect("effectGlowIntensity"),
        value: values.glowIntensity,
        onChange: setters.setGlowIntensity,
        minimumValue: 0,
        maximumValue: 100,
        step: 1,
      };
    case "Blink":
      return {
        label: tEffect("effectBlinkFrequency"),
        value: values.blinkSpeed,
        onChange: setters.setBlinkSpeed,
        minimumValue: 1,
        maximumValue: 10,
        step: 1,
      };
    default:
      return null;
  }
}

export function TextEffects({
  config, updateConfig, effectItems, effectSectionLabel, effectChipLabel,
  resolvedAppLocale, isProActive, openRewardAdModal,
}: Props) {
  const {
    effectSelectedItems,
    effectParamValues,
    gradientBackgroundPreset,
    glowIntensity,
    blinkSpeed,
    pixelColorMix,
  } = config.appearance;

  const fxVals = effectParamValues ?? {};

  const setGlowIntensity = (value: number) =>
    updateConfig("appearance", {
      glowIntensity: value,
      effectParamValues: { ...fxVals, Glow: value },
    });

  const setBlinkSpeed = (value: number) =>
    updateConfig("appearance", {
      blinkSpeed: value,
      effectParamValues: { ...fxVals, Blink: value },
    });

  const setFontWeight = (value: "normal" | "bold") =>
    updateConfig("appearance", { fontWeight: value });

  const values = { glowIntensity, blinkSpeed };
  const setters = {
    setGlowIntensity,
    setBlinkSpeed,
  };
  const pinnedEffectIds = new Set<string>(PRIMARY_EFFECT_CHIP_ROWS.flat());
  const effectChipRows = [
    ...PRIMARY_EFFECT_CHIP_ROWS.map((row) =>
      row.filter((effect) => effectItems.includes(effect)),
    ).filter((row) => row.length > 0),
    ...effectItems
      .filter((effect) => !pinnedEffectIds.has(effect))
      .reduce<string[][]>((rows, effect) => {
        const lastRow = rows.at(-1);
        if (lastRow == null || lastRow.length >= 3) {
          rows.push([effect]);
        } else {
          lastRow.push(effect);
        }
        return rows;
      }, []),
  ];
  const stackedSliderBlocks: {
    key: string;
    props: SettingsSliderBlockProps;
  }[] = [];
  for (const effect of effectItems) {
    if (!effectSelectedItems.includes(effect)) continue;
    const props = getSliderPropsForEffect(
      effect,
      values,
      setters,
      effectSectionLabel,
    );
    if (!props) continue;
    stackedSliderBlocks.push({ key: effect, props });
  }

  return (
    <>
      {/* effect - effect select */}
      <View
        style={[styles.settingsRow, { borderBottomWidth: 0, marginBottom: 0 }]}
      >
        <Text style={styles.settingsRowLabel} allowFontScaling={false}>
          {effectSectionLabel("effectHeading")}
        </Text>
      </View>

      <View style={styles.effectChipSectionContainer}>
        {effectChipRows.map((row, rowIndex) => (
          <View
            key={`effect-row-${rowIndex}`}
            style={[styles.effectChipWrapRow, { justifyContent: "flex-start" }]}
          >
            {row.map((effect) => {
              const isLocked = !isProActive && PRO_LOCKED_EFFECTS.has(effect);
              const isPixelActive = effectSelectedItems.includes("Pixel");
              const isBoldDisabled = effect === "Bold" && isPixelActive;
              return (
                <TouchableOpacity
                  key={effect}
                  style={[
                    btnStyles.effectItemButton,
                    { alignSelf: "flex-start" },
                    !isLocked &&
                      !isBoldDisabled &&
                      effectSelectedItems.includes(effect) &&
                      btnStyles.effectItemButtonActive,
                    isBoldDisabled && { opacity: 0.35 },
                  ]}
                  onPress={() => {
                    if (isLocked) {
                      openRewardAdModal();
                      return;
                    }
                    if (isBoldDisabled) return;
                    const isOn = effectSelectedItems.includes(effect);
                    const next = isOn
                      ? effectSelectedItems.filter((e) => e !== effect)
                      : [...effectSelectedItems, effect];

                    if (isOn) {
                      updateConfig("appearance", { effectSelectedItems: next });
                    } else {
                      const fx = fxVals;
                      const patch: Partial<BannerConfig["appearance"]> = {
                        effectSelectedItems: next,
                      };
                      if (effect === "Glow") {
                        patch.glowIntensity = fx.Glow ?? glowIntensity;
                      } else if (effect === "Blink") {
                        patch.blinkSpeed = fx.Blink ?? blinkSpeed;
                      } else if (effect === "Gradient") {
                        patch.gradientBackgroundPreset =
                          gradientBackgroundPreset ??
                          DEFAULT_GRADIENT_BACKGROUND_PRESET_ID;
                      } else if (effect === "Pixel") {
                        patch.font = getPixelFontIdForLocale(resolvedAppLocale);
                      }
                      updateConfig("appearance", patch);
                    }

                    if (effect === "Bold") {
                      setFontWeight(next.includes("Bold") ? "bold" : "normal");
                    }
                  }}
                >
                  <Text
                    style={[
                      btnStyles.effectItemButtonText,
                      !isLocked &&
                        effectSelectedItems.includes(effect) &&
                        btnStyles.effectItemButtonTextActive,
                    ]}
                    allowFontScaling={false}
                  >
                    {effectChipLabel(effect)}
                  </Text>
                  {isLocked && (
                    <View style={fxLock.chipOverlay}>
                      <Image source={LOCK_ICON} style={fxLock.chipIcon} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {stackedSliderBlocks.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          {stackedSliderBlocks.map(({ key, props }, i) => (
            <SettingsSliderBlock
              key={key}
              slotId={`effect-${key}`}
              {...props}
              containerStyle={{ marginTop: i === 0 ? 0 : 10 }}
            />
          ))}
        </View>
      ) : null}

      {hasPixelLedEffect(effectSelectedItems) ? (
        <View style={{ marginTop: 12, marginHorizontal: 15 }}>
          <Text
            allowFontScaling={false}
            style={[styles.settingsRowLabel, { marginBottom: 8 }]}
          >
            {effectSectionLabel("effectPixelationHeading")}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: pixelColorMix }}
            style={[
              {
                alignSelf: "flex-start",
                borderRadius: 20,
                padding: pixelColorMix ? 1 : 3,
                borderWidth: pixelColorMix ? 3 : 1,
                borderColor: pixelColorMix ? "#FF6E00" : "#BDBDBD",
                opacity: pixelColorMix ? 1 : 0.72,
              },
            ]}
            onPress={() =>
              updateConfig("appearance", { pixelColorMix: !pixelColorMix })
            }
          >
            <LinearGradient
              colors={[
                "#FF3B30",
                "#FF9500",
                "#FFD60A",
                "#34C759",
                "#0A84FF",
                "#BF5AF2",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                minWidth: 96,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={[
                  btnStyles.effectItemButtonText,
                  {
                    color: "#FFFFFF",
                    fontWeight: "700",
                    textTransform: "lowercase",
                  },
                ]}
                allowFontScaling={false}
              >
                {effectSectionLabel("effectMix")}
              </Text>
            </LinearGradient>
            {pixelColorMix ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  backgroundColor: "#FF6E00",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}
