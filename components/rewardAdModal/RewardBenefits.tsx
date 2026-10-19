import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { rewardAdModalStyles as styles } from "@/constants/styles";
import type { RewardAdLabelKey } from "@/language/rewardAdLabels";

const CHECK_ICON = require("../../assets/images/Check.png");

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

export function RewardBenefits({ rewardAdLabel }: {
  rewardAdLabel: (key: RewardAdLabelKey) => string;
}) {
  return (
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
  );
}
