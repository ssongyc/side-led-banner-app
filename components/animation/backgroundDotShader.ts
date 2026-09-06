const LED_DOT_MASK_GLSL = `
  float ledDotMask(vec2 pos, vec2 cellCenter) {
    float d = distance(pos, cellCenter);
    float aa = dotRadius * 0.12;
    return 1.0 - smoothstep(dotRadius - aa, dotRadius + 0.001, d);
  }
`;

/** 단색·하트 등: 샘플 색 도트 + default(off) LED 도트 */
export const DOT_MATRIX_BACKGROUND_SKSL = `
  uniform shader content;
  uniform float dotSize;
  uniform float dotRadius;
  uniform float defaultLedR;
  uniform float defaultLedG;
  uniform float defaultLedB;
  uniform float defaultLedAlpha;

  half3 unpremultiply(half4 c) {
    return c.a > 0.001 ? c.rgb / c.a : half3(0.0);
  }

  ${LED_DOT_MASK_GLSL}

  half4 main(vec2 pos) {
    vec2 cellOrigin = floor(pos / dotSize) * dotSize;
    vec2 cellCenter = cellOrigin + dotSize * 0.5;
    float mask = ledDotMask(pos, cellCenter);

    half4 sampled = content.eval(cellCenter);
    if (sampled.a < 0.001) {
      return half4(0.0);
    }

    if (mask <= 0.0) {
      return half4(defaultLedR, defaultLedG, defaultLedB, defaultLedAlpha);
    }

    half3 rgb = unpremultiply(sampled);
    return half4(rgb * mask, mask);
  }
`;

/**
 * 갤러리 사진 배경: 셀마다 사진 색 도트만 — 도트 사이는 어두운 패널.
 * defaultLed 격자를 쓰면 사진 도트와 이중 격자(모아레)가 생김.
 */
export const DOT_MATRIX_PHOTO_BACKGROUND_SKSL = `
  uniform shader content;
  uniform float dotSize;
  uniform float dotRadius;

  half3 unpremultiply(half4 c) {
    return c.a > 0.001 ? c.rgb / c.a : half3(0.0);
  }

  ${LED_DOT_MASK_GLSL}

  half4 main(vec2 pos) {
    vec2 cellOrigin = floor(pos / dotSize) * dotSize;
    vec2 cellCenter = cellOrigin + dotSize * 0.5;
    float mask = ledDotMask(pos, cellCenter);

    half4 sampled = content.eval(cellCenter);
    if (sampled.a < 0.001) {
      return half4(0.0);
    }

    if (mask <= 0.0) {
      return half4(0.0, 0.0, 0.0, 1.0);
    }

    half3 rgb = unpremultiply(sampled);
    return half4(rgb * mask, mask);
  }
`;

/** 정적 꺼진 LED 격자: layer 필터로 사용, content는 선언만 하고 무시 */
export const DOT_MATRIX_STATIC_OFF_SKSL = `
  uniform shader content;
  uniform float dotSize;
  uniform float dotRadius;
  uniform float offLedR;
  uniform float offLedG;
  uniform float offLedB;

  ${LED_DOT_MASK_GLSL}

  half4 main(vec2 pos) {
    vec2 cellOrigin = floor(pos / dotSize) * dotSize;
    vec2 cellCenter = cellOrigin + dotSize * 0.5;
    float mask = ledDotMask(pos, cellCenter);

    if (mask <= 0.0) {
      return half4(0.0, 0.0, 0.0, 1.0);
    }
    return half4(offLedR * mask, offLedG * mask, offLedB * mask, mask);
  }
`;

/** 꺼진 LED 고정 유니폼 — 배경색 무관하게 항상 같은 어두운 회색 소자 */
export const OFF_LED_UNIFORMS = {
  offLedR: 0.22,
  offLedG: 0.22,
  offLedB: 0.25,
} as const;

/** Settings > Background 색상에서 default(off) LED 도트 색 유도 */
export function resolveDefaultLedFromBackground(backgroundColor: string) {
  const raw = backgroundColor.replace("#", "").trim().toLowerCase();
  const hex = raw.length === 6 ? raw : "000000";
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  if (lum < 0.45) {
    const scale = 0.32;
    return {
      defaultLedR: r * scale + 0.04,
      defaultLedG: g * scale + 0.04,
      defaultLedB: b * scale + 0.05,
      defaultLedAlpha: 0.92,
    };
  }

  const scale = 0.58;
  return {
    defaultLedR: r * scale + 0.12,
    defaultLedG: g * scale + 0.12,
    defaultLedB: b * scale + 0.12,
    defaultLedAlpha: 0.88,
  };
}
