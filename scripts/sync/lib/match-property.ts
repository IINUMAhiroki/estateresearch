import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";
import {
  extractYear,
  normalizeForMatching,
  type PropertyUseType,
} from "./normalize";

type Supabase = SupabaseClient<Database>;

export type MatchResult =
  | { status: "auto_matched"; propertyId: string }
  | { status: "unmatched" };

/**
 * Resolves a fudosandb property reference to a canonical `properties` row:
 * exact match on normalized name+address if one already exists (via the
 * indexed normalized_name/normalized_address columns), otherwise creates a
 * new row when we have enough to satisfy the NOT NULL columns (name,
 * address, use_type). Ambiguous cases (missing name/address, or a use_type
 * label we can't map) are left unmatched for manual review rather than
 * guessing — see raw_transactions.match_status.
 */
export async function matchOrCreateProperty(
  supabase: Supabase,
  input: {
    propertyName: string | null;
    location: string | null;
    useTypeLabel: string | null;
    useType: PropertyUseType;
    yearBuiltLabel: string | null;
  },
): Promise<MatchResult> {
  const normalizedName = normalizeForMatching(input.propertyName);
  const normalizedAddress = normalizeForMatching(input.location);

  if (!normalizedName || !normalizedAddress) {
    return { status: "unmatched" };
  }
  if (input.useType === "other" && input.useTypeLabel) {
    // A use_type label we couldn't map is a sign the row needs a human look
    // before we invent a new property row for it.
    return { status: "unmatched" };
  }

  const { data: existing } = await supabase
    .from("properties")
    .select("id")
    .eq("normalized_name", normalizedName)
    .eq("normalized_address", normalizedAddress)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { status: "auto_matched", propertyId: existing.id };
  }

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      name: input.propertyName ?? normalizedName,
      address: input.location ?? normalizedAddress,
      normalized_name: normalizedName,
      normalized_address: normalizedAddress,
      use_type: input.useType,
      built_year: extractYear(input.yearBuiltLabel),
    })
    .select("id")
    .single();

  if (error || !created) {
    return { status: "unmatched" };
  }
  return { status: "auto_matched", propertyId: created.id };
}
