import {
  buildMarqueeTextBlob,
  type MarqueeGlyphPos,
} from "@/utils/buildMarqueeTextBlob";
import type { GlyphLedPanelRect } from "@/utils/glyphLedPanels";
import { assignGlyphMixColors } from "@/utils/pixelColorMix";
import {
  FilterMode,
  PaintStyle,
  Skia,
  TileMode,
  type SkFont,
  type SkImageFilter,
  type SkPaint,
  type SkPicture,
  type SkTextBlob,
} from "@shopify/react-native-skia";


const DROP_SHADOW_RGBA = Skia.Color("rgba(0, 0, 0, 0.5)");

export type MarqueeTileLayerMode = "full" | "glowOnly" | "textOnly";

function drawTextBlobs(
  canvas: ReturnType<ReturnType<typeof Skia.PictureRecorder>["beginRecording"]>,
  blobs: SkTextBlob[],
  fill: ReturnType<typeof Skia.Paint>,
) {
  for (const blob of blobs) {
    canvas.drawTextBlob(blob, 0, 0, fill);
  }
}

export type RecordMarqueeTileParams = {
  blob: SkTextBlob;
  /** ja 혼합 폰트 등 — `blob` 대신 전부 그림 */
  textBlobs?: SkTextBlob[];
  periodWidth: number;
  height: number;
  previewTextColor: string;
  glowLayerColor: string;
  isGlowEffect: boolean;
  glowBlurRadius: number;
  strokeWidthPx: number;
  strokeColor?: string;
  dropShadow: number;
  dropShadowBlur: number;
  layerMode?: MarqueeTileLayerMode;
  /** Pixel 도트용 마스크를 살짝 두껍게 (얇은 획 보강) */
  maskDilateRadius?: number;
  /** Pixel 도트용 마스크 침식 — 획을 가늘게 (밝기는 유지) */
  maskErodeRadius?: number;
  /** Pixel: 셀당 LED 1개 — 마스크 경계 흐림 최소화 */
  pixelCrispMask?: boolean;
  /** Pixel: 글자 1자당 LED 패널 사각형 */
  glyphLedPanels?: GlyphLedPanelRect[];
  /** Pixel: 글자별 색 혼합 */
  pixelColorMix?: boolean;
  glyphPositions?: MarqueeGlyphPos[];
  font?: SkFont | null;
  backgroundColor?: string;
  /** 작은 폰트일 때 N배로 기록해 픽셀 샘플링 정밀도 향상 */
  upscaleFactor?: number;
};

function composeFilters(
  outer: SkImageFilter | null,
  inner: SkImageFilter | null,
): SkImageFilter | null {
  if (!outer) return inner;
  if (!inner) return outer;
  return Skia.ImageFilter.MakeCompose(outer, inner);
}

function withDropShadow(blur: number): SkImageFilter {
  return Skia.ImageFilter.MakeDropShadow(
    5,
    5,
    blur,
    blur,
    DROP_SHADOW_RGBA,
  );
}

function withBlur(radius: number): SkImageFilter {
  return Skia.ImageFilter.MakeBlur(radius, radius, TileMode.Clamp);
}

function applyPixelMaskMorph(
  paint: SkPaint,
  dilate: number,
  erode: number,
) {
  let chain: SkImageFilter | null = null;
  if (dilate > 0) {
    chain = Skia.ImageFilter.MakeDilate(dilate, dilate, chain);
  }
  if (erode > 0) {
    chain = Skia.ImageFilter.MakeErode(erode, erode, chain);
  }
  if (chain) {
    paint.setImageFilter(chain);
  }
}

function setPaintFilters(paint: SkPaint, ...filters: (SkImageFilter | null)[]) {
  let chain: SkImageFilter | null = null;
  for (let i = filters.length - 1; i >= 0; i--) {
    const f = filters[i];
    if (!f) continue;
    chain = composeFilters(f, chain);
  }
  if (chain) {
    paint.setImageFilter(chain);
  }
}

function drawBlobLayer(
  canvas: ReturnType<ReturnType<typeof Skia.PictureRecorder>["beginRecording"]>,
  blob: SkTextBlob,
  params: {
    fillColor: string;
    strokeColor?: string;
    strokeWidthPx: number;
    dropShadowBlur: number;
    dropShadowEnabled: boolean;
    glowBlurRadius?: number;
  },
) {
  const { strokeWidthPx, dropShadowBlur, dropShadowEnabled, glowBlurRadius } =
    params;
  const blur =
    glowBlurRadius != null && glowBlurRadius > 0
      ? withBlur(glowBlurRadius)
      : null;

  if (strokeWidthPx > 0) {
    const stroke = Skia.Paint();
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);
    stroke.setStrokeWidth(strokeWidthPx);
    stroke.setColor(Skia.Color(params.strokeColor ?? "white"));
    if (dropShadowEnabled) {
      setPaintFilters(stroke, blur, withDropShadow(dropShadowBlur));
    } else if (blur) {
      stroke.setImageFilter(blur);
    }
    canvas.drawTextBlob(blob, 0, 0, stroke);
  }

  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  fill.setColor(Skia.Color(params.fillColor));
  if (dropShadowEnabled && strokeWidthPx === 0) {
    setPaintFilters(fill, blur, withDropShadow(dropShadowBlur));
  } else if (blur) {
    fill.setImageFilter(blur);
  }
  canvas.drawTextBlob(blob, 0, 0, fill);
}

function drawGlyphColorMixLayer(
  canvas: ReturnType<ReturnType<typeof Skia.PictureRecorder>["beginRecording"]>,
  params: {
    font: SkFont;
    glyphPositions: MarqueeGlyphPos[];
    backgroundColor: string;
    pixelCrispMask?: boolean;
    dilate: number;
    erode: number;
    fallbackColor: string;
  },
) {
  const fill = Skia.Paint();
  fill.setAntiAlias(!params.pixelCrispMask);
  applyPixelMaskMorph(fill, params.dilate, params.erode);

  const colors = assignGlyphMixColors(params.glyphPositions, {
    backgroundColor: params.backgroundColor,
  });

  for (let i = 0; i < params.glyphPositions.length; i++) {
    const glyph = params.glyphPositions[i];
    if (!glyph || !glyph.text || /^\s$/u.test(glyph.text)) continue;

    const glyphBlob = buildMarqueeTextBlob(params.font, [glyph]);
    if (!glyphBlob) continue;

    fill.setColor(Skia.Color(colors[i] ?? params.fallbackColor));
    canvas.drawTextBlob(glyphBlob, 0, 0, fill);
  }
}

type SkiaCanvas = ReturnType<ReturnType<typeof Skia.PictureRecorder>["beginRecording"]>;

function drawAllLayers(
  canvas: SkiaCanvas,
  p: RecordMarqueeTileParams,
  drawGlow: boolean,
  drawText: boolean,
  mode: MarqueeTileLayerMode,
  dropShadowEnabled: boolean,
): void {
  if (drawGlow) {
    const glowBlobs =
      p.textBlobs && p.textBlobs.length > 0 ? p.textBlobs : [p.blob];
    for (const blob of glowBlobs) {
      drawBlobLayer(canvas, blob, {
        fillColor: p.glowLayerColor,
        strokeWidthPx: p.strokeWidthPx,
        dropShadowBlur: p.dropShadowBlur,
        dropShadowEnabled,
        glowBlurRadius: p.glowBlurRadius,
      });
    }
  }

  if (drawText) {
    if (mode === "textOnly") {
      const dilate = Math.max(0, p.maskDilateRadius ?? 0);
      const erode = Math.max(0, p.maskErodeRadius ?? 0);
      const fill = Skia.Paint();
      fill.setAntiAlias(!p.pixelCrispMask);
      fill.setColor(Skia.Color(p.previewTextColor));
      const shouldColorMix =
        p.pixelColorMix &&
        p.font != null &&
        (p.glyphPositions?.length ?? 0) > 0;
      if (shouldColorMix) {
        drawGlyphColorMixLayer(canvas, {
          font: p.font!,
          glyphPositions: p.glyphPositions ?? [],
          backgroundColor: p.backgroundColor ?? "#000000",
          pixelCrispMask: p.pixelCrispMask,
          dilate,
          erode,
          fallbackColor: p.previewTextColor,
        });
      } else {
        applyPixelMaskMorph(fill, dilate, erode);
        const blobs =
          p.textBlobs && p.textBlobs.length > 0 ? p.textBlobs : [p.blob];
        drawTextBlobs(canvas, blobs, fill);
      }
    } else {
      const blobs = p.textBlobs && p.textBlobs.length > 0 ? p.textBlobs : [p.blob];
      for (const blob of blobs) {
        drawBlobLayer(canvas, blob, {
          fillColor: p.previewTextColor,
          strokeColor: p.strokeColor,
          strokeWidthPx: p.strokeWidthPx,
          dropShadowBlur: p.dropShadowBlur,
          dropShadowEnabled,
        });
      }
    }
  }
}

/** 텍스트 1벌 + 간격의 타일을 SkPicture로 기록합니다. */
export function recordTile(
  p: RecordMarqueeTileParams,
): SkPicture | null {
  const periodWidth = Math.max(1, Math.ceil(p.periodWidth));
  const height = Math.max(1, Math.ceil(p.height));
  const N = Math.max(1, Math.round(p.upscaleFactor ?? 1));
  const dropShadowEnabled = p.dropShadow > 0;
  const mode = p.layerMode ?? "full";
  const drawGlow =
    p.isGlowEffect && (mode === "full" || mode === "glowOnly");
  const drawText = mode === "full" || mode === "textOnly";

  // N > 1이면 N배 큰 캔버스에 기록해 셰이더 샘플링 해상도를 높임
  const bounds = Skia.XYWHRect(0, 0, periodWidth * N, height * N);
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(bounds);
  if (N > 1) canvas.scale(N, N);

  // 기본 위치(x=0)에 레이어 그리기
  drawAllLayers(canvas, p, drawGlow, drawText, mode, dropShadowEnabled);

  // periodWidth만큼 이동한 복사본을 그려 첫 글자의 왼쪽 stroke/glow 번짐이
  // 타일 끝부분 [period-bleed, period]에 기록되도록 함 → 마퀴 이음새에서 잘림 방지
  canvas.save();
  canvas.translate(periodWidth, 0);
  drawAllLayers(canvas, p, drawGlow, drawText, mode, dropShadowEnabled);
  canvas.restore();

  return recorder.finishRecordingAsPicture();
}

/** 글로우·stroke·shadow가 타일 경계에서 잘리지 않도록 하는 여유(px) */
export function computeEffectSpace(params: {
  isGlowEffect: boolean;
  glowBlurRadius: number;
  strokeWidthPx: number;
  dropShadow: number;
}): number {
  return Math.ceil(
    (params.isGlowEffect ? params.glowBlurRadius * 2.5 : 0) +
      params.strokeWidthPx * 2 +
      (params.dropShadow > 0 ? 12 : 0) +
      2,
  );
}

export function computeMarqueeTilePeriod(params: {
  textWidthPx: number;
  spacerPx: number;
  effectBleedPx: number;
}): number {
  return Math.max(
    1,
    params.textWidthPx + params.spacerPx + params.effectBleedPx,
  );
}

function makeMarqueePictureShader(
  picture: SkPicture,
  tileWidth: number,
  tileHeight: number,
  filterMode: FilterMode = FilterMode.Linear,
  upscaleFactor = 1,
) {
  const N = Math.max(1, Math.round(upscaleFactor));
  const tileRect = Skia.XYWHRect(
    0,
    0,
    Math.max(1, tileWidth) * N,
    Math.max(1, tileHeight) * N,
  );
  // localMatrix scale(1/N): 스크린 좌표 X → 픽처 좌표 X/N
  // Skia localMatrix는 target→source 역방향이므로 1/N 스케일로 N배 큰 픽처를 1배로 매핑
  let localMatrix: import("@shopify/react-native-skia").SkMatrix | undefined;
  if (N > 1) {
    localMatrix = Skia.Matrix();
    localMatrix.scale(1 / N, 1 / N);
  }
  return picture.makeShader(
    TileMode.Repeat,
    TileMode.Clamp,
    filterMode,
    localMatrix,
    tileRect,
  );
}

export function makeMarqueeStripPaint(
  picture: SkPicture,
  tileWidth: number,
  tileHeight: number,
  filterMode: FilterMode = FilterMode.Linear,
  upscaleFactor = 1,
): SkPaint {
  const paint = Skia.Paint();
  paint.setShader(
    makeMarqueePictureShader(picture, tileWidth, tileHeight, filterMode, upscaleFactor),
  );
  return paint;
}

/** 뷰포트 + 스크롤 여유를 덮을 스트립 너비 */
export function resolveMarqueeStripWidth(
  viewportWidthPx: number,
  periodPx: number,
): number {
  const viewport = Math.max(0, viewportWidthPx);
  const period = Math.max(1, periodPx);
  return Math.max(viewport + period * 2, period * 2);
}
