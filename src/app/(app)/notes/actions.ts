"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNoteSchema, deleteNoteSchema } from "@/lib/validations/notes";

export async function createNote(formData: FormData) {
  const parsed = createNoteSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    unitId: formData.get("unitId") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "入力内容を確認してください",
    };
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
  const { error } = await supabase.from("research_notes").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    unit_id: parsed.data.unitId || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/notes");
  return { error: null };
}

export async function deleteNote(formData: FormData) {
  const parsed = deleteNoteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "invalid id" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("research_notes")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/notes");
  return { error: null };
}
