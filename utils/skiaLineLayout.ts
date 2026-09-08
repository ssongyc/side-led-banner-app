import type { SkFont } from "@shopify/react-native-skia";

export type SkiaLineLayout = {
  width: number;
  glyphs: { x: number; text: string }[];
};

/** Use font advances, not ink bounds: spaces and side bearings occupy real layout width. */
export function layoutSkiaLine(
  font: SkFont,
  text: string,
  letterSpacing: number,
  getCharFont?: (ch: string) => SkFont,
): SkiaLineLayout {
  if (text.length === 0) return { width: 0, glyphs: [] };
  const characters = Array.from(text);
  const advances = getCharFont ? null : font.getGlyphWidths(font.getGlyphIDs(text));
  const glyphs: SkiaLineLayout["glyphs"] = [];
  let x = 0;
  characters.forEach((ch, index) => {
    const charFont = getCharFont?.(ch) ?? font;
    const advance = advances
      ? advances[index]
      : charFont.getGlyphWidths(charFont.getGlyphIDs(ch))[0];
    if (advance == null || !Number.isFinite(advance)) {
      throw new Error("Unable to measure text glyph advance.");
    }
    glyphs.push({ x, text: ch });
    x += advance + (index < characters.length - 1 ? letterSpacing : 0);
  });
  return { width: x, glyphs };
}
