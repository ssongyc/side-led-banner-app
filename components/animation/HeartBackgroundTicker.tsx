import { heartBackgroundTickerStyles as styles } from "@/constants/styles";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, Image as RNImage, StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

interface HeartBackgroundTickerProps {
  source: number;
  translateX: SharedValue<number>;
  startTrimPx?: number;
  blurRadius?: number;
}

const MAX_TILE_COUNT = 12;

// Heart 배경 이미지 타일 루프 렌더링용. 텍스트가 길어 이어 붙여서 렌더링
export function HeartBackgroundTicker({
  source,
  translateX,
  startTrimPx = 0,
  blurRadius = 0,
}: HeartBackgroundTickerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  // 로컬 이미지 원본 크기 확인
  const resolved = useMemo(() => RNImage.resolveAssetSource(source), [source]);
  // 타일 가로폭 계산용
  const imageAspectRatio =
    resolved?.width && resolved?.height ? resolved.width / resolved.height : 1;
  // 현 컨테이너 높이 기준 타일 폭
  const tileWidth = size.height > 0 ? size.height * imageAspectRatio : 0;
  // 타일 개수
  const tileCount = useMemo(() => {
    if (tileWidth <= 0) return 0;
    const needed = Math.max(3, Math.ceil(size.width / tileWidth) + 2);
    return Math.min(MAX_TILE_COUNT, needed);
  }, [size.width, tileWidth]);
  const tileIndexes = useMemo(
    () => Array.from({ length: tileCount }, (_, i) => i),
    [tileCount],
  );

  // 마퀴 이동값을 타일 단위로 루프
  const tickerStyle = useAnimatedStyle(() => {
    if (tileWidth <= 0) return { transform: [{ translateX: 0 }] };

    const loopOffset =
      ((-translateX.value % tileWidth) + tileWidth) % tileWidth;
    return {
      transform: [{ translateX: -loopOffset }],
    };
  }, [tileWidth]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }, [size.height, size.width]);

  // 타일 이미지 스타일 오프셋셋
  const imageStyle = useMemo(
    () => ({
      width: tileWidth + startTrimPx,
      height: size.height,
      marginLeft: -startTrimPx,
    }),
    [tileWidth, size.height, startTrimPx],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <View style={styles.clip}>
        <Animated.View style={[styles.row, tickerStyle]}>
          {tileIndexes.map((i) => (
            <View
              key={`heart-bg-tile-${i}`}
              style={{ width: tileWidth, height: size.height, overflow: "hidden" }}
            >
              <ExpoImage
                source={source}
                style={imageStyle}
                contentFit="fill"
                blurRadius={blurRadius}
              />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}
