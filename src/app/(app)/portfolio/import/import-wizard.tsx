"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { looksMojibake } from "@/lib/csv/detect-encoding";
import {
  FIELD_LABELS,
  type FieldKey,
  suggestColumnMapping,
  suggestTransactionTypeValue,
  type TransactionTypeValue,
} from "@/lib/csv/mapping";
import { parseCsvText } from "@/lib/csv/parse-csv-text";
import { parseFlexibleDate } from "@/lib/csv/parse-date";
import { importMappedCsv } from "../actions";

const FIELD_KEYS: FieldKey[] = [
  "securitiesCode",
  "transactionType",
  "quantityUnits",
  "pricePerUnitYen",
  "transactionDate",
];

type ParsedFile = { headers: string[]; rows: string[][] };

async function readAndDecodeFile(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  if (!looksMojibake(utf8)) return utf8;
  return new TextDecoder("shift-jis").decode(bytes);
}

export function ImportWizard() {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, number>>>({});
  const [valueMap, setValueMap] = useState<
    Record<string, TransactionTypeValue>
  >({});
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    error: string | null;
    successCount: number;
    errorCount: number;
    errors?: string[];
  } | null>(null);

  async function handleFileChange(selected: File | null) {
    setResult(null);
    setFile(selected);
    if (!selected) {
      setParsed(null);
      return;
    }
    const text = await readAndDecodeFile(selected);
    const table = parseCsvText(text);
    if (table.length === 0) return;

    const [headers, ...rows] = table;
    setParsed({ headers, rows });
    setMapping(suggestColumnMapping(headers));
  }

  const distinctTypeValues = useMemo(() => {
    if (!parsed || mapping.transactionType == null) return [];
    const col = mapping.transactionType;
    const values = new Set(
      parsed.rows.map((r) => r[col]?.trim()).filter(Boolean),
    );
    return [...values];
  }, [parsed, mapping.transactionType]);

  const effectiveValueMap = useCallback(
    (value: string): TransactionTypeValue =>
      valueMap[value] ?? suggestTransactionTypeValue(value),
    [valueMap],
  );

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, 5).map((row) => {
      const code =
        mapping.securitiesCode != null
          ? row[mapping.securitiesCode]
          : undefined;
      const rawType =
        mapping.transactionType != null
          ? row[mapping.transactionType]
          : undefined;
      const type = rawType != null ? effectiveValueMap(rawType) : "skip";
      const quantity =
        mapping.quantityUnits != null ? row[mapping.quantityUnits] : undefined;
      const price =
        mapping.pricePerUnitYen != null
          ? row[mapping.pricePerUnitYen]
          : undefined;
      const rawDate =
        mapping.transactionDate != null
          ? row[mapping.transactionDate]
          : undefined;
      const date = rawDate != null ? parseFlexibleDate(rawDate) : null;
      return {
        code,
        type,
        quantity,
        price,
        date,
        valid: Boolean(code && type !== "skip" && quantity && price && date),
      };
    });
  }, [parsed, mapping, effectiveValueMap]);

  const canSubmit =
    parsed != null &&
    file != null &&
    FIELD_KEYS.every((k) => mapping[k] != null) &&
    previewRows.some((r) => r.valid);

  function handleSubmit() {
    if (!file || !parsed) return;
    setResult(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("mapping", JSON.stringify(mapping));
    const fullValueMap = Object.fromEntries(
      distinctTypeValues.map((v) => [v, effectiveValueMap(v)]),
    );
    formData.set("valueMap", JSON.stringify(fullValueMap));

    startTransition(async () => {
      const res = await importMappedCsv(formData);
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border p-4">
        <Label htmlFor="file">取引履歴CSVファイル</Label>
        <Input
          id="file"
          type="file"
          accept=".csv"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          1行目をヘッダーとして扱います。証券会社は問いません —
          列の対応は下で確認・修正してください。
        </p>
      </div>

      {parsed && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-sm font-medium">列の対応</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELD_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`map-${key}`}>{FIELD_LABELS[key]}</Label>
                <select
                  id={`map-${key}`}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
                  value={mapping[key] ?? ""}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [key]:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">選択してください</option>
                  {parsed.headers.map((h, i) => (
                    <option key={h} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {distinctTypeValues.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">取引区分の割り当て</h3>
              <div className="space-y-2">
                {distinctTypeValues.map((value) => (
                  <div key={value} className="flex items-center gap-3 text-sm">
                    <span className="w-32 truncate">{value}</span>
                    <select
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      value={effectiveValueMap(value)}
                      onChange={(e) =>
                        setValueMap((prev) => ({
                          ...prev,
                          [value]: e.target.value as TransactionTypeValue,
                        }))
                      }
                    >
                      <option value="buy">買付</option>
                      <option value="sell">売却</option>
                      <option value="skip">無視する</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">プレビュー（先頭5件）</h3>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">証券コード</th>
                    <th className="p-2 text-left">取引区分</th>
                    <th className="p-2 text-left">口数</th>
                    <th className="p-2 text-left">単価</th>
                    <th className="p-2 text-left">取引日</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      // biome-ignore lint/suspicious/noArrayIndexKey: static preview list, never reordered/filtered
                      key={i}
                      className={`border-b last:border-0 ${row.valid ? "" : "text-destructive"}`}
                    >
                      <td className="p-2">{row.code ?? "—"}</td>
                      <td className="p-2">
                        {row.type === "skip"
                          ? "（無視）"
                          : row.type === "buy"
                            ? "買付"
                            : "売却"}
                      </td>
                      <td className="p-2">{row.quantity ?? "—"}</td>
                      <td className="p-2">{row.price ?? "—"}</td>
                      <td className="p-2">{row.date ?? "変換不可"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result?.error && (
            <p className="text-sm text-destructive">{result.error}</p>
          )}
          {result && !result.error && (
            <p className="text-sm text-muted-foreground">
              {result.successCount}件成功、エラー {result.errorCount}件
            </p>
          )}
          {result?.errors && result.errors.length > 0 && (
            <ul className="list-inside list-disc text-sm text-destructive">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            disabled={!canSubmit || pending}
            onClick={handleSubmit}
          >
            この内容でインポート
          </Button>
        </div>
      )}
    </div>
  );
}
