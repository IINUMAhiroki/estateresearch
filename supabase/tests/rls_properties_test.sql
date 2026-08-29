begin;
select plan(3);

select is(
  (select count(*)::int from public.properties),
  3,
  'seeded properties are present'
);

set local role anon;

select is(
  (select count(*)::int from public.properties),
  0,
  'anon cannot see any properties rows'
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

select * from finish();
rollback;
