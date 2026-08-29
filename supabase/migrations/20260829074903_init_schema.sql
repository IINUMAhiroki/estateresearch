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
-- properties: public master data, read-only to app users
-- =========================================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  prefecture text,
  price_yen bigint,
  built_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "properties_select_authenticated"
  on public.properties for select
  to authenticated
  using (true);

-- Double defense: RLS above already blocks writes with no insert/update/delete
-- policies, but revoke grants explicitly so a future permissive policy alone
-- cannot open write access.
revoke insert, update, delete on public.properties from anon, authenticated;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- =========================================================
-- research_notes: private per-user data
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

create trigger research_notes_updated_at
  before update on public.research_notes
  for each row execute function public.set_updated_at();
