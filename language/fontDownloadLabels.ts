import type { AppLocaleKey } from "@/constants/language";

export type FontDownloadLabelKey = "fontDownloadTitle";

const LABELS: Record<FontDownloadLabelKey, Record<AppLocaleKey, string>> = {
  fontDownloadTitle: {
    ko: "폰트 다운로드 중",
    en: "Downloading font…",
    ja: "フォントをダウンロード中…",
    zhTC: "正在下載字體…",
    zhSC: "正在下载字体…",
    fr: "Téléchargement de la police…",
    es: "Descargando la fuente…",
  },
};

export function fontDownloadLabel(
  key: FontDownloadLabelKey,
  locale: AppLocaleKey,
): string {
  return LABELS[key][locale] ?? LABELS[key].en;
}
