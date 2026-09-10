import React from "react";
import { Pressable, Text, ScrollView, useWindowDimensions } from "react-native";
import { WEB_AD_DIAGNOSTICS, selectWebAdState, useWebAdState } from "@/ads/webAdDiagnostics.web";
import { useSettingsRest } from "@/contexts/settingsContext";
export default function AdDiagnostics() {
  const state = useWebAdState();
  const { width, height } = useWindowDimensions();
  const { openRewardAdModal } = useSettingsRest();
  if (!WEB_AD_DIAGNOSTICS) return null;
  return <ScrollView style={{ position: "absolute", right: 8, bottom: 8, zIndex: 50, width: Math.min(340, width - 16), maxHeight: height * 0.45, backgroundColor: "#fff8df", borderWidth: 1, borderColor: "#886000" }} contentContainerStyle={{ padding: 12, gap: 8 }}>
    <Text allowFontScaling={false}>WEB DIAGNOSTICS ONLY · No real ads · {state}</Text>
    <Text allowFontScaling={false}>Choose a result, open the reward modal, then tap Watch Ad. Success simulates 2 hours of Pro for this page session only.</Text>
    {([
      ["Preparing", () => selectWebAdState("loading")],
      ["Ready → success", () => selectWebAdState("ready", "success")],
      ["Ready → show failure", () => selectWebAdState("ready", "failure")],
      ["Final load failure", () => selectWebAdState("load-failed")],
      ["Open reward modal", openRewardAdModal],
    ] as const).map(([label, action]) => <Pressable key={label} onPress={action} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8, backgroundColor: "#eee" }}>
      <Text allowFontScaling={false}>{label}</Text>
    </Pressable>)}
  </ScrollView>;
}
