import { createHash } from "node:crypto";

/** Deterministic id for a scraped row, used as raw_transactions.source_record_id. */
export function stableRecordId(parts: (string | null | undefined)[]): string {
  const input = parts.map((p) => p ?? "").join("|");
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}
