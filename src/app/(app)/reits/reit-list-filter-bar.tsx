"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/supabase/database.types";
import {
  EMPTY_REIT_LIST_FILTER_CRITERIA,
  type ReitListFilterCriteria,
} from "@/lib/validations/reit-list-filters";
import {
  deleteReitListFilter,
  saveReitListFilter,
  setDefaultReitListFilter,
} from "./actions";
import type { ReitListRow } from "./reit-list-table";

export type SavedReitListFilter =
  Database["public"]["Tables"]["reit_list_filters"]["Row"];

const MAX_SAVED_FILTERS = 5;

export function ReitListFilterBar({
  criteria,
  onCriteriaChange,
  sortKey,
  sortDesc,
  savedFilters,
  onApplySavedFilter,
}: {
  criteria: ReitListFilterCriteria;
  onCriteriaChange: (next: ReitListFilterCriteria) => void;
  sortKey: keyof ReitListRow;
  sortDesc: boolean;
  savedFilters: SavedReitListFilter[];
  onApplySavedFilter: (filter: SavedReitListFilter) => void;
}) {
  const [saveName, setSaveName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof ReitListFilterCriteria>(
    key: K,
    value: ReitListFilterCriteria[K],
  ) {
    onCriteriaChange({ ...criteria, [key]: value });
  }

  function handleSave() {
    setError(null);
    const formData = new FormData();
    formData.set(
      "payload",
      JSON.stringify({
        name: saveName,
        sortKey,
        sortDesc,
        filter: criteria,
      }),
    );
    startTransition(async () => {
      const res = await saveReitListFilter(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSaveName("");
      }
    });
  }

  function handleDelete(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      await deleteReitListFilter(formData);
    });
  }

  function handleSetDefault(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      await setDefaultReitListFilter(formData);
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="reit-filter-query">銘柄名・証券コード</Label>
          <Input
            id="reit-filter-query"
            value={criteria.query}
            onChange={(e) => update("query", e.target.value)}
            placeholder="検索..."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="reit-filter-min-yield">分配金利回り(%) 以上</Label>
          <Input
            id="reit-filter-min-yield"
            type="number"
            step="0.1"
            value={criteria.minDistributionYieldPct ?? ""}
            onChange={(e) =>
              update(
                "minDistributionYieldPct",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="reit-filter-max-nav">NAV倍率 以下</Label>
          <Input
            id="reit-filter-max-nav"
            type="number"
            step="0.01"
            value={criteria.maxNavMultiple ?? ""}
            onChange={(e) =>
              update(
                "maxNavMultiple",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="reit-filter-min-cap">時価総額(円) 以上</Label>
          <Input
            id="reit-filter-min-cap"
            type="number"
            step="1"
            value={criteria.minMarketCapYen ?? ""}
            onChange={(e) =>
              update(
                "minMarketCapYen",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
      </div>

      {JSON.stringify(criteria) !==
        JSON.stringify(EMPTY_REIT_LIST_FILTER_CRITERIA) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onCriteriaChange(EMPTY_REIT_LIST_FILTER_CRITERIA)}
        >
          条件をクリア
        </Button>
      )}

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium text-muted-foreground">
          保存済みフィルター（{savedFilters.length}/{MAX_SAVED_FILTERS}）
        </p>
        <ul className="flex flex-wrap gap-2">
          {savedFilters.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
            >
              <button
                type="button"
                onClick={() => onApplySavedFilter(f)}
                className="hover:underline"
              >
                {f.name}
              </button>
              <button
                type="button"
                onClick={() => handleSetDefault(f.id)}
                title="デフォルトに設定"
                disabled={pending}
              >
                <Star
                  className={`size-3.5 ${f.is_default ? "fill-current" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                title="削除"
                disabled={pending}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </li>
          ))}
          {savedFilters.length === 0 && (
            <li className="text-sm text-muted-foreground">
              保存済みフィルターはありません
            </li>
          )}
        </ul>

        {savedFilters.length < MAX_SAVED_FILTERS && (
          <div className="flex items-center gap-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="現在の条件・並び順を名前をつけて保存"
              className="max-w-xs"
            />
            <Button
              type="button"
              size="sm"
              disabled={!saveName.trim() || pending}
              onClick={handleSave}
            >
              保存
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
