const BASE_URL = "https://fudosandb.jp/v1";
const MAX_PER_PAGE = 200;
// Defensive cap: even at MAX_PER_PAGE this covers 10,000 rows, far beyond
// any endpoint this sync uses today. Exists so a pagination
// misunderstanding (server not honoring `page`, `count` meaning something
// other than "total rows", etc.) burns at most this many requests instead
// of silently draining the whole daily quota — which is exactly what
// happened once already during development (see CLAUDE.md/PR history).
const MAX_PAGES = 50;

export class RateLimitExhaustedError extends Error {
  constructor(remaining: number) {
    super(
      `fudosandb.jp rate limit nearly exhausted (remaining=${remaining}), stopping sync early`,
    );
    this.name = "RateLimitExhaustedError";
  }
}

type FudosandbListResponse<TKey extends string, TRow> = {
  data: { count: number } & { [K in TKey]: TRow[] };
};

/**
 * Fetches every page of a fudosandb.jp list endpoint, stopping (without
 * throwing) once the endpoint is exhausted, or throwing RateLimitExhaustedError
 * if the daily quota is close to running out so the sync can resume tomorrow
 * instead of hitting a 429 mid-run.
 */
export async function fetchAllPages<TKey extends string, TRow>(
  endpoint: string,
  dataKey: TKey,
  apiKey: string,
  params: Record<string, string> = {},
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let page = 1;
  let totalCount: number | null = null;

  while (page <= MAX_PAGES) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(MAX_PER_PAGE));
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url, { headers: { "X-API-Key": apiKey } });

    const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? "0");
    if (!res.ok) {
      if (res.status === 429) throw new RateLimitExhaustedError(remaining);
      throw new Error(
        `fudosandb.jp ${endpoint} returned ${res.status}: ${await res.text()}`,
      );
    }

    const body = (await res.json()) as FudosandbListResponse<TKey, TRow>;
    const pageRows = body.data[dataKey];
    totalCount = body.data.count;
    rows.push(...pageRows);

    // Stop as soon as we've collected everything the API says exists, not
    // just when a page comes back short — a total that's an exact multiple
    // of per_page (e.g. 200 total / 200 per_page) would otherwise never
    // satisfy `pageRows.length < MAX_PER_PAGE` and loop forever.
    if (pageRows.length === 0 || rows.length >= totalCount) break;

    if (remaining <= 2) {
      // Leave a small margin rather than racing the exact limit.
      throw new RateLimitExhaustedError(remaining);
    }
    page += 1;
  }

  return rows;
}
