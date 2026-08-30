-- Replaces the broker-specific 'csv_sbi'/'csv_rakuten' source values with a
-- single generic 'csv_import': the import flow no longer asks which broker
-- the CSV came from (it never had real per-broker column mappings to begin
-- with, since no sample export was ever obtained) — instead the user maps
-- CSV columns to fields themselves via a preview UI, so there is no
-- broker-specific parsing to distinguish here.

alter table public.portfolio_transactions drop constraint portfolio_transactions_source_check;

alter table public.portfolio_transactions
  add constraint portfolio_transactions_source_check
  check (source in ('manual', 'csv_import'));
