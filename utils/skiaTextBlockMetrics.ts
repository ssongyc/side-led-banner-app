import type { SkFont } from "@shopify/react-native-skia";

/** `bubbleGlyphs`와 동일: 한 줄의 픽셀 높이 */
export function skiaRowHeightPx(font: SkFont): number {
  const m = font.getMetrics();
  return m.descent - m.ascent;
}

/** 여러 줄 + 줄 간격(px) 블록 전체 높이 */
export function skiaTextBlockHeightPx(
  rowHeightPx: number,
  lineCount: number,
  lineGapPx: number,
): number {
  const n = Math.max(1, lineCount);
  const gap = Math.max(0, lineGapPx);
  return rowHeightPx * n + gap * Math.max(0, n - 1);
}

/**
 * `probeFontSize`로 로드한 폰트의 `rowHeightPx` 기준,
 * 주어진 높이 안에 들어가는 최대 fontSize.
 */
export function maxFontSizeForAvailableHeight(params: {
  rowHeightPxAtProbe: number;
  probeFontSize: number;
  lineCount: number;
  lineGapPx: number;
  availableHeightPx: number;
}): number {
  const {
    rowHeightPxAtProbe,
    probeFontSize,
    lineCount,
    lineGapPx,
    availableHeightPx,
  } = params;
  const n = Math.max(1, lineCount);
  const gaps = Math.max(0, n - 1) * Math.max(0, lineGapPx);
  const bodyBudget = Math.max(1, availableHeightPx - gaps);
  const rowHeightPerFontPx =
    rowHeightPxAtProbe / Math.max(1, probeFontSize);
  return Math.max(
    1,
    Math.floor(bodyBudget / (rowHeightPerFontPx * n)),
  );
}
