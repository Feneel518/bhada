// Parses rentals pasted from Excel / Google Sheets (tab-separated) or a CSV
// file, and expands unit ranges such as "101-110". Pure and client-safe.

export type ImportRow = {
  line: number;
  property: string;
  unit: string;
  tenant: string;
  phone: string;
  rent: number | null;
  dueDay: number;
  deposit: number | null;
  openingBalance: number | null;
  error?: string;
};

export const IMPORT_COLUMNS = [
  "Property",
  "Unit",
  "Tenant name",
  "Phone",
  "Monthly rent",
  "Due day",
  "Deposit",
  "Tenant already owes",
] as const;

type Field = "property" | "unit" | "tenant" | "phone" | "rent" | "dueDay" | "deposit" | "openingBalance";

const headerAliases: Record<Field, RegExp> = {
  property: /^(property|building|property name|society|makaan|मकान|મકાન)$/i,
  unit: /^(unit|unit no\.?|unit number|room|room no\.?|flat|flat no\.?|shop|shop no\.?|bed|कमरा|રૂમ)$/i,
  tenant: /^(tenant|tenant name|name|किरायेदार|ભાડુઆત)$/i,
  phone: /^(phone|mobile|mobile no\.?|phone number|whatsapp|contact|फ़ोन|ફોન)$/i,
  rent: /^(rent|monthly rent|rent amount|amount|किराया|ભાડું)$/i,
  dueDay: /^(due day|due date|rent due day|due)$/i,
  deposit: /^(deposit|security deposit)$/i,
  openingBalance: /^(tenant already owes|already owes|opening balance|balance|dues|pending|baki|बाकी|બાકી)$/i,
};

const defaultOrder: Field[] = ["property", "unit", "tenant", "phone", "rent", "dueDay", "deposit", "openingBalance"];

function splitLine(line: string, delimiter: string) {
  if (delimiter === "\t") return line.split("\t");
  // Minimal CSV: handles quoted fields with commas and doubled quotes.
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') { current += '"'; index++; }
      else if (character === '"') quoted = false;
      else current += character;
    } else if (character === '"') quoted = true;
    else if (character === delimiter) { cells.push(current); current = ""; }
    else current += character;
  }
  cells.push(current);
  return cells;
}

function money(raw: string) {
  const cleaned = raw.replace(/[₹,\s]|rs\.?|inr/gi, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : NaN;
}

export function parseRentalSheet(text: string): ImportRow[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trimEnd());
  const nonEmpty = lines.map((line, index) => ({ line, number: index + 1 })).filter((item) => item.line.trim());
  if (!nonEmpty.length) return [];

  const sample = nonEmpty[0].line;
  const delimiter = sample.includes("\t") ? "\t" : sample.includes(";") && !sample.includes(",") ? ";" : ",";
  const firstCells = splitLine(sample, delimiter).map((cell) => cell.trim());
  const headerMap = firstCells.map((cell) =>
    (Object.keys(headerAliases) as Field[]).find((field) => headerAliases[field].test(cell)) ?? null,
  );
  const hasHeader = headerMap.filter(Boolean).length >= 2;
  const order = hasHeader ? headerMap : defaultOrder;
  const body = hasHeader ? nonEmpty.slice(1) : nonEmpty;

  let lastProperty = "";
  return body.slice(0, 500).map(({ line, number }) => {
    const cells = splitLine(line, delimiter).map((cell) => cell.trim());
    const get = (field: Field) => {
      const index = order.indexOf(field);
      return index === -1 ? "" : cells[index] ?? "";
    };
    // Registers often leave the property blank under the first row of a building.
    const property = get("property") || lastProperty;
    lastProperty = property;
    const rent = money(get("rent"));
    const deposit = money(get("deposit"));
    const openingBalance = money(get("openingBalance"));
    const dueRaw = get("dueDay").replace(/(st|nd|rd|th)$/i, "");
    const dueDay = dueRaw ? Number(dueRaw) : 1;

    let error: string | undefined;
    if (!property) error = "Property name is missing.";
    else if (!get("unit")) error = "Unit is missing.";
    else if (Number.isNaN(rent)) error = "Rent must be a number.";
    else if (get("tenant") && !rent) error = "Add the monthly rent for this tenant.";
    else if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) error = "Due day must be 1 to 31.";
    else if (Number.isNaN(deposit) || Number.isNaN(openingBalance)) error = "Deposit and balance must be numbers.";

    return {
      line: number,
      property: property.slice(0, 120),
      unit: get("unit").slice(0, 40),
      tenant: get("tenant").slice(0, 120),
      phone: get("phone").slice(0, 30),
      rent: Number.isNaN(rent) ? null : rent,
      dueDay: Number.isInteger(dueDay) ? dueDay : 1,
      deposit: Number.isNaN(deposit) ? null : deposit,
      openingBalance: Number.isNaN(openingBalance) ? null : openingBalance,
      error,
    };
  });
}

/** "101-110", "A1 to A5", "G1, G2, 1st floor" → individual unit numbers (max 100). */
export function expandUnitNumbers(input: string): string[] {
  const parts = input.split(/[,\n]/).map((part) => part.trim()).filter(Boolean);
  const units: string[] = [];
  for (const part of parts) {
    const range = /^([A-Za-z]*[-/ ]?)(\d+)\s*(?:-|–|to)\s*\1?(\d+)$/i.exec(part);
    if (range) {
      const [, prefix, startRaw, endRaw] = range;
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (end >= start && end - start < 100) {
        for (let value = start; value <= end; value++) {
          units.push(`${prefix}${String(value).padStart(startRaw.length, "0")}`);
        }
        continue;
      }
    }
    units.push(part);
  }
  return [...new Set(units)].slice(0, 100);
}

export function templateCsv() {
  return [
    IMPORT_COLUMNS.join(","),
    "Shanti Residency,101,Aarav Mehta,9876543210,15000,5,30000,0",
    "Shanti Residency,102,Priya Shah,9898989898,14000,5,28000,2000",
    "Shanti Residency,103,,,,,,",
  ].join("\n");
}
