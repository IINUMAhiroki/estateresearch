export type FieldKey =
  | "securitiesCode"
  | "transactionType"
  | "quantityUnits"
  | "pricePerUnitYen"
  | "transactionDate";

export const FIELD_LABELS: Record<FieldKey, string> = {
  securitiesCode: "証券コード",
  transactionType: "取引区分",
  quantityUnits: "数量（口数）",
  pricePerUnitYen: "単価（円）",
  transactionDate: "取引日",
};

const FIELD_KEYWORDS: Record<FieldKey, RegExp> = {
  securitiesCode: /コード|銘柄/,
  transactionType: /区分|売買|種別/,
  quantityUnits: /数量|口数|株数/,
  pricePerUnitYen: /単価|価格/,
  transactionDate: /約定日|取引日|受渡日|日付|年月日/,
};

/** Best-guess column index per field, based on header keyword matching. */
export function suggestColumnMapping(
  headers: string[],
): Partial<Record<FieldKey, number>> {
  const mapping: Partial<Record<FieldKey, number>> = {};
  for (const key of Object.keys(FIELD_KEYWORDS) as FieldKey[]) {
    const idx = headers.findIndex((h) => FIELD_KEYWORDS[key].test(h));
    if (idx >= 0) mapping[key] = idx;
  }
  return mapping;
}

export type TransactionTypeValue = "buy" | "sell" | "skip";

/** Best-guess buy/sell classification for a raw 取引区分 cell value. */
export function suggestTransactionTypeValue(
  value: string,
): TransactionTypeValue {
  if (/買/.test(value)) return "buy";
  if (/売/.test(value)) return "sell";
  return "skip";
}
