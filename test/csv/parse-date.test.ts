import { describe, expect, it } from "vitest";
import { parseFlexibleDate } from "@/lib/csv/parse-date";

describe("parseFlexibleDate", () => {
  it("parses slash-separated dates", () => {
    expect(parseFlexibleDate("2026/01/15")).toBe("2026-01-15");
  });

  it("parses dash-separated dates", () => {
    expect(parseFlexibleDate("2026-1-5")).toBe("2026-01-05");
  });

  it("parses Japanese-style dates", () => {
    expect(parseFlexibleDate("2026年1月15日")).toBe("2026-01-15");
  });

  it("handles full-width digits", () => {
    expect(parseFlexibleDate("２０２６/０１/１５")).toBe("2026-01-15");
  });

  it("returns null for unrecognized formats", () => {
    expect(parseFlexibleDate("不明")).toBeNull();
    expect(parseFlexibleDate(null)).toBeNull();
  });
});
