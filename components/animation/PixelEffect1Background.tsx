import { resolveEffect1Rects } from "@/components/animation/resolveBackgroundEffectImage";
import type { Effect1Sources } from "@/hooks/useBackgroundAnimation";
import { Group, Image, useImage } from "@shopify/react-native-skia";
import { useMemo } from "react";

/** 응원봉픽셀배경용 */
export function PixelEffect1Background({
  sources,
  width,
  height,
  isFullscreenPortrait,
}: {
  sources: Effect1Sources;
  width: number;
  height: number;
  isFullscreenPortrait: boolean;
}) {
  const leftImage = useImage(sources.left);
  const rightImage = useImage(sources.right);
  const rects = useMemo(
    () => resolveEffect1Rects(width, height, isFullscreenPortrait),
    [width, height, isFullscreenPortrait],
  );

  if (!leftImage || !rightImage || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <Group>
      <Image image={leftImage} {...rects.left} fit="fill" />
      <Image image={rightImage} {...rects.right} fit="fill" />
    </Group>
  );
}
