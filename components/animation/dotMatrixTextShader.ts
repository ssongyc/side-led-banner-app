/** 글자 LED 도트 (배경 off-LED 없음 — 전체 화면 배경 레이어가 담당) */
export const DOT_MATRIX_TEXT_SKSL = `
  uniform shader content;
  uniform float dotSize;
  uniform float dotRadius;
  uniform float textThreshold;
  uniform float panelAlphaThreshold;
  uniform float sampleReachScale;
  uniform float sampleReachYScale;
  uniform float dotMaskAaScale;

  const float INV_SQRT2 = 0.707106781;

  half3 unpremultiply(half4 c) {
    return c.a > 0.001 ? c.rgb / c.a : half3(0.0);
  }

  float ledDotMask(vec2 pos, vec2 cellCenter) {
    float d = distance(pos, cellCenter);
    // inner-only fade: d=dotRadius에서 0, d=dotRadius-aa에서 1
    // dotRadius 바깥으로 번지지 않으므로 셀 크기와 무관하게 갭 보장
    float aa = max(dotRadius * dotMaskAaScale, dotSize * 0.05);
    return smoothstep(dotRadius, dotRadius - aa, d);
  }

  float textWeightFromSample(half4 s) {
    if (s.a < panelAlphaThreshold) {
      return 0.0;
    }
    return s.a;
  }

  vec2 sampleOffset(float x, float y) {
    return vec2(x, y * sampleReachYScale);
  }

  /** 최단 입점 근사: 중심에서 가장 가까운 유효 획 샘플을 고름 */
  void considerPoint(
    vec2 p,
    vec2 cellCenter,
    inout float minDist,
    inout float bestWeight,
    inout half3 bestRgb
  ) {
    half4 s = content.eval(p);
    float w = textWeightFromSample(s);
    if (w <= 0.0) {
      return;
    }
    float d = distance(p, cellCenter);
    if (d < minDist - 0.001 || (abs(d - minDist) <= 0.001 && w > bestWeight)) {
      minDist = d;
      bestWeight = w;
      bestRgb = unpremultiply(s);
    }
  }

  void searchShortestTextInCell(
    vec2 cellCenter,
    vec2 pos,
    out float minDist,
    out float bestWeight,
    out half3 bestRgb
  ) {
    minDist = 1e6;
    bestWeight = 0.0;
    bestRgb = half3(0.0);

    float halfCell = dotSize * 0.5;
    float reach = max(sampleReachScale, 0.35);
    float rNear = halfCell * 0.42 * reach;
    float rMid = halfCell * 0.65 * reach;
    float rFar = halfCell * 0.9 * reach;

    considerPoint(cellCenter, cellCenter, minDist, bestWeight, bestRgb);

    considerPoint(cellCenter + sampleOffset(rMid, 0.0), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rMid, 0.0), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(0.0, rMid), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(0.0, -rMid), cellCenter, minDist, bestWeight, bestRgb);

    considerPoint(cellCenter + sampleOffset(rNear, 0.0), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rNear, 0.0), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(0.0, rNear), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(0.0, -rNear), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(rNear * INV_SQRT2, rNear * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rNear * INV_SQRT2, rNear * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(rNear * INV_SQRT2, -rNear * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rNear * INV_SQRT2, -rNear * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);

    considerPoint(cellCenter + sampleOffset(rFar, 0.0), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rFar, 0.0), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(0.0, rFar), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(0.0, -rFar), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(rFar * INV_SQRT2, rFar * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rFar * INV_SQRT2, rFar * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(rFar * INV_SQRT2, -rFar * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
    considerPoint(cellCenter + sampleOffset(-rFar * INV_SQRT2, -rFar * INV_SQRT2), cellCenter, minDist, bestWeight, bestRgb);
  }

  half4 main(vec2 pos) {
    vec2 cellOrigin = floor(pos / dotSize) * dotSize;
    vec2 cellCenter = cellOrigin + dotSize * 0.5;
    float mask = ledDotMask(pos, cellCenter);
    if (mask <= 0.0) {
      return half4(0.0);
    }

    float minDist = 1e6;
    float bestWeight = 0.0;
    half3 bestRgb = half3(0.0);
    searchShortestTextInCell(cellCenter, pos, minDist, bestWeight, bestRgb);

    if (bestWeight < textThreshold) {
      return half4(0.0);
    }

    return half4(bestRgb, mask);
  }
`;
