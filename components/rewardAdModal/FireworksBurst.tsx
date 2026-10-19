import React, { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Group, Path, Rect, Skia } from "@shopify/react-native-skia";
import {
  cancelAnimation, Easing, type SharedValue, useDerivedValue,
  useSharedValue, withDelay, withSequence, withTiming,
} from "react-native-reanimated";

// FireworksBurst
const N = 45;

const createStarPath = (size: number) => {
  const half = size / 2;
  const inner = size * 0.15;

  return Skia.PathBuilder.Make()
    .moveTo(0, -half)
    .quadTo(0, 0, inner, -inner)
    .lineTo(half, 0)
    .quadTo(0, 0, inner, inner)
    .lineTo(0, half)
    .quadTo(0, 0, -inner, inner)
    .lineTo(-half, 0)
    .quadTo(0, 0, -inner, -inner)
    .close()
    .build();
};

const PARTICLE_DATA = Array.from({ length: N }, (_, i) => {
  const angle = (i / N) * Math.PI * 2 + ((i * 13) % 5) * 0.15;
  const maxDistance = 140 + ((i * 73) % 160);
  const size = 10 + ((i * 23) % 14);
  const type = i % 2 === 0 ? "rect" : "star";
  const colors = [
    "#FF6B00",
    "#FF9E00",
    "#e59e6b",
    "#e7b22d",
    "#f3cf8d",
    "#ecc330",
  ];
  const color = colors[i % colors.length];
  const baseOpacity = 0.5 + ((i * 7) % 6) * 0.1;
  const rotationSpeed = ((i * 11) % 4) + 4;
  const spinDirection = i % 3 === 0 ? 1 : -1;

  return {
    angle,
    maxDistance,
    size,
    type,
    color,
    baseOpacity,
    rotationSpeed,
    spinDirection,
  };
});

type FireworkParticleProps = {
  particle: (typeof PARTICLE_DATA)[number];
  starPath: ReturnType<typeof createStarPath> | null;
  progress: SharedValue<number>;
  alpha: SharedValue<number>;
  centerX: number;
  centerY: number;
};

function FireworkParticle({
  particle,
  starPath,
  progress,
  alpha,
  centerX,
  centerY,
}: FireworkParticleProps) {
  const transform = useDerivedValue(() => {
    const currentDist = particle.maxDistance * progress.value;
    const x = centerX + Math.cos(particle.angle) * currentDist;
    const y = centerY + Math.sin(particle.angle) * currentDist;
    const rotation =
      progress.value * particle.rotationSpeed * particle.spinDirection;

    return [{ translateX: x }, { translateY: y }, { rotate: rotation }];
  });
  const opacity = useDerivedValue(
    () => alpha.value * particle.baseOpacity,
  );

  return (
    <Group transform={transform} opacity={opacity}>
      {particle.type === "rect" ? (
        <Rect
          x={-particle.size / 2}
          y={-particle.size / 2}
          width={particle.size}
          height={particle.size}
          color={particle.color}
        />
      ) : (
        <Path path={starPath!} color={particle.color} style="fill" />
      )}
    </Group>
  );
}

export function FireworksBurst({ visible }: { visible: boolean }) {
  const { width: W, height: H } = useWindowDimensions();
  const cx = W / 2;
  const cy = H / 2;

  const progress = useSharedValue(0);
  const alpha = useSharedValue(0);

  const starPaths = useMemo(() => {
    return PARTICLE_DATA.map((p) =>
      p.type === "star" ? createStarPath(p.size) : null,
    );
  }, []);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      alpha.value = 0;

      progress.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.back(1.2)),
      });

      alpha.value = withSequence(
        withTiming(1, { duration: 50 }),
        withDelay(700, withTiming(0, { duration: 500 })),
      );
    } else {
      cancelAnimation(progress);
      cancelAnimation(alpha);
      progress.value = 0;
      alpha.value = 0;
    }
  }, [visible, progress, alpha]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLE_DATA.map((particle, index) => (
        <FireworkParticle
          key={index}
          particle={particle}
          starPath={starPaths[index]}
          progress={progress}
          alpha={alpha}
          centerX={cx}
          centerY={cy}
        />
      ))}
    </Canvas>
  );
}
