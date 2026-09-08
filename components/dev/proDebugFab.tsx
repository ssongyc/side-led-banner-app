import { uiThemeFontStyle } from "@/constants/appFonts";
import { useSettingsRest } from "@/contexts/settingsContext";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export function ProDebugFab() {
  const { isProActive, activatePro, updateUI } = useSettingsRest();

  if (!__DEV__) return null;

  return (
    <Pressable
      style={[styles.fab, isProActive && styles.fabActive]}
      onPress={() => {
        if (isProActive) {
          updateUI({ proMode: null });
        } else {
          activatePro();
        }
      }}
      accessibilityLabel="Pro 모드 토글 (디버그용)"
    >
      <Text style={styles.fabText} allowFontScaling={false}>
        {isProActive ? "PRO ON" : "PRO OFF"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 10,
    bottom: 210,
    zIndex: 9999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  fabActive: {
    backgroundColor: "rgba(255,110,0,0.85)",
  },
  fabText: {
    ...uiThemeFontStyle,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
