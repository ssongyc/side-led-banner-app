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
  backIconDark: {
    tintColor: "#FFFFFF",
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
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 8,
  },
  premiumHeaderIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  premiumTitleText: {
    ...uiThemeFontStyle,
    fontSize: HEADER_TITLE_FONT_SIZE,
    fontWeight: "700",
    color: "#F2EAF8",
    flexShrink: 1,
  },
  premiumContent: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 22,
  },
  premiumCard: {
    flexShrink: 0,
    overflow: "hidden",
    borderRadius: 13,
    backgroundColor: "#2A2A2A",
  },
  premiumCardBody: {
    flexDirection: "row",
    minHeight: moderateScale(126),
  },
  premiumIconPane: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#292929",
  },
  premiumDonationIcon: {
    width: moderateScale(86),
    height: moderateScale(86),
  },
  premiumTextPane: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#494949",
  },
  premiumProductTitle: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  premiumProductDescription: {
    ...uiThemeFontStyle,
    marginTop: 22,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(18),
    fontWeight: "500",
    color: "#FFFFFF",
  },
  premiumPriceBar: {
    height: moderateScale(50),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7156B3",
  },
  premiumPriceText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#DCD1F2",
  },
  premiumRestoreArea: {
    alignItems: "center",
    paddingBottom: 32,
  },
  premiumRestoreText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#CFC4DF",
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
