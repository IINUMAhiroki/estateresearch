begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

-- User A buys 10 units of reit 3269 at 100,000 yen, then buys 10 more at
-- 120,000 yen (average should be 110,000), then sells 5.
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.portfolio_transactions (reit_id, transaction_type, quantity_units, price_per_unit_yen, transaction_date)
select id, 'buy', 10, 100000, '2026-01-10' from public.reits where securities_code = '3269';

insert into public.portfolio_transactions (reit_id, transaction_type, quantity_units, price_per_unit_yen, transaction_date)
select id, 'buy', 10, 120000, '2026-02-10' from public.reits where securities_code = '3269';

insert into public.portfolio_transactions (reit_id, transaction_type, quantity_units, price_per_unit_yen, transaction_date)
select id, 'sell', 5, 150000, '2026-03-10' from public.reits where securities_code = '3269';

select is(
  (select count(*)::int from public.portfolio_transactions),
  3,
  'owner sees own 3 transactions'
);

select is(
  (select net_quantity_units::int from public.my_reit_holdings where securities_code = '3269'),
  15,
  'my_reit_holdings nets buy minus sell quantity (10+10-5=15)'
);

select is(
  (select average_acquisition_price_yen::numeric from public.my_reit_holdings where securities_code = '3269'),
  110000.00,
  'average_acquisition_price_yen is the weighted average of buy lots only (unaffected by the sell)'
);

select is(
  (select status from public.my_reit_holdings where securities_code = '3269'),
  'open',
  'holding with positive net quantity is open'
);

-- Switch to user B: same table, different session claims.
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.portfolio_transactions),
  0,
  'other user cannot see the transactions'
);

select is(
  (select count(*)::int from public.my_reit_holdings),
  0,
  'other user sees no rows in my_reit_holdings either'
);

-- RLS filters the update target silently rather than erroring, so it must
-- run as its own top-level statement.
update public.portfolio_transactions set quantity_units = 999;

set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select bool_and(quantity_units <> 999) from public.portfolio_transactions),
  true,
  'other user cannot update owner''s transactions'
);

-- Switch to anon: no session, no claims.
reset role;
set local role anon;

select throws_ok(
  $$ select * from public.portfolio_transactions $$,
  '42501',
  null,
  'anon cannot read portfolio_transactions'
);

select * from finish();
rollback;
