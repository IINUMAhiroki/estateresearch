import { createClient } from "@/lib/supabase/server";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(
      `id, current_price_yen, current_status, management_fee_yen,
       units ( floor_number, floor_area_sqm, layout, direction,
         buildings ( name, address, built_year, structure ) )`,
    )
    .eq("current_status", "published")
    .order("current_price_yen");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">物件マスタ</h1>
        <p className="text-sm text-muted-foreground">
          全ユーザー共通の公開データ（読み取り専用）。掲載中の物件のみ表示。
        </p>
      </div>

      <ul className="space-y-3">
        {listings?.map((listing) => {
          const unit = listing.units;
          const building = unit?.buildings;
          return (
            <li key={listing.id} className="rounded-lg border p-4">
              <h2 className="font-medium">{building?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {building?.address}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {listing.current_price_yen && (
                  <span>{listing.current_price_yen.toLocaleString()} 円</span>
                )}
                {unit?.layout && <span>{unit.layout}</span>}
                {unit?.floor_area_sqm && <span>{unit.floor_area_sqm}㎡</span>}
                {unit?.floor_number && <span>{unit.floor_number}階</span>}
                {building?.built_year && (
                  <span>築年: {building.built_year}</span>
                )}
              </div>
            </li>
          );
        })}
        {listings?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            掲載中の物件がありません。
          </p>
        )}
      </ul>
    </div>
  );
}
