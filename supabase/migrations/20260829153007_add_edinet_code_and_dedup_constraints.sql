-- Support the fudosandb.jp data sync: REITs are identified there by
-- edinet_code (not securities_code), and acquisitions/dispositions/
-- reit_distributions need unique constraints so the sync script can upsert
-- idempotently instead of duplicating rows on every run.

alter table public.reits add column edinet_code text unique;

alter table public.acquisitions
  add constraint acquisitions_property_reit_date_key
  unique (property_id, reit_id, acquisition_date);

alter table public.dispositions
  add constraint dispositions_property_reit_date_key
  unique (property_id, reit_id, disposition_date);

alter table public.reit_distributions
  add constraint reit_distributions_dedup_key
  unique (reit_id, fiscal_period_end, is_forecast, distribution_per_unit_yen);
