begin;
select plan(12);

-- Canonical master tables: authenticated can read seeded data, anon cannot.
select is(
  (select count(*)::int from public.reits),
  3,
  'seeded reits are present'
);

select is(
  (select count(*)::int from public.reit_market_snapshots),
  1,
  'seeded reit_market_snapshots are present'
);

select is(
  (select count(*)::int from public.reit_distributions),
  2,
  'seeded reit_distributions (actual + forecast) are present'
);

select is(
  (select count(*)::int from public.reit_portfolio_metrics),
  1,
  'seeded reit_portfolio_metrics are present'
);

select is(
  (select count(*)::int from public.properties),
  3,
  'seeded properties are present'
);

select is(
  (select count(*)::int from public.acquisitions),
  4,
  'seeded acquisitions are present (including a 准共有 pair)'
);

-- property_holdings view nets acquisitions minus dispositions: the
-- logistics center was fully disposed, so it should not appear.
select is(
  (select count(*)::int from public.property_holdings),
  3,
  'property_holdings shows only currently-held stakes'
);

set local role anon;

select is(
  (select count(*)::int from public.properties),
  0,
  'anon cannot see any properties rows'
);

select is(
  (select count(*)::int from public.reits),
  0,
  'anon cannot see any reits rows'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ delete from public.properties $$,
  '42501',
  null,
  'authenticated users cannot delete properties master data'
);

select throws_ok(
  $$ update public.acquisitions set acquisition_price_yen = 1 $$,
  '42501',
  null,
  'authenticated users cannot write to acquisitions'
);

-- raw_transactions is intentionally invisible to both anon and
-- authenticated: grants are revoked entirely, so even SELECT errors.
select throws_ok(
  $$ select * from public.raw_transactions $$,
  '42501',
  null,
  'authenticated cannot query raw_transactions at all'
);

select * from finish();
rollback;
