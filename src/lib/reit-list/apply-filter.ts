import type { ReitListFilterCriteria } from "@/lib/validations/reit-list-filters";

type FilterableReit = {
  name: string | null;
  securities_code: string | null;
  distribution_yield_pct: number | null;
  nav_multiple: number | null;
  market_cap_yen: number | null;
};

/** Client-side filtering over the already-fetched reit_rankings rows. */
export function applyReitListFilter<T extends FilterableReit>(
  rows: T[],
  criteria: ReitListFilterCriteria,
): T[] {
  const query = criteria.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (query) {
      const haystack =
        `${row.name ?? ""} ${row.securities_code ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (
      criteria.minDistributionYieldPct != null &&
      (row.distribution_yield_pct ?? -Infinity) <
        criteria.minDistributionYieldPct
    ) {
      return false;
    }
    if (
      criteria.maxNavMultiple != null &&
      (row.nav_multiple ?? Infinity) > criteria.maxNavMultiple
    ) {
      return false;
    }
    if (
      criteria.minMarketCapYen != null &&
      (row.market_cap_yen ?? -Infinity) < criteria.minMarketCapYen
    ) {
      return false;
    }
    return true;
  });
}
