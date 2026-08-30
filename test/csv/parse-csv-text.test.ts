import { describe, expect, it } from "vitest";
import { parseCsvText } from "@/lib/csv/parse-csv-text";

describe("parseCsvText", () => {
  it("parses simple comma-separated rows", () => {
    const rows = parseCsvText("a,b,c\n1,2,3");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with embedded commas", () => {
    const rows = parseCsvText('name,note\n"アドバンス, レジデンス",ok');
    expect(rows).toEqual([
      ["name", "note"],
      ["アドバンス, レジデンス", "ok"],
    ]);
  });

  it("handles escaped double quotes inside quoted fields", () => {
    const rows = parseCsvText('a\n"say ""hi"""');
    expect(rows).toEqual([["a"], ['say "hi"']]);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCsvText("a,b\r\n1,2\r\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("skips blank trailing lines", () => {
    const rows = parseCsvText("a,b\n1,2\n\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});
