"use client";

import { useRouter, useSearchParams } from "next/navigation";

type FilterBarProps = {
  reits: { id: string; name: string; securities_code: string }[];
};

export function FilterBar({ reits }: FilterBarProps) {
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
      <label htmlFor="reitId" className="flex flex-col gap-1 text-sm">
        REIT銘柄
        <select
          id="reitId"
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
      <label htmlFor="isForecast" className="flex flex-col gap-1 text-sm">
        実績/予想
        <select
          id="isForecast"
          className="h-9 w-32 rounded-md border border-input bg-transparent px-2.5 text-sm"
          defaultValue={searchParams.get("isForecast") ?? ""}
          onChange={(e) => updateParam("isForecast", e.target.value)}
        >
          <option value="">すべて</option>
          <option value="false">実績</option>
          <option value="true">予想</option>
        </select>
      </label>
    </div>
  );
}
