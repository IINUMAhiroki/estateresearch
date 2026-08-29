import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ReitsPage() {
  const supabase = await createClient();
  const { data: reits } = await supabase
    .from("reits")
    .select(
      "id, securities_code, name, sponsor, asset_manager, primary_use_type",
    )
    .order("securities_code");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">REIT銘柄</h1>
        <p className="text-sm text-muted-foreground">
          上場J-REIT一覧（読み取り専用）。
        </p>
      </div>

      <ul className="divide-y rounded-lg border">
        {reits?.map((reit) => (
          <li key={reit.id}>
            <Link
              href={`/reits/${reit.securities_code}`}
              className="flex flex-wrap items-baseline justify-between gap-2 p-4 hover:bg-muted"
            >
              <span className="font-medium">
                {reit.name}（{reit.securities_code}）
              </span>
              <span className="text-sm text-muted-foreground">
                {reit.primary_use_type ?? reit.sponsor}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
