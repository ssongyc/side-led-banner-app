/**
 * 사용 방법 (새로 background effect 추가할 때)
 * 1. BackgroundEffectPreset 타입에 새로운 키 추가
 * 2) 정적인 이미지의 경우에는 heartBgA 참조해서 넣어주세요
 * 3) 애니메이션 (effect1)의 경우에는 sources 로 Effect1Soruces참고해주세요
 * 4) id는 effect 식별자입니다.
 */
import {
  isSpeechBubblePreset,
  type SpeechBubblePresetId,
} from "@/constants/speechBubblePresets";
import { useSettingsRest } from "@/contexts/settingsContext";
import { useEffect, useMemo, useState } from "react";

export type BackgroundEffectPreset =
  | "none"
  | "effect1"
  | "heartBgA"
  | SpeechBubblePresetId;
type BackgroundEffectFrame = "on" | "light" | "off";
export type Effect1Sources = {
  left: number;
  right: number;
};

const FRAME_SEQUENCE: BackgroundEffectFrame[] = ["on", "light", "off"];
const FRAME_DURATION_MS = 260;

const EFFECT_1_SOURCES = {
  on: {
    left: require("@/assets/images/Effect_1_on_L.png"),
    right: require("@/assets/images/Effect_1_on_R.png"),
  },
  light: {
    left: require("@/assets/images/Effect_1_light_L.png"),
    right: require("@/assets/images/Effect_1_light_R.png"),
  },
  off: {
    left: require("@/assets/images/Effect_1_off_L.png"),
    right: require("@/assets/images/Effect_1_off_R.png"),
  },
} as const;

const HEART_BG_A_SOURCE = require("@/assets/images/Heart_BG_A.png");

export type BackgroundEffectAnimationResult =
  | {
      id: "none";
      imageSource: null;
      sources: null;
    }
  | {
      id: "effect1";
      imageSource: null;
      sources: Effect1Sources;
    }
  | {
      id: "heartBgA";
      imageSource: number;
      sources: null;
    }
  | {
      id: SpeechBubblePresetId;
      imageSource: null;
      sources: null;
    };

export type BackgroundEffectId = BackgroundEffectAnimationResult["id"];

//각 배경 이펙트마다 렌더링 가능한 상태로 바꿈
export function useBackgroundAnimation(isActive = true) {
  const { config } = useSettingsRest();
  const preset: BackgroundEffectPreset = config.appearance.backgroundEffectPreset as BackgroundEffectPreset;
  const [frameIndex, setFrameIndex] = useState(0);
  const isEnabled = preset === "effect1";
  const isHeartEnabled = preset === "heartBgA";
  const isSpeechBubble = isSpeechBubblePreset(preset);

  useEffect(() => {
    if (!isEnabled) {
      setFrameIndex(0);
      return;
    }
    if (!isActive) return;
    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAME_SEQUENCE.length);
    }, FRAME_DURATION_MS);
    return () => clearInterval(id);
  }, [isEnabled, isActive]);

  return useMemo<BackgroundEffectAnimationResult>(() => {
    if (isHeartEnabled) {
      return {
        id: "heartBgA",
        imageSource: HEART_BG_A_SOURCE,
        sources: null,
      } as const;
    }
    if (isSpeechBubble) {
      return {
        id: preset,
        imageSource: null,
        sources: null,
      } as const;
    }

    if (!isEnabled) {
      return {
        id: "none",
        imageSource: null,
        sources: null,
      } as const;
    }
    const frame = FRAME_SEQUENCE[frameIndex];
    return {
      id: "effect1",
      imageSource: null,
      sources: EFFECT_1_SOURCES[frame],
    } as const;
  }, [frameIndex, isEnabled, isHeartEnabled, isSpeechBubble, preset]);
}
