"use server";

import { revalidatePath } from "next/cache";
import { type Broker, parseBrokerCsv } from "@/lib/csv/parse-broker-csv";
import { createClient } from "@/lib/supabase/server";
import {
  createTransactionSchema,
  deleteTransactionSchema,
} from "@/lib/validations/portfolio";

export async function createTransaction(formData: FormData) {
  const parsed = createTransactionSchema.safeParse({
    reitId: formData.get("reitId"),
    transactionType: formData.get("transactionType"),
    quantityUnits: formData.get("quantityUnits"),
    pricePerUnitYen: formData.get("pricePerUnitYen"),
    transactionDate: formData.get("transactionDate"),
    memo: formData.get("memo") ?? undefined,
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
  const { error } = await supabase.from("portfolio_transactions").insert({
    reit_id: parsed.data.reitId,
    transaction_type: parsed.data.transactionType,
    quantity_units: parsed.data.quantityUnits,
    price_per_unit_yen: parsed.data.pricePerUnitYen,
    transaction_date: parsed.data.transactionDate,
    memo: parsed.data.memo || null,
    source: "manual",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portfolio");
  return { error: null };
}

export async function deleteTransaction(formData: FormData) {
  const parsed = deleteTransactionSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "invalid id" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_transactions")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portfolio");
  return { error: null };
}

export async function importCsv(formData: FormData) {
  const broker = formData.get("broker");
  const file = formData.get("file");

  if (broker !== "sbi" && broker !== "rakuten") {
    return {
      error: "証券会社を選択してください",
      successCount: 0,
      errorCount: 0,
    };
  }
  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "CSVファイルを選択してください",
      successCount: 0,
      errorCount: 0,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です", successCount: 0, errorCount: 0 };
  }

  let parsed: ReturnType<typeof parseBrokerCsv>;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseBrokerCsv(broker as Broker, buffer);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "CSVの解析に失敗しました",
      successCount: 0,
      errorCount: 0,
    };
  }

  const { data: reits } = await supabase
    .from("reits")
    .select("id, securities_code");
  const reitIdByCode = new Map(
    (reits ?? []).map((r) => [r.securities_code, r.id]),
  );

  const rowsToInsert = [];
  const errors = [...parsed.errors];
  for (const row of parsed.rows) {
    const reitId = reitIdByCode.get(row.securitiesCode);
    if (!reitId) {
      errors.push(
        `証券コード ${row.securitiesCode} はREITとして登録されていません`,
      );
      continue;
    }
    rowsToInsert.push({
      reit_id: reitId,
      transaction_type: row.transactionType,
      quantity_units: row.quantityUnits,
      price_per_unit_yen: row.pricePerUnitYen,
      transaction_date: row.transactionDate,
      source:
        broker === "sbi" ? ("csv_sbi" as const) : ("csv_rakuten" as const),
    });
  }

  if (rowsToInsert.length === 0) {
    return { error: null, successCount: 0, errorCount: errors.length, errors };
  }

  const { error, count } = await supabase
    .from("portfolio_transactions")
    .upsert(rowsToInsert, {
      onConflict:
        "owner_id,reit_id,transaction_date,transaction_type,quantity_units,price_per_unit_yen",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (error) {
    return {
      error: error.message,
      successCount: 0,
      errorCount: errors.length,
      errors,
    };
  }

  revalidatePath("/portfolio");
  return {
    error: null,
    successCount: count ?? rowsToInsert.length,
    errorCount: errors.length,
    errors,
  };
}
