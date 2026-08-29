import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "./filter-bar";

export default async function DistributionsPage({
  searchParams,
}: PageProps<"/distributions">) {
  const params = await searchParams;
  const reitId = first(params.reitId);
  const isForecast = first(params.isForecast);

  const supabase = await createClient();

  const [{ data: reits }, distributionsResult] = await Promise.all([
    supabase.from("reits").select("id, name, securities_code").order("name"),
    (() => {
      let query = supabase
        .from("reit_distributions")
        .select(
          "id, fiscal_period_end, distribution_per_unit_yen, is_forecast, reits ( name, securities_code )",
        )
        .order("fiscal_period_end", { ascending: false });
      if (reitId) query = query.eq("reit_id", reitId);
      if (isForecast) query = query.eq("is_forecast", isForecast === "true");
      return query;
    })(),
  ]);

  const distributions = distributionsResult.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">分配金予実</h1>
        <p className="text-sm text-muted-foreground">
          決算期ごとの1口当たり分配金（実績・予想）。
        </p>
      </div>

      <FilterBar reits={reits ?? []} />

      <ul className="divide-y rounded-lg border">
        {distributions?.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between p-4 text-sm"
          >
            <span>
              {d.reits?.name}（{d.reits?.securities_code}） ・{" "}
              {d.fiscal_period_end}
              {" ・ "}
              <span
                className={
                  d.is_forecast ? "text-muted-foreground" : "font-medium"
                }
              >
                {d.is_forecast ? "予想" : "実績"}
              </span>
            </span>
            <span className="font-medium">
              {d.distribution_per_unit_yen.toLocaleString()}円/口
            </span>
          </li>
        ))}
        {(!distributions || distributions.length === 0) && (
          <li className="p-4 text-center text-muted-foreground">
            データがありません
          </li>
        )}
      </ul>
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
