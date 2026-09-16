import type { AppLocaleKey } from "@/constants/language";

type LocaleLike = {
  languageTag?: string | null;
  languageCode?: string | null;
  languageScriptCode?: string | null;
  scriptCode?: string | null;
  regionCode?: string | null;
};

function normalizeLocalePart(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export function deviceLocaleToAppLocale(locale: LocaleLike): AppLocaleKey {
  const tagParts = normalizeLocalePart(locale.languageTag)
    .replace(/_/g, "-")
    .split("-")
    .filter(Boolean);
  const tagSubtags = tagParts.slice(1);

  const code = normalizeLocalePart(
    locale.languageCode || tagParts[0],
  ).toLowerCase();
  const script = normalizeLocalePart(
    locale.languageScriptCode ||
      locale.scriptCode ||
      tagSubtags.find((part) => part.length === 4),
  ).toLowerCase();
  const region = normalizeLocalePart(
    locale.regionCode ||
      tagSubtags.find((part) => part.length === 2 || /^\d{3}$/.test(part)),
  ).toUpperCase();

  if (code === "zh" && script === "hant") return "zhTC";
  if (code === "zh" && script === "hans") return "zhSC";
  if (code === "zh" && script) return "en";
  if (code === "zh" && ["TW", "HK", "MO"].includes(region)) return "zhTC";
  if (code === "zh") return "zhSC";
  if (code === "ko") return "ko";
  if (code === "en") return "en";
  if (code === "ja") return "ja";
  if (code === "fr") return "fr";
  if (code === "es") return "es";
  return "en";
}
