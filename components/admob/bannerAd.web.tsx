import React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { WEB_AD_DIAGNOSTICS } from "@/ads/webAdDiagnostics.web";
import { adUnavailableReason } from "@/utils/adAvailability";
import { useSettingsLocalizationContext } from "@/contexts/settingsContext";
export default function BannerAdComponent({ style }: { style?: StyleProp<ViewStyle>; unavailableLabel: string }) {
  const { resolvedAppLocale } = useSettingsLocalizationContext();
  return <View style={[{ alignItems: "center", justifyContent: "center", minHeight: WEB_AD_DIAGNOSTICS ? 150 : 50, flexShrink: 0 }, style]}>
    <Text allowFontScaling={false}>{WEB_AD_DIAGNOSTICS ? "WEB DIAGNOSTICS · Banner reserved area (150px), no real ad" : adUnavailableReason(resolvedAppLocale)}</Text>
  </View>;
}

// Web keeps its existing inline diagnostic placement; no native host is loaded.
export function BannerPlacementProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
