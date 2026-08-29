-- Seed data for local development. Writes to public.properties bypass RLS
-- because this runs via the postgres role during `supabase db reset`.
insert into public.properties (name, address, prefecture, price_yen, built_year)
values
  ('サンプルマンション A棟', '東京都渋谷区1-1-1', '東京都', 68000000, 2015),
  ('サンプルマンション B棟', '大阪府大阪市北区2-2-2', '大阪府', 42000000, 2008),
  ('サンプル戸建て', '神奈川県横浜市中区3-3-3', '神奈川県', 55000000, 1998);
