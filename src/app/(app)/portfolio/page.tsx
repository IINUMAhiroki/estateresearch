import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { TransactionForm } from "./transaction-form";

export default async function PortfolioPage() {
  const supabase = await createClient();

  const [{ data: reits }, { data: holdings }, { data: transactions }] =
    await Promise.all([
      supabase.from("reits").select("id, name, securities_code").order("name"),
      supabase.from("my_reit_holdings").select("*").order("reit_name"),
      supabase
        .from("portfolio_transactions")
        .select(
          "id, transaction_type, quantity_units, price_per_unit_yen, transaction_date, source, reits ( name, securities_code )",
        )
        .order("transaction_date", { ascending: false }),
    ]);

  const openHoldings = holdings?.filter((h) => h.status === "open") ?? [];
  const closedHoldings = holdings?.filter((h) => h.status === "closed") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">
            保有REIT（マイポートフォリオ）
          </h1>
          <p className="text-sm text-muted-foreground">
            自分が保有するREIT銘柄を記録する（総平均法による概算値。税務上の正式な数値ではありません）。
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/portfolio/import">CSVインポート</Link>
        </Button>
      </div>

      <TransactionForm reits={reits ?? []} />

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          保有中
        </h2>
        <ul className="space-y-2">
          {openHoldings.map((h) => (
            <li key={h.reit_id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">
                  {h.reit_name}（{h.securities_code}）
                </span>
                <span className="text-sm text-muted-foreground">
                  {h.net_quantity_units?.toLocaleString()}口 ・ 平均取得単価{" "}
                  {h.average_acquisition_price_yen?.toLocaleString()}円
                </span>
              </div>
            </li>
          ))}
          {openHoldings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              保有中の銘柄はありません。
            </p>
          )}
        </ul>
      </section>

      {closedHoldings.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            売却済み履歴
          </h2>
          <ul className="space-y-2">
            {closedHoldings.map((h) => (
              <li
                key={h.reit_id}
                className="rounded-lg border p-4 text-muted-foreground"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    {h.reit_name}（{h.securities_code}）
                  </span>
                  <span className="text-sm">
                    累計 {h.total_bought_quantity_units?.toLocaleString()}口取得
                    / 全売却済み
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          取引履歴
        </h2>
        <ul className="divide-y rounded-lg border">
          {transactions?.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 p-4 text-sm"
            >
              <span>
                {t.transaction_date} ・ {t.reits?.name}（
                {t.reits?.securities_code}） ・{" "}
                {t.transaction_type === "buy" ? "買付" : "売却"}{" "}
                {t.quantity_units.toLocaleString()}口 @{" "}
                {t.price_per_unit_yen.toLocaleString()}円
              </span>
              <DeleteTransactionButton id={t.id} />
            </li>
          ))}
          {(!transactions || transactions.length === 0) && (
            <li className="p-4 text-center text-muted-foreground">
              取引履歴がありません。
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
