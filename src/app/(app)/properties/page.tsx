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

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select(
      `id, name, address, use_type, built_year,
       regions ( name ),
       acquisitions ( acquisition_date, acquisition_price_yen, acquisition_cap_rate, ownership_ratio,
         reits ( name, securities_code ) ),
       dispositions ( disposition_date, disposition_price_yen, gain_loss_yen, ownership_ratio,
         reits ( name, securities_code ) )`,
    )
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">物件マスタ</h1>
        <p className="text-sm text-muted-foreground">
          J-REITが取得・保有する物件のみを掲載（読み取り専用）。
        </p>
      </div>

      <ul className="space-y-3">
        {properties?.map((property) => (
          <li key={property.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-medium">{property.name}</h2>
              <span className="text-xs text-muted-foreground">
                {USE_TYPE_LABELS[property.use_type] ?? property.use_type}
                {property.regions?.name && ` ・ ${property.regions.name}`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{property.address}</p>
            {property.built_year && (
              <p className="text-xs text-muted-foreground">
                築年: {property.built_year}
              </p>
            )}
            <ul className="mt-2 space-y-1 border-t pt-2 text-sm">
              {property.acquisitions?.map((acquisition) => (
                <li
                  key={`${acquisition.reits?.securities_code}-${acquisition.acquisition_date}`}
                  className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {acquisition.reits?.name}（
                    {acquisition.reits?.securities_code}）
                  </span>
                  <span>{acquisition.ownership_ratio}%保有</span>
                  {acquisition.acquisition_price_yen && (
                    <span>
                      {acquisition.acquisition_price_yen.toLocaleString()}
                      円で取得
                    </span>
                  )}
                  {acquisition.acquisition_cap_rate && (
                    <span>CR {acquisition.acquisition_cap_rate}%</span>
                  )}
                  <span>{acquisition.acquisition_date}</span>
                </li>
              ))}
              {property.dispositions?.map((disposition) => (
                <li
                  key={`${disposition.reits?.securities_code}-${disposition.disposition_date}`}
                  className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {disposition.reits?.name}（
                    {disposition.reits?.securities_code}）が売却
                  </span>
                  {disposition.disposition_price_yen && (
                    <span>
                      {disposition.disposition_price_yen.toLocaleString()}
                      円で売却
                    </span>
                  )}
                  {disposition.gain_loss_yen != null && (
                    <span>
                      差益 {disposition.gain_loss_yen.toLocaleString()}円
                    </span>
                  )}
                  <span>{disposition.disposition_date}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {properties?.length === 0 && (
          <p className="text-sm text-muted-foreground">物件がありません。</p>
        )}
      </ul>
    </div>
  );
}
