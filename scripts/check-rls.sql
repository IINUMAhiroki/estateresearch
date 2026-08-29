-- Fails the caller (via non-empty output) if any public-schema table has RLS
-- disabled, has zero policies, or any view is not security_invoker.
select 'RLS_DISABLED: ' || c.relname as issue
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

union all

select 'VIEW_NOT_INVOKER: ' || c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and coalesce(c.reloptions::text, '') not like '%security_invoker=true%';
