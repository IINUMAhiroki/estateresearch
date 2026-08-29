"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "./actions";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => {
        const formData = new FormData();
        formData.set("id", id);
        startTransition(async () => {
          const result = await deleteTransaction(formData);
          if (result.error) {
            toast.error(result.error);
          }
        });
      }}
      aria-label="削除"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
