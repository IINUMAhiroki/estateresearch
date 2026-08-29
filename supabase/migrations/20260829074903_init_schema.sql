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
-- Real-estate domain (マンション). Public master data, read-only to
-- authenticated users. Writes happen only via migration/seed/service role
-- (future ETL job), never through the app's own user-facing API surface.
-- =========================================================

-- ---------------------------------------------------------
-- sources: ingestion source master (suumo, athome, manual, ...)
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
-- agencies: 仲介業者マスタ
-- ---------------------------------------------------------
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_number text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index agencies_license_number_key
  on public.agencies (license_number)
  where license_number is not null;

alter table public.agencies enable row level security;

create policy "agencies_select_authenticated"
  on public.agencies for select
  to authenticated
  using (true);

revoke insert, update, delete on public.agencies from anon, authenticated;

create trigger agencies_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- stations: 駅マスタ
-- ---------------------------------------------------------
create table public.stations (
  id uuid primary key default gen_random_uuid(),
  line_name text not null,
  station_name text not null,
  company_name text,
  created_at timestamptz not null default now(),
  unique (line_name, station_name)
);

alter table public.stations enable row level security;

create policy "stations_select_authenticated"
  on public.stations for select
  to authenticated
  using (true);

revoke insert, update, delete on public.stations from anon, authenticated;

-- ---------------------------------------------------------
-- buildings: 建物マスタ（マンション）
-- ---------------------------------------------------------
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  building_type text not null default 'mansion' check (building_type in ('mansion')),
  name text not null,
  name_normalized text,
  address text not null,
  normalized_address text,
  prefecture text,
  city text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  total_units int,
  structure text check (structure in ('rc', 'src', 'steel', 'light_steel', 'wood', 'other')),
  floors_above int,
  floors_below int,
  built_year int,
  built_month int check (built_month between 1 and 12),
  land_rights text check (land_rights in ('ownership', 'leasehold', 'other')),
  use_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.buildings enable row level security;

create policy "buildings_select_authenticated"
  on public.buildings for select
  to authenticated
  using (true);

revoke insert, update, delete on public.buildings from anon, authenticated;

create trigger buildings_updated_at
  before update on public.buildings
  for each row execute function public.set_updated_at();

-- building <-> station (M:N). A building can be near multiple stations/lines.
create table public.building_stations (
  building_id uuid not null references public.buildings (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  walk_minutes int,
  distance_meters int,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (building_id, station_id)
);

alter table public.building_stations enable row level security;

create policy "building_stations_select_authenticated"
  on public.building_stations for select
  to authenticated
  using (true);

revoke insert, update, delete on public.building_stations from anon, authenticated;

-- ---------------------------------------------------------
-- features: 設備・特徴タグ（boolean列を増やさず、行として管理）
-- ---------------------------------------------------------
create table public.features (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  scope text not null check (scope in ('building', 'unit')),
  created_at timestamptz not null default now()
);

alter table public.features enable row level security;

create policy "features_select_authenticated"
  on public.features for select
  to authenticated
  using (true);

revoke insert, update, delete on public.features from anon, authenticated;

create table public.building_features (
  building_id uuid not null references public.buildings (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (building_id, feature_id)
);

alter table public.building_features enable row level security;

create policy "building_features_select_authenticated"
  on public.building_features for select
  to authenticated
  using (true);

revoke insert, update, delete on public.building_features from anon, authenticated;

-- ---------------------------------------------------------
-- units: 専有部（部屋）マスタ。階数・面積など「引っ越さない限り
-- 変わらない」物理属性のみを持つ。掲載イベントは listings で別管理。
-- ---------------------------------------------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  room_number text,
  floor_number int,
  floor_area_sqm numeric(6, 2),
  balcony_area_sqm numeric(6, 2),
  layout text,
  direction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index units_building_room_key
  on public.units (building_id, room_number)
  where room_number is not null;

create index units_building_id_idx on public.units (building_id);

alter table public.units enable row level security;

create policy "units_select_authenticated"
  on public.units for select
  to authenticated
  using (true);

revoke insert, update, delete on public.units from anon, authenticated;

create trigger units_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create table public.unit_features (
  unit_id uuid not null references public.units (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (unit_id, feature_id)
);

alter table public.unit_features enable row level security;

create policy "unit_features_select_authenticated"
  on public.unit_features for select
  to authenticated
  using (true);

revoke insert, update, delete on public.unit_features from anon, authenticated;

-- ---------------------------------------------------------
-- listings: 掲載（商流イベント）。同じ unit が掲載終了→再掲載され
-- れば新しい行になり、一般媒介で複数業者が同時に扱えば同じ unit に
-- 複数の listings 行が並行して存在しうる。
-- ---------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  agency_id uuid references public.agencies (id) on delete set null,
  transaction_type text check (
    transaction_type in (
      'seller', 'agent', 'mediation_general',
      'mediation_exclusive', 'mediation_exclusive_specified'
    )
  ),
  current_price_yen bigint,
  current_status text not null default 'published' check (
    current_status in ('published', 'application_received', 'contracted', 'closed', 'suspended')
  ),
  management_fee_yen bigint,
  repair_reserve_fund_yen bigint,
  occupancy_status text check (occupancy_status in ('vacant', 'owner_occupied', 'tenant_occupied', 'other')),
  handover_date date,
  handover_note text,
  first_listed_at timestamptz,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_unit_id_idx on public.listings (unit_id);
create index listings_agency_id_idx on public.listings (agency_id);

alter table public.listings enable row level security;

create policy "listings_select_authenticated"
  on public.listings for select
  to authenticated
  using (true);

revoke insert, update, delete on public.listings from anon, authenticated;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- current_price_yen / current_status above are a cache of the latest history
-- row below; the append-only history tables are the source of truth.

-- ---------------------------------------------------------
-- price_history / status_history: append-only event log per listing.
-- ---------------------------------------------------------
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  price_yen bigint not null,
  effective_at timestamptz not null default now(),
  source_id uuid references public.sources (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index price_history_listing_id_idx on public.price_history (listing_id);

alter table public.price_history enable row level security;

create policy "price_history_select_authenticated"
  on public.price_history for select
  to authenticated
  using (true);

revoke insert, update, delete on public.price_history from anon, authenticated;

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  status text not null check (
    status in ('published', 'application_received', 'contracted', 'closed', 'suspended')
  ),
  effective_at timestamptz not null default now(),
  source_id uuid references public.sources (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index status_history_listing_id_idx on public.status_history (listing_id);

alter table public.status_history enable row level security;

create policy "status_history_select_authenticated"
  on public.status_history for select
  to authenticated
  using (true);

revoke insert, update, delete on public.status_history from anon, authenticated;

-- ---------------------------------------------------------
-- listing_images: 複数枚・順序付き画像
-- ---------------------------------------------------------
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  image_type text check (
    image_type in ('exterior', 'floor_plan', 'room', 'view', 'common_area', 'map', 'other')
  ),
  sort_order int not null default 0,
  caption text,
  created_at timestamptz not null default now()
);

create index listing_images_listing_id_idx on public.listing_images (listing_id);

alter table public.listing_images enable row level security;

create policy "listing_images_select_authenticated"
  on public.listing_images for select
  to authenticated
  using (true);

revoke insert, update, delete on public.listing_images from anon, authenticated;

-- ---------------------------------------------------------
-- raw_listings: ingestion/dedup layer. One row per (source, listing,
-- scrape). Deliberately NOT exposed to anon/authenticated at all — this is
-- pre-cleansing, noisy, portal-native data; only a future service-role ETL
-- job reads/writes it. An explicit deny-all policy documents that this is
-- intentional (RLS enabled + zero policies would read the same to Postgres,
-- but this is self-documenting and satisfies "every table has a policy").
-- ---------------------------------------------------------
create table public.raw_listings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  source_listing_id text not null,
  scraped_at timestamptz not null default now(),
  source_url text,
  raw_building_name text,
  raw_address text,
  raw_price_yen bigint,
  raw_payload jsonb not null default '{}'::jsonb,
  matched_building_id uuid references public.buildings (id) on delete set null,
  matched_unit_id uuid references public.units (id) on delete set null,
  matched_listing_id uuid references public.listings (id) on delete set null,
  match_status text not null default 'unmatched' check (
    match_status in ('unmatched', 'auto_matched', 'manual_matched', 'rejected')
  ),
  match_confidence numeric(3, 2),
  matched_at timestamptz,
  matched_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_listing_id, scraped_at)
);

alter table public.raw_listings enable row level security;

create policy "raw_listings_no_access"
  on public.raw_listings for all
  to authenticated, anon
  using (false)
  with check (false);

revoke all on public.raw_listings from anon, authenticated;

create trigger raw_listings_updated_at
  before update on public.raw_listings
  for each row execute function public.set_updated_at();

-- =========================================================
-- research_notes: private per-user data. Notes are anchored to a unit
-- (a physical room), not a listing instance, so a user's memo carries
-- across relisting/price-change episodes for the same room.
-- =========================================================
create table public.research_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
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
create index research_notes_unit_id_idx on public.research_notes (unit_id);

create trigger research_notes_updated_at
  before update on public.research_notes
  for each row execute function public.set_updated_at();
