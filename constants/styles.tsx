import { uiThemeFontStyle } from "@/constants/appFonts";
import { moderateScale } from "@/constants/scale";
import { Dimensions, Platform, StyleSheet } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const CONTENTS_INPUT_FONT_SIZE = moderateScale(18);
export const CONTENTS_INPUT_LINE_HEIGHT = Math.round(
  CONTENTS_INPUT_FONT_SIZE * 1.3,
);
export const CONTENTS_INPUT_VIEWPORT_MARGIN = moderateScale(16);
export const CONTENTS_INPUT_VIEWPORT_HEIGHT =
  3 * CONTENTS_INPUT_LINE_HEIGHT + CONTENTS_INPUT_VIEWPORT_MARGIN;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },

  scrollViewContainer: {
    paddingBottom: 30,
  },

  previewContainer: {
    height: (SCREEN_WIDTH - 18) * (355 / 373),
    flexDirection: "column",
    padding: 5,
    marginHorizontal: 9,
    backgroundColor: "black",
    borderRadius: 20,
    overflow: "hidden",
  },
  preview: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: "#D9D9D9",
    overflow: "hidden",
  },

  presetButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  contentsInputContainer: {
    minHeight: CONTENTS_INPUT_VIEWPORT_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 5,
    marginTop: 2,
    marginBottom: 5,
  },
  contentsInput: {
    fontSize: CONTENTS_INPUT_FONT_SIZE,
    lineHeight: CONTENTS_INPUT_LINE_HEIGHT,
    flex: 0.8,
    color: "white",
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },

  contentsInputResetButtonContainer: {
    flex: 0.25,
    justifyContent: "center",
    alignItems: "flex-end",
  },

  playBarContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    height: 63,
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginTop: 8,
    marginHorizontal: 9,
    backgroundColor: "black",
    borderRadius: 20,
  },

  tabContainer: {
    height: moderateScale(60),
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(15),
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#FF6E00",
  },
  tabText: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(14),
    color: "#787878",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FF6E00",
  },

  settingsPanelContainer: {
    flex: 1,
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#DDDDDD",
  },
  settingsRowLabel: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(16),
    color: "black",
    fontWeight: "400",
  },

  settingsRowValueContainer: {
    minWidth: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7E7E7",
    borderRadius: 24,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  settingsRowValue: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(16),
    color: "black",
    fontWeight: "400",
  },

  colorPickerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#DDDDDD",
  },

  dropdownContainer: {
    width: "55%",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "#E7E7E7",
  },
  dropdownMenuContainer: {
    paddingVertical: 4,
    paddingBottom: 2,
  },

  dropdownPlaceholderStyle: { ...uiThemeFontStyle },
  dropdownSelectedTextStyle: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(17),
  },
  dropdownIconStyle: {
    width: 30,
  },

  dropdownItemContainerStyle: {
    borderRadius: 0,
    padding: 0,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  dropdownItemContent: {
    width: "100%",
  },
  dropdownItemTextStyle: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(17),
    flexShrink: 1,
  },
  dropdownItemTextStyleSelected: {
    fontWeight: "700",
  },

  effectContainer: {
    flex: 1,
    gap: 10,
    marginHorizontal: 15,
  },
  effectChipSectionContainer: {
    gap: 10,
    marginHorizontal: 15,
  },
  effectChipWrapRow: {
    flex: 0,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },

  effectImageContainer: {
    flex: 1,
    flexDirection: "row",
    marginHorizontal: 15,
    marginTop: 10,
  },
  effectImage: {
    width: 100,
    height: 300,
    aspectRatio: 1,
    marginRight: 10,
    gap: 4,
    borderRadius: 8,
  },
  backgroundEffectCard: {
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    width: 92,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  backgroundEffectCardSelected: {
    borderColor: "#FF6E00",
  },
  backgroundEffectThumb: {
    width: "100%",
    height: 180,
    aspectRatio: undefined,
  },

  accessoryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  accessoryClose: {
    fontSize: moderateScale(16),
    color: "#007AFF",
    fontWeight: "600",
  },
});

export const rewardAdModalStyles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    justifyContent: "center",
    alignItems: "center",
    // Absolute overlay owns its safe-area padding in RewardAdModal.
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  dim: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: "100%",

    maxHeight: "100%",
    flexShrink: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 0,
    position: "relative",
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 44,
    height: 44,
    backgroundColor: "#EFEFEF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  appIconContainer: {

    alignSelf: "center",
    width: "100%",
    maxWidth: 240,
    aspectRatio: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  appIconImage: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
  },
  headerBadge: {
    ...uiThemeFontStyle,
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    lineHeight: moderateScale(26),
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  benefitContainer: {
    width: "100%",
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  checkIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  benefitText: {
    ...uiThemeFontStyle,
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: "500",
    color: "#333333",
    lineHeight: moderateScale(21),
  },
  proActiveBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
  },
  proActiveBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#fff",
  },
  modalBody: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },
  modalBodyContent: {
    padding: 16,
  },
  modalActions: {
    flexShrink: 0,
    paddingTop: 8,
  },
  reservedText: {
    width: "100%",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  reservedTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reservedTextCopy: {
    width: "100%",
    marginRight: "-100%",
    flexShrink: 0,
    opacity: 0,
  },
  reservedTextVisible: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  adStatusArea: {
    width: "100%",
    marginBottom: 8,
  },
  adStatusText: {
    ...uiThemeFontStyle,
    fontSize: 13,
    lineHeight: 18,
    color: "#555555",
    textAlign: "center",
  },
  adRetryArea: {
    minHeight: 44,
    flexShrink: 0,
    alignItems: "center",
  },
  adRetryButton: {
    minHeight: 44,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  adRetryText: {
    ...uiThemeFontStyle,
    fontSize: 14,
    fontWeight: "700",
    color: "#7156B3",
  },
  ctaButton: {
    width: "100%",
    minHeight: 56,
    flexShrink: 0,
    alignSelf: "center",
  },
  ctaButtonBg: {
    ...StyleSheet.absoluteFill,
  },
  ctaButtonContent: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaPlayBg: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  ctaButtonText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
    includeFontPadding: false,
  },
});

export const heartBackgroundTickerStyles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  row: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
  },
});

export const colorPickerStyles = StyleSheet.create({
  colorPickerContainer: {
    gap: 10,
    marginHorizontal: 15,
    marginBottom: 5,
  },
  colorPickerRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  colorPickerItemButton: {
    position: "relative",
  },
  colorPickerItem: {
    width: 32,
    height: 32,
    borderRadius: 50,
  },
  colorPickerItemActive: {
    position: "absolute",
    top: -4,
    left: -4,
    borderWidth: 2.5,
    borderColor: "black",
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  photoEmpty: {
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B0B0B0",
  },
});

export const colorPickerLockStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(150,150,150,0.55)",
    borderRadius: 50,
  },
  icon: {
    position: "absolute",
    width: 14,
    height: 14,
    top: 9,
    left: 9,
    resizeMode: "contain",
  },
});

export const effectSectionLockStyles = StyleSheet.create({
  chipOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(160,160,160,0.5)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  chipIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(150,150,150,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
});

export const sliderLockStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(150,150,150,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});

const SLIDER_WIDTH = SCREEN_WIDTH - 100;
export const sliderComponentStyles = StyleSheet.create({
  sliderContainer: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 15,
    paddingBottom: 30,
    marginHorizontal: 10,
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#DDDDDD",
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    backgroundColor: "#8F8D8A",
    borderRadius: 4,
    height: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  sliderThumb: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderRadius: 24,
    height: 23,
    width: 38,
    elevation: 3,
  },
  sliderButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

export const ledBannerFullScreenStyles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
  },
  flex: {
    flex: 1,
  },
  layerPassThrough: {
    ...StyleSheet.absoluteFill,
  },
});

export const toolbarStyles = StyleSheet.create({
  cursorNavContainer: {
    flexDirection: "row",
  },
  cursorNavButton: {
    width: 44,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
});

export const settingsFooterStyles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: "#F9F9F9",
  },
  logo: {
    width: 130,
    height: 36,
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkText: {
    fontSize: moderateScale(12),
    color: "#666666",
    fontWeight: "500",
  },
  separator: {
    fontSize: moderateScale(11),
    color: "#CCCCCC",
  },
  containerDark: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: "#3F3F3F",
  },
  linkTextDark: {
    fontSize: moderateScale(12),
    color: "#E8E3EC",
    fontWeight: "500",
  },
  separatorDark: {
    fontSize: moderateScale(11),
    color: "#AFA9B8",
  },
});

export function resolveDropdownMaxHeight(
  contentHeightPx: number,
  windowHeight: number,
  options?: { capPx?: number; menuPaddingPx?: number; windowHeightRatio?: number },
): number {
  const capPx = options?.capPx ?? 220;
  const menuPaddingPx = options?.menuPaddingPx ?? 6;
  const windowHeightRatio = options?.windowHeightRatio ?? 0.32;
  const cap = Math.min(capPx, Math.floor(windowHeight * windowHeightRatio));
  if (contentHeightPx <= 0) {
    return cap;
  }
  return Math.min(cap, Math.ceil(contentHeightPx + menuPaddingPx));
}
