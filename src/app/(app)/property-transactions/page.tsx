import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "./filter-bar";

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

type TransactionRow = {
  kind: "acquisition" | "disposition";
  date: string;
  propertyName: string;
  propertyAddress: string;
  useType: string;
  regionName: string | null;
  reitName: string | undefined;
  reitCode: string | undefined;
  priceYen: number | null;
  extra: string | null;
};

export default async function PropertyTransactionsPage({
  searchParams,
}: PageProps<"/property-transactions">) {
  const params = await searchParams;
  const dateFrom = first(params.dateFrom);
  const dateTo = first(params.dateTo);
  const regionId = first(params.regionId);
  const useType = first(params.useType);
  const reitId = first(params.reitId);

  const supabase = await createClient();

  const [{ data: regions }, { data: reits }] = await Promise.all([
    supabase.from("regions").select("id, name").order("sort_order"),
    supabase.from("reits").select("id, name, securities_code").order("name"),
  ]);

  let acquisitionsQuery = supabase.from("acquisitions").select(
    `acquisition_date, acquisition_price_yen, acquisition_cap_rate,
       properties!inner ( name, address, use_type, region_id, regions ( name ) ),
       reits ( name, securities_code )`,
  );
  let dispositionsQuery = supabase.from("dispositions").select(
    `disposition_date, disposition_price_yen, gain_loss_yen,
       properties!inner ( name, address, use_type, region_id, regions ( name ) ),
       reits ( name, securities_code )`,
  );

  if (dateFrom) {
    acquisitionsQuery = acquisitionsQuery.gte("acquisition_date", dateFrom);
    dispositionsQuery = dispositionsQuery.gte("disposition_date", dateFrom);
  }
  if (dateTo) {
    acquisitionsQuery = acquisitionsQuery.lte("acquisition_date", dateTo);
    dispositionsQuery = dispositionsQuery.lte("disposition_date", dateTo);
  }
  if (useType) {
    acquisitionsQuery = acquisitionsQuery.eq("properties.use_type", useType);
    dispositionsQuery = dispositionsQuery.eq("properties.use_type", useType);
  }
  if (regionId) {
    acquisitionsQuery = acquisitionsQuery.eq("properties.region_id", regionId);
    dispositionsQuery = dispositionsQuery.eq("properties.region_id", regionId);
  }
  if (reitId) {
    acquisitionsQuery = acquisitionsQuery.eq("reit_id", reitId);
    dispositionsQuery = dispositionsQuery.eq("reit_id", reitId);
  }

  const [{ data: acquisitions }, { data: dispositions }] = await Promise.all([
    acquisitionsQuery,
    dispositionsQuery,
  ]);

  const rows: TransactionRow[] = [
    ...(acquisitions ?? []).map((a) => ({
      kind: "acquisition" as const,
      date: a.acquisition_date,
      propertyName: a.properties.name,
      propertyAddress: a.properties.address,
      useType: a.properties.use_type,
      regionName: a.properties.regions?.name ?? null,
      reitName: a.reits?.name,
      reitCode: a.reits?.securities_code,
      priceYen: a.acquisition_price_yen,
      extra: a.acquisition_cap_rate ? `CR ${a.acquisition_cap_rate}%` : null,
    })),
    ...(dispositions ?? []).map((d) => ({
      kind: "disposition" as const,
      date: d.disposition_date,
      propertyName: d.properties.name,
      propertyAddress: d.properties.address,
      useType: d.properties.use_type,
      regionName: d.properties.regions?.name ?? null,
      reitName: d.reits?.name,
      reitCode: d.reits?.securities_code,
      priceYen: d.disposition_price_yen,
      extra:
        d.gain_loss_yen != null
          ? `差益 ${d.gain_loss_yen.toLocaleString()}円`
          : null,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">取得・売却実績</h1>
        <p className="text-sm text-muted-foreground">
          J-REITによる物件の取得・売却実績（読み取り専用）。
        </p>
      </div>

      <FilterBar regions={regions ?? []} reits={reits ?? []} />

      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={`${row.kind}-${row.reitCode}-${row.propertyName}-${row.date}`}
            className="rounded-lg border p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-medium">{row.propertyName}</h2>
              <span className="text-xs text-muted-foreground">
                {USE_TYPE_LABELS[row.useType] ?? row.useType}
                {row.regionName && ` ・ ${row.regionName}`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {row.propertyAddress}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t pt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {row.reitName}（{row.reitCode}）
                {row.kind === "acquisition" ? "が取得" : "が売却"}
              </span>
              {row.priceYen != null && (
                <span>{row.priceYen.toLocaleString()}円</span>
              )}
              {row.extra && <span>{row.extra}</span>}
              <span>{row.date}</span>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            該当する実績がありません。
          </p>
        )}
      </ul>
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
