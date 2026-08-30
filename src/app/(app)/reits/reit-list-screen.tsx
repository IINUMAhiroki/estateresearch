"use client";

import { useMemo, useState } from "react";
import { applyReitListFilter } from "@/lib/reit-list/apply-filter";
import {
  EMPTY_REIT_LIST_FILTER_CRITERIA,
  type ReitListFilterCriteria,
} from "@/lib/validations/reit-list-filters";
import {
  ReitListFilterBar,
  type SavedReitListFilter,
} from "./reit-list-filter-bar";
import { type ReitListRow, ReitListTable } from "./reit-list-table";

function findDefaultFilter(
  savedFilters: SavedReitListFilter[],
): SavedReitListFilter | undefined {
  return savedFilters.find((f) => f.is_default);
}

export function ReitListScreen({
  reits,
  savedFilters,
}: {
  reits: ReitListRow[];
  savedFilters: SavedReitListFilter[];
}) {
  const defaultFilter = findDefaultFilter(savedFilters);

  const [sortKey, setSortKey] = useState<keyof ReitListRow>(
    (defaultFilter?.sort_key as keyof ReitListRow) ?? "nav_multiple",
  );
  const [sortDesc, setSortDesc] = useState(defaultFilter?.sort_desc ?? true);
  const [criteria, setCriteria] = useState<ReitListFilterCriteria>(
    (defaultFilter?.filter as ReitListFilterCriteria | undefined) ??
      EMPTY_REIT_LIST_FILTER_CRITERIA,
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = applyReitListFilter(reits, criteria);
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const diff = Number(av) - Number(bv);
      return sortDesc ? -diff : diff;
    });
  }, [reits, criteria, sortKey, sortDesc]);

  function toggleSort(key: keyof ReitListRow) {
    if (key === sortKey) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  function applySavedFilter(filter: SavedReitListFilter) {
    setSortKey(filter.sort_key as keyof ReitListRow);
    setSortDesc(filter.sort_desc);
    setCriteria(
      (filter.filter as ReitListFilterCriteria | undefined) ??
        EMPTY_REIT_LIST_FILTER_CRITERIA,
    );
  }

  return (
    <div className="space-y-4">
      <ReitListFilterBar
        criteria={criteria}
        onCriteriaChange={setCriteria}
        sortKey={sortKey}
        sortDesc={sortDesc}
        savedFilters={savedFilters}
        onApplySavedFilter={applySavedFilter}
      />
      <ReitListTable
        reits={filteredAndSorted}
        sortKey={sortKey}
        sortDesc={sortDesc}
        onToggleSort={toggleSort}
      />
    </div>
  );
}
