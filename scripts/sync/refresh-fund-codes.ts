/**
 * Manual/occasional-use maintenance script — NOT part of the daily sync
 * cron. Refreshes scripts/sync/data/reit-fund-codes.csv from EDINET's
 * official fund code list.
 *
 * Why this needs a browser at all: EDINET's download page
 * (https://disclosure2.edinet-fsa.go.jp/weee0010.aspx) generates the ZIP
 * client-side as a base64 data: URL triggered by an onclick handler — there
 * is no static HTTP endpoint to fetch with plain `fetch()`. J-REIT listings
 * change only a few times a year, so re-running this by hand periodically
 * (rather than wiring it into the daily automated sync) is the pragmatic
 * tradeoff.
 *
 * Requires the `unzip` CLI to be on PATH (present on macOS/Linux/GitHub
 * Actions runners by default) — avoids pulling in a JS zip library for a
 * script that runs a few times a year at most.
 *
 * Usage: pnpm exec tsx scripts/sync/refresh-fund-codes.ts
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import iconv from "iconv-lite";
import { chromium } from "playwright-core";

const OUTPUT_PATH = path.join(
  import.meta.dirname,
  "data",
  "reit-fund-codes.csv",
);

async function downloadFundCodeZip(): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto("https://disclosure2.edinet-fsa.go.jp/weee0010.aspx");
    const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
    await page.evaluate(() => {
      // biome-ignore lint/suspicious/noExplicitAny: page-global function injected by EDINET's own script
      (window as any).onDownloadFund();
    });
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    if (!stream) throw new Error("download stream unavailable");
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks);
  } finally {
    await browser.close();
  }
}

function extractFundCodeCsv(zipBuffer: Buffer): Buffer {
  const dir = mkdtempSync(path.join(tmpdir(), "edinet-fund-"));
  try {
    const zipPath = path.join(dir, "fund.zip");
    writeFileSync(zipPath, zipBuffer);
    execFileSync("unzip", ["-o", zipPath, "-d", dir]);
    const csvPath = path.join(dir, "FundcodeDlInfo.csv");
    return readFileSync(csvPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function parseCsvLine(line: string): string[] {
  // Simple quoted-CSV split — good enough for EDINET's plain comma-quoted format.
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

// JPX lists infrastructure funds separately from its 58-issue J-REIT market
// (インフラファンド市場, not 不動産投資信託証券). EDINET's
// "内国投資証券" filing kind doesn't distinguish the two, so exclude these
// known infrastructure-fund EDINET codes by hand to match JPX's REIT count.
const INFRASTRUCTURE_FUND_EDINET_CODES = new Set([
  "E32725", // いちごグリーンインフラ投資法人
  "E33433", // カナディアン・ソーラー・インフラ投資法人
  "E34255", // 東京インフラ・エネルギー投資法人
]);

async function main() {
  console.log("downloading fund code list from EDINET...");
  const zipBuffer = await downloadFundCodeZip();
  const csvBuffer = extractFundCodeCsv(zipBuffer);

  const text = iconv.decode(csvBuffer, "Shift_JIS");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  // lines[0] is a "ダウンロード実行日,...,件数,N件" metadata line, lines[1] is the header.
  const rows = lines.slice(2).map(parseCsvLine);

  const reitRows: {
    edinetCode: string;
    securitiesCode: string;
    name: string;
  }[] = [];
  for (const row of rows) {
    if (row.length < 9) continue;
    const [, secCode, name, , kind, , , edinetCode] = row;
    if (kind !== "内国投資証券" || !secCode.trim()) continue;
    if (INFRASTRUCTURE_FUND_EDINET_CODES.has(edinetCode)) continue;
    // EDINET pads the displayed securities code with a trailing "0".
    reitRows.push({ edinetCode, securitiesCode: secCode.slice(0, -1), name });
  }
  reitRows.sort((a, b) => a.securitiesCode.localeCompare(b.securitiesCode));

  const csvOut = [
    "edinet_code,securities_code,name",
    ...reitRows.map((r) => `${r.edinetCode},${r.securitiesCode},"${r.name}"`),
  ].join("\n");

  writeFileSync(OUTPUT_PATH, `${csvOut}\n`, "utf-8");
  console.log(`wrote ${reitRows.length} REIT rows to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
