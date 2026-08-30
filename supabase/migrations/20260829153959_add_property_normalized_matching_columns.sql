-- Supports the fudosandb.jp sync's property matching: without an indexed
-- normalized key, matching would require scanning every row in application
-- code, which does not scale to the ~7,000 properties fudosandb tracks.
-- Populated by the sync script at write time (not a generated column,
-- since normalization logic lives in TypeScript); existing seed rows are
-- left null and simply won't be matched against by the sync (acceptable —
-- seed data is illustrative, not real properties).

alter table public.properties add column normalized_name text;
alter table public.properties add column normalized_address text;

create index properties_normalized_match_idx
  on public.properties (normalized_name, normalized_address);
