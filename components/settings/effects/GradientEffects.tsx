import { btnStyles } from "@/constants/btnStyles";
import { GRADIENT_BACKGROUND_PRESETS } from "@/constants/gradientBackgroundPresets";
import { styles } from "@/constants/styles";
import type { useSettingsRest } from "@/contexts/settingsContext";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type Props = Pick<ReturnType<typeof useSettingsRest>, "config" | "updateConfig" | "effectSectionLabel">;

export function GradientEffects({ config, updateConfig, effectSectionLabel }: Props) {
  const { effectSelectedItems, gradientBackgroundPreset } = config.appearance;
  return (
    <>
      {effectSelectedItems.includes("Gradient") ? (
        <View style={{ marginTop: 14, marginHorizontal: 15 }}>
          <Text
            allowFontScaling={false}
            style={[styles.settingsRowLabel, { marginBottom: 8 }]}
          >
            {effectSectionLabel("gradientBackgroundHeading")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.effectContainer}
          >
            {GRADIENT_BACKGROUND_PRESETS.map((p) => {
              const selected = gradientBackgroundPreset === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    btnStyles.effectItemButton,
                    selected && btnStyles.effectItemButtonActive,
                    { minWidth: 76, paddingVertical: 8 },
                  ]}
                  onPress={() =>
                    updateConfig("appearance", {
                      gradientBackgroundPreset: p.id,
                    })
                  }
                >
                  <Text
                    style={[
                      btnStyles.effectItemButtonText,
                      selected && btnStyles.effectItemButtonTextActive,
                    ]}
                    allowFontScaling={false}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}
