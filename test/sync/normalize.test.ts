import { describe, expect, it } from "vitest";
import {
  extractYear,
  mapUseTypeLabel,
  millionYenToYen,
  normalizeForMatching,
  parseJapaneseFullDate,
  toHalfWidthAlnum,
} from "../../scripts/sync/lib/normalize";

describe("toHalfWidthAlnum", () => {
  it("converts full-width digits and letters to half-width", () => {
    expect(toHalfWidthAlnum("２０１８年")).toBe("2018年");
    expect(toHalfWidthAlnum("ＡＢＣ")).toBe("ABC");
  });
});

describe("millionYenToYen", () => {
  it("converts million-yen values to whole yen", () => {
    expect(millionYenToYen(3152)).toBe(3_152_000_000);
    expect(millionYenToYen(6060.5)).toBe(6_060_500_000);
  });

  it("returns null for null/undefined/NaN", () => {
    expect(millionYenToYen(null)).toBeNull();
    expect(millionYenToYen(undefined)).toBeNull();
    expect(millionYenToYen(Number.NaN)).toBeNull();
  });
});

describe("parseJapaneseFullDate", () => {
  it("parses a clean YYYY年M月D日 string", () => {
    expect(parseJapaneseFullDate("2018年9月10日")).toBe("2018-09-10");
  });

  it("handles full-width digits", () => {
    expect(parseJapaneseFullDate("２０１８年９月１０日")).toBe("2018-09-10");
  });

  it("returns null for compound multi-date strings", () => {
    expect(
      parseJapaneseFullDate(
        "（土地）2016年12月22日（建物（本再開発物件）2025年2月20日",
      ),
    ).toBeNull();
  });

  it("returns null for year-month-only strings", () => {
    expect(parseJapaneseFullDate("2008年4月")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(parseJapaneseFullDate(null)).toBeNull();
    expect(parseJapaneseFullDate(undefined)).toBeNull();
  });
});

describe("extractYear", () => {
  it("extracts the year from a year-month string", () => {
    expect(extractYear("2008年4月")).toBe(2008);
  });

  it("extracts the year from a full date string", () => {
    expect(extractYear("2018年9月10日")).toBe(2018);
  });

  it("returns null when no year pattern is found", () => {
    expect(extractYear("不明")).toBeNull();
    expect(extractYear(null)).toBeNull();
  });
});

describe("mapUseTypeLabel", () => {
  it("maps single-keyword labels", () => {
    expect(mapUseTypeLabel("住居")).toBe("residential");
    expect(mapUseTypeLabel("物流施設")).toBe("logistics");
    expect(mapUseTypeLabel("ホテル")).toBe("hotel");
  });

  it("prioritizes office over retail in compound labels", () => {
    expect(mapUseTypeLabel("事務所・店舗")).toBe("office");
  });

  it("falls back to other for unknown or missing labels", () => {
    expect(mapUseTypeLabel("その他不明用途")).toBe("other");
    expect(mapUseTypeLabel(null)).toBe("other");
  });
});

describe("normalizeForMatching", () => {
  it("strips whitespace and normalizes width", () => {
    expect(normalizeForMatching(" サンプル　ビル ２０１ ")).toBe(
      "サンプルビル201",
    );
  });

  it("returns null for empty/whitespace-only input", () => {
    expect(normalizeForMatching("   ")).toBeNull();
    expect(normalizeForMatching(null)).toBeNull();
  });
});
