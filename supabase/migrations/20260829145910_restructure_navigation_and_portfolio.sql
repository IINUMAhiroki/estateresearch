-- Restructure navigation + add portfolio holdings feature.
-- Drops research_notes (マイノート feature retired), adds reit_rankings view
-- for the rankings screen, and adds portfolio_transactions + my_reit_holdings
-- for the user's own REIT portfolio tracking.

-- =========================================================
-- Drop research_notes (マイノート機能を廃止)
-- =========================================================
drop table if exists public.research_notes;

-- =========================================================
-- reit_rankings: flat, single-query view for the rankings screen.
-- Joins reits with each REIT's latest market snapshot and latest
-- portfolio metrics via LATERAL, sidestepping PostgREST's inability to
-- embed relationships through a view.
-- =========================================================

-- Support the LATERAL "latest row per reit" lookup efficiently.
drop index if exists public.reit_market_snapshots_reit_id_idx;
create index reit_market_snapshots_reit_id_date_idx
  on public.reit_market_snapshots (reit_id, snapshot_date desc);

create view public.reit_rankings
with (security_invoker = true) as
select
  r.id as reit_id,
  r.securities_code,
  r.name,
  r.primary_use_type,
  snap.snapshot_date,
  snap.unit_price_yen,
  snap.unit_price_change_pct,
  snap.distribution_yield_pct,
  snap.nav_per_unit_yen,
  snap.nav_multiple,
  snap.market_cap_yen,
  snap.trading_volume_units,
  metrics.fiscal_period_end,
  metrics.asset_size_yen,
  metrics.property_count,
  metrics.average_building_age_years,
  metrics.noi_yield_pct,
  metrics.unrealized_gain_loss_pct,
  metrics.annual_distribution_yen,
  metrics.roe_pct,
  metrics.interest_bearing_debt_ratio_pct
from public.reits r
left join lateral (
  select *
  from public.reit_market_snapshots s
  where s.reit_id = r.id
  order by s.snapshot_date desc
  limit 1
) snap on true
left join lateral (
  select *
  from public.reit_portfolio_metrics m
  where m.reit_id = r.id
  order by m.fiscal_period_end desc
  limit 1
) metrics on true;

revoke all on public.reit_rankings from anon;
grant select on public.reit_rankings to authenticated;

-- =========================================================
-- portfolio_transactions: private per-user ledger of the user's own REIT
-- unit purchases/sales (distinct from acquisitions/dispositions, which
-- model REIT-corporation-to-property ownership, not user-to-security
-- ownership). Full CRUD RLS, unlike the scraped public master data,
-- because the user may need to correct their own entries.
-- =========================================================
create table public.portfolio_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reit_id uuid not null references public.reits (id) on delete cascade,
  transaction_type text not null check (transaction_type in ('buy', 'sell')),
  quantity_units bigint not null check (quantity_units > 0),
  price_per_unit_yen numeric(10, 2) not null check (price_per_unit_yen >= 0),
  transaction_date date not null,
  source text not null default 'manual' check (source in ('manual', 'csv_sbi', 'csv_rakuten')),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency for re-imported/duplicate CSV rows.
create unique index portfolio_transactions_dedup_idx
  on public.portfolio_transactions
  (owner_id, reit_id, transaction_date, transaction_type, quantity_units, price_per_unit_yen);

create index portfolio_transactions_owner_id_idx on public.portfolio_transactions (owner_id);
create index portfolio_transactions_owner_reit_idx on public.portfolio_transactions (owner_id, reit_id);

alter table public.portfolio_transactions enable row level security;

create policy "portfolio_transactions_select_own"
  on public.portfolio_transactions for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "portfolio_transactions_insert_own"
  on public.portfolio_transactions for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "portfolio_transactions_update_own"
  on public.portfolio_transactions for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "portfolio_transactions_delete_own"
  on public.portfolio_transactions for delete
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.portfolio_transactions from anon;

create trigger portfolio_transactions_updated_at
  before update on public.portfolio_transactions
  for each row execute function public.set_updated_at();

-- my_reit_holdings: nets buy/sell quantities per (owner, reit) using the
-- weighted-average-of-all-buy-lots method for average acquisition price
-- (matches how Japanese brokers typically display 総平均法-style holdings;
-- a full FIFO lot-tracking engine is unnecessary complexity for a research
-- tool — this is an approximation, not a tax-accurate cost basis).
create view public.my_reit_holdings
with (security_invoker = true) as
select
  t.owner_id,
  t.reit_id,
  r.securities_code,
  r.name as reit_name,
  sum(case when t.transaction_type = 'buy' then t.quantity_units else -t.quantity_units end) as net_quantity_units,
  case
    when sum(case when t.transaction_type = 'buy' then t.quantity_units else -t.quantity_units end) > 0
    then 'open'
    else 'closed'
  end as status,
  round(
    sum(case when t.transaction_type = 'buy' then t.quantity_units * t.price_per_unit_yen else 0 end)
    / nullif(sum(case when t.transaction_type = 'buy' then t.quantity_units else 0 end), 0),
    2
  ) as average_acquisition_price_yen,
  sum(case when t.transaction_type = 'buy' then t.quantity_units else 0 end) as total_bought_quantity_units,
  sum(case when t.transaction_type = 'sell' then t.quantity_units else 0 end) as total_sold_quantity_units,
  min(t.transaction_date) filter (where t.transaction_type = 'buy') as first_acquired_at,
  max(t.transaction_date) as last_transaction_date
from public.portfolio_transactions t
join public.reits r on r.id = t.reit_id
group by t.owner_id, t.reit_id, r.securities_code, r.name;

revoke all on public.my_reit_holdings from anon;
grant select on public.my_reit_holdings to authenticated;
