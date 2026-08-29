import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const USE_TYPE_LABELS: Record<string, string> = {
  residential: "住居",
  office: "オフィス",
  retail: "商業施設",
  logistics: "物流施設",
  hotel: "ホテル",
  healthcare: "ヘルスケア",
  land: "底地",
  other: "その他",
};

export default async function ReitDetailPage({
  params,
}: PageProps<"/reits/[code]">) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: reit } = await supabase
    .from("reits")
    .select("*")
    .eq("securities_code", code)
    .maybeSingle();

  if (!reit) {
    notFound();
  }

  const [
    { data: snapshot },
    { data: metrics },
    { data: distributions },
    { data: holdings },
  ] = await Promise.all([
    supabase
      .from("reit_market_snapshots")
      .select("*")
      .eq("reit_id", reit.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reit_portfolio_metrics")
      .select("*")
      .eq("reit_id", reit.id)
      .order("fiscal_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reit_distributions")
      .select("*")
      .eq("reit_id", reit.id)
      .order("fiscal_period_end", { ascending: false }),
    supabase
      .from("property_holdings")
      .select("property_id, net_ownership_ratio")
      .eq("reit_id", reit.id),
  ]);

  // property_holdings is a view with no FK metadata, so PostgREST cannot
  // auto-embed `properties` through it — fetch separately and zip in JS.
  const propertyIds = (holdings ?? [])
    .map((h) => h.property_id)
    .filter((id): id is string => id != null);
  const { data: properties } =
    propertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("id, name, address, use_type, regions ( name )")
          .in("id", propertyIds)
      : { data: [] };
  const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {reit.name}（{reit.securities_code}）
        </h1>
        <p className="text-sm text-muted-foreground">
          {reit.sponsor && `スポンサー: ${reit.sponsor}`}
          {reit.asset_manager && ` ・ 運用会社: ${reit.asset_manager}`}
          {reit.primary_use_type && ` ・ ${reit.primary_use_type}`}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            市場指標（{snapshot?.snapshot_date ?? "データなし"}）
          </h2>
          {snapshot ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">投資口価格</dt>
              <dd>{snapshot.unit_price_yen?.toLocaleString()}円</dd>
              <dt className="text-muted-foreground">分配金利回り</dt>
              <dd>{snapshot.distribution_yield_pct}%</dd>
              <dt className="text-muted-foreground">NAV倍率</dt>
              <dd>{snapshot.nav_multiple}</dd>
              <dt className="text-muted-foreground">時価総額</dt>
              <dd>{snapshot.market_cap_yen?.toLocaleString()}円</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">データなし</p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            財務指標（{metrics?.fiscal_period_end ?? "データなし"}）
          </h2>
          {metrics ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">資産規模</dt>
              <dd>{metrics.asset_size_yen?.toLocaleString()}円</dd>
              <dt className="text-muted-foreground">保有棟数</dt>
              <dd>{metrics.property_count}棟</dd>
              <dt className="text-muted-foreground">NOI利回り</dt>
              <dd>{metrics.noi_yield_pct}%</dd>
              <dt className="text-muted-foreground">ROE</dt>
              <dd>{metrics.roe_pct}%</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">データなし</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          分配金予実
        </h2>
        <ul className="space-y-1 rounded-lg border p-4 text-sm">
          {distributions?.map((d) => (
            <li key={d.id} className="flex justify-between">
              <span>
                {d.fiscal_period_end}（{d.is_forecast ? "予想" : "実績"}）
              </span>
              <span>{d.distribution_per_unit_yen.toLocaleString()}円/口</span>
            </li>
          ))}
          {(!distributions || distributions.length === 0) && (
            <li className="text-muted-foreground">データなし</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          保有物件
        </h2>
        <ul className="space-y-2">
          {holdings?.map((h) => {
            const property = h.property_id
              ? propertyById.get(h.property_id)
              : undefined;
            if (!property) return null;
            return (
              <li key={h.property_id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{property.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {USE_TYPE_LABELS[property.use_type] ?? property.use_type}
                    {property.regions?.name && ` ・ ${property.regions.name}`}
                    {` ・ ${h.net_ownership_ratio}%保有`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {property.address}
                </p>
              </li>
            );
          })}
          {(!holdings || holdings.length === 0) && (
            <p className="text-sm text-muted-foreground">保有物件なし</p>
          )}
        </ul>
      </section>
    </div>
  );
}
