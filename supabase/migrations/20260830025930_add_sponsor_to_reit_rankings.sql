-- /reits and /rankings are being merged into a single sortable REIT list
-- (only 58 issues total, so a separate plain list added no value). The
-- merged page needs `sponsor` alongside the existing ranking columns;
-- appending it preserves the view's existing grants (create or replace
-- view only allows adding columns at the end, not reordering/removing).
create or replace view public.reit_rankings
with (security_invoker = true) as
select
  r.id as reit_id,
  r.securities_code,
  r.name,
  r.primary_use_type,
  snap.snapshot_date,
  snap.unit_price_yen,
  snap.unit_price_change_pct,
  snap.distribution_yield_pct,
  snap.nav_per_unit_yen,
  snap.nav_multiple,
  snap.market_cap_yen,
  snap.trading_volume_units,
  metrics.fiscal_period_end,
  metrics.asset_size_yen,
  metrics.property_count,
  metrics.average_building_age_years,
  metrics.noi_yield_pct,
  metrics.unrealized_gain_loss_pct,
  metrics.annual_distribution_yen,
  metrics.roe_pct,
  metrics.interest_bearing_debt_ratio_pct,
  r.sponsor
from public.reits r
left join lateral (
  select *
  from public.reit_market_snapshots s
  where s.reit_id = r.id
  order by s.snapshot_date desc
  limit 1
) snap on true
left join lateral (
  select *
  from public.reit_portfolio_metrics m
  where m.reit_id = r.id
  order by m.fiscal_period_end desc
  limit 1
) metrics on true;
