import { RateLimitExhaustedError } from "./lib/fudosandb-client";
import {
  createSyncClient,
  requireFudosandbApiKey,
} from "./lib/supabase-client";
import { syncAcquisitions } from "./stages/sync-acquisitions";
import { syncReits } from "./stages/sync-reits";
import { syncSales } from "./stages/sync-sales";

async function ensureFudosandbSource(
  supabase: ReturnType<typeof createSyncClient>,
) {
  const { data, error } = await supabase
    .from("sources")
    .upsert(
      {
        code: "fudosandb",
        name: "fudosandb.jp",
        base_url: "https://fudosandb.jp",
      },
      { onConflict: "code" },
    )
    .select("id")
    .single();
  if (error || !data)
    throw error ?? new Error("failed to upsert fudosandb source");
  return data.id;
}

async function main() {
  const supabase = createSyncClient();
  const apiKey = requireFudosandbApiKey();

  console.log("=== syncReits (from local EDINET snapshot, no API cost) ===");
  const reitsResult = await syncReits(supabase);
  console.log(`reits upserted: ${reitsResult.upserted}`);

  const sourceId = await ensureFudosandbSource(supabase);

  const stages: [
    string,
    () => Promise<{ fetched: number; written: number; unmatched: number }>,
  ][] = [
    ["syncAcquisitions", () => syncAcquisitions(supabase, apiKey, sourceId)],
    ["syncSales", () => syncSales(supabase, apiKey, sourceId)],
  ];

  for (const [name, run] of stages) {
    console.log(`=== ${name} ===`);
    try {
      const result = await run();
      console.log(
        `${name}: fetched=${result.fetched} written=${result.written} unmatched=${result.unmatched}`,
      );
    } catch (err) {
      if (err instanceof RateLimitExhaustedError) {
        console.warn(
          `${name}: rate limit reached, stopping here for today (${err.message})`,
        );
        break;
      }
      console.error(`${name} failed:`, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
