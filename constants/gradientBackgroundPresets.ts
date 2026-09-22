/** Gradient 배경 이펙트 목록 */
export const GRADIENT_BACKDROP_IDS = ["wave", "flow", "pulse"] as const;
export type GradientBackdropId = (typeof GRADIENT_BACKDROP_IDS)[number];

type GradientBackgroundPresetMeta = {
  id: GradientBackdropId;
  label: string;
};

export const GRADIENT_BACKGROUND_PRESETS: GradientBackgroundPresetMeta[] = [
  { id: "wave", label: "Wave" },
  { id: "flow", label: "Flow" },
  { id: "pulse", label: "Pulse" },
];

export const DEFAULT_GRADIENT_BACKGROUND_PRESET_ID = "wave";
