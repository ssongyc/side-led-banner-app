import { SIGN_BOARD_PRESETS } from "./signBoardPresets";

// Framed backgrounds share the existing image and text-box pipeline.
export const SPEECH_BUBBLE_PRESETS = {
  ...SIGN_BOARD_PRESETS,
  speechBg1: {
    previewSource: require("@/assets/images/Speech_BG_1_A.png"),
    fullscreenLandscapeSource: require("@/assets/images/Speech_BG_1_A.png"),
    fullscreenPortraitSource: require("@/assets/images/Speech_BG_1_B.png"),
    ios: {
      previewHeightBoostPx: 20,
      // 가로 세로 위치는 textSizing SPEECH_BG_TEXT_LAYOUT, portrait만 yOffset
      textBox: {
        landscape: { width: "70%", yOffset: 0 },
        portrait: { width: "65%", yOffset: 0 },
      },
    },
    android: {
      previewHeightBoostPx: 20,
      textBox: {
        landscape: { width: "70%", yOffset: 0 },
        portrait: { width: "65%", yOffset: 0 },
      },
    },
  },
  speechBg2: {
    previewSource: require("@/assets/images/Speech_BG_2_A.png"),
    fullscreenLandscapeSource: require("@/assets/images/Speech_BG_2_A.png"),
    fullscreenPortraitSource: require("@/assets/images/Speech_BG_2_B.png"),
    ios: {
      previewHeightBoostPx: 20,
      textBox: {
        landscape: { width: "80%", yOffset: 0 },
        portrait: { width: "70%", yOffset: 10 },
      },
    },
    android: {
      previewHeightBoostPx: 20,
      textBox: {
        landscape: { width: "80%", yOffset: 0 },
        portrait: { width: "70%", yOffset: 0 },
      },
    },
  },
} as const;

export type SpeechBubblePresetId = keyof typeof SPEECH_BUBBLE_PRESETS;

export function isSpeechBubblePreset(id: string): id is SpeechBubblePresetId {
  return Object.prototype.hasOwnProperty.call(SPEECH_BUBBLE_PRESETS, id);
}
