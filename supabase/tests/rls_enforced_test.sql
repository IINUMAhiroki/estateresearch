begin;
select plan(1);

select is_empty(
  $$
  select 'RLS_DISABLED: ' || c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity

  union all

  select 'NO_POLICY: ' || c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
  group by c.relname
  having count(p.oid) = 0
  $$,
  'every public table has RLS enabled with at least one policy'
);

select * from finish();
rollback;
