import { readFileSync } from "node:fs";
import path from "node:path";

export type ReitCodeEntry = {
  edinetCode: string;
  securitiesCode: string;
  name: string;
};

const DEFAULT_CSV_PATH = path.join(
  import.meta.dirname,
  "..",
  "data",
  "reit-fund-codes.csv",
);

/**
 * Loads the committed REIT edinet_code<->securities_code snapshot (see
 * scripts/sync/refresh-fund-codes.ts for how it's produced/refreshed).
 */
export function loadReitCodeMap(
  csvPath = DEFAULT_CSV_PATH,
): Map<string, ReitCodeEntry> {
  const text = readFileSync(csvPath, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const map = new Map<string, ReitCodeEntry>();

  for (const line of lines.slice(1)) {
    const match = line.match(/^([^,]+),([^,]+),"?([^"]*)"?$/);
    if (!match) continue;
    const [, edinetCode, securitiesCode, name] = match;
    map.set(edinetCode, { edinetCode, securitiesCode, name });
  }

  return map;
}
