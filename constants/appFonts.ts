import { APP_LOCALE_KEYS, type AppLocaleKey } from "@/constants/language";
import { REMOTE_FONT_FACE_SETS, type RemoteFontId } from "@/constants/remoteFonts";

/** settings폰트키용 */
export type FontId =
  | "montserrat"
  | "poppins"
  | "inter"
  | "rubik_one"
  | "tektur"
  | "gowun_batang"
  | "hahmlet"
  | "gaegu"
  | "nanum_square_neo"
  | "noto_sans_kr"
  | "kaisei"
  | "ibm_plex_sans_jp"
  | "dela_gothic_one"
  | "mochiy_pop_one"
  | "line_seed_jp"
  | "noto_sans_tc"
  | "noto_sans_sc"
  | "zhengfeng_brush"
  | "yrdzst"
  | "noto_serif_sc"
  | "galmuri11"
  | "fusion_pixel_zh_hans"
  | "fusion_pixel_zh_hant"
  | "montserrat_medium"
  | "poppins_medium"
  | "syne"
  | "orbitron"
  | "roboto_slab"
  | "noto_serif_tc"
  | "chiron_goround_tc"
  | "lxgw_wenkai_tc"
  | "chiron_hei_hk"
  | "tsanger_shuyuan"
  | "arimo";

export interface RemoteFontMarker {
  remote: RemoteFontId;
  weight: "regular" | "bold";
}

export type FontAssetSource = number | RemoteFontMarker;

export interface FontFaceSet {
  regular: FontAssetSource;
  bold: FontAssetSource;
}

export interface FontDropdownItem {
  label: string;
  value: FontId;
}

export function isRemoteFontMarker(
  source: FontAssetSource,
): source is RemoteFontMarker {
  return typeof source === "object" && source !== null;
}

function fontFaceSet(regular: number, bold: number): FontFaceSet {
  return { regular, bold };
}

function singleFace(asset: number): FontFaceSet {
  return { regular: asset, bold: asset };
}

function remoteFace(remote: RemoteFontId): FontFaceSet {
  return {
    regular: { remote, weight: "regular" },
    bold: { remote, weight: "bold" },
  };
}

const montserrat = fontFaceSet(
  require("@/assets/fonts/Montserrat/static/Montserrat-Regular.ttf"),
  require("@/assets/fonts/Montserrat/static/Montserrat-Black.ttf"),
);
const poppins = fontFaceSet(
  require("@/assets/fonts/Poppins/Poppins-Regular.ttf"),
  require("@/assets/fonts/Poppins/Poppins-Black.ttf"),
);
const inter = fontFaceSet(
  require("@/assets/fonts/Inter/static/Inter_28pt-Regular.ttf"),
  require("@/assets/fonts/Inter/static/Inter_28pt-Bold.ttf"),
);
const rubikOne = fontFaceSet(
  require("@/assets/fonts/Rubik/Rubik_400Regular.ttf"),
  require("@/assets/fonts/Rubik/Rubik_700Bold.ttf"),
);
const montserratMedium = fontFaceSet(
  require("@/assets/fonts/Montserrat/static/Montserrat-Medium.ttf"),
  require("@/assets/fonts/Montserrat/static/Montserrat-Black.ttf"),
);
const poppinsMedium = fontFaceSet(
  require("@/assets/fonts/Poppins/Poppins-Medium.ttf"),
  require("@/assets/fonts/Poppins/Poppins-Black.ttf"),
);
const syne = fontFaceSet(
  require("@/assets/fonts/Syne/static/Syne-Medium.ttf"),
  require("@/assets/fonts/Syne/static/Syne-ExtraBold.ttf"),
);
const orbitron = fontFaceSet(
  require("@/assets/fonts/Orbitron/static/Orbitron-Regular.ttf"),
  require("@/assets/fonts/Orbitron/static/Orbitron-Black.ttf"),
);
const robotoSlab = fontFaceSet(
  require("@/assets/fonts/Roboto_Slab/static/RobotoSlab-Regular.ttf"),
  require("@/assets/fonts/Roboto_Slab/static/RobotoSlab-Black.ttf"),
);
const arimo = fontFaceSet(
  require("@/assets/fonts/Arimo/static/Arimo-Regular.ttf"),
  require("@/assets/fonts/Arimo/static/Arimo-Bold.ttf"),
);
const notoSerifTc = fontFaceSet(
  require("@/assets/fonts/Noto_Serif_TC/NotoSerifTC-Medium.ttf"),
  require("@/assets/fonts/Noto_Serif_TC/NotoSerifTC-Bold.ttf"),
);
const chironGoRoundTc = remoteFace("chiron_goround_tc");
const lxgwWenKaiTc = fontFaceSet(
  require("@/assets/fonts/LXGW_WenKai_TC/LXGWWenKaiTC-Regular.ttf"),
  require("@/assets/fonts/LXGW_WenKai_TC/LXGWWenKaiTC-Bold.ttf"),
);
const tsangerShuYuan = fontFaceSet(
  require("@/assets/fonts/仓耳舒圆体W02/CangErShuYuanTiW02-2.ttf"),
  require("@/assets/fonts/仓耳舒圆体W05.ttf"),
);
const tektur = fontFaceSet(
  require("@/assets/fonts/Tektur/static/Tektur-Regular.ttf"),
  require("@/assets/fonts/Tektur/static/Tektur-Bold.ttf"),
);
const gowunBatang = fontFaceSet(
  require("@/assets/fonts/Gowun_Batang/GowunBatang-Regular.ttf"),
  require("@/assets/fonts/Gowun_Batang/GowunBatang-Bold.ttf"),
);
const hahmlet = fontFaceSet(
  require("@/assets/fonts/Hahmlet/static/Hahmlet-Medium.ttf"),
  require("@/assets/fonts/Hahmlet/static/Hahmlet-Black.ttf"),
);
const gaegu = fontFaceSet(
  require("@/assets/fonts/Gaegu/Gaegu-Regular.ttf"),
  require("@/assets/fonts/Gaegu/Gaegu-Bold.ttf"),
);
const chironHeiHk = remoteFace("chiron_hei_hk");
const nanumSquareNeo = fontFaceSet(
  require("@/assets/fonts/nanum-square-neo/NanumSquareNeo-bRg.ttf"),
  require("@/assets/fonts/nanum-square-neo/TTF/NanumSquareNeo-eHv.ttf"),
);
const notoSansKr = fontFaceSet(
  require("@/assets/fonts/Noto_Sans_KR/static/NotoSansKR-Regular.ttf"),
  require("@/assets/fonts/Noto_Sans_KR/static/NotoSansKR-Bold.ttf"),
);
const kaisei = fontFaceSet(
  require("@/assets/fonts/Kaisei_Tokumin/KaiseiTokumin-Regular.ttf"),
  require("@/assets/fonts/Kaisei_Tokumin/KaiseiTokumin-ExtraBold.ttf"),
);
const ibmPlexSansJp = fontFaceSet(
  require("@/assets/fonts/IBM_Plex_Sans_JP/IBMPlexSansJP_300Light.ttf"),
  require("@/assets/fonts/IBM_Plex_Sans_JP/IBMPlexSansJP_700Bold.ttf"),
);
const delaGothicOne = fontFaceSet(
  require("@/assets/fonts/Zen_Kaku_Gothic_New/static/ZenKakuGothicNew-Regular.ttf"),
  require("@/assets/fonts/Zen_Kaku_Gothic_New/static/ZenKakuGothicNew-Bold.ttf"),
);
const mochiyPopOne = fontFaceSet(
  require("@/assets/fonts/M_PLUS_Rounded_1c/static/MPLUSRounded1c-Regular.ttf"),
  require("@/assets/fonts/M_PLUS_Rounded_1c/static/MPLUSRounded1c-Bold.ttf"),
);
const lineSeedJp = fontFaceSet(
  require("@/assets/fonts/LINE_Seed_JP/LINESeedJP_400Regular.ttf"),
  require("@/assets/fonts/LINE_Seed_JP/LINESeedJP_800ExtraBold.ttf"),
);
const notoSansTc = fontFaceSet(
  require("@/assets/fonts/Noto_Sans_TC/static/NotoSansTC-Regular.ttf"),
  require("@/assets/fonts/Noto_Sans_TC/static/NotoSansTC-Bold.ttf"),
);
const notoSansSc = fontFaceSet(
  require("@/assets/fonts/Noto_Sans_SC/static/NotoSansSC-Regular.ttf"),
  require("@/assets/fonts/Noto_Sans_SC/static/NotoSansSC-Bold.ttf"),
);
const zhengfengBrush = remoteFace("zhengfeng_brush");
const yrdzst = fontFaceSet(
  require("@/assets/fonts/YangRenDongZhuShiTi-Regular/YangRenDongZhuShiTi-Regular-2.ttf"),
  require("@/assets/fonts/YangRenDongZhuShiTi-Bold/YangRenDongZhuShiTi-Bold-2.ttf"),
);
const notoSerifSc = fontFaceSet(
  require("@/assets/fonts/Noto_Serif_SC/NotoSerifSC_400Regular.ttf"),
  require("@/assets/fonts/Noto_Serif_SC/NotoSerifSC_700Bold.ttf"),
);
const galmuri11 = singleFace(
  require("@/assets/fonts/galmuri11/Galmuri11.ttf"),
);
const fusionPixelZhHans = singleFace(
  require("@/assets/fonts/FusionPixel/FusionPixel-ZhHans.ttf"),
);
const fusionPixelZhHant = singleFace(
  require("@/assets/fonts/FusionPixel/FusionPixel-ZhHant.ttf"),
);

/** Galmuri픽셀폰트ID용 (ko/en/ja/fr/es) */
export const GALMURI11_FONT_ID = "galmuri11" as const satisfies FontId;

/** zhSC 픽셀폰트ID용 — Galmuri11과 동일한 12px 그리드(upm 1200) */
export const FUSION_PIXEL_ZH_HANS_FONT_ID =
  "fusion_pixel_zh_hans" as const satisfies FontId;

/** zhTC 픽셀폰트ID용 — Galmuri11과 동일한 12px 그리드(upm 1200) */
export const FUSION_PIXEL_ZH_HANT_FONT_ID =
  "fusion_pixel_zh_hant" as const satisfies FontId;

/** 폰트에셋맵용 */
export const APP_FONT_FACE_SETS: Record<FontId, FontFaceSet> = {
  montserrat,
  poppins,
  inter,
  rubik_one: rubikOne,
  tektur,
  montserrat_medium: montserratMedium,
  poppins_medium: poppinsMedium,
  syne,
  orbitron,
  roboto_slab: robotoSlab,
  gowun_batang: gowunBatang,
  hahmlet,
  gaegu,
  nanum_square_neo: nanumSquareNeo,
  noto_sans_kr: notoSansKr,
  kaisei,
  ibm_plex_sans_jp: ibmPlexSansJp,
  dela_gothic_one: delaGothicOne,
  mochiy_pop_one: mochiyPopOne,
  line_seed_jp: lineSeedJp,
  noto_sans_tc: notoSansTc,
  noto_sans_sc: notoSansSc,
  zhengfeng_brush: zhengfengBrush,
  yrdzst,
  noto_serif_sc: notoSerifSc,
  galmuri11,
  fusion_pixel_zh_hans: fusionPixelZhHans,
  fusion_pixel_zh_hant: fusionPixelZhHant,
  noto_serif_tc: notoSerifTc,
  chiron_goround_tc: chironGoRoundTc,
  lxgw_wenkai_tc: lxgwWenKaiTc,
  chiron_hei_hk: chironHeiHk,
  tsanger_shuyuan: tsangerShuYuan,
  arimo,
};

export const APP_FONT_ITEMS_BY_LOCALE: Record<AppLocaleKey, FontDropdownItem[]> =
  {
    en: [
      { label: "Montserrat", value: "montserrat" },
      { label: "Poppins", value: "poppins" },
      { label: "Inter", value: "inter" },
      { label: "Rubik", value: "rubik_one" },
      { label: "Tektur", value: "tektur" },
    ],
    ko: [
      { label: "Noto Sans KR", value: "noto_sans_kr" },
      { label: "Gowun Batang", value: "gowun_batang" },
      { label: "Hahmlet", value: "hahmlet" },
      { label: "Gaegu", value: "gaegu" },
      { label: "Nanum Square Neo", value: "nanum_square_neo" },
    ],
    ja: [
      { label: "LINE Seed JP", value: "line_seed_jp" },
      { label: "Kaisei", value: "kaisei" },
      { label: "IBM Plex Sans JP", value: "ibm_plex_sans_jp" },
      { label: "Zen Kaku Gothic New", value: "dela_gothic_one" },
      { label: "M PLUS Rounded 1c", value: "mochiy_pop_one" },
      
    ],
    zhTC: [
      { label: "Noto Sans TC", value: "noto_sans_tc" },
      { label: "Noto Serif TC", value: "noto_serif_tc" },
      { label: "Chiron GoRound TC", value: "chiron_goround_tc" },
      { label: "LXGW WenKai TC", value: "lxgw_wenkai_tc" },
      { label: "Chiron Hei HK", value: "chiron_hei_hk" },
    ],
    zhSC: [
      { label: "Noto Sans SC", value: "noto_sans_sc" },
      { label: "Noto Serif SC", value: "noto_serif_sc" },
      { label: "Zhengfeng Brush", value: "zhengfeng_brush" },
      { label: "YRDZST", value: "yrdzst" },
      { label: "Tsanger ShuYuan", value: "tsanger_shuyuan" },
    ],
    fr: [
      { label: "Montserrat", value: "montserrat_medium" },
      { label: "Syne", value: "syne" },
      { label: "Arimo", value: "arimo" },
      { label: "Roboto Slab", value: "roboto_slab" },
      { label: "Poppins", value: "poppins_medium" },
    ],
    es: [
      { label: "Montserrat", value: "montserrat_medium" },
      { label: "Syne", value: "syne" },
      { label: "Orbitron", value: "orbitron" },
      { label: "Roboto Slab", value: "roboto_slab" },
      { label: "Poppins", value: "poppins_medium" },
    ],
  };

const DEFAULT_FONT: FontId = "noto_sans_kr";

/** 삭제폰트매핑용 */
const LEGACY_FONT_IDS: Record<string, FontId> = {
  bebas_neue: "tektur",
  m_plus_1: "kaisei",
  zen_kaku_gothic_new: "ibm_plex_sans_jp",
  noto_sans_jp: "line_seed_jp",
  bit8_dot_font: "line_seed_jp",
  hanyi_xiangsu_9px_fan: "noto_sans_tc",
  enikusu_hg: "kaisei",
  dotted_songti_circle: "noto_sans_sc",
  dotted_songti_square: "noto_sans_sc",
  dotted_songti_diamond: "noto_sans_sc",
  aa_xiaogou_pixel: "noto_sans_sc",
  zcool_pixels: "noto_sans_sc",
  chango: "noto_sans_tc",
  zcool_xiaowei: "noto_sans_tc",
  ma_shan_zheng: "noto_sans_sc",
  kslocalbaseballpark: "noto_sans_kr",
  m_plus_rounded_1c: "noto_sans_sc",
  chen_yu_luo_yan: "noto_sans_tc",
  zcool_kuaile: "noto_sans_sc",
  m_plus_1p: "noto_sans_sc",
  ziti_guanjia_bodian: "noto_sans_sc",
  black_han_sans: "noto_sans_kr",
  do_hyeon: "hahmlet",
  jua: "gaegu",
  zcool_qingke_huangyou: "zhengfeng_brush",
  long_cang: "yrdzst",
  wdxl_lubrifont_sc: "tsanger_shuyuan",
};

export function normalizeFontId(
  value: string,
): FontId | null {
  if (isFontId(value)) return value;
  return LEGACY_FONT_IDS[value] ?? null;
}

/** 픽셀전용폰트용 */
export const FONTS_HIDDEN_FROM_PICKER = new Set<FontId>([
  "galmuri11",
  "fusion_pixel_zh_hans",
  "fusion_pixel_zh_hant",
]);

export function isFontHiddenFromPicker(
  appearanceFont: string,
): boolean {
  const id = normalizeFontId(appearanceFont);
  return id != null && FONTS_HIDDEN_FROM_PICKER.has(id);
}

/** Skia전용폰트용 */
const SKIA_ONLY_FONTS = new Set<FontId>([
  "galmuri11",
  "fusion_pixel_zh_hans",
  "fusion_pixel_zh_hant",
]);

function isSkiaOnlyFont(appearanceFont: string): boolean {
  const id = normalizeFontId(appearanceFont);
  return id != null && SKIA_ONLY_FONTS.has(id);
}

/** Bold미지원폰트용 */
const FONTS_WITHOUT_BOLD = new Set<FontId>([
  "galmuri11",
  "fusion_pixel_zh_hans",
  "fusion_pixel_zh_hant",
]);

export function supportsBold(appearanceFont: string): boolean {
  const id = normalizeFontId(appearanceFont);
  if (!id) return true;
  return !FONTS_WITHOUT_BOLD.has(id);
}

function isFontId(value: string): value is FontId {
  return Object.prototype.hasOwnProperty.call(APP_FONT_FACE_SETS, value);
}

export function getFontItemsForLocale(locale: AppLocaleKey): FontDropdownItem[] {
  return APP_FONT_ITEMS_BY_LOCALE[locale].filter(
    (item) => !FONTS_HIDDEN_FROM_PICKER.has(item.value),
  );
}

export function getDefaultForLocale(
  locale: AppLocaleKey,
): FontId {
  return APP_FONT_ITEMS_BY_LOCALE[locale][0]?.value ?? DEFAULT_FONT;
}

/** locale별 Pixel 그리드용 (Galmuri11과 동일한 12px 그리드) */
const PIXEL_FONT_ID_BY_LOCALE: Record<AppLocaleKey, FontId> = {
  ko: GALMURI11_FONT_ID,
  en: GALMURI11_FONT_ID,
  ja: GALMURI11_FONT_ID,
  fr: GALMURI11_FONT_ID,
  es: GALMURI11_FONT_ID,
  zhTC: FUSION_PIXEL_ZH_HANT_FONT_ID,
  zhSC: FUSION_PIXEL_ZH_HANS_FONT_ID,
};

/** Pixel 이펙트 활성 시 locale에 맞는 픽셀 폰트 반환 */
export function getPixelFontIdForLocale(locale: AppLocaleKey): FontId {
  return PIXEL_FONT_ID_BY_LOCALE[locale] ?? GALMURI11_FONT_ID;
}

const FONT_ID_TO_LOCALES: Partial<Record<FontId, Set<AppLocaleKey>>> = {};
(Object.keys(APP_FONT_ITEMS_BY_LOCALE) as AppLocaleKey[]).forEach((locale) => {
  APP_FONT_ITEMS_BY_LOCALE[locale].forEach((item) => {
    const set = FONT_ID_TO_LOCALES[item.value] ?? new Set<AppLocaleKey>();
    set.add(locale);
    FONT_ID_TO_LOCALES[item.value] = set;
  });
});

/**
 * 선택된 폰트가 주어진 locale 에 속하는지 판단.
 * 앱 UI 언어 와 무관하게, 폰트 자체 기준으로 판단해야 영어 UI에서 한글 폰트를 선택하는 경우에서도 글자별 fallback이 올바르게 동작함.
 * 일부 폰트(예: ZCOOL QingKe HuangYou)는 zhTC·zhSC 양쪽 목록에 모두 있으므로,
 * 단일 locale로 단정하지 않고 멤버십으로 판단함.
 */
export function fontBelongsToLocale(
  appearanceFont: string,
  locale: AppLocaleKey,
): boolean {
  const id = normalizeFontId(appearanceFont);
  if (!id) return false;
  return FONT_ID_TO_LOCALES[id]?.has(locale) ?? false;
}

export function resolveFontFaceSet(appearanceFont: string): FontFaceSet {
  const id = normalizeFontId(appearanceFont);
  if (id) {
    return APP_FONT_FACE_SETS[id];
  }
  return APP_FONT_FACE_SETS[DEFAULT_FONT];
}

/** RNfontFamily키용 */
export function appFontFamilyForText(
  appearanceFont: string,
  fontWeight: "normal" | "bold",
  locale?: AppLocaleKey,
): string {
  if (locale && isSkiaOnlyFont(appearanceFont)) {
    return appFontFamilyForText(
      getDefaultForLocale(locale),
      fontWeight,
    );
  }
  const id = normalizeFontId(appearanceFont) ?? appearanceFont;
  const base = `AppFont-${id}`;
  return fontWeight === "bold" ? `${base}-bold` : base;
}

function buildFontAssetsForIds(ids: FontId[]): Record<string, number> {
  const out: Record<string, number> = {};
  ids.forEach((id) => {
    if (SKIA_ONLY_FONTS.has(id)) return;
    const set = APP_FONT_FACE_SETS[id];
    if (!isRemoteFontMarker(set.regular)) {
      out[appFontFamilyForText(id, "normal")] = set.regular;
    }
    if (!isRemoteFontMarker(set.bold)) {
      out[appFontFamilyForText(id, "bold")] = set.bold;
    }
  });
  return out;
}

export function getEagerFontIdsForLocale(locale: AppLocaleKey): FontId[] {
  return APP_FONT_ITEMS_BY_LOCALE[locale].map((item) => item.value);
}

/** 부트 시점에 즉시 로드할 폰트*/
export function buildEagerFontAssets(
  locale: AppLocaleKey,
): Record<string, number> {
  return buildFontAssetsForIds(getEagerFontIdsForLocale(locale));
}

function dedupeFontIds(ids: FontId[]): FontId[] {
  return Array.from(new Set(ids));
}

/** id 목록 RN 폰트 asset 매핑 */
export function buildFontAssets(ids: FontId[]): Record<string, number> {
  return buildFontAssetsForIds(dedupeFontIds(ids));
}

/** 주어진 id들을 제외한 나머지 전체 폰트 asset 매핑 */
export function buildRemainingFontAssets(
  excludeIds: FontId[],
): Record<string, number> {
  const exclude = new Set(excludeIds);
  const remainingIds = (Object.keys(APP_FONT_FACE_SETS) as FontId[]).filter(
    (id) => !exclude.has(id) && !SKIA_ONLY_FONTS.has(id),
  );
  return buildFontAssetsForIds(remainingIds);
}

/** 모든 locale의 default 폰트 id */
export function getAllDefaultFontIds(): FontId[] {
  return dedupeFontIds(APP_LOCALE_KEYS.map(getDefaultForLocale));
}

/** fontByLocale 맵에 저장된 폰트 id들 */
export function getFontIdsInLocaleMap(
  map: Partial<Record<AppLocaleKey, string>> | undefined | null,
): FontId[] {
  if (!map) return [];
  const ids = Object.values(map)
    .filter((value): value is string => !!value)
    .map((value) => normalizeFontId(value))
    .filter((id): id is FontId => id != null);
  return dedupeFontIds(ids);
}

export function getFontAssetIds(ids: FontId[]): number[] {
  const assets: number[] = [];
  ids.forEach((id) => {
    const set = APP_FONT_FACE_SETS[id];
    if (!isRemoteFontMarker(set.regular)) assets.push(set.regular);
    if (!isRemoteFontMarker(set.bold)) assets.push(set.bold);
  });
  return assets;
}

export function getRemoteFontIdsForIds(ids: FontId[]): RemoteFontId[] {
  const out = new Set<RemoteFontId>();
  ids.forEach((id) => {
    const set = APP_FONT_FACE_SETS[id];
    if (isRemoteFontMarker(set.regular)) out.add(set.regular.remote);
    if (isRemoteFontMarker(set.bold)) out.add(set.bold.remote);
  });
  return Array.from(out);
}

export function getSkiaFontAssets(locale: AppLocaleKey): number[] {
  return getFontAssetIds(getEagerFontIdsForLocale(locale));
}

export const APP_THEME_FONT_FAMILY = "AppTheme";
export const APP_THEME_FONT_FAMILY_BOLD = "AppTheme-Bold";

export const APP_THEME_FONT_ASSETS: Record<string, number> = {
  [APP_THEME_FONT_FAMILY]: require("../assets/fonts/Tektur/static/Tektur-Regular.ttf"),
  [APP_THEME_FONT_FAMILY_BOLD]: require("../assets/fonts/Tektur/static/Tektur-Bold.ttf"),
};

export const uiThemeFontStyle = { fontFamily: APP_THEME_FONT_FAMILY } as const;
