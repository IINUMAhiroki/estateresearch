import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { clientEnv, getServerOnlyEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS entirely — only import this from
 * server-only code that intentionally needs to act outside a user's
 * session (seeding, admin/batch jobs). Never expose it to a Server Action
 * that handles a regular user request.
 */
export function createAdminClient() {
  const { SUPABASE_SECRET_KEY } = getServerOnlyEnv();

  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    { auth: { persistSession: false } },
  );
}
