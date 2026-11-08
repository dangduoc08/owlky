/*
 * Excel export of the data grid (phase 6, ADR-0021): a minimal Office Open XML workbook (one sheet,
 * inline strings, typed numbers, booleans and dates) in a stored (uncompressed) ZIP, written here
 * so the grid needs no dependency. Text is never written as a formula: exported data may come
 * from users.
 */
import type { GridColumn } from "./data-grid.js";

/* ------------------------------------------------------------------ ZIP (stored) */

let crcTable: Uint32Array | null = null;
/** CRC-32 (ZIP, PNG) of bytes. */
export function gridCrc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** A ZIP archive of the files, stored without compression (fixed dates: the output is stable). */
export function gridZip(files: readonly { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  // 1980-01-01 00:00 in MS-DOS format.
  const date = (0 << 9) | (1 << 5) | 1;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = gridCrc32(file.data);
    const size = file.data.length;
    const local = new Uint8Array(30 + name.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, 0x0800, true); // UTF-8 names
    l.setUint16(8, 0, true); // stored
    l.setUint16(10, 0, true);
    l.setUint16(12, date, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, size, true);
    l.setUint32(22, size, true);
    l.setUint16(26, name.length, true);
    local.set(name, 30);
    const entry = new Uint8Array(46 + name.length);
    const c = new DataView(entry.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(14, date, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, size, true);
    c.setUint32(24, size, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    entry.set(name, 46);
    parts.push(local, file.data);
    central.push(entry);
    offset += local.length + size;
  }
  const centralSize = central.reduce((sum, e) => sum + e.length, 0);
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, files.length, true);
  e.setUint16(10, files.length, true);
  e.setUint32(12, centralSize, true);
  e.setUint32(16, offset, true);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const part of all) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/* ------------------------------------------------------------------ SpreadsheetML */

/** Excel export options (MUI X `excelOptions`). */
export interface GridExcelOptions {
  /** File name without `.xlsx`. */
  fileName?: string | undefined;
  /** Default true. */
  includeHeaders?: boolean | undefined;
  /** Fields to export, in this order (default: the shown columns). */
  fields?: readonly string[] | undefined;
  /** Hidden columns too. */
  allColumns?: boolean | undefined;
  /** Default "Sheet1" (at most 31 characters, without `[]:*?/\`). */
  sheetName?: string | undefined;
}

/** XML text: escaped, characters XML can't hold dropped. */
const xml = (text: string) =>
  text
    // biome-ignore lint/suspicious/noControlCharactersInRegex: XML 1.0 forbids these characters.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** A column letter: 0 → A, 26 → AA. */
export const gridExcelColumn = (index: number): string => {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};

/** Days since 1899-12-30 (Excel's date serial) of a date value, or null. */
export function gridExcelDate(value: unknown, type: "date" | "dateTime"): number | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  // ISO dates without a time are UTC days; anything else is the local wall clock.
  const utc =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? time
      : time - date.getTimezoneOffset() * 60_000;
  const serial = (utc - Date.UTC(1899, 11, 30)) / 86_400_000;
  return type === "date" ? Math.floor(serial) : Math.round(serial * 86_400) / 86_400;
}

const sheetNameOf = (name: string | undefined) => {
  const clean = (name ?? "").replace(/[[\]:*?/\\]/g, "").slice(0, 31);
  return clean || "Sheet1";
};

/**
 * The workbook (.xlsx bytes) of the columns (header names, bold) and rows: numbers, booleans and
 * dates as typed cells (dates with a date format), everything else as its text.
 */
export function gridToXlsx<R>(
  columns: readonly GridColumn[],
  rows: readonly R[],
  value: (row: R, field: string) => unknown,
  text: (row: R, field: string) => string,
  options: GridExcelOptions = {},
): Uint8Array {
  const exported = columns.filter((column) => column.type !== "actions");
  const lines: string[] = [];
  const stringCell = (ref: string, content: string, style = 0) =>
    `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t xml:space="preserve">${xml(content)}</t></is></c>`;
  let r = 0;
  if (options.includeHeaders !== false) {
    r++;
    lines.push(
      `<row r="${r}">${exported
        .map((c, i) => stringCell(`${gridExcelColumn(i)}${r}`, c.headerName ?? c.field, 3))
        .join("")}</row>`,
    );
  }
  for (const row of rows) {
    r++;
    const cells = exported.map((column, i) => {
      const ref = `${gridExcelColumn(i)}${r}`;
      const raw = value(row, column.field);
      if (column.type === "number") {
        const n = typeof raw === "number" ? raw : raw === "" || raw == null ? NaN : Number(raw);
        if (Number.isFinite(n)) return `<c r="${ref}"><v>${n}</v></c>`;
      }
      if (
        column.type === "boolean" &&
        (typeof raw === "boolean" || raw === "true" || raw === "false")
      )
        return `<c r="${ref}" t="b"><v>${raw === true || raw === "true" ? 1 : 0}</v></c>`;
      if (column.type === "date" || column.type === "dateTime") {
        const serial = gridExcelDate(raw, column.type);
        if (serial !== null)
          return `<c r="${ref}" s="${column.type === "date" ? 1 : 2}"><v>${serial}</v></c>`;
      }
      const shown = text(row, column.field);
      return shown === "" ? `<c r="${ref}"/>` : stringCell(ref, shown);
    });
    lines.push(`<row r="${r}">${cells.join("")}</row>`);
  }
  // Column widths in characters (about 7px each), from the columns' px widths.
  const cols = exported
    .map(
      (c, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${Math.max(Math.round((c.width ?? 100) / 7), 8)}" customWidth="1"/>`,
    )
    .join("");
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const sheet = `${head}<worksheet xmlns="${main}">${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${lines.join("")}</sheetData></worksheet>`;
  const styles = `${head}<styleSheet xmlns="${main}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="22" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;
  const workbook = `${head}<workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="${xml(sheetNameOf(options.sheetName))}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRels = `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`;
  const rootRels = `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const ct = "application/vnd.openxmlformats-officedocument.spreadsheetml";
  const types = `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${ct}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${ct}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${ct}.styles+xml"/></Types>`;
  const encoder = new TextEncoder();
  return gridZip([
    { name: "[Content_Types].xml", data: encoder.encode(types) },
    { name: "_rels/.rels", data: encoder.encode(rootRels) },
    { name: "xl/workbook.xml", data: encoder.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(workbookRels) },
    { name: "xl/styles.xml", data: encoder.encode(styles) },
    { name: "xl/worksheets/sheet1.xml", data: encoder.encode(sheet) },
  ]);
}

/** The media type of .xlsx files. */
export const GRID_XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Excel options from an attribute's JSON (`data-ok-excel-options`): known keys only. */
export function parseGridExcelOptions(json: string | null): GridExcelOptions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json ?? "null");
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const value = parsed as Record<string, unknown>;
  const out: GridExcelOptions = {};
  if (typeof value["fileName"] === "string") out.fileName = value["fileName"];
  if (typeof value["sheetName"] === "string") out.sheetName = value["sheetName"];
  if (typeof value["includeHeaders"] === "boolean") out.includeHeaders = value["includeHeaders"];
  if (typeof value["allColumns"] === "boolean") out.allColumns = value["allColumns"];
  if (Array.isArray(value["fields"]))
    out.fields = value["fields"].filter((f): f is string => typeof f === "string");
  return out;
}
