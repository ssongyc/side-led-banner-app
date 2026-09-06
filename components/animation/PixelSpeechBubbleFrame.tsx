import { DOT_MATRIX_FRAME_SKSL, resolveFramePixelDotSize } from "@/components/animation/dotMatrixFrameShader";
import { Group, Image, Paint, RuntimeShader, Skia, useImage } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

type Props = {
  source: number;
  width: number;
  height: number;
  previewInset: number;
  pixelShaderSize: number;
  useWhiteDots?: boolean;
};

/** 말풍선 PNG — BackgroundEffectLayer와 동일 fill, 어두운 테두리만 도트 레이어 */
export function PixelSpeechBubbleFrame({
  source,
  width,
  height,
  previewInset,
  pixelShaderSize,
  useWhiteDots = false,
}: Props) {
  const image = useImage(source);
  const frameSource = useMemo(() => {
    const runtimeEffect = Skia.RuntimeEffect.Make(DOT_MATRIX_FRAME_SKSL);
    if (!runtimeEffect) throw new Error("Failed to compile dot matrix frame shader.");
    return runtimeEffect;
  }, []);

  const layout = useMemo(
    () => ({
      x: 0,
      y: -previewInset,
      width,
      height: height + previewInset * 2,
    }),
    [width, height, previewInset],
  );

  const frameDotSize = resolveFramePixelDotSize(pixelShaderSize);

  const frameShaderLayer = useMemo(() => {
    const dotColor: [number, number, number] = useWhiteDots
      ? [1, 1, 1]
      : [0, 0, 0];
    return (
      <Paint>
        <RuntimeShader
          source={frameSource}
          uniforms={{
            dotSize: frameDotSize,
            dotRadius: frameDotSize * 0.46,
            lineThreshold: 0.42,
            dotColor,
          }}
        />
      </Paint>
    );
  }, [frameDotSize, frameSource, useWhiteDots]);

  if (!image) return null;

  return (
    <Group layer={frameShaderLayer}>
      <Image
        image={image}
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
        fit="fill"
      />
    </Group>
  );
};
