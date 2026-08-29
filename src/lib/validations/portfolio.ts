import { z } from "zod";

export const createTransactionSchema = z.object({
  reitId: z.string().uuid(),
  transactionType: z.enum(["buy", "sell"]),
  quantityUnits: z.coerce.number().int().positive(),
  pricePerUnitYen: z.coerce.number().nonnegative(),
  transactionDate: z.string().min(1, "取引日を入力してください"),
  memo: z.string().trim().max(2000).optional(),
});

export const deleteTransactionSchema = z.object({
  id: z.string().uuid(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
