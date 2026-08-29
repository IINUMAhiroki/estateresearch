import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";
import { fetchAllPages } from "../lib/fudosandb-client";
import type { FudosandbSaleRow } from "../lib/fudosandb-types";
import { stableRecordId } from "../lib/hash";
import { matchOrCreateProperty } from "../lib/match-property";
import {
  mapUseTypeLabel,
  millionYenToYen,
  parseJapaneseFullDate,
} from "../lib/normalize";
import type { SyncSummary } from "./sync-acquisitions";

export async function syncSales(
  supabase: SupabaseClient<Database>,
  apiKey: string,
  sourceId: string,
): Promise<SyncSummary> {
  const rows = await fetchAllPages<"sales", FudosandbSaleRow>(
    "/reit/sales",
    "sales",
    apiKey,
  );

  const { data: reits } = await supabase
    .from("reits")
    .select("id, edinet_code");
  const reitIdByEdinetCode = new Map(
    (reits ?? [])
      .filter((r) => r.edinet_code)
      .map((r) => [r.edinet_code as string, r.id]),
  );

  let written = 0;
  let unmatched = 0;

  for (const row of rows) {
    const sourceRecordId = stableRecordId([
      row.edinet_code,
      row.property_name,
      row.sale_date,
      "disposition",
    ]);

    const reitId = row.edinet_code
      ? reitIdByEdinetCode.get(row.edinet_code)
      : undefined;
    const saleDate = parseJapaneseFullDate(row.sale_date);
    const useType = mapUseTypeLabel(row.use_type);

    let matchStatus: "auto_matched" | "unmatched" = "unmatched";
    let matchedPropertyId: string | null = null;
    let matchedDispositionId: string | null = null;

    if (reitId && saleDate) {
      const match = await matchOrCreateProperty(supabase, {
        propertyName: row.property_name,
        location: row.location,
        useTypeLabel: row.use_type,
        useType,
        yearBuiltLabel: null,
      });

      if (match.status === "auto_matched") {
        const { data: disposition, error } = await supabase
          .from("dispositions")
          .upsert(
            {
              property_id: match.propertyId,
              reit_id: reitId,
              disposition_date: saleDate,
              disposition_price_yen: millionYenToYen(
                row.sale_price_million_yen,
              ),
              gain_loss_yen: millionYenToYen(row.gain_loss_million_yen),
              ownership_ratio: 100,
              buyer: row.buyer,
              source_id: sourceId,
            },
            { onConflict: "property_id,reit_id,disposition_date" },
          )
          .select("id")
          .single();

        if (!error && disposition) {
          matchStatus = "auto_matched";
          matchedPropertyId = match.propertyId;
          matchedDispositionId = disposition.id;
          written += 1;
        }
      }
    }

    if (matchStatus === "unmatched") unmatched += 1;

    await supabase.from("raw_transactions").insert({
      source_id: sourceId,
      source_record_id: sourceRecordId,
      transaction_type: "disposition",
      raw_reit_name: row.reit_name,
      raw_property_name: row.property_name,
      raw_address: row.location,
      raw_use_type: row.use_type,
      raw_date: saleDate,
      raw_price_yen: millionYenToYen(row.sale_price_million_yen),
      raw_gain_loss_yen: millionYenToYen(row.gain_loss_million_yen),
      raw_payload:
        row as unknown as Database["public"]["Tables"]["raw_transactions"]["Insert"]["raw_payload"],
      matched_reit_id: reitId ?? null,
      matched_property_id: matchedPropertyId,
      matched_disposition_id: matchedDispositionId,
      match_status: matchStatus,
      match_confidence: matchStatus === "auto_matched" ? 0.9 : null,
      matched_at:
        matchStatus === "auto_matched" ? new Date().toISOString() : null,
    });
  }

  return { fetched: rows.length, written, unmatched };
}
