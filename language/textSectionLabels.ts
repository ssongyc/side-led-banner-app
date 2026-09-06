import type { AppLocaleKey } from "@/constants/language";
import type { GoogleSheetLocaleRow } from "@/hooks/useGoogleSheets";
import {
  pickLocaleFromSheetRows,
  type SheetRowPickOptions,
} from "@/language/matchSheetRows";

/**
 * TEXT/설정 공통 오프라인 기본값.
 * 시트에서는 같은 행의 영어(C)·한글(B)이 코드 기본과 같으면 그 행의 현재 언어 열을 씁니다.
 */

export type TextSectionLabelKey =
  | "language"
  | "langFollowDevice"
  | "font"
  | "fontPlaceholder"
  | "color"
  /** 배경*/
  | "backgroundColor"
  | "blur"
  | "speed"
  | "size"
  | "lineSpacing"
  | "letterSpacing"
  | "viewMode"
  | "outline"
  | "dropShadow"
  | "viewModeReset"
  | "viewModeContinuous"
  | "tabText"
  | "tabBackground"
  | "tabEffects"
  /** 설정*/
  | "settingsTitle"
  | "upgradeToPremium"
  | "premiumProductTitle"
  | "premiumProductDescription"
  | "premiumPrice"
  | "restorePreviousPurchase"
  | "sunnyGames"
  | "instagram"
  | "twitter"
  | "link"
  | "credits"
  | "openSourceInfo"
  | "terms"
  | "privacy"
  | "appVersion";

const LABELS: Record<TextSectionLabelKey, Record<AppLocaleKey, string>> = {
  language: {
    ko: "언어",
    en: "Language",
    ja: "言語",
    zhTC: "語言",
    zhSC: "语言",
    fr: "Langue",
    es: "Idioma",
  },
  langFollowDevice: {
    ko: "기기 설정 따름",
    en: "Follow device",
    ja: "端末の設定に従う",
    zhTC: "跟隨裝置",
    zhSC: "跟随系统",
    fr: "Suivre l'appareil",
    es: "Seguir dispositivo",
  },
  font: {
    ko: "글꼴",
    en: "Font",
    ja: "フォント",
    zhTC: "字體",
    zhSC: "字体",
    fr: "Police",
    es: "Fuente",
  },
  fontPlaceholder: {
    ko: "글꼴 선택",
    en: "Select font",
    ja: "フォントを選択",
    zhTC: "選擇字體",
    zhSC: "选择字体",
    fr: "Sélectionner une police",
    es: "Seleccionar fuente",
  },
  color: {
    ko: "색상",
    en: "Color",
    ja: "カラー",
    zhTC: "顏色",
    zhSC: "颜色",
    fr: "Couleur",
    es: "Color",
  },
  backgroundColor: {
    ko: "색상",
    en: "Color",
    ja: "カラー",
    zhTC: "顏色",
    zhSC: "颜色",
    fr: "Couleur",
    es: "Color",
  },
  blur: {
    ko: "흐림",
    en: "Blur",
    ja: "ぼかし",
    zhTC: "模糊",
    zhSC: "模糊",
    fr: "Flou",
    es: "Desenfoque",
  },
  speed: {
    ko: "속도",
    en: "Speed",
    ja: "速度",
    zhTC: "速度",
    zhSC: "速度",
    fr: "Vitesse",
    es: "Velocidad",
  },
  size: {
    ko: "크기",
    en: "Size",
    ja: "サイズ",
    zhTC: "大小",
    zhSC: "大小",
    fr: "Taille",
    es: "Tamaño",
  },
  lineSpacing: {
    ko: "행간",
    en: "Line Spacing",
    ja: "行間",
    zhTC: "行間距",
    zhSC: "行间距",
    fr: "Espacement des lignes",
    es: "Espaciado de líneas",
  },
  letterSpacing: {
    ko: "자간",
    en: "Letter Spacing",
    ja: "文字間隔",
    zhTC: "字間距",
    zhSC: "字距",
    fr: "Espacement des lettres",
    es: "Espaciado de letras",
  },
  viewMode: {
    ko: "보기 모드",
    en: "View Mode",
    ja: "表示モード",
    zhTC: "檢視模式",
    zhSC: "查看模式",
    fr: "Mode d'affichage",
    es: "Modo de vista",
  },
  outline: {
    ko: "외곽선",
    en: "Outline",
    ja: "縁取り",
    zhTC: "輪廓",
    zhSC: "轮廓",
    fr: "Contour",
    es: "Contorno",
  },
  dropShadow: {
    ko: "그림자",
    en: "Drop Shadow",
    ja: "ドロップシャドウ",
    zhTC: "陰影",
    zhSC: "投影",
    fr: "Ombre portée",
    es: "Sombra paralela",
  },
  viewModeReset: {
    ko: "스타일 A",
    en: "Style A",
    ja: "スタイル A",
    zhTC: "樣式 A",
    zhSC: "样式 A",
    fr: "Style A",
    es: "Estilo A",
  },
  viewModeContinuous: {
    ko: "스타일 B",
    en: "Style B",
    ja: "スタイル B",
    zhTC: "樣式 B",
    zhSC: "样式 B",
    fr: "Style B",
    es: "Estilo B",
  },
  /** Settings Tab*/
  tabText: {
    ko: "텍스트",
    en: "Text",
    ja: "テキスト",
    zhTC: "文字",
    zhSC: "文本",
    fr: "Texte",
    es: "Texto",
  },
  tabBackground: {
    ko: "배경",
    en: "Background",
    ja: "背景",
    zhTC: "背景",
    zhSC: "背景",
    fr: "Arrière-plan",
    es: "Fondo",
  },
  tabEffects: {
    ko: "효과",
    en: "Effects",
    ja: "エフェクト",
    zhTC: "特效",
    zhSC: "特效",
    fr: "Effets",
    es: "Efectos",
  },
  settingsTitle: {
    ko: "설정",
    en: "Settings",
    ja: "設定",
    zhTC: "設定",
    zhSC: "设置",
    fr: "Paramètres",
    es: "Ajustes",
  },
  upgradeToPremium: {
    ko: "Pro로 업그레이드",
    en: "Upgrade to Pro",
    ja: "Pro にアップグレード",
    zhTC: "升級至 Pro",
    zhSC: "升级到 Pro",
    fr: "Passer à Pro",
    es: "Actualizar a Pro",
  },
  premiumProductTitle: {
    ko: "LED POP Premium",
    en: "LED POP Premium",
    ja: "LED POP Premium",
    zhTC: "LED POP Premium",
    zhSC: "LED POP Premium",
    fr: "LED POP Premium",
    es: "LED POP Premium",
  },
  premiumProductDescription: {
    ko: "광고 없이 LED POP 전체 버전을 즐기세요.",
    en: "Enjoy the full version of LED POP without ads.",
    ja: "広告なしで LED POP のフルバージョンをお楽しみください。",
    zhTC: "享受沒有廣告的 LED POP 完整版。",
    zhSC: "享受没有广告的 LED POP 完整版。",
    fr: "Profitez de la version complète de LED POP sans publicités.",
    es: "Disfruta la versión completa de LED POP sin anuncios.",
  },
  premiumPrice: {
    ko: "$6.99 CAD",
    en: "$6.99 CAD",
    ja: "$6.99 CAD",
    zhTC: "$6.99 CAD",
    zhSC: "$6.99 CAD",
    fr: "$6.99 CAD",
    es: "$6.99 CAD",
  },
  restorePreviousPurchase: {
    ko: "이전 구매 복원",
    en: "Restore the Previous Purchase",
    ja: "以前の購入を復元",
    zhTC: "恢復先前購買",
    zhSC: "恢复之前购买",
    fr: "Restaurer l’achat précédent",
    es: "Restaurar la compra anterior",
  },
  sunnyGames: {
    ko: "Sunny의 게임 및 앱",
    en: "Sunny's Games and Apps",
    ja: "Sunny のゲームとアプリ",
    zhTC: "Sunny 的遊戲與應用",
    zhSC: "Sunny 的游戏与应用",
    fr: "Jeux et applications de Sunny",
    es: "Juegos y aplicaciones de Sunny",
  },
  instagram: {
    ko: "Instagram",
    en: "Instagram",
    ja: "Instagram",
    zhTC: "Instagram",
    zhSC: "Instagram",
    fr: "Instagram",
    es: "Instagram",
  },
  twitter: {
    ko: "X (Twitter)",
    en: "X (Twitter)",
    ja: "X (Twitter)",
    zhTC: "X (Twitter)",
    zhSC: "X (Twitter)",
    fr: "X (Twitter)",
    es: "X (Twitter)",
  },
  link: {
    ko: "링크",
    en: "Link",
    ja: "リンク",
    zhTC: "連結",
    zhSC: "链接",
    fr: "Lien",
    es: "Enlace",
  },
  credits: {
    ko: "크레딧",
    en: "Credits",
    ja: "クレジット",
    zhTC: "製作群",
    zhSC: "制作团队",
    fr: "Crédits",
    es: "Créditos",
  },
  openSourceInfo: {
    ko: "오픈 소스 정보",
    en: "Open Source Info",
    ja: "オープンソース情報",
    zhTC: "開源資訊",
    zhSC: "开源信息",
    fr: "Infos open source",
    es: "Información de código abierto",
  },
  terms: {
    ko: "이용약관",
    en: "Terms",
    ja: "利用規約",
    zhTC: "服務條款",
    zhSC: "服务条款",
    fr: "Conditions",
    es: "Términos",
  },
  privacy: {
    ko: "개인정보처리방침",
    en: "Privacy",
    ja: "プライバシー",
    zhTC: "隱私權",
    zhSC: "隐私政策",
    fr: "Confidentialité",
    es: "Privacidad",
  },
  appVersion: {
    ko: "앱 버전",
    en: "App Version",
    ja: "アプリのバージョン",
    zhTC: "應用程式版本",
    zhSC: "应用版本",
    fr: "Version de l'application",
    es: "Versión de la app",
  },
};

/** 시트에 같은 영어가 여러 줄일 때 첫 번째 행의 값을 쓰고 나머지는 무시 */
const TEXT_SHEET_PICK: Partial<
  Record<TextSectionLabelKey, SheetRowPickOptions>
> = {
  color: { englishOccurrenceIndex: 0 },
  backgroundColor: { englishOccurrenceIndex: 1 },
  size: { sheetRow: 5 },
};


const SETTINGS_SHEET_PICK: Partial<
  Record<TextSectionLabelKey, SheetRowPickOptions>
> = {
  settingsTitle: { sheetRow: 2 },
  language: { sheetRow: 24 },
  instagram: { sheetRow: 37 },
  twitter: { sheetRow: 38 },
  link: { sheetRow: 39 },
  sunnyGames: { sheetRow: 43 },
  credits: { sheetRow: 57 },
  openSourceInfo: { sheetRow: 64 },
  terms: { sheetRow: 67 },
  privacy: { sheetRow: 68 },
  appVersion: { sheetRow: 65 },
};

export function tTextSectionLabel(
  key: TextSectionLabelKey,
  locale: AppLocaleKey,
  sheetRows?: GoogleSheetLocaleRow[] | null,
  settingsSheetRows?: GoogleSheetLocaleRow[] | null,
): string {
  const fb = LABELS[key];

  const settingsOpts = SETTINGS_SHEET_PICK[key];
  if (settingsOpts) {
    const fromSettingsSheet = pickLocaleFromSheetRows(
      settingsSheetRows,
      locale,
      fb.en,
      fb.ko,
      settingsOpts,
    );
    /** 시트 행이 아직 번역 안 됐으면(현재 언어 칸 == 영어 칸) 코드 기본값을 우선함 */
    if (fromSettingsSheet && locale !== "en") {
      const enFromSettingsSheet = pickLocaleFromSheetRows(
        settingsSheetRows,
        "en",
        fb.en,
        fb.ko,
        settingsOpts,
      );
      if (fromSettingsSheet === enFromSettingsSheet && fb[locale]) {
        return fb[locale];
      }
    }
    if (fromSettingsSheet) return fromSettingsSheet;
  }

  const opts = TEXT_SHEET_PICK[key];
  const fromSheet = pickLocaleFromSheetRows(
    sheetRows,
    locale,
    fb.en,
    fb.ko,
    opts,
  );
  if (fromSheet) return fromSheet;

  const s = fb[locale];
  if (s) return s;
  return fb.en;
}
