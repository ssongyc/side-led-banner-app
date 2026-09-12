import type { AppLocaleKey } from "@/constants/language";

export const STARTUP_RECOVERY_LABELS: Record<AppLocaleKey, { title: string; storage: string; splash: string; retry: string }> = {
  ko: { title: "앱 준비 오류", storage: "저장된 설정을 읽지 못했어요. 기존 데이터는 변경하지 않았습니다. 다시 시도해 주세요.", splash: "시작 화면을 닫지 못했어요. 다시 시도해 주세요.", retry: "다시 시도" },
  en: { title: "App startup error", storage: "Could not read saved settings. Existing data has not been changed. Please try again.", splash: "Could not close the startup screen. Please try again.", retry: "Try again" },
  ja: { title: "アプリの起動エラー", storage: "保存した設定を読み込めませんでした。既存のデータは変更していません。もう一度お試しください。", splash: "起動画面を閉じられませんでした。もう一度お試しください。", retry: "再試行" },
  zhSC: { title: "应用启动错误", storage: "无法读取已保存的设置。现有数据未被更改。请重试。", splash: "无法关闭启动画面。请重试。", retry: "重试" },
  zhTC: { title: "應用程式啟動錯誤", storage: "無法讀取已儲存的設定。現有資料未被更改。請重試。", splash: "無法關閉啟動畫面。請重試。", retry: "重試" },
  fr: { title: "Erreur au démarrage", storage: "Impossible de lire les réglages enregistrés. Les données existantes n’ont pas été modifiées. Veuillez réessayer.", splash: "Impossible de fermer l’écran de démarrage. Veuillez réessayer.", retry: "Réessayer" },
  es: { title: "Error al iniciar", storage: "No se pudieron leer los ajustes guardados. Los datos existentes no se han modificado. Inténtalo de nuevo.", splash: "No se pudo cerrar la pantalla de inicio. Inténtalo de nuevo.", retry: "Reintentar" },
};
