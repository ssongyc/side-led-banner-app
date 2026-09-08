import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

type BannerAdComponentProps = {
  style?: any;
  unavailableLabel: string;
};

export default function BannerAdComponent({
  style,
  unavailableLabel,
}: BannerAdComponentProps) {
  const [unavailableVisible, setUnavailableVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setUnavailableVisible(false), 10_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={[{ alignItems: "center", minHeight: 50, justifyContent: "center" }, style]}>
      {unavailableVisible ? <Text allowFontScaling={false}>{unavailableLabel}</Text> : null}
    </View>
  );
}
