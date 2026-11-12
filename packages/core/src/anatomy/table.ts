import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Table ------------------------------------------------------------------------------------

export const tableSizes = ["medium", "small"] as const;
export const tablePaddings = ["normal", "checkbox", "none"] as const;
export const tableAligns = ["inherit", "left", "center", "right", "justify"] as const;
export const tableSortDirections = ["asc", "desc"] as const;
export type TableSize = (typeof tableSizes)[number];
export type TablePadding = (typeof tablePaddings)[number];
export type TableAlign = (typeof tableAligns)[number];
export type TableSortDirection = (typeof tableSortDirections)[number];

export const tableOptions = defineOptions("table", "data-ok-table", {
  size: style("data-ok-size", tableSizes, "medium", "Cell height (`small` = dense)."),
  padding: style(
    "data-ok-padding",
    tablePaddings,
    "normal",
    "Cell padding (`checkbox` for a selection column).",
  ),
  stickyHeader: flag(
    "data-ok-sticky-header",
    "Header stays visible while a height-limited container scrolls.",
  ),
  sort: state(
    "aria-sort",
    "Sorted column (`TableSortLabel` + app state; HTML sorts rows).",
    "sort",
  ),
  selected: state("data-ok-selected", "Selected rows (app state; HTML: row checkboxes).", "select"),
  expanded: state("aria-expanded", "Open detail rows (`TableExpandButton`).", "expand"),
});

export interface TableAnatomyOptions {
  size?: TableSize | undefined;
  padding?: TablePadding | undefined;
  stickyHeader?: boolean | undefined;
}

/** `data-ok-*` attributes of a `<table>`. */
export const tableAttributes = (options: TableAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tableOptions, { ...options });

export interface TableCellAnatomyOptions {
  align?: TableAlign | undefined;
  padding?: TablePadding | undefined;
  size?: TableSize | undefined;
}

const allowed = <V extends string>(values: readonly V[], value: unknown): value is V =>
  values.includes(value as V);

/** Per-cell overrides (only the given, valid ones; a cell inherits the table's otherwise). */
export const tableCellAttributes = (options: TableCellAnatomyOptions = {}): DataAttributes => {
  const attributes: DataAttributes = {};
  if (allowed(tableAligns, options.align) && options.align !== "inherit")
    attributes["data-ok-align"] = options.align;
  if (allowed(tablePaddings, options.padding)) attributes["data-ok-padding"] = options.padding;
  if (allowed(tableSizes, options.size)) attributes["data-ok-size"] = options.size;
  return attributes;
};

export const tableSortLabelOptions = defineOptions("table-sort-label", "data-ok-table-sort-label", {
  active: flag("data-ok-active", "The table is sorted by this column."),
  direction: style("data-ok-direction", tableSortDirections, "asc", "Arrow direction."),
  hideSortIcon: flag("data-ok-hide-sort-icon", "No arrow while inactive (shown on hover / focus)."),
});

export interface TableSortLabelAnatomyOptions {
  active?: boolean | undefined;
  direction?: TableSortDirection | undefined;
  hideSortIcon?: boolean | undefined;
}

/** `data-ok-*` attributes of a sort button in a header cell. */
export const tableSortLabelAttributes = (
  options: TableSortLabelAnatomyOptions = {},
): DataAttributes => optionAttributes(tableSortLabelOptions, { ...options });

/** `aria-sort` of a header cell for a sort direction (`false` = not sorted). */
export const ariaSort = (direction: TableSortDirection | false | undefined) =>
  direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined;
