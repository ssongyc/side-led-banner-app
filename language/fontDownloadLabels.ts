import type { AppLocaleKey } from "@/constants/language";

export type FontDownloadLabelKey =
  | "fontDownloadTitle"
  | "fontDownloadFailed"
  | "fontDownloadFailedMessage"
  | "close";

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
  fontDownloadFailed: {
    ko: "폰트 다운로드 실패",
    en: "Font download failed",
    ja: "フォントをダウンロードできませんでした",
    zhTC: "字體下載失敗",
    zhSC: "字体下载失败",
    fr: "Échec du téléchargement de la police",
    es: "No se pudo descargar la fuente",
  },
  fontDownloadFailedMessage: {
    ko: "연결을 확인한 뒤 창을 닫고 폰트를 다시 선택해 주세요.",
    en: "Check your connection, close this message, and select the font again.",
    ja: "接続を確認し、この画面を閉じてからフォントをもう一度選択してください。",
    zhTC: "請檢查連線，關閉此訊息後重新選擇字體。",
    zhSC: "请检查网络，关闭此消息后重新选择字体。",
    fr: "Vérifiez votre connexion, fermez ce message, puis sélectionnez à nouveau la police.",
    es: "Comprueba la conexión, cierra este mensaje y vuelve a seleccionar la fuente.",
  },
  close: {
    ko: "닫기",
    en: "Close",
    ja: "閉じる",
    zhTC: "關閉",
    zhSC: "关闭",
    fr: "Fermer",
    es: "Cerrar",
  },
};

export function fontDownloadLabel(
  key: FontDownloadLabelKey,
  locale: AppLocaleKey,
): string {
  return LABELS[key][locale] ?? LABELS[key].en;
}
