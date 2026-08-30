/**
 * Narrow types for the fields this sync actually reads from fudosandb.jp
 * responses. Deliberately not exhaustive (the API returns 30+ columns per
 * row, many asset-type-specific) — the full raw row is always stored in
 * raw_transactions.raw_payload regardless, so nothing is lost by typing
 * only what we consume here.
 */
export type FudosandbAcquisitionRow = {
  edinet_code: string | null;
  reit_name: string | null;
  property_name: string | null;
  location: string | null;
  use_type: string | null;
  year_built: string | null;
  acquisition_date: string | null;
  acquisition_million_yen: number | null;
  acquisition_noi_cap_rate_pct: number | null;
  seller: string | null;
  [key: string]: unknown;
};

export type FudosandbSaleRow = {
  edinet_code: string | null;
  reit_name: string | null;
  property_name: string | null;
  location: string | null;
  use_type: string | null;
  sale_date: string | null;
  sale_price_million_yen: number | null;
  gain_loss_million_yen: number | null;
  buyer: string | null;
  [key: string]: unknown;
};
