import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください").max(200),
  body: z.string().trim().max(10_000).default(""),
  propertyId: z.string().uuid().optional().or(z.literal("")),
});

export const deleteNoteSchema = z.object({
  id: z.string().uuid(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
