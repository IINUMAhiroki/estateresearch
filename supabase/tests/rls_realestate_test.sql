begin;
select plan(8);

-- Canonical master tables: authenticated can read seeded data, anon cannot.
select is(
  (select count(*)::int from public.buildings),
  2,
  'seeded buildings are present'
);

select is(
  (select count(*)::int from public.units),
  2,
  'seeded units are present'
);

select is(
  (select count(*)::int from public.listings),
  2,
  'seeded listings are present'
);

set local role anon;

select is(
  (select count(*)::int from public.buildings),
  0,
  'anon cannot see any buildings rows'
);

select is(
  (select count(*)::int from public.units),
  0,
  'anon cannot see any units rows'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ delete from public.buildings $$,
  '42501',
  null,
  'authenticated users cannot delete buildings master data'
);

select throws_ok(
  $$ update public.listings set current_price_yen = 1 $$,
  '42501',
  null,
  'authenticated users cannot write to listings'
);

-- raw_listings is intentionally invisible to both anon and authenticated:
-- grants are revoked entirely, so even a SELECT errors before RLS applies.
select throws_ok(
  $$ select * from public.raw_listings $$,
  '42501',
  null,
  'authenticated cannot query raw_listings at all'
);

select * from finish();
rollback;
