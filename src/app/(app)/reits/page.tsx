import { createClient } from "@/lib/supabase/server";
import { ReitListScreen } from "./reit-list-screen";

export default async function ReitsPage() {
  const supabase = await createClient();
  const [{ data: reits }, { data: savedFilters }] = await Promise.all([
    supabase.from("reit_rankings").select("*"),
    supabase
      .from("reit_list_filters")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">REIT銘柄</h1>
        <p className="text-sm text-muted-foreground">
          上場J-REIT一覧（58銘柄）。列見出しをクリックで並べ替え。
        </p>
      </div>

      <ReitListScreen reits={reits ?? []} savedFilters={savedFilters ?? []} />
    </div>
  );
}
