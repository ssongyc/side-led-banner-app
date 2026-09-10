import { WEB_AD_DIAGNOSTICS } from "@/ads/webAdDiagnostics.web";
const messages: Record<string, string> = {
 ko: "웹에서는 광고를 지원하지 않습니다.", en: "Ads are not supported on web.", ja: "ウェブでは広告に対応していません。",
 zhTC: "網頁版不支援廣告。", zhSC: "网页版不支持广告。", fr: "Les publicités ne sont pas prises en charge sur le Web.", es: "Los anuncios no están disponibles en la web.",
};
export function adUnavailableReason(locale: string): string | null { return WEB_AD_DIAGNOSTICS ? null : messages[locale]; }
export function shouldTrackAdInteraction() { return false; }
