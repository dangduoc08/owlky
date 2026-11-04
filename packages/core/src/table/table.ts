/*
 * Table logic shared by React (stories, apps) and the HTML runtime: comparing cell values, the
 * next sort direction, page ranges and the selection state of a "select all" checkbox.
 */
import type { TableSortDirection } from "../anatomy/anatomy.js";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
/** Plain numbers, with optional thousands separators: "1,324,171,354", "-3.5". */
const NUMBER = /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/;

/**
 * Compares two cell values: numerically when both are numbers, otherwise as text (locale-aware,
 * numeric-aware, case-insensitive). Ascending order; negate for descending.
 */
export function compareCellValues(a: string, b: string): number {
  const x = a.trim();
  const y = b.trim();
  if (NUMBER.test(x) && NUMBER.test(y)) {
    return Number(x.replaceAll(",", "")) - Number(y.replaceAll(",", ""));
  }
  return collator.compare(x, y);
}

/** Clicking a sort label: an active column flips, another one starts ascending. */
export const nextSortDirection = (
  active: boolean,
  direction: TableSortDirection,
): TableSortDirection => (active && direction === "asc" ? "desc" : "asc");

export interface PageRange {
  /** 1-based index of the first row shown (0 when there are no rows). */
  from: number;
  /** 1-based index of the last row shown. */
  to: number;
  /** Total rows; `-1` = unknown (server-side). */
  count: number;
  /** 0-based page. */
  page: number;
}

/** Rows shown by a page. `rowsPerPage` `-1` shows every row. */
export function pageRange(page: number, rowsPerPage: number, count: number): PageRange {
  if (rowsPerPage === -1) return { from: count === 0 ? 0 : 1, to: count, count, page: 0 };
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = count === -1 ? (page + 1) * rowsPerPage : Math.min(count, (page + 1) * rowsPerPage);
  return { from, to, count, page };
}

/** Last valid 0-based page (`count` `-1` = unknown: no last page). */
export const lastPage = (rowsPerPage: number, count: number) =>
  count === -1 ? Number.POSITIVE_INFINITY : Math.max(0, Math.ceil(count / rowsPerPage) - 1);

/** The default "1–5 of 12" label (MUI's wording). */
export const defaultLabelDisplayedRows = ({ from, to, count }: PageRange) =>
  `${from}–${to} of ${count === -1 ? `more than ${to}` : count}`;

export type PaginationAction = "first" | "previous" | "next" | "last";

/** Default accessible names of the pagination buttons. */
export const defaultPaginationLabel = (type: PaginationAction) => `Go to ${type} page`;

/** State of a "select all" checkbox for `selected` of `total` rows. */
export const selectAllState = (selected: number, total: number) => ({
  checked: total > 0 && selected === total,
  indeterminate: selected > 0 && selected < total,
});
