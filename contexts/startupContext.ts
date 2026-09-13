import { createContext } from "react";
import type { AppLocaleKey } from "@/constants/language";

export type StorageStartupState = {
  ready: boolean;
  failed: boolean;
  locale: AppLocaleKey;
  retry: () => void;
};

// The root owns startup presentation; the mounted preview reports preparation only.
export const StartupPreviewContext = createContext<(ready: boolean) => void>(() => {});

// Readiness calculation still runs while only animation producers are paused.
export const StartupVisibilityContext = createContext(true);
