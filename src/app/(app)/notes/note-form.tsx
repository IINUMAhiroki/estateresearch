"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "./actions";

export function NoteForm() {
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
          const result = await createNote(formData);
          if (result.error) {
            setError(result.error);
            toast.error(result.error);
            return;
          }
          formRef.current?.reset();
          toast.success("ノートを追加しました");
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">メモ</Label>
        <Textarea id="body" name="body" rows={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        追加
      </Button>
    </form>
  );
}
