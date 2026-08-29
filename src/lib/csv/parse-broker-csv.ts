import { parseRakutenCsv } from "./parse-rakuten-csv";
import { parseSbiCsv } from "./parse-sbi-csv";
import type { CsvParseResult } from "./types";

export type Broker = "sbi" | "rakuten";

export function parseBrokerCsv(broker: Broker, buffer: Buffer): CsvParseResult {
  switch (broker) {
    case "sbi":
      return parseSbiCsv(buffer);
    case "rakuten":
      return parseRakutenCsv(buffer);
  }
}
