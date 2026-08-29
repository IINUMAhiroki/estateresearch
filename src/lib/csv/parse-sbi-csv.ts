import type { CsvParseResult } from "./types";

/**
 * SBI証券の取引履歴CSVをパースする。
 *
 * 未実装: SBI証券のCSVエクスポートは Shift_JIS(CP932) が一般的（UTF-8 では
 * ない）と想定されるが、正確な列名・列構成は実サンプルを見るまで未確認。
 * 実サンプルCSVを入手してから、iconv-lite でデコードし列マッピングを実装する。
 */
export function parseSbiCsv(_buffer: Buffer): CsvParseResult {
  throw new Error(
    "SBI証券CSVの列マッピングは未実装です。実サンプルファイルを確認してから実装してください。",
  );
}
