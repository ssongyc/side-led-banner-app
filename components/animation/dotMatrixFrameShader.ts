/** 말풍선 테두리 등 어두운 선만 도트화 (밝은 패널은 투명 → 아래 배경 레이어가 비침) */
export const DOT_MATRIX_FRAME_SKSL = `
  uniform shader content;
  uniform float dotSize;
  uniform float dotRadius;
  uniform float lineThreshold;
  uniform half3 dotColor;

  half3 unpremultiply(half4 c) {
    return c.a > 0.001 ? c.rgb / c.a : half3(0.0);
  }

  float ledDotMask(vec2 pos, vec2 cellCenter) {
    float d = distance(pos, cellCenter);
    float aa = dotRadius * 0.12;
    return 1.0 - smoothstep(dotRadius - aa, dotRadius + 0.001, d);
  }

  float strokeAt(vec2 p) {
    half4 s = content.eval(p);
    if (s.a < 0.08) {
      return 0.0;
    }
    half3 rgb = unpremultiply(s);
    float lum = dot(rgb, vec3(0.299, 0.587, 0.114));
    return lum <= lineThreshold ? 1.0 : 0.0;
  }

  half4 main(vec2 pos) {
    vec2 cellOrigin = floor(pos / dotSize) * dotSize;
    vec2 cellCenter = cellOrigin + dotSize * 0.5;
    float mask = ledDotMask(pos, cellCenter);
    if (mask <= 0.0) {
      return half4(0.0);
    }

    // 얇은 stroke·라운드 코너: 셀 중심만 보면 누락 → 셀 안 여러 점 OR
    float hit = strokeAt(cellCenter);
    hit = max(hit, strokeAt(pos));
    hit = max(hit, strokeAt(cellOrigin + vec2(dotSize * 0.2, dotSize * 0.5)));
    hit = max(hit, strokeAt(cellOrigin + vec2(dotSize * 0.8, dotSize * 0.5)));
    hit = max(hit, strokeAt(cellOrigin + vec2(dotSize * 0.5, dotSize * 0.2)));
    hit = max(hit, strokeAt(cellOrigin + vec2(dotSize * 0.5, dotSize * 0.8)));
    if (hit < 0.5) {
      return half4(0.0);
    }

    return half4(dotColor, mask);
  }
`;


export function resolveFramePixelDotSize(textDotSize: number): number {
  return Math.max(4, Math.round(textDotSize * 0.75));
}
