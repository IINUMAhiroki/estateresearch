import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles both the OAuth/magic-link `code` exchange and the older
 * `token_hash` verification flow used by password-recovery/signup emails.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Only ever redirect within this app — never trust an absolute URL from
  // the query string (open-redirect prevention).
  const rawNext = searchParams.get("next") ?? "/property-transactions";
  const next = rawNext.startsWith("/") ? rawNext : "/property-transactions";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "signup" | "recovery" | "invite" | "magiclink",
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
