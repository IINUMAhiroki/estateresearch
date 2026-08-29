import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadReitCodeMap } from "../../scripts/sync/lib/edinet-codes";

const FIXTURE_PATH = path.join(
  import.meta.dirname,
  "fixtures",
  "reit-fund-codes-sample.csv",
);

describe("loadReitCodeMap", () => {
  it("loads all rows keyed by edinet_code", () => {
    const map = loadReitCodeMap(FIXTURE_PATH);
    expect(map.size).toBe(3);
  });

  it("parses securities_code and name correctly", () => {
    const map = loadReitCodeMap(FIXTURE_PATH);
    expect(map.get("E24347")).toEqual({
      edinetCode: "E24347",
      securitiesCode: "3269",
      name: "アドバンス・レジデンス投資法人",
    });
  });

  it("handles alphanumeric securities codes", () => {
    const map = loadReitCodeMap(FIXTURE_PATH);
    expect(map.get("E40695")?.securitiesCode).toBe("401A");
  });
});
