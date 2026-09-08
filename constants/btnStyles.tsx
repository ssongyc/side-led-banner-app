import { uiThemeFontStyle } from "@/constants/appFonts";
import { moderateScale } from "@/constants/scale";
import { StyleSheet } from "react-native";

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const btnStyles = StyleSheet.create({
  presetButtonActive: {
    flex: 1,
    marginHorizontal: 4, // 버튼 간 간격
    backgroundColor: "#CCCCCC",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    height: moderateScale(28),
  },
  presetButton: {
    flex: 1,
    marginHorizontal: 4, // 버튼 간 간격
    backgroundColor: "#727272",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    height: moderateScale(28),
  },
  presetButtonGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    // shadow
    shadowColor: "white",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  presetButtonActiveText: {
    ...uiThemeFontStyle,
    color: "#000000",
  },
  presetButtonText: {
    ...uiThemeFontStyle,
    color: "#B1B1AF",
  },
  presetButtonLockOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  presetButtonLockIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  contentsInputResetButton: {
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 3,
  },
  contentsInputResetButtonText: {
    ...uiThemeFontStyle,
    color: "white",
    fontSize: moderateScale(25),
  },
  playResumeButton: {
    flex: 1, // 나머지 3개 슬롯이 고정폭이므로 남는 공간을 전부 채움 (여백 없음)
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBEBEB",
    borderRadius: 15,
  },
  playBarSideSlot: {
    justifyContent: "center",
    alignItems: "center",
  },
  playBarSettingsImage: {
    width: 53,
    height: 53,
  },
  settingsRowValueButton: {
    fontSize: 0,
    color: "black",
    fontWeight: "400",
  },
  effectItemButton: {
    padding: 10,
    minWidth: 82,
    backgroundColor: "#F6F6F6",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    marginRight: 5,
    marginBottom: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  effectItemButtonActive: {
    borderColor: "#FF6E00",
  },
  effectItemButtonText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(16),
    color: "black",
    fontWeight: "400",
  },
  effectItemButtonTextActive: {
    color: "#FF6E00",
  },
});
