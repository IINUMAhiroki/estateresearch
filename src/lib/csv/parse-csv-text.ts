/**
 * Minimal RFC4180-ish CSV parser: handles quoted fields (including embedded
 * commas/newlines and "" escaped quotes). Pure and isomorphic — used both
 * client-side (import preview) and server-side (Server Action) so the
 * preview a user sees is guaranteed to match what actually gets imported.
 */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\r") {
      // Skip; \r\n handled via the following \n, bare \r treated as a line end below.
      if (text[i + 1] !== "\n") pushRow();
    } else if (ch === "\n") {
      pushRow();
    } else {
      field += ch;
    }
  }

  // Trailing field/row not yet terminated by a newline.
  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
