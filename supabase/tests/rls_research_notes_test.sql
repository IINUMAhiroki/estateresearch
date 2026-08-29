begin;
select plan(6);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

-- User A creates a note against a seeded property.
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.research_notes (title, property_id)
values ('A note', '00000000-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from public.research_notes),
  1,
  'owner can see own note'
);

-- Switch to user B: same table, different session claims.
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.research_notes),
  0,
  'other user cannot see the note'
);

-- RLS filters the update target silently rather than erroring, so it must
-- run as its own top-level statement (a WITH containing UPDATE cannot be
-- nested inside another query).
update public.research_notes set title = 'hacked';

-- Switch back to the owner and confirm the title is untouched.
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select title from public.research_notes limit 1),
  'A note',
  'other user cannot update the note (owner still sees original title)'
);

set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_ok(
  $$ insert into public.properties (name, address, use_type) values ('x', 'y', 'office') $$,
  '42501',
  null,
  'authenticated users cannot write to the properties master table'
);

select is(
  (select count(*)::int from public.properties),
  3,
  'authenticated users can read seeded properties master data'
);

-- Switch to anon: no session, no claims.
reset role;
set local role anon;

select throws_ok(
  $$ select * from public.research_notes $$,
  '42501',
  null,
  'anon cannot read private research_notes'
);

select * from finish();
rollback;
