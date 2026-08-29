-- estateresearch: initial schema
-- Convention: every table gets RLS enabled + explicit policies + grants in this same file.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- profiles: 1:1 with auth.users, private to owner
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profiles from anon;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- J-REIT domain. This app only tracks properties that are (or were)
-- securitized/held by a J-REIT — no consumer/individual listings. Public
-- master data, read-only to authenticated users; writes happen only via
-- migration/seed/service role (future ingestion job).
-- =========================================================

-- ---------------------------------------------------------
-- sources: ingestion source master (japan_reit_com, manual, ...)
-- ---------------------------------------------------------
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  base_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sources enable row level security;

create policy "sources_select_authenticated"
  on public.sources for select
  to authenticated
  using (true);

revoke insert, update, delete on public.sources from anon, authenticated;

create trigger sources_updated_at
  before update on public.sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- regions: 地域区分マスタ (japan-reit.com の11区分に準拠)
-- ---------------------------------------------------------
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.regions enable row level security;

create policy "regions_select_authenticated"
  on public.regions for select
  to authenticated
  using (true);

revoke insert, update, delete on public.regions from anon, authenticated;

-- ---------------------------------------------------------
-- reits: 投資法人マスタ
-- ---------------------------------------------------------
create table public.reits (
  id uuid primary key default gen_random_uuid(),
  securities_code text not null unique,
  name text not null,
  sponsor text,
  asset_manager text,
  primary_use_type text,
  fiscal_month int check (fiscal_month between 1 and 12),
  listed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reits enable row level security;

create policy "reits_select_authenticated"
  on public.reits for select
  to authenticated
  using (true);

revoke insert, update, delete on public.reits from anon, authenticated;

create trigger reits_updated_at
  before update on public.reits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- reit_market_snapshots: 銘柄ごとの日次market指標 (append-only)
-- 投資口価格・分配金利回り・NAV倍率・時価総額などは日々変動するため、
-- reits 本体には持たせずスナップショットの積み上げで持つ。
-- ---------------------------------------------------------
create table public.reit_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  reit_id uuid not null references public.reits (id) on delete cascade,
  snapshot_date date not null,
  unit_price_yen bigint,
  unit_price_change_yen bigint,
  unit_price_change_pct numeric(5, 2),
  distribution_yield_pct numeric(5, 2),
  nav_per_unit_yen bigint,
  nav_multiple numeric(5, 2),
  market_cap_yen bigint,
  trading_volume_units bigint,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (reit_id, snapshot_date)
);

create index reit_market_snapshots_reit_id_idx on public.reit_market_snapshots (reit_id);

alter table public.reit_market_snapshots enable row level security;

create policy "reit_market_snapshots_select_authenticated"
  on public.reit_market_snapshots for select
  to authenticated
  using (true);

revoke insert, update, delete on public.reit_market_snapshots from anon, authenticated;

-- ---------------------------------------------------------
-- reit_distributions: 決算期ごとの1口当たり分配金 実績/予想 (append-only)
-- 予想は改定されうるため、期・実績予想フラグの組でユニーク制約はかけず、
-- 「最新行が現在値」という履歴テーブルの流儀に合わせる。
-- ---------------------------------------------------------
create table public.reit_distributions (
  id uuid primary key default gen_random_uuid(),
  reit_id uuid not null references public.reits (id) on delete cascade,
  fiscal_period_end date not null,
  distribution_per_unit_yen bigint not null,
  is_forecast boolean not null default false,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

create index reit_distributions_reit_id_period_idx
  on public.reit_distributions (reit_id, fiscal_period_end);

alter table public.reit_distributions enable row level security;

create policy "reit_distributions_select_authenticated"
  on public.reit_distributions for select
  to authenticated
  using (true);

revoke insert, update, delete on public.reit_distributions from anon, authenticated;

-- ---------------------------------------------------------
-- reit_portfolio_metrics: 決算期ごとの財務・ポートフォリオ指標 (append-only)
-- reit_market_snapshots (日次の市場データ) とは更新頻度が異なるため別テーブル。
-- ランキングページ(資産規模・保有棟数・平均築年数・NOI利回り・含み損益率・
-- 年額分配金・ROE・有利子負債比率)に対応。
-- ---------------------------------------------------------
create table public.reit_portfolio_metrics (
  id uuid primary key default gen_random_uuid(),
  reit_id uuid not null references public.reits (id) on delete cascade,
  fiscal_period_end date not null,
  asset_size_yen bigint,
  property_count int,
  average_building_age_years numeric(5, 2),
  noi_yield_pct numeric(5, 2),
  unrealized_gain_loss_pct numeric(5, 2),
  annual_distribution_yen bigint,
  roe_pct numeric(5, 2),
  interest_bearing_debt_ratio_pct numeric(5, 2),
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

create index reit_portfolio_metrics_reit_id_period_idx
  on public.reit_portfolio_metrics (reit_id, fiscal_period_end);

alter table public.reit_portfolio_metrics enable row level security;

create policy "reit_portfolio_metrics_select_authenticated"
  on public.reit_portfolio_metrics for select
  to authenticated
  using (true);

revoke insert, update, delete on public.reit_portfolio_metrics from anon, authenticated;

-- ---------------------------------------------------------
-- properties: 物件マスタ (REITが取得・保有・売却する実物資産)
-- ---------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  prefecture text,
  region_id uuid references public.regions (id) on delete set null,
  use_type text not null check (
    use_type in ('residential', 'office', 'retail', 'logistics', 'hotel', 'healthcare', 'land', 'other')
  ),
  built_year int,
  total_floor_area_sqm numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_region_id_idx on public.properties (region_id);
create index properties_use_type_idx on public.properties (use_type);

alter table public.properties enable row level security;

create policy "properties_select_authenticated"
  on public.properties for select
  to authenticated
  using (true);

revoke insert, update, delete on public.properties from anon, authenticated;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- acquisitions: 取得実績 (append-only event log)
-- ownership_ratio supports 准共有持分 — multiple REITs can each hold a
-- percentage stake in the same property.
-- ---------------------------------------------------------
create table public.acquisitions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  reit_id uuid not null references public.reits (id) on delete cascade,
  acquisition_date date not null,
  acquisition_price_yen bigint,
  acquisition_cap_rate numeric(5, 3),
  ownership_ratio numeric(5, 2) not null default 100.00 check (
    ownership_ratio > 0 and ownership_ratio <= 100
  ),
  seller text,
  source_id uuid references public.sources (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index acquisitions_property_id_idx on public.acquisitions (property_id);
create index acquisitions_reit_id_idx on public.acquisitions (reit_id);

alter table public.acquisitions enable row level security;

create policy "acquisitions_select_authenticated"
  on public.acquisitions for select
  to authenticated
  using (true);

revoke insert, update, delete on public.acquisitions from anon, authenticated;

-- ---------------------------------------------------------
-- dispositions: 売却実績 (append-only event log)
-- ---------------------------------------------------------
create table public.dispositions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  reit_id uuid not null references public.reits (id) on delete cascade,
  disposition_date date not null,
  disposition_price_yen bigint,
  gain_loss_yen bigint,
  ownership_ratio numeric(5, 2) not null default 100.00 check (
    ownership_ratio > 0 and ownership_ratio <= 100
  ),
  buyer text,
  source_id uuid references public.sources (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index dispositions_property_id_idx on public.dispositions (property_id);
create index dispositions_reit_id_idx on public.dispositions (reit_id);

alter table public.dispositions enable row level security;

create policy "dispositions_select_authenticated"
  on public.dispositions for select
  to authenticated
  using (true);

revoke insert, update, delete on public.dispositions from anon, authenticated;

-- ---------------------------------------------------------
-- property_holdings: current net ownership per (property, reit), derived
-- from acquisitions minus dispositions. A view, not a cache table, so it
-- can never drift from the append-only event logs above.
-- ---------------------------------------------------------
create view public.property_holdings
with (security_invoker = true) as
select
  a.property_id,
  a.reit_id,
  sum(a.ownership_ratio) - coalesce(d.disposed_ratio, 0) as net_ownership_ratio
from public.acquisitions a
left join (
  select property_id, reit_id, sum(ownership_ratio) as disposed_ratio
  from public.dispositions
  group by property_id, reit_id
) d on d.property_id = a.property_id and d.reit_id = a.reit_id
group by a.property_id, a.reit_id, d.disposed_ratio
having sum(a.ownership_ratio) - coalesce(d.disposed_ratio, 0) > 0;

revoke all on public.property_holdings from anon;
grant select on public.property_holdings to authenticated;

-- ---------------------------------------------------------
-- raw_transactions: ingestion/dedup layer. One row per scraped
-- acquisition/disposition record. Deliberately NOT exposed to
-- anon/authenticated at all — pre-cleansing, portal-native data; only a
-- future service-role ETL job reads/writes it. An explicit deny-all policy
-- documents that this is intentional.
-- ---------------------------------------------------------
create table public.raw_transactions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  source_record_id text,
  scraped_at timestamptz not null default now(),
  source_url text,
  transaction_type text not null check (transaction_type in ('acquisition', 'disposition')),
  raw_reit_name text,
  raw_property_name text,
  raw_address text,
  raw_use_type text,
  raw_date date,
  raw_price_yen bigint,
  raw_cap_rate numeric,
  raw_gain_loss_yen bigint,
  raw_payload jsonb not null default '{}'::jsonb,
  matched_property_id uuid references public.properties (id) on delete set null,
  matched_reit_id uuid references public.reits (id) on delete set null,
  matched_acquisition_id uuid references public.acquisitions (id) on delete set null,
  matched_disposition_id uuid references public.dispositions (id) on delete set null,
  match_status text not null default 'unmatched' check (
    match_status in ('unmatched', 'auto_matched', 'manual_matched', 'rejected')
  ),
  match_confidence numeric(3, 2),
  matched_at timestamptz,
  matched_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.raw_transactions enable row level security;

create policy "raw_transactions_no_access"
  on public.raw_transactions for all
  to authenticated, anon
  using (false)
  with check (false);

revoke all on public.raw_transactions from anon, authenticated;

create trigger raw_transactions_updated_at
  before update on public.raw_transactions
  for each row execute function public.set_updated_at();

-- =========================================================
-- research_notes: private per-user data, anchored to a property (the
-- whole building/asset is the unit of analysis for a REIT investor, unlike
-- consumer real estate where a single unit/room would be the target).
-- =========================================================
create table public.research_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.research_notes enable row level security;

create policy "notes_select_own"
  on public.research_notes for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "notes_insert_own"
  on public.research_notes for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "notes_update_own"
  on public.research_notes for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "notes_delete_own"
  on public.research_notes for delete
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.research_notes from anon;

create index research_notes_owner_id_idx on public.research_notes (owner_id);
create index research_notes_property_id_idx on public.research_notes (property_id);

create trigger research_notes_updated_at
  before update on public.research_notes
  for each row execute function public.set_updated_at();
