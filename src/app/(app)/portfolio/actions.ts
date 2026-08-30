"use server";

import iconv from "iconv-lite";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { looksMojibake } from "@/lib/csv/detect-encoding";
import { parseCsvText } from "@/lib/csv/parse-csv-text";
import { parseFlexibleDate } from "@/lib/csv/parse-date";
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

const columnMappingSchema = z.object({
  securitiesCode: z.number().int().nonnegative(),
  transactionType: z.number().int().nonnegative(),
  quantityUnits: z.number().int().nonnegative(),
  pricePerUnitYen: z.number().int().nonnegative(),
  transactionDate: z.number().int().nonnegative(),
});

const valueMapSchema = z.record(z.string(), z.enum(["buy", "sell", "skip"]));

type ImportResult = {
  error: string | null;
  successCount: number;
  errorCount: number;
  errors?: string[];
};

/**
 * Imports a brokerage transaction-history CSV using a user-confirmed column
 * mapping (built in the ImportWizard preview UI) rather than a hardcoded
 * per-broker parser — no real SBI/Rakuten sample export was ever obtained,
 * and a mapping UI works regardless of which broker the file came from.
 * Re-parses the raw file server-side rather than trusting client-derived
 * rows; only the column-index mapping and value mapping are trusted input.
 */
export async function importMappedCsv(
  formData: FormData,
): Promise<ImportResult> {
  const file = formData.get("file");
  const mappingRaw = formData.get("mapping");
  const valueMapRaw = formData.get("valueMap");

  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "CSVファイルを選択してください",
      successCount: 0,
      errorCount: 0,
    };
  }
  if (typeof mappingRaw !== "string" || typeof valueMapRaw !== "string") {
    return { error: "列の対応情報が不正です", successCount: 0, errorCount: 0 };
  }

  let mapping: z.infer<typeof columnMappingSchema>;
  let valueMap: z.infer<typeof valueMapSchema>;
  try {
    mapping = columnMappingSchema.parse(JSON.parse(mappingRaw));
    valueMap = valueMapSchema.parse(JSON.parse(valueMapRaw));
  } catch {
    return { error: "列の対応情報が不正です", successCount: 0, errorCount: 0 };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です", successCount: 0, errorCount: 0 };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = iconv.decode(buffer, "utf-8");
  if (looksMojibake(text)) {
    text = iconv.decode(buffer, "Shift_JIS");
  }

  const table = parseCsvText(text);
  const dataRows = table.slice(1); // first row is always treated as the header

  const { data: reits } = await supabase
    .from("reits")
    .select("id, securities_code");
  const reitIdByCode = new Map(
    (reits ?? []).map((r) => [r.securities_code, r.id]),
  );

  const rowsToInsert: {
    reit_id: string;
    transaction_type: "buy" | "sell";
    quantity_units: number;
    price_per_unit_yen: number;
    transaction_date: string;
    source: "csv_import";
  }[] = [];
  const errors: string[] = [];

  for (const row of dataRows) {
    const code = row[mapping.securitiesCode]?.trim();
    const rawType = row[mapping.transactionType]?.trim();
    const type = rawType ? valueMap[rawType] : undefined;

    // Rows the user chose to ignore (e.g. dividend/fee rows) are silently
    // skipped — not counted as errors.
    if (!type || type === "skip") continue;
    if (!code) {
      errors.push("証券コードが空の行をスキップしました");
      continue;
    }

    const reitId = reitIdByCode.get(code);
    if (!reitId) {
      errors.push(`証券コード ${code} はREITとして登録されていません`);
      continue;
    }

    const quantity = Number(row[mapping.quantityUnits]?.replace(/,/g, ""));
    const price = Number(row[mapping.pricePerUnitYen]?.replace(/,/g, ""));
    const date = parseFlexibleDate(row[mapping.transactionDate]);

    if (
      !date ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      errors.push(`証券コード ${code} の行の値を読み取れませんでした`);
      continue;
    }

    rowsToInsert.push({
      reit_id: reitId,
      transaction_type: type,
      quantity_units: quantity,
      price_per_unit_yen: price,
      transaction_date: date,
      source: "csv_import",
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
