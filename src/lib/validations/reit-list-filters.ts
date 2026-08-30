import { z } from "zod";

// Kept as a plain criteria object (not dedicated DB columns) so the filter
// UI can grow new dimensions without a migration each time — only the
// shape is validated here, the DB stores it as an opaque jsonb blob.
export const reitListFilterCriteriaSchema = z.object({
  query: z.string().trim().max(100).default(""),
  minDistributionYieldPct: z.coerce.number().nonnegative().nullable(),
  maxNavMultiple: z.coerce.number().nonnegative().nullable(),
  minMarketCapYen: z.coerce.number().nonnegative().nullable(),
});

export type ReitListFilterCriteria = z.infer<
  typeof reitListFilterCriteriaSchema
>;

export const EMPTY_REIT_LIST_FILTER_CRITERIA: ReitListFilterCriteria = {
  query: "",
  minDistributionYieldPct: null,
  maxNavMultiple: null,
  minMarketCapYen: null,
};

export const saveReitListFilterSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(50),
  sortKey: z.string().min(1),
  sortDesc: z.coerce.boolean(),
  filter: reitListFilterCriteriaSchema,
});

export const reitListFilterIdSchema = z.object({
  id: z.string().uuid(),
});
