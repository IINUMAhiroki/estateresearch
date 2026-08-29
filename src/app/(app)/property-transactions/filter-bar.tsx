"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const USE_TYPE_OPTIONS = [
  { value: "residential", label: "住居" },
  { value: "office", label: "オフィス" },
  { value: "retail", label: "商業施設" },
  { value: "logistics", label: "物流施設" },
  { value: "hotel", label: "ホテル" },
  { value: "healthcare", label: "ヘルスケア" },
  { value: "land", label: "底地" },
  { value: "other", label: "その他" },
];

type FilterBarProps = {
  regions: { id: string; name: string }[];
  reits: { id: string; name: string; securities_code: string }[];
};

export function FilterBar({ regions, reits }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <label htmlFor="dateFrom" className="flex flex-col gap-1 text-sm">
        期間（開始）
        <Input
          id="dateFrom"
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => updateParam("dateFrom", e.target.value)}
          className="w-40"
        />
      </label>
      <label htmlFor="dateTo" className="flex flex-col gap-1 text-sm">
        期間（終了）
        <Input
          id="dateTo"
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(e) => updateParam("dateTo", e.target.value)}
          className="w-40"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        地域
        <select
          className="h-9 w-40 rounded-md border border-input bg-transparent px-2.5 text-sm"
          defaultValue={searchParams.get("regionId") ?? ""}
          onChange={(e) => updateParam("regionId", e.target.value)}
        >
          <option value="">すべて</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        用途
        <select
          className="h-9 w-32 rounded-md border border-input bg-transparent px-2.5 text-sm"
          defaultValue={searchParams.get("useType") ?? ""}
          onChange={(e) => updateParam("useType", e.target.value)}
        >
          <option value="">すべて</option>
          {USE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        REIT銘柄
        <select
          className="h-9 w-56 rounded-md border border-input bg-transparent px-2.5 text-sm"
          defaultValue={searchParams.get("reitId") ?? ""}
          onChange={(e) => updateParam("reitId", e.target.value)}
        >
          <option value="">すべて</option>
          {reits.map((reit) => (
            <option key={reit.id} value={reit.id}>
              {reit.name}（{reit.securities_code}）
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
