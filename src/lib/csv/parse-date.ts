const FULLWIDTH_OFFSET = 0xfee0;

function toHalfWidth(value: string): string {
  return value.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - FULLWIDTH_OFFSET),
  );
}

/**
 * Parses common Japanese brokerage date formats to ISO "YYYY-MM-DD":
 * "2026/01/15", "2026-01-15", "2026年1月15日". Returns null for anything
 * else rather than guessing.
 */
export function parseFlexibleDate(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const normalized = toHalfWidth(value).trim();

  const slashOrDash = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  const japanese = normalized.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  const match = slashOrDash ?? japanese;
  if (!match) return null;

  const [, year, month, day] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : iso;
}
