import { uiThemeFontStyle } from "@/constants/appFonts";
import { moderateScale } from "@/constants/scale";
import { Dimensions, StyleSheet } from "react-native";

const screen = Dimensions.get("screen");
const HEADER_TITLE_FONT_SIZE = Math.min(screen.width, screen.height) >= 600 ? 28 : 22;

export const settingsStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 8,
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: "#000000",
  },
  titleRow: {
    flexDirection: "row",
    flexShrink: 1,
    alignItems: "center",
    gap: 8,
    marginLeft: 4,
  },
  titleText: {
    ...uiThemeFontStyle,
    fontSize: HEADER_TITLE_FONT_SIZE,
    flexShrink: 1,
    fontWeight: "700",
    color: "black",
  },
  rootLinkText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(16),
    color: "#2A7BE4",
    fontWeight: "500",
  },
  /** Settings 루트 페이지의 App Version 값 텍스트 */
  versionValueText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(16),
    color: "#787878",
    fontWeight: "400",
  },
});

/** Open Source Info 스크린*/
export const openSourceInfoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
    gap: 12,
  },
  nameText: {
    ...uiThemeFontStyle,
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: "500",
    color: "black",
  },
  versionText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(14),
    fontWeight: "400",
    color: "#9A9A9A",
  },
});

/** Credits 스크린*/
export const creditsStyles = StyleSheet.create({
  row: {
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
  },
  roleText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(15),
    fontWeight: "500",
    color: "#292929",
  },
  namesText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#3A3A3A",
    textAlign: "right",
  },
  namesTextLeft: {
    textAlign: "left",
  },
  subtitleText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(13),
    fontWeight: "400",
    color: "#9A9A9A",
  },
});
