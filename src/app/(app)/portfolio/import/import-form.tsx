"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importCsv } from "../actions";

export function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    error: string | null;
    successCount: number;
    errorCount: number;
    errors?: string[];
  } | null>(null);

  return (
    <form
      ref={formRef}
      className="space-y-4 rounded-lg border p-4"
      action={(formData) => {
        setResult(null);
        startTransition(async () => {
          const res = await importCsv(formData);
          setResult(res);
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="broker">証券会社</Label>
        <select
          id="broker"
          name="broker"
          required
          className="h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="sbi">SBI証券</option>
          <option value="rakuten">楽天証券</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">取引履歴CSVファイル</Label>
        <Input id="file" name="file" type="file" accept=".csv" required />
      </div>
      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      {result && !result.error && (
        <p className="text-sm text-muted-foreground">
          {result.successCount}件中 成功、エラー {result.errorCount}件
        </p>
      )}
      {result?.errors && result.errors.length > 0 && (
        <ul className="list-inside list-disc text-sm text-destructive">
          {result.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <Button type="submit" disabled={pending}>
        インポート
      </Button>
    </form>
  );
}
