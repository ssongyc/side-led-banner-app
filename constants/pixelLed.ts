import type { AppLocaleKey } from "@/constants/language";

/** 1줄도트기준px용 */
export const PIXEL_LED_DOT_SIZE_PX = 6;
/** 다줄도트기준px용 */
export const PIXEL_LED_DOT_SIZE_PX_MULTILINE = 6;
/** 슬라이더100%기준px용 */
export const PIXEL_LED_REF_FONT_PX = 100;

export type PixelFontCircleGrid = "galmuri11";

function resolveReferencePixelLedDotPx(
  playOption: "one" | "multi",
  _locale?: AppLocaleKey,
): number {
  return playOption === "multi"
    ? PIXEL_LED_DOT_SIZE_PX_MULTILINE
    : PIXEL_LED_DOT_SIZE_PX;
}

/** playOption별 도트 최솟값*/
function resolvePixelDotMinPx(playOption: "one" | "multi"): number {
  return playOption === "one" ? 3 : 1;
}

function scalePixelLedDotByFontSize(
  referenceDotPx: number,
  fontSizePx: number,
  minDotPx = 1,
): number {
  const fontSize = Math.max(1, fontSizePx);
  const scaled = referenceDotPx * (fontSize / PIXEL_LED_REF_FONT_PX);
  return Math.max(
    minDotPx,
    Math.min(255, Math.round(scaled)),
  );
}

/** Pixel크기슬라이더하한용 */
export function resolvePixelFontSizeSliderMinPercent(params: {
  playOption: "one" | "multi";
  locale: AppLocaleKey;
  maxFontSizeAtFullSlider?: number;
  sliderFloor?: number;
}): number {
  const SLIDER_MAX = 100;
  const floor = params.sliderFloor ?? 20;
  const maxBox = Math.max(
    1,
    params.maxFontSizeAtFullSlider ?? (
      params.playOption === "one"
        ? PIXEL_LED_REF_FONT_PX * 3
        : (PIXEL_LED_REF_FONT_PX / 2) * 3
    ),
  );
  const refDot = resolveReferencePixelLedDotPx(params.playOption);
  const dotMinPx = resolvePixelDotMinPx(params.playOption);
  const minRenderPx = Math.ceil((dotMinPx * PIXEL_LED_REF_FONT_PX) / refDot);
  return Math.max(
    floor,
    Math.min(
      SLIDER_MAX,
      Math.ceil((minRenderPx * SLIDER_MAX) / maxBox),
    ),
  );
}

/** CircleGrid모드반환용 */
export function resolvePixelFontCircleGridMode(
  effectSelectedItems: string[],
): PixelFontCircleGrid | null {
  return hasPixelLedEffect(effectSelectedItems) ? "galmuri11" : null;
}

export function resolvePixelShaderSizePx(params: {
  playOption: "one" | "multi";
  locale?: AppLocaleKey;
  fontSizePx?: number;
}): number {
  const fontSize = Math.max(1, params.fontSizePx ?? PIXEL_LED_REF_FONT_PX);
  const raw = scalePixelLedDotByFontSize(
    resolveReferencePixelLedDotPx(params.playOption),
    fontSize,
    resolvePixelDotMinPx(params.playOption),
  );
  // 최소 4px: 3px 도트는 DPR=3 기기에서 갭이 0.04px(≈0)으로 사각형처럼 보임
  return Math.max(4, raw);
}

/**
 * 작은 폰트 크기일 때 SkPicture를 N배로 기록해 텍스트 샘플링 정밀도를 높이는 배율.
 * rawDot < 4인 경우에만 > 1.
 */
export function resolveContentUpscaleFactor(params: {
  playOption: "one" | "multi";
  fontSizePx?: number;
}): number {
  const refDot = resolveReferencePixelLedDotPx(params.playOption);
  const fontSize = Math.max(1, params.fontSizePx ?? PIXEL_LED_REF_FONT_PX);
  const rawDot = Math.max(1, Math.round((refDot * fontSize) / PIXEL_LED_REF_FONT_PX));
  if (rawDot >= 4) return 1;
  return Math.ceil(4 / rawDot);
}

/** 배경프레임도트용 */
export function resolvePixelBackgroundShaderSizePx(params: {
  playOption: "one" | "multi";
  locale?: AppLocaleKey;
}): number {
  return resolveReferencePixelLedDotPx(params.playOption);
}

export type PixelTextShaderUniforms = {
  textThreshold: number;
  panelAlphaThreshold: number;
  dotRadiusScale: number;
  sampleReachScale: number;
  sampleReachYScale: number;
  dotMaskAaScale: number;
};

/**
 * Pixel텍스트셰이더용.
 * inner-only smoothstep 방식: dotRadius 바깥으로 번지지 않으므로
 * dotRadius < halfCell 조건만 충족하면 됨 (aa는 내부 페이드 범위).
 *   갭(CSS px) = halfCell - dotRadius = dotSize * (0.5 - dotRadiusScale)
 *   DPR=3 기준 물리 갭 = 갭 × 3
 *   dotSize=4, scale=0.40 → 갭 0.4px CSS = 1.2px physical (선명하게 보임)
 *   dotSize=6, scale=0.40 → 갭 0.6px CSS = 1.8px physical
 */
export function resolvePixelTextShaderUniforms(dotSizePx?: number): PixelTextShaderUniforms {
  const sz = dotSizePx ?? 4;
  // inner-only이므로 bleed 없음. 0.40으로 통일 (갭 = sz * 0.10px CSS)
  const dotRadiusScale = sz <= 4 ? 0.40 : 0.40;
  return {
    textThreshold: 0.28,
    panelAlphaThreshold: 0.08,
    dotRadiusScale,
    sampleReachScale: 0.85,
    sampleReachYScale: 0.58,
    dotMaskAaScale: 0.18,
  };
}

/** CircleGrid패딩셀 */
export function pixelGlyphPanelPadCells(dotSizePx: number): number {
  return dotSizePx <= 6 ? 1 : 2;
}

export function hasPixelLedEffect(effectSelectedItems: string[]): boolean {
  return effectSelectedItems.includes("Pixel");
}

/** 구프리셋Pixel칩용 */
export function migrateLegacyEffectItems(items: string[]): string[] {
  return items.map((item) =>
    item === "Pixel2" || item === "PixelZhTC" ? "Pixel" : item,
  );
}

/** Skia도트셰이더uniform용 */
export function pixelLedDotUniforms(dotSize: number) {
  return { dotSize, dotRadius: dotSize * 0.40 };
}
