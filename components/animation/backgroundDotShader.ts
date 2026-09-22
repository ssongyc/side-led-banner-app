const PIXEL_BLOCK_MASK_GLSL = `
  float pixelBlockMask(vec2 pos, vec2 cellCenter) {
    float edge = max(abs(pos.x - cellCenter.x), abs(pos.y - cellCenter.y));
    float aa = max(dotRadius * 0.08, dotSize * 0.025);
    return 1.0 - smoothstep(dotRadius - aa, dotRadius, edge);
  }
`;

/** Animated/image content rendered as clean square pixels over the selected background. */
export const DOT_MATRIX_BACKGROUND_SKSL = `
  uniform shader content;
  uniform float dotSize;
  uniform float dotRadius;

  half3 unpremultiply(half4 c) {
    return c.a > 0.001 ? c.rgb / c.a : half3(0.0);
  }

  ${PIXEL_BLOCK_MASK_GLSL}

  half4 main(vec2 pos) {
    vec2 cellOrigin = floor(pos / dotSize) * dotSize;
    vec2 cellCenter = cellOrigin + dotSize * 0.5;
    float mask = pixelBlockMask(pos, cellCenter);
    half4 sampled = content.eval(cellCenter);

    if (sampled.a < 0.001 || mask <= 0.0) {
      return half4(0.0);
    }

    half3 rgb = unpremultiply(sampled);
    return half4(rgb * mask, mask);
  }
`;
