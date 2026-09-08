import { styles } from "@/constants/styles";
import { useSettingsRest } from "@/contexts/settingsContext";
import React from "react";
import { ScrollView } from "react-native";
import { BackgroundEffects } from "./effects/BackgroundEffects";
import { GradientEffects } from "./effects/GradientEffects";
import { TextEffects } from "./effects/TextEffects";

export const EffectSection = () => {
  const {
    config, updateConfig, effectItems, effectSectionLabel, effectChipLabel,
    resolvedAppLocale, isProActive, openRewardAdModal,
  } = useSettingsRest();

  return (
    <ScrollView
      id="effectSection"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContainer}
    >
      <TextEffects
        config={config}
        updateConfig={updateConfig}
        effectItems={effectItems}
        effectSectionLabel={effectSectionLabel}
        effectChipLabel={effectChipLabel}
        resolvedAppLocale={resolvedAppLocale}
        isProActive={isProActive}
        openRewardAdModal={openRewardAdModal}
      />
      <GradientEffects
        config={config}
        updateConfig={updateConfig}
        effectSectionLabel={effectSectionLabel}
      />
      <BackgroundEffects
        config={config}
        updateConfig={updateConfig}
        effectSectionLabel={effectSectionLabel}
        isProActive={isProActive}
        openRewardAdModal={openRewardAdModal}
      />
    </ScrollView>
  );
};
