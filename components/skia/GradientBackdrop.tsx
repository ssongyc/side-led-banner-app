import {
  Group,
  LinearGradient,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { GradientBackdropId } from "@/constants/gradientBackgroundPresets";

type Props = {
  preset: GradientBackdropId;
  isActive: boolean;
  width: number;
  height: number;
  /** 사진 배경 위에 올릴 때 살짝만 보이게 */
  opacity?: number;
  blur?: number;
};

/**
 * Effect > Gradient 배경: LinearGradient / RadialGradient만 사용 (RuntimeShader 미사용).
 */
export function GradientBackdrop({
  preset,
  isActive,
  width,
  height,
  opacity = 1,
  blur = 0,
}: Props) {
  const phase = useSharedValue(0);

  const blurPaint = useMemo(() => {
    if (blur <= 0) return undefined;
    const paint = Skia.Paint();
    paint.setImageFilter(Skia.ImageFilter.MakeBlur(blur, blur, 0, null));
    return paint;
  }, [blur]);

  const duration = preset === "pulse" ? 2800 : preset === "flow" ? 4500 : 5200;

  const running = isActive && width > 0 && height > 0;

  // A different preset starts its own cycle; hiding the same preset retains its phase.
  useEffect(() => {
    cancelAnimation(phase);
    phase.value = 0;
  }, [phase, preset]);

  useEffect(() => {
    cancelAnimation(phase);
    if (!running) return;
    const cycle = Math.PI * 2;
    const progress = Math.min(1, Math.max(0, phase.value / cycle));
    phase.value = withTiming(cycle,
      { duration: duration * (1 - progress), easing: Easing.linear },
      finished => {
        "worklet";
        if (!finished) return;
        phase.value = 0;
        phase.value = withRepeat(
          withTiming(cycle, { duration, easing: Easing.linear }), -1, false,
        );
      });
    return () => cancelAnimation(phase);
  }, [phase, duration, preset, running]);

  const w = Math.max(1, width);
  const h = Math.max(1, height);

  if (width <= 0 || height <= 0) return null;

  if (preset === "pulse") {
    return (
      <Group layer={blurPaint}>
        <PulseGradient w={w} h={h} phase={phase} opacity={opacity} />
      </Group>
    );
  }

  if (preset === "flow") {
    return (
      <Group layer={blurPaint}>
        <FlowGradient w={w} h={h} phase={phase} opacity={opacity} />
      </Group>
    );
  }

  return (
    <Group layer={blurPaint}>
      <WaveGradient
        w={w}
        h={h}
        phase={phase}
        opacity={opacity}
      />
    </Group>
  );
}

function WaveGradient({
  w,
  h,
  phase,
  opacity,
}: {
  w: number;
  h: number;
  phase: ReturnType<typeof useSharedValue<number>>;
  opacity: number;
}) {
  const start = useDerivedValue(() => {
    const dy = Math.sin(phase.value) * h * 0.18;
    const dx = Math.cos(phase.value * 0.7) * w * 0.06;
    return vec(dx, dy);
  });

  const end = useDerivedValue(() => {
    const dx = Math.cos(phase.value * 0.9) * w * 0.14;
    const dy = Math.sin(phase.value * 1.05 + 1) * h * 0.12;
    return vec(w + dx, h + dy);
  });

  const colors = useMemo(
    () => ["#3FA9FF", "#FF5CA8", "#2E1068"],
    [],
  );

  return (
    <Group opacity={opacity}>
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient
          start={start}
          end={end}
          colors={colors}
          positions={[0, 0.5, 1]}
        />
      </Rect>
    </Group>
  );
}

/** 좌우로 색이 흘러가는 느낌 */
function FlowGradient({
  w,
  h,
  phase,
  opacity,
}: {
  w: number;
  h: number;
  phase: ReturnType<typeof useSharedValue<number>>;
  opacity: number;
}) {
  const start = useDerivedValue(() => {
    const drift = Math.sin(phase.value) * w * 0.42;
    return vec(-w * 0.08 + drift, h * 0.12);
  });

  const end = useDerivedValue(() => {
    const drift = Math.sin(phase.value) * w * 0.42;
    return vec(w * 1.02 + drift, h * 0.92);
  });

  const colors = useMemo(
    () => ["#FF6B35", "#F7C59F", "#5B21B6"],
    [],
  );

  return (
    <Group opacity={opacity}>
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient
          start={start}
          end={end}
          colors={colors}
          positions={[0, 0.45, 1]}
        />
      </Rect>
    </Group>
  );
}

/** 중심에서 맥동하는 방사 그라데이션 */
function PulseGradient({
  w,
  h,
  phase,
  opacity,
}: {
  w: number;
  h: number;
  phase: ReturnType<typeof useSharedValue<number>>;
  opacity: number;
}) {
  const base = Math.min(w, h);

  const c = useDerivedValue(() => {
    const ox = Math.sin(phase.value * 1.1) * w * 0.04;
    const oy = Math.cos(phase.value * 0.95) * h * 0.04;
    return vec(w / 2 + ox, h / 2 + oy);
  });

  const r = useDerivedValue(() => {
    const breathe = 0.72 + 0.28 * ((Math.sin(phase.value) + 1) / 2);
    return base * 0.62 * breathe;
  });

  const colors = useMemo(
    () => ["#FFF0F8", "#E85D8C", "#2D0A1E"],
    [],
  );

  const combinedOpacity = useDerivedValue(
    () => opacity * (0.55 + 0.45 * ((Math.sin(phase.value * 1.3) + 1) / 2)),
  );

  return (
    <Group opacity={combinedOpacity}>
      <Rect x={0} y={0} width={w} height={h}>
        <RadialGradient c={c} r={r} colors={colors} positions={[0, 0.55, 1]} />
      </Rect>
    </Group>
  );
}
