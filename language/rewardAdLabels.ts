import type { AppLocaleKey } from "@/constants/language";
import type { GoogleSheetLocaleRow } from "@/hooks/useGoogleSheets";
import {
  pickLocaleFromSheetRows,
  type SheetRowPickOptions,
} from "@/language/matchSheetRows";

/**
 * 리워드 광고 팝업 문자
 */
export type RewardAdLabelKey =
  | "rewardHeaderBadge"
  | "rewardBenefitTextSize"
  | "rewardBenefitColors"
  | "rewardBenefitEffects"
  | "rewardBenefitFavorites"
  | "rewardBenefitOutlineShadow"
  | "rewardDescription"
  | "rewardWatchAd"
  | "rewardAdPreparing"
  | "rewardAdPreparingButton"
  | "rewardAdLoadFailed"
  | "rewardAdShowFailed"
  | "rewardAdRetry"
  | "rewardAdUnavailable";

const LABELS: Record<RewardAdLabelKey, Record<AppLocaleKey, string>> = {
  rewardAdPreparing: {
  "ko": "광고를 준비하고 있어요. 잠시만 기다려 주세요.",
  "en": "Preparing your ad. Please wait a moment.",
  "ja": "広告を準備しています。少々お待ちください。",
  "zhTC": "正在準備廣告，請稍候。",
  "zhSC": "正在准备广告，请稍候。",
  "fr": "La publicité se prépare. Veuillez patienter.",
  "es": "Estamos preparando el anuncio. Espera un momento."
},
  rewardAdPreparingButton: {
  "ko": "광고 준비 중…",
  "en": "Preparing Ad...",
  "ja": "広告を準備中…",
  "zhTC": "廣告準備中…",
  "zhSC": "广告准备中…",
  "fr": "Préparation…",
  "es": "Preparando…"
},
  rewardAdLoadFailed: {
  "ko": "광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  "en": "We couldn't load the ad. Please try again later.",
  "ja": "広告を読み込めませんでした。しばらくしてから再試行してください。",
  "zhTC": "無法載入廣告，請稍後再試。",
  "zhSC": "无法加载广告，请稍后重试。",
  "fr": "La publicité n’a pas pu être chargée. Réessayez plus tard.",
  "es": "No se pudo cargar el anuncio. Inténtalo de nuevo más tarde."
},
  rewardAdShowFailed: {
    ko: "광고를 재생하지 못했어요. 다시 시도해 주세요.",
    en: "We couldn't play the ad. Please try again.",
    ja: "広告を再生できませんでした。もう一度お試しください。",
    zhTC: "無法播放廣告，請再試一次。",
    zhSC: "无法播放广告，请重试。",
    fr: "La publicité n’a pas pu être lue. Veuillez réessayer.",
    es: "No se pudo reproducir el anuncio. Inténtalo de nuevo."
  },
  rewardAdRetry: {
  "ko": "다시 시도",
  "en": "Try again",
  "ja": "再試行",
  "zhTC": "重試",
  "zhSC": "重试",
  "fr": "Réessayer",
  "es": "Reintentar"
},
  rewardHeaderBadge: {
    ko: "LED Pop 프로 무료 사용",
    en: "Use LED Pop Pro for Free",
    ja: "LED Pop Proを無料で利用",
    zhTC: "免費使用 LED Pop Pro",
    zhSC: "免费使用 LED Pop Pro",
    fr: "Utilisez LED Pop Pro gratuitement",
    es: "Usa LED Pop Pro gratis",
  },
  rewardBenefitTextSize: {
    ko: "글자 크기 조절 가능",
    en: "Adjustable text size",
    ja: "文字サイズを調整可能",
    zhTC: "可調整文字大小",
    zhSC: "可调整文字大小",
    fr: "Taille du texte ajustable",
    es: "Tamaño de texto ajustable",
  },
  rewardBenefitColors: {
    ko: "모든 텍스트와 배경 색상 사용 가능",
    en: "All text and background colors available",
    ja: "すべてのテキストと背景色を利用可能",
    zhTC: "可使用所有文字和背景顏色",
    zhSC: "可使用所有文本和背景颜色",
    fr: "Toutes les couleurs de texte et d'arrière-plan disponibles",
    es: "Todos los colores de texto y fondo disponibles",
  },
  rewardBenefitEffects: {
    ko: "모든 효과 사용 가능",
    en: "Access all effects",
    ja: "すべてのエフェクトを利用可能",
    zhTC: "可使用所有特效",
    zhSC: "可使用所有特效",
    fr: "Accès à tous les effets",
    es: "Acceso a todos los efectos",
  },
  rewardBenefitFavorites: {
    ko: "모든 즐겨찾기 사용 가능",
    en: "All favorites available",
    ja: "すべてのお気に入りを利用可能",
    zhTC: "可使用所有收藏",
    zhSC: "可使用所有收藏",
    fr: "Tous les favoris disponibles",
    es: "Todos los favoritos disponibles",
  },
  rewardBenefitOutlineShadow: {
    ko: "외곽선과 그림자 사용 가능",
    en: "Outlines and shadows available",
    ja: "縁取りと影を利用可能",
    zhTC: "可使用輪廓和陰影",
    zhSC: "可使用轮廓和阴影",
    fr: "Contours et ombres disponibles",
    es: "Contornos y sombras disponibles",
  },
  rewardDescription: {
    ko: "광고 1회 시청 후 6시간 동안 동영상 광고 없이 Pro 버전을 사용할 수 있습니다.",
    en: "Watch one ad and use Pro without video ads for 6 hours.",
    ja: "広告を視聴すると、6時間動画広告なしでPro版を利用できます。",
    zhTC: "觀看一次廣告後，即可在6小時內免影片廣告並使用Pro版",
    zhSC: "观看一次广告后，即可在6小时内免视频广告并使用Pro版",
    fr: "Regardez une publicité et utilisez la version Pro sans publicité vidéo pendant 6 heures.",
    es: "Mira un anuncio y usa la versión Pro sin anuncios de video durante 6 horas.",
  },
  rewardWatchAd: {
    ko: "광고 보기",
    en: "Watch Ad",
    ja: "広告を見る",
    zhTC: "觀看廣告",
    zhSC: "观看广告",
    fr: "Regarder la pub",
    es: "Ver anuncio",
  },
  rewardAdUnavailable: {
    ko: "광고 사용 불가",
    en: "Ad Unavailable",
    ja: "広告を利用できません",
    zhTC: "廣告無法使用",
    zhSC: "广告无法使用",
    fr: "Publicité indisponible",
    es: "Anuncio no disponible",
  },
};

// All variants participate in intrinsic layout, including before an ad state changes.
export const REWARD_AD_STATUS_TEXTS = [
  ...Object.values(LABELS.rewardAdPreparing),
  ...Object.values(LABELS.rewardAdLoadFailed),
  ...Object.values(LABELS.rewardAdShowFailed),
];
export const REWARD_AD_BUTTON_TEXTS = [
  ...Object.values(LABELS.rewardWatchAd),
  ...Object.values(LABELS.rewardAdPreparingButton),
];

/** 게시 CSV 행 번호(1-based). 영·한 앵커가 같으면 시트 값이 코드 fallback보다 우선 */
const REWARD_SHEET_PICK: Partial<
  Record<RewardAdLabelKey, SheetRowPickOptions>
> = {
  rewardDescription: { sheetRow: 32 },
  rewardBenefitTextSize: { sheetRow: 33 },
  rewardBenefitColors: { sheetRow: 34 },
  rewardBenefitFavorites: { sheetRow: 35 },
  rewardBenefitEffects: { sheetRow: 36 },
  rewardWatchAd: { sheetRow: 37 },
};

/** 시트 E/F 열이 뒤바뀌었거나 깨진 경우 코드 fallback을 씁니다. */
function reconcileRewardLocaleFromSheet(
  locale: AppLocaleKey,
  fromSheet: string,
  fb: Record<AppLocaleKey, string>,
): string {
  if (locale === "zhTC") {
    if (fromSheet === fb.zhSC || /walls/i.test(fromSheet)) return fb.zhTC;
  }
  if (locale === "zhSC") {
    if (fromSheet === fb.zhTC) return fb.zhSC;
  }
  return fromSheet;
}

export function tRewardAdLabel(
  key: RewardAdLabelKey,
  locale: AppLocaleKey,
  sheetRows?: GoogleSheetLocaleRow[] | null,
): string {
  const fb = LABELS[key];
  // Authored modal status copy must not be replaced by a remotely matched Sheet row.
  if (key === "rewardAdPreparing" || key === "rewardAdPreparingButton" ||
      key === "rewardAdLoadFailed" || key === "rewardAdShowFailed" || key === "rewardAdRetry") return fb[locale];
  const opts = REWARD_SHEET_PICK[key];

  const fromSheet = pickLocaleFromSheetRows(
    sheetRows,
    locale,
    fb.en,
    fb.ko,
    opts,
  );
  if (fromSheet) {
    return reconcileRewardLocaleFromSheet(locale, fromSheet, fb);
  }

  const s = fb[locale];
  if (s) return s;
  return fb.en;
}
