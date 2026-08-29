"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTransaction } from "./actions";

type TransactionFormProps = {
  reits: { id: string; name: string; securities_code: string }[];
};

export function TransactionForm({ reits }: TransactionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      className="space-y-3 rounded-lg border p-4"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createTransaction(formData);
          if (result.error) {
            setError(result.error);
            toast.error(result.error);
            return;
          }
          formRef.current?.reset();
          toast.success("取引を追加しました");
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reitId">REIT銘柄</Label>
          <select
            id="reitId"
            name="reitId"
            required
            className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">選択してください</option>
            {reits.map((reit) => (
              <option key={reit.id} value={reit.id}>
                {reit.name}（{reit.securities_code}）
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transactionType">取引区分</Label>
          <select
            id="transactionType"
            name="transactionType"
            required
            className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="buy">買付</option>
            <option value="sell">売却</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantityUnits">口数</Label>
          <Input
            id="quantityUnits"
            name="quantityUnits"
            type="number"
            min={1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerUnitYen">単価（円）</Label>
          <Input
            id="pricePerUnitYen"
            name="pricePerUnitYen"
            type="number"
            min={0}
            step="0.01"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transactionDate">取引日</Label>
          <Input
            id="transactionDate"
            name="transactionDate"
            type="date"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="memo">メモ</Label>
          <Input id="memo" name="memo" type="text" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        追加
      </Button>
    </form>
  );
}
