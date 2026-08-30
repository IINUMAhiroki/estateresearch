import { describe, expect, it } from "vitest";
import {
  suggestColumnMapping,
  suggestTransactionTypeValue,
} from "@/lib/csv/mapping";

describe("suggestColumnMapping", () => {
  it("matches columns by header keyword", () => {
    const mapping = suggestColumnMapping([
      "銘柄コード",
      "売買区分",
      "数量",
      "約定単価",
      "約定日",
    ]);
    expect(mapping).toEqual({
      securitiesCode: 0,
      transactionType: 1,
      quantityUnits: 2,
      pricePerUnitYen: 3,
      transactionDate: 4,
    });
  });

  it("leaves unmatched fields out of the mapping", () => {
    const mapping = suggestColumnMapping(["よくわからない列"]);
    expect(mapping).toEqual({});
  });
});

describe("suggestTransactionTypeValue", () => {
  it("classifies buy-like values", () => {
    expect(suggestTransactionTypeValue("買付")).toBe("buy");
    expect(suggestTransactionTypeValue("現物買")).toBe("buy");
  });

  it("classifies sell-like values", () => {
    expect(suggestTransactionTypeValue("売却")).toBe("sell");
    expect(suggestTransactionTypeValue("現物売")).toBe("sell");
  });

  it("falls back to skip for unrecognized values", () => {
    expect(suggestTransactionTypeValue("配当金")).toBe("skip");
  });
});
