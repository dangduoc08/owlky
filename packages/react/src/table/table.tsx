"use client";

import {
  ariaSort,
  defaultLabelDisplayedRows,
  defaultPaginationLabel,
  iconButtonAttributes,
  lastPage,
  type PageRange,
  type PaginationAction,
  pageRange,
  type TableAlign,
  type TablePadding,
  type TableSize,
  type TableSortDirection,
  tableAttributes,
  tableCellAttributes,
  tableSortLabelAttributes,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type ReactNode,
  useContext,
} from "react";

/** `thead` / `tbody` / `tfoot`: tells cells which element to render. */
const SectionContext = createContext<"head" | "body" | "footer">("body");

export interface TableProps extends ComponentPropsWithoutRef<"table"> {
  /** Default `"medium"`; `"small"` = dense rows. */
  size?: TableSize | undefined;
  /** Default `"normal"`. */
  padding?: TablePadding | undefined;
  /** Header stays visible while a height-limited `TableContainer` scrolls. */
  stickyHeader?: boolean | undefined;
}

/** Table — spec: specs/components/table.md. Data, sorting and paging stay in the app. */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { size, padding, stickyHeader, ...props },
  ref,
) {
  return (
    <table
      ref={ref}
      {...tableAttributes({ size, padding, stickyHeader })}
      data-ok-runtime="off"
      {...props}
    />
  );
});

export interface TableContainerProps extends ComponentPropsWithoutRef<"section"> {
  /** Name of the scrollable region (or `aria-labelledby`). */
  "aria-label"?: string | undefined;
}

/** Scrolls a wide (or height-limited) table; a named, focusable region for keyboard scrolling. */
export const TableContainer = forwardRef<HTMLElement, TableContainerProps>(
  function TableContainer(props, ref) {
    return (
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard-focusable (axe scrollable-region-focusable).
      <section ref={ref} data-ok-table-container="" tabIndex={0} {...props} />
    );
  },
);

export const TableHead = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"thead">>(
  function TableHead(props, ref) {
    return (
      <SectionContext.Provider value="head">
        <thead ref={ref} {...props} />
      </SectionContext.Provider>
    );
  },
);

export const TableBody = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tbody">>(
  function TableBody(props, ref) {
    return (
      <SectionContext.Provider value="body">
        <tbody ref={ref} {...props} />
      </SectionContext.Provider>
    );
  },
);

export const TableFooter = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tfoot">>(
  function TableFooter(props, ref) {
    return (
      <SectionContext.Provider value="footer">
        <tfoot ref={ref} {...props} />
      </SectionContext.Provider>
    );
  },
);

export interface TableRowProps extends ComponentPropsWithoutRef<"tr"> {
  /** Shade on hover. */
  hover?: boolean | undefined;
  /** Selected shading. */
  selected?: boolean | undefined;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { hover, selected, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      data-ok-hover={hover ? "" : undefined}
      data-ok-selected={selected ? "" : undefined}
      {...props}
    />
  );
});

export interface TableCellProps
  extends Omit<ComponentPropsWithoutRef<"td">, "align">,
    Pick<ComponentPropsWithoutRef<"th">, "scope" | "abbr"> {
  /** Text alignment (right for numbers). Default: inherit. */
  align?: TableAlign | undefined;
  /** Overrides the table's padding. */
  padding?: TablePadding | undefined;
  /** Overrides the table's size. */
  size?: TableSize | undefined;
  /** Header cell of the sorted column: sets `aria-sort`. */
  sortDirection?: TableSortDirection | false | undefined;
}

/** `<th scope="col">` in the head, `<th>` with `scope="row"`, `<td>` otherwise. */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { align, padding, size, sortDirection, scope, ...props },
  ref,
) {
  const section = useContext(SectionContext);
  const head = section === "head";
  const Cell = head || scope === "row" ? "th" : "td";
  return (
    <Cell
      ref={ref}
      scope={head ? (scope ?? "col") : scope}
      aria-sort={ariaSort(sortDirection)}
      {...tableCellAttributes({ align, padding, size })}
      {...props}
    />
  );
});

/** Arrow down; CSS turns it up for ascending. */
function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

export interface TableSortLabelProps extends ComponentPropsWithoutRef<"button"> {
  /** The table is sorted by this column. */
  active?: boolean | undefined;
  /** Default `"asc"`. */
  direction?: TableSortDirection | undefined;
  /** No arrow while inactive. */
  hideSortIcon?: boolean | undefined;
  /** Replaces the arrow (rotated 180° when ascending). */
  icon?: ReactNode;
}

/** The sort button of a header cell. Set `sortDirection` on the cell for `aria-sort`. */
export const TableSortLabel = forwardRef<HTMLButtonElement, TableSortLabelProps>(
  function TableSortLabel({ active, direction, hideSortIcon, icon, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        {...tableSortLabelAttributes({ active, direction, hideSortIcon })}
        {...props}
      >
        {children}
        <span data-ok-table-sort-icon="" aria-hidden="true">
          {icon ?? <ArrowIcon />}
        </span>
      </button>
    );
  },
);

function ChevronIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const CHEVRONS: Record<PaginationAction | "down", string> = {
  down: "m6 9 6 6 6-6",
  first: "m11 17-5-5 5-5M18 17l-5-5 5-5",
  previous: "m15 18-6-6 6-6",
  next: "m9 18 6-6-6-6",
  last: "m13 17 5-5-5-5M6 17l5-5-5-5",
};

export interface TableExpandButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** The detail row is open. */
  expanded: boolean;
  /** `id` of the `TableDetailRow` it opens. */
  controls: string;
  /** Name, e.g. "Show details of Eclair". */
  "aria-label": string;
}

/** Opens / closes a `TableDetailRow` (an icon button with a chevron). */
export const TableExpandButton = forwardRef<HTMLButtonElement, TableExpandButtonProps>(
  function TableExpandButton({ expanded, controls, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        {...iconButtonAttributes({ size: "sm" })}
        data-ok-table-expand={controls}
        aria-controls={controls}
        aria-expanded={expanded}
        {...props}
      >
        <ChevronIcon d={CHEVRONS.down} />
      </button>
    );
  },
);

export interface TableDetailRowProps extends ComponentPropsWithoutRef<"tr"> {
  /** Referenced by the row's `TableExpandButton`. */
  id: string;
  open: boolean;
  /** Number of columns it spans. */
  colSpan: number;
}

/** The collapsible row under a data row. */
export const TableDetailRow = forwardRef<HTMLTableRowElement, TableDetailRowProps>(
  function TableDetailRow({ open, colSpan, children, ...props }, ref) {
    return (
      <tr ref={ref} data-ok-table-detail="" hidden={!open} {...props}>
        <td colSpan={colSpan}>{children}</td>
      </tr>
    );
  },
);

export type RowsPerPageOption = number | { label: string; value: number };

export interface TablePaginationProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Total rows; `-1` = unknown (server-side). */
  count: number;
  /** 0-based page. */
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: ((rowsPerPage: number) => void) | undefined;
  /** Default `[10, 25, 50, 100]`; fewer than two hides the select; `-1` = all. */
  rowsPerPageOptions?: readonly RowsPerPageOption[] | undefined;
  /** Default `"Rows per page:"`. */
  labelRowsPerPage?: ReactNode;
  labelDisplayedRows?: ((range: PageRange) => ReactNode) | undefined;
  getItemAriaLabel?: ((type: PaginationAction) => string) | undefined;
  showFirstButton?: boolean | undefined;
  showLastButton?: boolean | undefined;
  disabled?: boolean | undefined;
}

/** Rows per page, the displayed range and page buttons. Place it after the `TableContainer`. */
export const TablePagination = forwardRef<HTMLDivElement, TablePaginationProps>(
  function TablePagination(
    {
      count,
      page,
      rowsPerPage,
      onPageChange,
      onRowsPerPageChange,
      rowsPerPageOptions = [10, 25, 50, 100],
      labelRowsPerPage = "Rows per page:",
      labelDisplayedRows = defaultLabelDisplayedRows,
      getItemAriaLabel = defaultPaginationLabel,
      showFirstButton = false,
      showLastButton = false,
      disabled = false,
      ...props
    },
    ref,
  ) {
    const last = rowsPerPage === -1 ? 0 : lastPage(rowsPerPage, count);
    const targets: Record<PaginationAction, number> = {
      first: 0,
      previous: page - 1,
      next: page + 1,
      last: Number.isFinite(last) ? last : page,
    };
    const atStart = page <= 0;
    const atEnd = page >= last;
    const actions: PaginationAction[] = [
      ...(showFirstButton ? (["first"] as const) : []),
      "previous",
      "next",
      ...(showLastButton ? (["last"] as const) : []),
    ];
    return (
      <div ref={ref} data-ok-table-pagination="" data-ok-runtime="off" {...props}>
        {rowsPerPageOptions.length > 1 && (
          <label data-ok-table-pagination-rows="">
            {labelRowsPerPage}
            <select
              value={rowsPerPage}
              disabled={disabled}
              onChange={(event) => onRowsPerPageChange?.(Number(event.currentTarget.value))}
            >
              {rowsPerPageOptions.map((option) => {
                const { label, value } =
                  typeof option === "number" ? { label: String(option), value: option } : option;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
        )}
        <span data-ok-table-pagination-displayed="" aria-live="polite">
          {labelDisplayedRows(pageRange(page, rowsPerPage, count))}
        </span>
        <div data-ok-table-pagination-actions="">
          {actions.map((action) => {
            const label = getItemAriaLabel(action);
            const backward = action === "first" || action === "previous";
            return (
              <button
                key={action}
                type="button"
                {...iconButtonAttributes({ size: "sm" })}
                data-ok-table-pagination-action={action}
                aria-label={label}
                title={label}
                disabled={disabled || (backward ? atStart : atEnd)}
                onClick={() => onPageChange(targets[action])}
              >
                <ChevronIcon d={CHEVRONS[action]} />
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
