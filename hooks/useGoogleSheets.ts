import {
  APP_LOCALE_KEYS,
  type AppLocaleKey,
} from "@/constants/language";
import { fetchText } from "@/utils/ApiClient";
import Papa from "papaparse";
import { useCallback, useEffect, useState } from "react";

export const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4uzvVy0xudw8AviSG0o-JsE5IiuBdpYt4tAAxDXFSK9l0i2To3cZ2pBqCDc3AoRoeENUW_QC5s4_d/pub?gid=0&single=true&output=csv";

/**
 * "Settings (2)" 시트. B~H열 순서가 `APP_LOCALE_KEYS`와 다르게 영어가 B열부터 시작하ㅂ니다.
 * @see SETTINGS_SHEET_LOCALE_ORDER
 */
export const SETTINGS_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5To4DMk6Jv889Y09eFtHdUdwa0cNIE4JKWpxfK6NTl8KfgJ4hNvxusbMvoaQp1aAUQLcAnv0hwOMw/pub?gid=0&single=true&output=csv";

/** (English, 한국어, 日本語, 简体中文, 繁體中文, Français, Español) */
export const SETTINGS_SHEET_LOCALE_ORDER: readonly AppLocaleKey[] = [
  "en",
  "ko",
  "ja",
  "zhSC",
  "zhTC",
  "fr",
  "es",
];

export type SheetLocaleKey = AppLocaleKey;

/** 실제 값 추출 시작하는 인덱스 */
const COL_B_INDEX = 1;

export type GoogleSheetLocaleRow = {
  /**
   * 게시 CSV에서의 **시트 행 번호**와 동일(첫 줄 = 1행).
   * 빈 줄도 번호를 차지하므로, 파서는 CSV 원본 줄 순서로 부여한다.
   */
  sheetRow: number;
  /** A열. 비어 있으면 `row-{sheetRow}` */
  rowKey: string;
  /** B~F 열 문자열 (시트 헤더 텍스트와 무관한 고정 키). */
  locales: Record<SheetLocaleKey, string>;
};

export type GoogleSheetParseResult = {
  /** A1 (버전·일자 등) */
  sheetVersion: string;
  /** B1:{마지막 로케일 열}1에 표시된 헤더 라벨 원문 (`APP_LOCALE_KEYS` 개수만큼) */
  headerLabelsB1F: readonly string[];
  rows: GoogleSheetLocaleRow[];
};

function trimCell(value: unknown): string {
  return String(value ?? "").trim();
}

function localesFromB2F(
  cells: string[],
  localeOrder: readonly AppLocaleKey[],
): Record<SheetLocaleKey, string> {
  const locales = {} as Record<SheetLocaleKey, string>;
  for (let k = 0; k < localeOrder.length; k++) {
    const key = localeOrder[k];
    locales[key] = cells[COL_B_INDEX + k] ?? "";
  }
  return locales;
}

function hasAnyB2F(locales: Record<SheetLocaleKey, string>): boolean {
  return Object.values(locales).some((v) => v !== "");
}

function parsePublishedSheetCsv(
  csvText: string,
  localeOrder: readonly AppLocaleKey[],
): GoogleSheetParseResult {
  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    /** 줄 번호를 스프레드시트 행과 맞추려면 빈 줄도 유지 */
    skipEmptyLines: false,
  });
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }

  const rawRows = parsed.data as string[][];
  if (rawRows.length === 0) {
    return {
      sheetVersion: "",
      headerLabelsB1F: new Array(localeOrder.length).fill(""),
      rows: [],
    };
  }
  /**해더 행 추출 */
  const headerLine = (rawRows[0] ?? []).map(trimCell);
  const sheetVersion = headerLine[0] ?? "";
  const headerLabelsB1F = Array.from(
    { length: localeOrder.length },
    (_, k) => headerLine[COL_B_INDEX + k] ?? "",
  );

  const rows: GoogleSheetLocaleRow[] = [];

  /** i+1번째 행의 key 와 값들 추출 */
  for (let i = 1; i < rawRows.length; i++) {
    const sheetRow = i + 1;
    const cells = (rawRows[i] ?? []).map(trimCell);
    const rowKeyRaw = cells[0] ?? "";
    const rowKey = rowKeyRaw !== "" ? rowKeyRaw : `row-${sheetRow}`;

    const locales = localesFromB2F(cells, localeOrder);
    if (!hasAnyB2F(locales)) continue;

    rows.push({ sheetRow, rowKey, locales });
  }

  return { sheetVersion, headerLabelsB1F, rows };
}

export type UseGoogleSheetsResult = {
  data: GoogleSheetParseResult | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * **B2:F** 구간만 사용(B=한국어, C=영어, D=일본어, E=번체, F=간체
 */
export function useGoogleSheets(
  csvUrl: string = GOOGLE_SHEET_CSV_URL,
  localeOrder: readonly AppLocaleKey[] = APP_LOCALE_KEYS,
): UseGoogleSheetsResult {
  const [data, setData] = useState<GoogleSheetParseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (opts?: { bustCache?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      let url = csvUrl;
      if (opts?.bustCache) {
        const sep = csvUrl.includes("?") ? "&" : "?";
        url = `${csvUrl}${sep}_=${Date.now()}`;
      }
      const csvText = await fetchText(url);
      setData(parsePublishedSheetCsv(csvText, localeOrder));
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setData(null);
      if (__DEV__) console.error("Google Sheet CSV 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [csvUrl, localeOrder]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(() => load({ bustCache: true }), [load]);

  return { data, loading, error, refetch };
}
