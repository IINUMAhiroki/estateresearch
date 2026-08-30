"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  reitListFilterIdSchema,
  saveReitListFilterSchema,
} from "@/lib/validations/reit-list-filters";

export async function saveReitListFilter(formData: FormData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { error: "入力内容を確認してください" };
  }

  let parsed: z.infer<typeof saveReitListFilterSchema>;
  try {
    parsed = saveReitListFilterSchema.parse(JSON.parse(raw));
  } catch {
    return { error: "入力内容を確認してください" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }

  // owner_id is never taken from the client — the column defaults to
  // auth.uid() and RLS enforces it regardless of what's sent here.
  const { error } = await supabase.from("reit_list_filters").insert({
    name: parsed.name,
    sort_key: parsed.sortKey,
    sort_desc: parsed.sortDesc,
    filter: parsed.filter,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "その名前のフィルターは既に保存されています" };
    }
    return { error: error.message };
  }

  revalidatePath("/reits");
  return { error: null };
}

export async function deleteReitListFilter(formData: FormData) {
  const parsed = reitListFilterIdSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { error: "invalid id" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reit_list_filters")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reits");
  return { error: null };
}

export async function setDefaultReitListFilter(formData: FormData) {
  const parsed = reitListFilterIdSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { error: "invalid id" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_default_reit_list_filter", {
    target_id: parsed.data.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reits");
  return { error: null };
}
