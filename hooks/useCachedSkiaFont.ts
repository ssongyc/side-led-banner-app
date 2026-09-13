import { isRemoteFontMarker, type FontAssetSource } from "@/constants/appFonts";
import { REMOTE_FONT_FACE_SETS } from "@/constants/remoteFonts";
import { ensureRemoteFontDownloaded } from "@/utils/remoteFontLoader";
import type { SkFont, SkTypeface } from "@shopify/react-native-skia";
import { Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { Image } from "react-native";

/**
 * Skia의 기본 useFont/useTypeface는 컴포넌트 인스턴스마다 캐시가 없어서,
 * 같은 폰트를 다시 고르거나(뒤로가기) 같은 폰트를 여러 컴포넌트(미리보기+전체화면)가
 * 동시에 쓸 때마다 TTF를 매번 새로 디코딩합니다. 여기서는 asset(require id) 기준으로
 * 앱 전역에 한 번만 디코딩해서 공유합니다.
 */
export type FontAssetRef = number | string;

const typefaceCache = new Map<FontAssetRef, SkTypeface | null>();
const pendingTypefaceLoads = new Map<FontAssetRef, Promise<SkTypeface | null>>();

const LOAD_RETRY_DELAYS_MS = [300, 1000, 2000];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTypeface(asset: FontAssetRef): Promise<SkTypeface | null> {
  const uri = typeof asset === "number" ? Image.resolveAssetSource(asset).uri : asset;
  const data = await Skia.Data.fromURI(uri);
  return data ? Skia.Typeface.MakeFreeTypeFaceFromData(data) : null;
}

// 부팅 직후처럼 폰트 다운로드가 몰릴 때 개발 서버(Metro)에서 일시적으로
// 거부되는 경우가 있어, 실패 시 짧은 자체 재시도합니다.
async function fetchTypefaceWithRetry(asset: FontAssetRef): Promise<SkTypeface | null> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetchTypeface(asset);
    } catch {
      const delay = LOAD_RETRY_DELAYS_MS[attempt];
      if (delay == null) return null;
      await wait(delay);
    }
  }
}

export function loadTypeface(asset: FontAssetRef): Promise<SkTypeface | null> {
  const cached = typefaceCache.get(asset);
  if (cached !== undefined) return Promise.resolve(cached);

  const pending = pendingTypefaceLoads.get(asset);
  if (pending) return pending;

  const promise = fetchTypefaceWithRetry(asset)
    .then((typeface) => {
      // 성공/영구 실패 모두 결과를 캐시해 이후 호출자가 중복 재시도하지 않게 함
      typefaceCache.set(asset, typeface);
      return typeface;
    })
    .finally(() => {
      pendingTypefaceLoads.delete(asset);
    });

  pendingTypefaceLoads.set(asset, promise);
  return promise;
}

/** 부팅 시점 등에서 캐시를 미리 데워두기 위한 fire-and-forget 프리로드 */
export function preloadSkiaTypefaces(assets: FontAssetRef[]): void {
  assets.forEach((asset) => {
    void loadTypeface(asset);
  });
}

/** Manual startup retry may discard failed decodes; successful/in-flight work is retained. */
export function clearFailedSkiaTypefaces(): void {
  for (const [asset, typeface] of typefaceCache) {
    if (typeface === null) typefaceCache.delete(asset);
  }
}

const RETRY_DELAYS_MS = [500, 1500, 3000];

/** asset 기준 전역 캐시를 쓰는 useFont 대체 훅. */
export function useCachedSkiaFont(
  asset: FontAssetRef | null | undefined,
  size: number,
): SkFont | null {
  const [loaded, setLoaded] = useState(() => ({
    asset, typeface: asset != null ? typefaceCache.get(asset) ?? null : null,
  }));

  useEffect(() => {
    if (asset == null) {
      setLoaded({ asset, typeface: null });
      return;
    }
    const cached = typefaceCache.get(asset);
    if (cached !== undefined) {
      setLoaded({ asset, typeface: cached });
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // 첫 로드가 실패해도(iOS 저사양/태블릿에서 초기 IO 지연 등) 마퀴 애니메이션이
    // textWidth=0 상태로 영구히 멈추지 않도록 짧은 백오프로 재시도한다
    const attemptLoad = (retryIndex: number) => {
      loadTypeface(asset).then((tf) => {
        if (cancelled) return;
        if (tf) {
          setLoaded({ asset, typeface: tf });
          return;
        }
        const delay = RETRY_DELAYS_MS[retryIndex];
        if (delay == null) {
          setLoaded({ asset, typeface: null });
          return;
        }
        timer = setTimeout(() => attemptLoad(retryIndex + 1), delay);
      });
    };
    attemptLoad(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [asset]);

  // A font from the previous selection must never count as the requested font being ready.
  const typeface = loaded.asset === asset ? loaded.typeface : null;
  return useMemo(() => (typeface ? Skia.Font(typeface, size) : null), [typeface, size]);
}

export function useResolvedFontAssetRef(
  source: FontAssetSource | null,
): FontAssetRef | null {
  const [resolved, setResolved] = useState<{ key: string; uri: string } | null>(null);
  const marker = source != null && isRemoteFontMarker(source) ? source : null;

  const markerKey = marker ? `${marker.remote}:${marker.weight}` : null;

  useEffect(() => {
    if (!marker || !markerKey) return;
    let cancelled = false;
    const fontSource = REMOTE_FONT_FACE_SETS[marker.remote][marker.weight];
    ensureRemoteFontDownloaded(fontSource)
      .then((uri) => {
        if (__DEV__) console.log("[fonts] remote font resolve done", marker.remote, marker.weight, uri);
        if (!cancelled) setResolved({ key: markerKey, uri });
      })
      .catch((err) => {
        if (__DEV__) console.warn("[fonts] remote font resolve failed", marker.remote, marker.weight, err);
      });
    return () => {
      cancelled = true;
    };
  }, [marker?.remote, marker?.weight, markerKey]);

  if (source == null) return null;
  return typeof source === "number" ? source : resolved && resolved.key === markerKey ? resolved.uri : null;
}
