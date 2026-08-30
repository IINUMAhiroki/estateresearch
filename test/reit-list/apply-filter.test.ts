import { describe, expect, it } from "vitest";
import { applyReitListFilter } from "@/lib/reit-list/apply-filter";
import { EMPTY_REIT_LIST_FILTER_CRITERIA } from "@/lib/validations/reit-list-filters";

const REITS = [
  {
    name: "アドバンス・レジデンス投資法人",
    securities_code: "3269",
    distribution_yield_pct: 4.2,
    nav_multiple: 1.1,
    market_cap_yen: 500_000_000_000,
  },
  {
    name: "ジャパン・ホテル・リート投資法人",
    securities_code: "8985",
    distribution_yield_pct: 3.5,
    nav_multiple: 0.9,
    market_cap_yen: 200_000_000_000,
  },
  {
    name: "インヴィンシブル投資法人",
    securities_code: "8963",
    distribution_yield_pct: null,
    nav_multiple: null,
    market_cap_yen: null,
  },
];

describe("applyReitListFilter", () => {
  it("returns all rows when no criteria are set", () => {
    expect(applyReitListFilter(REITS, EMPTY_REIT_LIST_FILTER_CRITERIA)).toEqual(
      REITS,
    );
  });

  it("matches query against name or securities code, case-insensitively", () => {
    const byCode = applyReitListFilter(REITS, {
      ...EMPTY_REIT_LIST_FILTER_CRITERIA,
      query: "8985",
    });
    expect(byCode.map((r) => r.securities_code)).toEqual(["8985"]);

    const byName = applyReitListFilter(REITS, {
      ...EMPTY_REIT_LIST_FILTER_CRITERIA,
      query: "ホテル",
    });
    expect(byName.map((r) => r.securities_code)).toEqual(["8985"]);
  });

  it("excludes rows with null metrics when a numeric threshold is set", () => {
    const result = applyReitListFilter(REITS, {
      ...EMPTY_REIT_LIST_FILTER_CRITERIA,
      minDistributionYieldPct: 4,
    });
    expect(result.map((r) => r.securities_code)).toEqual(["3269"]);
  });

  it("applies maxNavMultiple as an inclusive upper bound", () => {
    const result = applyReitListFilter(REITS, {
      ...EMPTY_REIT_LIST_FILTER_CRITERIA,
      maxNavMultiple: 0.9,
    });
    expect(result.map((r) => r.securities_code)).toEqual(["8985"]);
  });

  it("combines multiple criteria with AND semantics", () => {
    const result = applyReitListFilter(REITS, {
      ...EMPTY_REIT_LIST_FILTER_CRITERIA,
      minDistributionYieldPct: 3,
      minMarketCapYen: 300_000_000_000,
    });
    expect(result.map((r) => r.securities_code)).toEqual(["3269"]);
  });
});
