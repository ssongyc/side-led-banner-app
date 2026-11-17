import {
  BACKGROUND_PHOTO_MARGIN_BLUR,
  getBackgroundPhotoZoomFrame,
  type BackgroundPhotoViewMode,
} from "@/utils/backgroundPhotoLayout";
import { Image, type ImageLoadEventData } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { PixelRatio, StyleSheet, View } from "react-native";

type PhotoSize = { width: number; height: number };

function getPhotoTiles(width: number, height: number, photo: PhotoSize) {
  const scale = Math.min(width / photo.width, height / photo.height);
  const tileWidth = photo.width * scale;
  const tileHeight = photo.height * scale;
  const originX = (width - tileWidth) / 2;
  const originY = (height - tileHeight) / 2;
  const countX = Math.ceil(originX / tileWidth);
  const countY = Math.ceil(originY / tileHeight);
  const tiles: { key: string; left: number; top: number; width: number; height: number }[] = [];
  for (let ix = -countX; ix <= countX; ix += 1) {
    for (let iy = -countY; iy <= countY; iy += 1) {
      const left = PixelRatio.roundToNearestPixel(originX + ix * tileWidth);
      const top = PixelRatio.roundToNearestPixel(originY + iy * tileHeight);
      tiles.push({
        key: `${ix}:${iy}`,
        left,
        top,
        width: PixelRatio.roundToNearestPixel(originX + (ix + 1) * tileWidth) - left,
        height: PixelRatio.roundToNearestPixel(originY + (iy + 1) * tileHeight) - top,
      });
    }
  }
  return tiles;
}

export function BackgroundPhotoLayer({
  uri,
  width,
  height,
  blurRadius,
  viewMode,
}: {
  uri: string;
  width: number;
  height: number;
  blurRadius: number;
  viewMode: BackgroundPhotoViewMode;
}) {
  const [photo, setPhoto] = useState<PhotoSize | null>(null);
  const onPhotoLoad = useCallback(({ source }: ImageLoadEventData) => {
    if (source.width <= 0 || source.height <= 0) return;
    const { width, height } = source;
    setPhoto(current => (
      current?.width === width && current.height === height ? current : { width, height }
    ));
  }, []);

  const tiles = useMemo(
    () => viewMode === "repeat" && photo && width > 0 && height > 0
      ? getPhotoTiles(width, height, photo)
      : null,
    [viewMode, width, height, photo],
  );
  const frame = viewMode === "zoom" && photo
    ? getBackgroundPhotoZoomFrame(width, height, photo.width, photo.height)
    : null;
  const source = { uri };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {frame ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={Math.max(blurRadius, BACKGROUND_PHOTO_MARGIN_BLUR)}
        />
      ) : null}
      {tiles ? tiles.map(({ key, ...tile }) => (
        <Image
          key={key}
          source={source}
          style={{ position: "absolute", ...tile }}
          contentFit="cover"
          blurRadius={blurRadius}
        />
      )) : (
        <Image
          key="foreground"
          source={source}
          style={frame
            ? { position: "absolute", left: frame.x, top: frame.y, width: frame.width, height: frame.height }
            : StyleSheet.absoluteFill}
          contentFit={viewMode === "repeat" ? "contain" : "cover"}
          blurRadius={blurRadius}
          onLoad={onPhotoLoad}
        />
      )}
    </View>
  );
}
