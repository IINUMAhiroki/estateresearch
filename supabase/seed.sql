-- Seed data for local development. Writes to these public master tables
-- bypass RLS because this runs via the postgres role during `supabase db reset`.

insert into public.sources (code, name, base_url) values
  ('manual', '手動入力', null),
  ('suumo', 'SUUMO', 'https://suumo.jp'),
  ('athome', 'at home', 'https://www.athome.co.jp');

insert into public.agencies (name, license_number, phone) values
  ('サンプル不動産株式会社', '東京都知事(1)第12345号', '03-1234-5678');

insert into public.stations (line_name, station_name, company_name) values
  ('JR山手線', '渋谷', 'JR東日本'),
  ('東京メトロ銀座線', '渋谷', '東京メトロ'),
  ('JR東海道本線', '横浜', 'JR東日本');

insert into public.features (name, scope) values
  ('オートロック', 'building'),
  ('宅配ボックス', 'building'),
  ('エレベーター', 'building'),
  ('24時間管理', 'building'),
  ('ペット可', 'unit'),
  ('バルコニー', 'unit'),
  ('駐輪場', 'building');

insert into public.buildings (
  id, building_type, name, address, prefecture, city,
  total_units, structure, floors_above, built_year, built_month, land_rights
) values
  (
    '00000000-0000-0000-0000-000000000001', 'mansion', 'サンプルマンション A棟',
    '東京都渋谷区1-1-1', '東京都', '渋谷区',
    48, 'rc', 12, 2015, 4, 'ownership'
  ),
  (
    '00000000-0000-0000-0000-000000000002', 'mansion', 'サンプルマンション B棟',
    '神奈川県横浜市中区3-3-3', '神奈川県', '横浜市中区',
    30, 'src', 8, 2008, 9, 'ownership'
  );

insert into public.building_stations (building_id, station_id, walk_minutes, is_primary)
select '00000000-0000-0000-0000-000000000001', id, 8, true
from public.stations where station_name = '渋谷' and line_name = 'JR山手線';

insert into public.building_stations (building_id, station_id, walk_minutes, is_primary)
select '00000000-0000-0000-0000-000000000002', id, 10, true
from public.stations where station_name = '横浜';

insert into public.building_features (building_id, feature_id)
select '00000000-0000-0000-0000-000000000001', id from public.features where name in ('オートロック', '宅配ボックス', 'エレベーター');

insert into public.units (
  id, building_id, room_number, floor_number, floor_area_sqm, layout, direction
) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '501', 5, 68.5, '3LDK', '南'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', '203', 2, 55.2, '2LDK', '東');

insert into public.unit_features (unit_id, feature_id)
select '00000000-0000-0000-0000-000000000101', id from public.features where name in ('ペット可', 'バルコニー');

insert into public.listings (
  id, unit_id, agency_id, transaction_type, current_price_yen, current_status,
  management_fee_yen, repair_reserve_fund_yen, occupancy_status, first_listed_at, last_confirmed_at
)
select
  '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101',
  a.id, 'mediation_general', 68000000, 'published',
  18000, 15000, 'vacant', now() - interval '30 days', now()
from public.agencies a limit 1;

insert into public.listings (
  id, unit_id, agency_id, transaction_type, current_price_yen, current_status,
  management_fee_yen, repair_reserve_fund_yen, occupancy_status, first_listed_at, last_confirmed_at
)
select
  '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102',
  a.id, 'agent', 42000000, 'published',
  12000, 9000, 'owner_occupied', now() - interval '10 days', now()
from public.agencies a limit 1;

insert into public.price_history (listing_id, price_yen, effective_at, source_id, note)
select '00000000-0000-0000-0000-000000000201', 70000000, now() - interval '30 days', id, '掲載開始時価格'
from public.sources where code = 'manual';

insert into public.price_history (listing_id, price_yen, effective_at, source_id, note)
select '00000000-0000-0000-0000-000000000201', 68000000, now() - interval '5 days', id, '値下げ'
from public.sources where code = 'manual';

insert into public.price_history (listing_id, price_yen, effective_at, source_id)
select '00000000-0000-0000-0000-000000000202', 42000000, now() - interval '10 days', id
from public.sources where code = 'manual';

insert into public.status_history (listing_id, status, effective_at, source_id)
select '00000000-0000-0000-0000-000000000201', 'published', now() - interval '30 days', id
from public.sources where code = 'manual';

insert into public.status_history (listing_id, status, effective_at, source_id)
select '00000000-0000-0000-0000-000000000202', 'published', now() - interval '10 days', id
from public.sources where code = 'manual';
