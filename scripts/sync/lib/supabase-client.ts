import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";

/**
 * Standalone service-role client for sync scripts. Deliberately independent
 * of src/lib/supabase/admin.ts: this script runs outside the Next.js app
 * (via GitHub Actions + tsx), not as part of the Vercel deployment, so it
 * reads env vars directly rather than depending on Next.js-specific tooling
 * or the `@/` path alias.
 */
export function createSyncClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false },
  });
}

export function requireFudosandbApiKey(): string {
  const key = process.env.FUDOSANDB_API_KEY;
  if (!key) throw new Error("FUDOSANDB_API_KEY must be set");
  return key;
}
