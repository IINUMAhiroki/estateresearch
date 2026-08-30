/**
 * Pure normalization helpers for the fudosandb.jp data sync. Kept dependency
 * free and side-effect free so they can be unit tested with plain strings.
 */

const FULLWIDTH_ALNUM_OFFSET = 0xfee0;

/** Full-width alphanumerics -> half-width (fudosandb mixes both). */
export function toHalfWidthAlnum(value: string): string {
  return value.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - FULLWIDTH_ALNUM_OFFSET),
  );
}

/** Converts a fudosandb 百万円(million yen) numeric value to whole yen. */
export function millionYenToYen(
  value: number | null | undefined,
): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 1_000_000);
}

/**
 * Parses a strict "YYYY年M月D日" date string to ISO "YYYY-MM-DD". Returns
 * null for anything else (compound strings like
 * "（土地）2016年12月22日（建物）2025年2月20日" are deliberately rejected —
 * we can't safely pick one date, so the row is left unmatched for manual
 * review rather than guessing).
 */
export function parseJapaneseFullDate(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const normalized = toHalfWidthAlnum(value).trim();
  const match = normalized.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const mm = month.padStart(2, "0");
  const dd = day.padStart(2, "0");
  const iso = `${year}-${mm}-${dd}`;

  // Guard against out-of-range month/day that would silently roll over in Date.
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

/** Extracts a 4-digit year from strings like "2008年4月" (used for built_year). */
export function extractYear(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = toHalfWidthAlnum(value).match(/(\d{4})年/);
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 1800 && year <= 2200 ? year : null;
}

export type PropertyUseType =
  | "residential"
  | "office"
  | "retail"
  | "logistics"
  | "hotel"
  | "healthcare"
  | "land"
  | "other";

// Order matters: checked top-to-bottom, first keyword match wins. Compound
// labels like "事務所・店舗" are common in the source data; office is
// prioritized over retail when both appear together as a pragmatic default.
const USE_TYPE_KEYWORDS: [RegExp, PropertyUseType][] = [
  [/住居|住宅|レジデンス/, "residential"],
  [/ホテル|旅館/, "hotel"],
  [/物流|倉庫/, "logistics"],
  [/医療|介護|ヘルスケア/, "healthcare"],
  [/底地|土地/, "land"],
  [/事務所|オフィス/, "office"],
  [/店舗|商業/, "retail"],
];

export function mapUseTypeLabel(
  label: string | null | undefined,
): PropertyUseType {
  if (!label) return "other";
  for (const [pattern, useType] of USE_TYPE_KEYWORDS) {
    if (pattern.test(label)) return useType;
  }
  return "other";
}

/** Collapses whitespace and normalizes width for name/address matching. */
export function normalizeForMatching(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const normalized = toHalfWidthAlnum(value).replace(/\s+/g, "").trim();
  return normalized.length > 0 ? normalized : null;
}
