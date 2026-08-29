import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clientEnv } from "@/lib/env";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — session refresh is handled by
            // proxy.ts instead, so this can be safely ignored here.
          }
        },
      },
    },
  );
}
