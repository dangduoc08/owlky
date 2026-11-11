import { describe, expect, it } from "vitest";
import type { GridColumn } from "./data-grid.js";
import {
  gridCrc32,
  gridExcelColumn,
  gridExcelDate,
  gridToXlsx,
  gridZip,
  parseGridExcelOptions,
} from "./grid-excel.js";

/** Reads a stored ZIP (the only kind gridZip writes) through its central directory. */
function unzip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const files = new Map<string, string>();
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(at, true)).toBe(0x02014b50);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const offset = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const start = offset + 30 + view.getUint16(offset + 26, true);
    const data = bytes.subarray(start, start + size);
    expect(gridCrc32(data)).toBe(crc);
    files.set(name, decoder.decode(data));
    at += 46 + nameLength;
  }
  return files;
}

describe("zip", () => {
  it("computes CRC-32", () => {
    expect(gridCrc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    expect(gridCrc32(new Uint8Array())).toBe(0);
  });

  it("stores files that read back", () => {
    const files = unzip(
      gridZip([
        { name: "a.txt", data: new TextEncoder().encode("hello") },
        { name: "dir/é.txt", data: new TextEncoder().encode("") },
      ]),
    );
    expect([...files]).toEqual([
      ["a.txt", "hello"],
      ["dir/é.txt", ""],
    ]);
  });
});

describe("xlsx", () => {
  type Row = Record<string, unknown>;
  const columns: GridColumn[] = [
    { field: "name", headerName: "Name", width: 140 },
    { field: "age", headerName: "Age", type: "number" },
    { field: "active", headerName: "Active", type: "boolean" },
    { field: "born", headerName: "Born", type: "date" },
    { field: "seen", type: "dateTime" },
    { field: "actions", type: "actions" },
  ];
  const rows: Row[] = [
    {
      name: '=HYPERLINK("x") & <b>\u0001',
      age: 30,
      active: true,
      born: "2000-01-01",
      seen: "2025-05-01T12:00",
    },
    { name: "", age: "n/a", active: "maybe", born: "nope", seen: null },
    { name: "Bo", age: "", active: "false", born: new Date(Date.UTC(1900, 0, 1)), seen: "" },
  ];
  const value = (row: Row, field: string) => row[field];
  const text = (row: Row, field: string) => String(row[field] ?? "");

  it("writes typed cells, bold headers and escaped text (never formulas)", () => {
    const files = unzip(gridToXlsx(columns, rows, value, text, { sheetName: "My [data]:*?/\\" }));
    expect([...files.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    expect(files.get("xl/workbook.xml")).toContain('<sheet name="My data"');
    const sheet = files.get("xl/worksheets/sheet1.xml") as string;
    expect(sheet).toContain('<c r="A1" t="inlineStr" s="3"><is><t xml:space="preserve">Name</t>');
    expect(sheet).toContain('<c r="E1" t="inlineStr" s="3"><is><t xml:space="preserve">seen</t>');
    expect(sheet).not.toContain("F1");
    expect(sheet).toContain(
      '<t xml:space="preserve">=HYPERLINK(&quot;x&quot;) &amp; &lt;b&gt;</t>',
    );
    expect(sheet).not.toContain("<f>");
    expect(sheet).toContain('<c r="B2"><v>30</v></c>');
    expect(sheet).toContain('<c r="C2" t="b"><v>1</v></c>');
    expect(sheet).toContain('<c r="D2" s="1"><v>36526</v></c>');
    expect(sheet).toMatch(/<c r="E2" s="2"><v>45778\.5<\/v><\/c>/);
    expect(sheet).toContain('<c r="A3"/>');
    expect(sheet).toContain('<c r="B3" t="inlineStr"><is><t xml:space="preserve">n/a</t>');
    expect(sheet).toContain('<c r="C3" t="inlineStr"><is><t xml:space="preserve">maybe</t>');
    expect(sheet).toContain('<c r="D3" t="inlineStr"><is><t xml:space="preserve">nope</t>');
    expect(sheet).toContain('<c r="E3"/>');
    expect(sheet).toContain('<c r="B4"/>');
    expect(sheet).toContain('<c r="C4" t="b"><v>0</v></c>');
    expect(sheet).toContain('<col min="1" max="1" width="20" customWidth="1"/>');
    expect(files.get("xl/styles.xml")).toContain('numFmtId="14"');
  });

  it("leaves out headers when asked and names the default sheet", () => {
    const files = unzip(
      gridToXlsx(columns.slice(0, 1), [], value, text, { includeHeaders: false }),
    );
    expect(files.get("xl/workbook.xml")).toContain('<sheet name="Sheet1"');
    expect(files.get("xl/worksheets/sheet1.xml")).toContain("<sheetData></sheetData>");
    const none = unzip(gridToXlsx([], [], value, text));
    expect(none.get("xl/worksheets/sheet1.xml")).not.toContain("<cols>");
  });

  it("names columns and converts dates", () => {
    expect([0, 25, 26, 27, 701, 702].map(gridExcelColumn)).toEqual([
      "A",
      "Z",
      "AA",
      "AB",
      "ZZ",
      "AAA",
    ]);
    expect(gridExcelDate("1899-12-31", "date")).toBe(1);
    expect(gridExcelDate(null, "date")).toBeNull();
    expect(gridExcelDate("", "date")).toBeNull();
    expect(gridExcelDate("x", "dateTime")).toBeNull();
  });

  it("parses options from untrusted JSON", () => {
    expect(
      parseGridExcelOptions(
        '{"fileName":"f","sheetName":"s","includeHeaders":false,"allColumns":true,"fields":["a",1],"evil":1}',
      ),
    ).toEqual({
      fileName: "f",
      sheetName: "s",
      includeHeaders: false,
      allColumns: true,
      fields: ["a"],
    });
    expect(parseGridExcelOptions('{"fileName":1}')).toEqual({});
    expect(parseGridExcelOptions('{"source":"all"}')).toEqual({ source: "all" });
    expect(parseGridExcelOptions('{"source":"x"}')).toEqual({});
    expect(parseGridExcelOptions("[]")).toEqual({});
    expect(parseGridExcelOptions("{")).toEqual({});
    expect(parseGridExcelOptions(null)).toEqual({});
  });
});
