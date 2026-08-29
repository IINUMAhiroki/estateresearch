import { createClient } from "@/lib/supabase/server";
import { RankingTable } from "./ranking-table";

export default async function RankingsPage() {
  const supabase = await createClient();
  const { data: rankings } = await supabase.from("reit_rankings").select("*");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ランキング</h1>
        <p className="text-sm text-muted-foreground">
          各銘柄の最新指標で並べ替え（列見出しをクリックでソート）。
        </p>
      </div>

      <RankingTable rankings={rankings ?? []} />
    </div>
  );
}
