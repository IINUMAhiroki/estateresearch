import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";
import { fetchAllPages } from "../lib/fudosandb-client";
import type { FudosandbAcquisitionRow } from "../lib/fudosandb-types";
import { stableRecordId } from "../lib/hash";
import { matchOrCreateProperty } from "../lib/match-property";
import {
  mapUseTypeLabel,
  millionYenToYen,
  parseJapaneseFullDate,
} from "../lib/normalize";

export type SyncSummary = {
  fetched: number;
  written: number;
  unmatched: number;
};

/**
 * Note: fudosandb.jp doesn't expose an ownership percentage for 准共有
 * (quasi co-ownership) cases, so every row written here defaults to a
 * full 100% stake — this mirrors the same limitation already documented
 * for the (never-built) japan-reit.com HTML scraper plan.
 */
export async function syncAcquisitions(
  supabase: SupabaseClient<Database>,
  apiKey: string,
  sourceId: string,
): Promise<SyncSummary> {
  const rows = await fetchAllPages<"acquisitions", FudosandbAcquisitionRow>(
    "/reit/acquisitions",
    "acquisitions",
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
      row.acquisition_date,
      "acquisition",
    ]);

    const reitId = row.edinet_code
      ? reitIdByEdinetCode.get(row.edinet_code)
      : undefined;
    const acquisitionDate = parseJapaneseFullDate(row.acquisition_date);
    const useType = mapUseTypeLabel(row.use_type);

    let matchStatus: "auto_matched" | "unmatched" = "unmatched";
    let matchedPropertyId: string | null = null;
    let matchedAcquisitionId: string | null = null;

    if (reitId && acquisitionDate) {
      const match = await matchOrCreateProperty(supabase, {
        propertyName: row.property_name,
        location: row.location,
        useTypeLabel: row.use_type,
        useType,
        yearBuiltLabel: row.year_built,
      });

      if (match.status === "auto_matched") {
        const { data: acquisition, error } = await supabase
          .from("acquisitions")
          .upsert(
            {
              property_id: match.propertyId,
              reit_id: reitId,
              acquisition_date: acquisitionDate,
              acquisition_price_yen: millionYenToYen(
                row.acquisition_million_yen,
              ),
              acquisition_cap_rate: row.acquisition_noi_cap_rate_pct,
              ownership_ratio: 100,
              seller: row.seller,
              source_id: sourceId,
            },
            { onConflict: "property_id,reit_id,acquisition_date" },
          )
          .select("id")
          .single();

        if (!error && acquisition) {
          matchStatus = "auto_matched";
          matchedPropertyId = match.propertyId;
          matchedAcquisitionId = acquisition.id;
          written += 1;
        }
      }
    }

    if (matchStatus === "unmatched") unmatched += 1;

    await supabase.from("raw_transactions").insert({
      source_id: sourceId,
      source_record_id: sourceRecordId,
      transaction_type: "acquisition",
      raw_reit_name: row.reit_name,
      raw_property_name: row.property_name,
      raw_address: row.location,
      raw_use_type: row.use_type,
      raw_date: acquisitionDate,
      raw_price_yen: millionYenToYen(row.acquisition_million_yen),
      raw_cap_rate: row.acquisition_noi_cap_rate_pct,
      raw_payload:
        row as unknown as Database["public"]["Tables"]["raw_transactions"]["Insert"]["raw_payload"],
      matched_reit_id: reitId ?? null,
      matched_property_id: matchedPropertyId,
      matched_acquisition_id: matchedAcquisitionId,
      match_status: matchStatus,
      match_confidence: matchStatus === "auto_matched" ? 0.9 : null,
      matched_at:
        matchStatus === "auto_matched" ? new Date().toISOString() : null,
    });
  }

  return { fetched: rows.length, written, unmatched };
}
