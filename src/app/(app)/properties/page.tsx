import { createClient } from "@/lib/supabase/server";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, address, prefecture, price_yen, built_year")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">物件マスタ</h1>
        <p className="text-sm text-muted-foreground">
          全ユーザー共通の公開データ（読み取り専用）。
        </p>
      </div>

      <ul className="space-y-3">
        {properties?.map((property) => (
          <li key={property.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{property.name}</h2>
            <p className="text-sm text-muted-foreground">{property.address}</p>
            <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
              {property.price_yen && (
                <span>{property.price_yen.toLocaleString()} 円</span>
              )}
              {property.built_year && <span>築年: {property.built_year}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
