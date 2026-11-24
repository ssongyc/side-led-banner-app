import { resolveHeartImageSource } from "@/components/animation/resolveBackgroundEffectImage";
import { Group, Image, useImage } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { Image as RNImage } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";

const MAX_TILE_COUNT = 12;

type Props = {
  heartSource: number;
  width: number;
  height: number;
  translateX: SharedValue<number>;
  isTablet: boolean;
  isFullscreen: boolean;
  isFullscreenPortrait: boolean;
  isPortrait: boolean;
};

/** Heart픽셀배경용 */
export function PixelHeartBackground({
  heartSource,
  width,
  height,
  translateX,
  isTablet,
  isFullscreen,
  isFullscreenPortrait,
  isPortrait,
}: Props) {
  const assetSource = resolveHeartImageSource({
    heartSource,
    isTablet,
    isFullscreen,
    isFullscreenPortrait,
    isPortrait,
  });
  const image = useImage(assetSource);

  const tileWidth = useMemo(() => {
    if (height <= 0) return 0;
    const resolved = RNImage.resolveAssetSource(assetSource);
    const aspect =
      resolved?.width && resolved?.height
        ? resolved.width / resolved.height
        : 1;
    return height * aspect;
  }, [assetSource, height]);

  const tileCount = useMemo(() => {
    if (tileWidth <= 0 || width <= 0) return 0;
    const needed = Math.max(3, Math.ceil(width / tileWidth) + 2);
    return Math.min(MAX_TILE_COUNT, needed);
  }, [width, tileWidth]);

  const transform = useDerivedValue(() => {
    if (tileWidth <= 0) {
      return [{ translateX: 0 }];
    }
    const loopOffset =
      ((-translateX.value % tileWidth) + tileWidth) % tileWidth;
    return [{ translateX: -loopOffset }];
  }, [tileWidth]);

  const tiles = useMemo(
    () => Array.from({ length: tileCount }, (_, i) => i),
    [tileCount],
  );

  if (!image || tileWidth <= 0 || tileCount <= 0) {
    return null;
  }

  return (
    <Group transform={transform}>
      {tiles.map((i) => (
        <Image
          key={`heart-tile-${i}`}
          image={image}
          x={i * tileWidth}
          y={0}
          width={tileWidth}
          height={height}
          fit="fill"
        />
      ))}
    </Group>
  );
}
