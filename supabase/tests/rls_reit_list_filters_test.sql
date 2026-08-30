begin;
select plan(9);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.reit_list_filters (name, sort_key, filter)
values ('高利回り', 'distribution_yield_pct', '{"minDistributionYieldPct": 4}');

insert into public.reit_list_filters (name, sort_key, filter)
values ('低NAV倍率', 'nav_multiple', '{"maxNavMultiple": 1}');

select is(
  (select count(*)::int from public.reit_list_filters),
  2,
  'owner sees own 2 saved filters'
);

select set_default_reit_list_filter(id)
from public.reit_list_filters where name = '高利回り';

select is(
  (select count(*)::int from public.reit_list_filters where is_default),
  1,
  'exactly one filter is default after setting it'
);

select set_default_reit_list_filter(id)
from public.reit_list_filters where name = '低NAV倍率';

select is(
  (select name from public.reit_list_filters where is_default),
  '低NAV倍率',
  'setting a new default unsets the previous one'
);

-- Fill up to the 5-per-user cap (already have 2, add 3 more).
insert into public.reit_list_filters (name) values ('filter3'), ('filter4'), ('filter5');

select throws_ok(
  $$ insert into public.reit_list_filters (name) values ('filter6') $$,
  'P0001',
  'reit_list_filters: 保存できるフィルターは1ユーザーにつき5件までです',
  'a 6th saved filter is rejected by the per-user cap'
);

-- Switch to user B.
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.reit_list_filters),
  0,
  'other user cannot see the first user''s saved filters'
);

insert into public.reit_list_filters (name) values ('b-filter-1');

select is(
  (select count(*)::int from public.reit_list_filters),
  1,
  'other user can save their own filter independently of the cap'
);

-- RLS filters the update target silently rather than erroring, so it must
-- run as its own top-level statement.
update public.reit_list_filters set name = 'hijacked';

set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select bool_and(name <> 'hijacked') from public.reit_list_filters),
  true,
  'other user cannot rename owner''s saved filters'
);

select is(
  (select count(*)::int from public.reit_list_filters),
  5,
  'owner still has exactly 5 saved filters (untouched by the other user)'
);

-- Switch to anon: no session, no claims.
reset role;
set local role anon;

select throws_ok(
  $$ select * from public.reit_list_filters $$,
  '42501',
  null,
  'anon cannot read reit_list_filters'
);

select * from finish();
rollback;
