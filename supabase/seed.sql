-- Seed data for local development. Writes to these public master tables
-- bypass RLS because this runs via the postgres role during `supabase db reset`.

insert into public.sources (code, name, base_url) values
  ('manual', '手動入力', null),
  ('japan_reit_com', 'JAPAN-REIT.COM', 'https://www.japan-reit.com');

insert into public.regions (name, sort_order) values
  ('東京都主要５区', 1),
  ('東京２３区', 2),
  ('関東地区', 3),
  ('北海道地区', 4),
  ('東北地区', 5),
  ('北陸地区', 6),
  ('中部地区', 7),
  ('近畿地区', 8),
  ('四国地区', 9),
  ('中国地区', 10),
  ('九州地区', 11);

insert into public.reits (securities_code, name, sponsor, primary_use_type, fiscal_month) values
  ('3269', 'アドバンス・レジデンス投資法人', '伊藤忠グループ', '住居特化型', 2),
  ('8985', 'ジャパン・ホテル・リート投資法人', 'オリックスグループ', 'ホテル特化型', 12),
  ('8963', '住友不動産投資法人', '住友不動産グループ', 'オフィス・住居複合型', 6);

insert into public.reit_market_snapshots (
  reit_id, snapshot_date, unit_price_yen, unit_price_change_yen, unit_price_change_pct,
  distribution_yield_pct, nav_per_unit_yen, nav_multiple, market_cap_yen,
  trading_volume_units, source_id
)
select
  r.id, current_date, 145200, -800, -0.55, 4.26, 128500, 1.13, 414154250400, 12300,
  (select id from public.sources where code = 'japan_reit_com')
from public.reits r where r.securities_code = '3269';

insert into public.reit_portfolio_metrics (
  reit_id, fiscal_period_end, asset_size_yen, property_count, average_building_age_years,
  noi_yield_pct, unrealized_gain_loss_pct, annual_distribution_yen, roe_pct,
  interest_bearing_debt_ratio_pct, source_id
)
select
  r.id, '2025-08-31', 480500000000, 289, 18.4, 5.2, 22.8, 6140, 3.1, 42.5,
  (select id from public.sources where code = 'japan_reit_com')
from public.reits r where r.securities_code = '3269';

insert into public.reit_distributions (reit_id, fiscal_period_end, distribution_per_unit_yen, is_forecast, source_id)
select
  r.id, '2026-02-28', 3090, true,
  (select id from public.sources where code = 'japan_reit_com')
from public.reits r where r.securities_code = '3269';

insert into public.reit_distributions (reit_id, fiscal_period_end, distribution_per_unit_yen, is_forecast, source_id)
select
  r.id, '2025-08-31', 3050, false,
  (select id from public.sources where code = 'japan_reit_com')
from public.reits r where r.securities_code = '3269';

insert into public.properties (id, name, address, prefecture, region_id, use_type, built_year) values
  (
    '00000000-0000-0000-0000-000000000001', 'サンプルレジデンス渋谷',
    '東京都渋谷区1-1-1', '東京都',
    (select id from public.regions where name = '東京都主要５区'),
    'residential', 2015
  ),
  (
    '00000000-0000-0000-0000-000000000002', 'サンプルオフィスビル大阪',
    '大阪府大阪市北区2-2-2', '大阪府',
    (select id from public.regions where name = '近畿地区'),
    'office', 2005
  ),
  (
    '00000000-0000-0000-0000-000000000003', 'サンプル物流センター横浜',
    '神奈川県横浜市中区3-3-3', '神奈川県',
    (select id from public.regions where name = '関東地区'),
    'logistics', 2018
  );

insert into public.acquisitions (
  property_id, reit_id, acquisition_date, acquisition_price_yen, acquisition_cap_rate, ownership_ratio, source_id
)
select
  '00000000-0000-0000-0000-000000000001',
  (select id from public.reits where securities_code = '3269'),
  '2024-04-01', 6800000000, 4.200, 100.00,
  (select id from public.sources where code = 'japan_reit_com');

insert into public.acquisitions (
  property_id, reit_id, acquisition_date, acquisition_price_yen, acquisition_cap_rate, ownership_ratio, source_id
)
select
  '00000000-0000-0000-0000-000000000002',
  (select id from public.reits where securities_code = '8963'),
  '2022-09-15', 12000000000, 4.500, 50.00,
  (select id from public.sources where code = 'japan_reit_com');

-- 准共有: same office building, a second REIT holds the other half.
insert into public.acquisitions (
  property_id, reit_id, acquisition_date, acquisition_price_yen, acquisition_cap_rate, ownership_ratio, source_id
)
select
  '00000000-0000-0000-0000-000000000002',
  (select id from public.reits where securities_code = '3269'),
  '2022-09-15', 12000000000, 4.500, 50.00,
  (select id from public.sources where code = 'japan_reit_com');

insert into public.acquisitions (
  property_id, reit_id, acquisition_date, acquisition_price_yen, acquisition_cap_rate, ownership_ratio, source_id
)
select
  '00000000-0000-0000-0000-000000000003',
  (select id from public.reits where securities_code = '8985'),
  '2020-01-20', 4200000000, 5.100, 100.00,
  (select id from public.sources where code = 'japan_reit_com');

-- Later disposed by the same REIT that acquired it (logistics center sold).
insert into public.dispositions (
  property_id, reit_id, disposition_date, disposition_price_yen, gain_loss_yen, ownership_ratio, source_id
)
select
  '00000000-0000-0000-0000-000000000003',
  (select id from public.reits where securities_code = '8985'),
  '2026-02-10', 4600000000, 400000000, 100.00,
  (select id from public.sources where code = 'japan_reit_com');
