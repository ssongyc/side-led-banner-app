import {
  Skia,
  type SkRuntimeEffect,
} from "@shopify/react-native-skia";

const runtimeEffectCache = new Map<string, SkRuntimeEffect>();

/**
 * Compile only when a Skia-backed component asks for the effect.
 * Failed compilations are never cached, so a later render can try again after
 * the Skia runtime becomes available.
 */
export function getCachedSkiaRuntimeEffect(
  source: string,
  failureMessage: string,
): SkRuntimeEffect {
  const cached = runtimeEffectCache.get(source);
  if (cached) return cached;

  const effect = Skia.RuntimeEffect.Make(source);
  if (!effect) {
    throw new Error(failureMessage);
  }

  runtimeEffectCache.set(source, effect);
  return effect;
}
