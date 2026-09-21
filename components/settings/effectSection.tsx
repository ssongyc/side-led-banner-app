import { styles } from "@/constants/styles";
import {
  useSettingsAppearance,
  useSettingsLocalizationContext,
  useSettingsUI,
} from "@/contexts/settingsContext";
import React from "react";
import { ScrollView } from "react-native";
import { BackgroundEffects } from "./effects/BackgroundEffects";
import { GradientEffects } from "./effects/GradientEffects";
import { TextEffects } from "./effects/TextEffects";

export const EffectSection = () => {
  const { appearance, updateConfig, effectItems } = useSettingsAppearance();
  const { effectSectionLabel, effectChipLabel, resolvedAppLocale } =
    useSettingsLocalizationContext();
  const { isProActive, openRewardAdModal } = useSettingsUI();
  const config = { appearance };

  return (
    <ScrollView
      id="effectSection"
      style={styles.settingsPanelContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContainer}
      keyboardShouldPersistTaps="handled"
      directionalLockEnabled
      canCancelContentTouches
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
