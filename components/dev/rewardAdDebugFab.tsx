import { uiThemeFontStyle } from "@/constants/appFonts";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  onOpen: () => void;
};

/**
 * 개발 빌드에서만 표시. 리워드 광고 팝업 UI를 CSV 디버그와 같이 FAB로 띄웁니다.
 */
export function RewardAdDebugFab({ onOpen }: Props) {
  if (!__DEV__) {
    return null;
  }
  return (
    <Pressable
      style={styles.fab}
      onPress={onOpen}
      accessibilityLabel="리워드 광고 팝업 (디버그용)"
    >
      <Text style={styles.fabText} allowFontScaling={false}>
        Ads
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 10,
    bottom: 165,
    zIndex: 9999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  fabText: {
    ...uiThemeFontStyle,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
