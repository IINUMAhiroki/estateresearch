import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";
import { loadReitCodeMap } from "../lib/edinet-codes";

/**
 * Upserts every known J-REIT from the local EDINET fund-code snapshot into
 * `reits`. This doesn't need fudosandb.jp at all — the snapshot already has
 * the full universe of J-REITs with their securities_code/edinet_code/name,
 * so seeding the reits master this way costs zero API quota.
 */
export async function syncReits(
  supabase: SupabaseClient<Database>,
): Promise<{ upserted: number }> {
  const codeMap = loadReitCodeMap();
  const rows = [...codeMap.values()].map((entry) => ({
    edinet_code: entry.edinetCode,
    securities_code: entry.securitiesCode,
    name: entry.name,
  }));

  const { error } = await supabase
    .from("reits")
    .upsert(rows, { onConflict: "edinet_code" });
  if (error) throw error;

  return { upserted: rows.length };
}
