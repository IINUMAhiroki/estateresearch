-- reit_list_filters: per-user saved filter/sort presets for the /reits
-- list screen. `filter` is kept as an opaque jsonb blob (rather than
-- dedicated columns) so the client-side filter UI can evolve without a
-- migration each time; the DB only enforces ownership, the 5-per-user
-- cap, and the "at most one default" invariant.
create table public.reit_list_filters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  sort_key text not null default 'nav_multiple',
  sort_desc boolean not null default true,
  filter jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- At most one default filter per user. A plain unique index (not a
-- constraint with a WHERE clause on a check) is the standard way to
-- express this "partial uniqueness" in Postgres.
create unique index reit_list_filters_one_default_per_owner
  on public.reit_list_filters (owner_id)
  where is_default;

create index reit_list_filters_owner_id_idx on public.reit_list_filters (owner_id);

alter table public.reit_list_filters enable row level security;

create policy "reit_list_filters_select_own"
  on public.reit_list_filters for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "reit_list_filters_insert_own"
  on public.reit_list_filters for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "reit_list_filters_update_own"
  on public.reit_list_filters for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "reit_list_filters_delete_own"
  on public.reit_list_filters for delete
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.reit_list_filters from anon;

create trigger reit_list_filters_updated_at
  before update on public.reit_list_filters
  for each row execute function public.set_updated_at();

-- Row-count caps can't be expressed as a check constraint (no access to
-- sibling rows), so enforce the 5-per-user limit with a trigger. Runs as
-- SECURITY INVOKER (the default) so the count is naturally scoped to the
-- inserting user's own rows via the select policy above — no privilege
-- escalation needed.
create or replace function public.enforce_reit_list_filters_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.reit_list_filters where owner_id = new.owner_id) >= 5 then
    raise exception 'reit_list_filters: 保存できるフィルターは1ユーザーにつき5件までです';
  end if;
  return new;
end;
$$;

create trigger reit_list_filters_limit_before_insert
  before insert on public.reit_list_filters
  for each row execute function public.enforce_reit_list_filters_limit();

-- Atomically swaps which saved filter is the default, so the client never
-- has to juggle the partial-unique-index ordering itself.
create or replace function public.set_default_reit_list_filter(target_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.reit_list_filters
    set is_default = false
    where owner_id = (select auth.uid()) and id <> target_id and is_default;

  update public.reit_list_filters
    set is_default = true
    where id = target_id and owner_id = (select auth.uid());
end;
$$;

revoke all on function public.set_default_reit_list_filter(uuid) from public;
grant execute on function public.set_default_reit_list_filter(uuid) to authenticated;
