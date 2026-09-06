import React from "react";
import { Text, View } from "react-native";

type BannerAdComponentProps = {
  style?: any;
  unavailableLabel: string;
};

export default function BannerAdComponent({
  style,
  unavailableLabel,
}: BannerAdComponentProps) {
  return (
    <View style={[{ alignItems: "center", minHeight: 50, justifyContent: "center" }, style]}>
      <Text allowFontScaling={false}>{unavailableLabel}</Text>
    </View>
  );
}
