"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/lib/supabase/database.types";

export type ReitListRow = Database["public"]["Views"]["reit_rankings"]["Row"];

export const COLUMNS: { key: keyof ReitListRow; label: string }[] = [
  { key: "unit_price_yen", label: "投資口価格" },
  { key: "unit_price_change_pct", label: "騰落率(%)" },
  { key: "distribution_yield_pct", label: "分配金利回り(%)" },
  { key: "nav_multiple", label: "NAV倍率" },
  { key: "market_cap_yen", label: "時価総額" },
  { key: "asset_size_yen", label: "資産規模" },
  { key: "noi_yield_pct", label: "NOI利回り(%)" },
  { key: "unrealized_gain_loss_pct", label: "含み損益率(%)" },
  { key: "roe_pct", label: "ROE(%)" },
  { key: "interest_bearing_debt_ratio_pct", label: "有利子負債比率(%)" },
];

export function ReitListTable({
  reits,
  sortKey,
  sortDesc,
  onToggleSort,
}: {
  reits: ReitListRow[];
  sortKey: keyof ReitListRow;
  sortDesc: boolean;
  onToggleSort: (key: keyof ReitListRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="whitespace-nowrap p-3 text-left font-medium">
              銘柄
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap p-3 text-right font-medium"
              >
                <button
                  type="button"
                  onClick={() => onToggleSort(col.key)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {col.label}
                  {sortKey === col.key &&
                    (sortDesc ? (
                      <ArrowDown className="size-3" />
                    ) : (
                      <ArrowUp className="size-3" />
                    ))}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reits.map((row) => (
            <tr
              key={row.reit_id}
              className="border-b last:border-0 hover:bg-muted/30"
            >
              <td className="whitespace-nowrap p-3">
                <Link
                  href={`/reits/${row.securities_code}`}
                  className="hover:underline"
                >
                  <span>
                    {row.name}（{row.securities_code}）
                  </span>
                  {(row.primary_use_type || row.sponsor) && (
                    <span className="block text-xs text-muted-foreground">
                      {row.primary_use_type ?? row.sponsor}
                    </span>
                  )}
                </Link>
              </td>
              {COLUMNS.map((col) => (
                <td key={col.key} className="whitespace-nowrap p-3 text-right">
                  {formatValue(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
          {reits.length === 0 && (
            <tr>
              <td
                colSpan={COLUMNS.length + 1}
                className="p-4 text-center text-muted-foreground"
              >
                データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}
