/*
 * Data grid generated columns (roadmap 4.18.14, ADR-0057; ApexGrid `autoGenerate`): the columns
 * and their types from the rows' fields, for React (`columns` left out) and the HTML runtime (a
 * data table in the markup).
 */
import type { GridColumn, GridColumnType } from "./data-grid.js";

/** Rows looked at to find the fields and their types. */
export const GRID_AUTO_SAMPLE = 200;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

const blank = (value: unknown) => value === null || value === undefined || value === "";
const atMidnight = (date: Date) =>
  date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

/**
 * A column type from its values (blanks left out): `number`, `boolean`, `date` (dates, or
 * `YYYY-MM-DD` text), `dateTime` (dates with a time, ISO date times) or `string`. `fromText` reads
 * text as a table cell holds it: "42" is a number, "true" a boolean.
 */
export function gridInferColumnType(values: readonly unknown[], fromText = false): GridColumnType {
  const own = values.filter((value) => !blank(value));
  if (own.length === 0) return "string";
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : null);
  const every = (test: (value: unknown) => boolean) => own.every(test);
  if (every((v) => typeof v === "boolean" || (fromText && /^(true|false)$/.test(text(v) ?? ""))))
    return "boolean";
  if (
    every(
      (v) =>
        (typeof v === "number" && Number.isFinite(v)) || (fromText && NUMBER.test(text(v) ?? "")),
    )
  )
    return "number";
  const dateOf = (v: unknown): "date" | "dateTime" | null => {
    if (v instanceof Date)
      return Number.isNaN(v.getTime()) ? null : atMidnight(v) ? "date" : "dateTime";
    const t = text(v);
    if (t === null) return null;
    if (DATE.test(t)) return Number.isNaN(Date.parse(t)) ? null : "date";
    if (DATE_TIME.test(t)) return Number.isNaN(Date.parse(t)) ? null : "dateTime";
    return null;
  };
  const kinds = own.map(dateOf);
  if (kinds.every((kind) => kind !== null)) return kinds.includes("dateTime") ? "dateTime" : "date";
  return "string";
}

/**
 * A header from a field name: words split at capitals, `_`, `-` and spaces, in sentence case, with
 * acronyms kept ("firstName" → "First name", "unit_price" → "Unit price", "userID" → "User ID";
 * "id" → "ID").
 */
export function gridHeaderName(field: string): string {
  const words = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (words.length === 0) return field;
  return words
    .map((word, index) => {
      if (/^id$/i.test(word)) return "ID";
      if (word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

/** What `gridAutoColumns` reads: rows as objects, or (HTML) their fields and texts. */
export interface GridAutoColumnsOptions {
  /** Values are text from table cells (see `gridInferColumnType`). */
  fromText?: boolean | undefined;
  /** Rows looked at. Default `GRID_AUTO_SAMPLE`. */
  sample?: number | undefined;
}

/**
 * Columns from rows (ApexGrid `autoGenerate`): one per field, in the order the fields first appear,
 * typed from their values, headers from the field names. They share the width (`flex: 1`) and are
 * at least 120px wide.
 */
export function gridAutoColumns(
  rows: readonly unknown[],
  options: GridAutoColumnsOptions = {},
): GridColumn[] {
  const sample = rows.slice(0, options.sample ?? GRID_AUTO_SAMPLE);
  const fields: string[] = [];
  for (const row of sample) {
    if (!row || typeof row !== "object") continue;
    for (const field of Object.keys(row))
      if (!fields.includes(field) && !["__proto__", "constructor", "prototype"].includes(field))
        fields.push(field);
  }
  return fields.map((field) => ({
    field,
    headerName: gridHeaderName(field),
    type: gridInferColumnType(
      sample.map((row) => (row as Record<string, unknown> | null)?.[field]),
      !!options.fromText,
    ),
    flex: 1,
    minWidth: 120,
  }));
}

/** A table cell's text as the value of a generated column of `type` (blank: `null`). */
export function gridAutoValue(text: string, type: GridColumnType): unknown {
  const own = text.trim();
  if (own === "") return null;
  if (type === "number") return Number(own);
  if (type === "boolean") return own === "true";
  return own;
}
