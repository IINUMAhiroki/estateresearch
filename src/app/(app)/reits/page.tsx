import { createClient } from "@/lib/supabase/server";
import { ReitListTable } from "./reit-list-table";

export default async function ReitsPage() {
  const supabase = await createClient();
  const { data: reits } = await supabase.from("reit_rankings").select("*");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">REIT銘柄</h1>
        <p className="text-sm text-muted-foreground">
          上場J-REIT一覧（58銘柄）。列見出しをクリックで並べ替え。
        </p>
      </div>

      <ReitListTable reits={reits ?? []} />
    </div>
  );
}
