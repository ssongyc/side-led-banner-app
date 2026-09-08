// Original artwork: Figma LED-Banner / Style Sheet (278:2125).
// A is landscape (852 x 393), B is portrait (393 x 852).
const platformLayout = {
  previewHeightBoostPx: 0,
  textBox: {
    landscape: { width: "92%", yOffset: 0 },
    portrait: { width: "84%", yOffset: 0 },
  },
} as const;

export const SIGN_BOARD_PRESETS = {
  nameBg: {
    previewSource: require("@/assets/images/Name_BG_1_A.png"),
    fullscreenLandscapeSource: require("@/assets/images/Name_BG_1_A.png"),
    fullscreenPortraitSource: require("@/assets/images/Name_BG_1_B.png"),
    ios: platformLayout,
    android: platformLayout,
  },
  locationBg: {
    previewSource: require("@/assets/images/Location_BG_1_A.png"),
    fullscreenLandscapeSource: require("@/assets/images/Location_BG_1_A.png"),
    fullscreenPortraitSource: require("@/assets/images/Location_BG_1_B.png"),
    ios: platformLayout,
    android: platformLayout,
  },
  todayBg: {
    previewSource: require("@/assets/images/Today_BG_1_A.png"),
    fullscreenLandscapeSource: require("@/assets/images/Today_BG_1_A.png"),
    fullscreenPortraitSource: require("@/assets/images/Today_BG_1_B.png"),
    ios: platformLayout,
    android: platformLayout,
  },
} as const;

export type SignBoardPresetId = keyof typeof SIGN_BOARD_PRESETS;
export function isSignBoardPreset(id: string): id is SignBoardPresetId {
  return Object.prototype.hasOwnProperty.call(SIGN_BOARD_PRESETS, id);
}

// Keep text inside the white body, with 10 design pixels of vertical padding.
export const SIGN_BOARD_TEXT_LAYOUT = {
  landscape: { topOffsetRatio: 110 / 393, textHeightRatio: 253 / 393 },
  portrait: { topOffsetRatio: 130 / 852, textHeightRatio: 692 / 852 },
} as const;
