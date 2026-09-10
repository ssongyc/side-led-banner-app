import { layoutSkiaLine } from "@/utils/skiaLineLayout";
import type { SpeechBubblePresetId } from "@/constants/speechBubblePresets";
import type { SkFont } from "@shopify/react-native-skia";

export const BUBBLE_SAFE = {
  widthRatio: 0.88,
  heightRatio: 0.72,
} as const;

export const BUBBLE_MAX_ROWS = 3;

export type BubbleGlyph = { x: number; y: number; text: string };

export type BubbleRowLayout = {
  text: string;
  width: number;
  glyphs: { x: number; text: string }[];
};

export type BubbleLayoutOpts = {
  frameWidth: number;
  frameHeight: number;
  safeWRatio?: number;
  safeHRatio?: number;
  maxRows?: number;
  lineGapPx?: number;
};

export type BubbleCanvasOpts = Omit<BubbleLayoutOpts, "frameWidth" | "frameHeight"> & {
  /** Pixel dilate + glyph panel pad (px per side) */
  edgeInsetPx?: number;
};

/** 말풍선 + Pixel 시 텍스트 박스 안쪽 여백 (dilate 1 + panel pad 1) */
export function resolveBubbleCanvasOpts(params: {
  isSpeechActive: boolean;
  isPixelEffect: boolean;
  pixelShaderSize: number;
  speechBubbleId?: SpeechBubblePresetId | null;
}): BubbleCanvasOpts | null {
  if (!params.isSpeechActive) return null;
  const opts: BubbleCanvasOpts = {};
  if (params.isPixelEffect) {
    opts.edgeInsetPx = 2 * params.pixelShaderSize;
    if (params.speechBubbleId === "speechBg1") {
      opts.safeWRatio = 0.82;
    }
  }
  return Object.keys(opts).length > 0 ? opts : {};
}

function splitEnterRows(text: string): string[] {
  return text.replace(/\r\n?/g, "\n").split("\n");
}

export function countRows(
  text: string,
  playOption: "one" | "multi" = "multi",
  maxRows = BUBBLE_MAX_ROWS,
): number {
  if (playOption === "one") return 1;
  const rows = splitEnterRows(text);
  if (rows.length === 0) return 1;
  return Math.min(maxRows, rows.length);
}

export function bubbleRows(params: {
  text: string;
  maxRows?: number;
  playOption?: "one" | "multi";
}): string[] {
  const { text, maxRows = BUBBLE_MAX_ROWS, playOption = "multi" } = params;
  const manual = splitEnterRows(text);
  if (playOption === "one") {
    const one = manual.join(" ");
    return one.length > 0 ? [one] : [];
  }
  return manual.slice(0, maxRows);
}

export function bubbleLayouts(
  font: SkFont,
  rows: string[],
  letterSpacing: number,
  getCharFont?: (ch: string) => SkFont,
): BubbleRowLayout[] {
  return rows.map((text) => ({
    text,
    ...layoutSkiaLine(font, text, letterSpacing, getCharFont),
  }));
}

export function bubbleGlyphs(params: {
  font: SkFont;
  rows: Pick<BubbleRowLayout, "width" | "glyphs">[];
  frameWidth: number;
  frameHeight: number;
  safeWRatio?: number;
  safeHRatio?: number;
  lineGapPx?: number;
  edgeInsetPx?: number;
}): BubbleGlyph[] {
  const {
    font,
    rows,
    frameWidth,
    frameHeight,
    safeWRatio = BUBBLE_SAFE.widthRatio,
    lineGapPx = 0,
    edgeInsetPx = 0,
  } = params;

  const n = rows.length;
  if (n === 0 || frameWidth <= 0 || frameHeight <= 0) return [];

  const inset = Math.max(0, edgeInsetPx);
  const innerW = Math.max(1, frameWidth - inset * 2);

  const metrics = font.getMetrics();
  const rowH = metrics.descent - metrics.ascent;
  const gap = Math.max(0, lineGapPx);
  const blockH = rowH * n + gap * Math.max(0, n - 1);

  const safeW = innerW * safeWRatio;
  const safeLeft = inset + (innerW - safeW) / 2;
  const blockTop = Math.max(0, (frameHeight - blockH) / 2);
  const baseY = blockTop - metrics.ascent;
  const rowStep = rowH + gap;

  // Align the entire text block once so every row enters the marquee together.
  const blockWidth = rows.reduce((max, row) => Math.max(max, row.width), 0);
  const x0 = safeLeft + (safeW - blockWidth) / 2;
  const out: BubbleGlyph[] = [];
  for (let i = 0; i < n; i++) {
    const row = rows[i]!;
    const y = baseY + i * rowStep;
    for (const g of row.glyphs) {
      out.push({ x: x0 + g.x, y, text: g.text });
    }
  }
  return out;
}
