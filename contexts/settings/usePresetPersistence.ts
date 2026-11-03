import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { AppLanguagePreference } from "@/constants/language";
import { readAppLanguage, writeAppLanguage } from "@/utils/appLanguageStorage";
import { readProModeExpiry, writeProModeExpiry } from "@/utils/proModeStorage";
import { persistPresetSlotsSnapshot, readPresetSlotsJson, restorePresetBackgroundPhotos } from "@/utils/presetStorage";
import {
  type BannerConfig, type PresetSnapshot, DEFAULT_BANNER_CONFIG,
  PRESET_SLOT_COUNT, PRESET_AUTOSAVE_DEBOUNCE_MS, blankPresetSnapshot,
  configFromPreset, normalizePresetSlot, presetFromConfig,
} from "./presetModel";

type Options = {
  config: BannerConfig;
  configRef: RefObject<BannerConfig>;
  setConfig: Dispatch<SetStateAction<BannerConfig>>;
  activePreset: number;
  activePresetRef: RefObject<number>;
  appLanguage: AppLanguagePreference;
  proMode: number | null;
  applyRestoredPreferences: (
    language: Awaited<ReturnType<typeof readAppLanguage>>,
    expiry: number | null,
  ) => void;
};

export function usePresetPersistence({
  config, configRef, setConfig, activePreset, activePresetRef,
  appLanguage, proMode, applyRestoredPreferences,
}: Options) {
  const [presetSlots, setPresetSlots] = useState<PresetSnapshot[]>(() =>
    Array.from({ length: PRESET_SLOT_COUNT }, (_, i) =>
      i === 0 ? presetFromConfig(DEFAULT_BANNER_CONFIG) : blankPresetSnapshot(),
    ),
  );

  /** AsyncStorage에서 슬롯 복원 완료 전에는 자식을 마운트하지 않음(로드 전 저장·조작 레이스 방지) */
  const [presetsStorageReady, setPresetsStorageReady] = useState(false);
  const [storageLoadFailed, setStorageLoadFailed] = useState(false);
  const [storageLoadAttempt, setStorageLoadAttempt] = useState(0);
  /** state 커밋 전에도 “복원 완료” 여부를 동기적으로 알기 위함(저장 콜백에서 사용) */
  const presetsStorageReadyRef = useRef(false);

  const presetSlotsRef = useRef(presetSlots);
  useEffect(() => {
    presetSlotsRef.current = presetSlots;
  }, [presetSlots]);

  useEffect(() => {
    if (!presetsStorageReadyRef.current) return;
    const timeoutId = setTimeout(() => {
      const active = activePresetRef.current;
      setPresetSlots((prev) => {
        if (active < 0 || active >= PRESET_SLOT_COUNT) return prev;
        const next = [...prev];
        next[active] = presetFromConfig(configRef.current);
        void persistPresetSlotsSnapshot(next).catch((err) => {
          if (__DEV__) console.warn("[presets] autosave persist failed", err);
        });
        return next;
      });
    }, PRESET_AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [config, activePreset, activePresetRef, configRef]);

  useEffect(() => {
    if (!presetsStorageReadyRef.current) return;
    void writeAppLanguage(appLanguage).catch((err) => {
      if (__DEV__) console.warn("[settings] appLanguage persist failed", err);
    });
  }, [appLanguage]);

  useEffect(() => {
    if (!presetsStorageReadyRef.current) return;
    void writeProModeExpiry(proMode).catch((err) => {
      if (__DEV__) console.warn("[settings] proMode persist failed", err);
    });
  }, [proMode]);

  useEffect(() => {
    let cancelled = false;
    const blankSlots = Array.from({ length: PRESET_SLOT_COUNT }, (_, i) =>
      i === 0 ? presetFromConfig(DEFAULT_BANNER_CONFIG) : blankPresetSnapshot(),
    );
    (async () => {
      try {
        const storedAppLanguage = await readAppLanguage();

        const [raw, storedProModeExpiry] = await Promise.all([
          readPresetSlotsJson(),
          readProModeExpiry(),
        ]);
        if (cancelled) return;

        // Validate before applying state or permitting any automatic writes.
        let slots = blankSlots;
        if (raw !== null) {
          const parsed: unknown = JSON.parse(raw);
          if (!Array.isArray(parsed) || parsed.length !== PRESET_SLOT_COUNT ||
              parsed.some(item => !item || typeof item !== "object" || Array.isArray(item))) {
            throw new Error("Invalid saved preset slots");
          }
          slots = await restorePresetBackgroundPhotos(parsed.map(item => normalizePresetSlot(item)));
        }
        if (cancelled) return;
        applyRestoredPreferences(storedAppLanguage, storedProModeExpiry);
        setPresetSlots(slots);
        const active = activePresetRef.current;
        if (active >= 0 && active < slots.length) {
          const chosen = slots[active];
          if (chosen) {
            setConfig(
              configFromPreset(chosen, configRef.current.content.playOption),
            );
          }
        }
        presetsStorageReadyRef.current = true;
        setPresetsStorageReady(true);
      } catch (error) {
        if (!cancelled) {
          // Never replace unreadable data or enable autosave after a read failure.
          setStorageLoadFailed(true);
          if (__DEV__) console.error("[settings] saved settings load failed", error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageLoadAttempt, applyRestoredPreferences, activePresetRef, configRef, setConfig]);

  const selectPreset = useCallback((slot: number) => {
    if (slot < 0 || slot >= PRESET_SLOT_COUNT) return;

    const cfg = configRef.current;
    const prev = activePresetRef.current;
    const slots = [...presetSlotsRef.current];

    if (prev !== slot) {
      slots[prev] = presetFromConfig(cfg);
    }

    const chosen = slots[slot];
    if (!chosen) return;

    if (presetsStorageReadyRef.current) {
      void persistPresetSlotsSnapshot(slots).catch((err) => {
        if (__DEV__) console.warn("[presets] loadPreset persist failed", err);
      });
    }
    setPresetSlots(slots);
    return configFromPreset(chosen, cfg.content.playOption);
  }, [activePresetRef, configRef]);

  const retryStorage = useCallback(() => {
    setStorageLoadFailed(false);
    setStorageLoadAttempt(attempt => attempt + 1);
  }, []);

  return { presetsStorageReady, storageLoadFailed, retryStorage, selectPreset };
}
