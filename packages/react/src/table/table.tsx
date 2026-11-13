"use client";

import {
  altArrowDownLinear,
  altArrowLeftLinear,
  altArrowRightLinear,
  ariaSort,
  arrowDownLinear,
  defaultLabelDisplayedRows,
  defaultPaginationLabel,
  doubleAltArrowLeftLinear,
  doubleAltArrowRightLinear,
  type IconData,
  iconButtonAttributes,
  lastPage,
  type PageRange,
  type PaginationAction,
  pageRange,
  selectBehaviorAttributes,
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
  type ElementType,
  forwardRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
  useContext,
  useId,
} from "react";
import { MenuItem } from "../menu/menu.js";
import { type SelectMenuProps, SelectRoot } from "../select/select.js";
import { Icon } from "../utils/icon.js";

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
  /** Name of the scrollable region (or `aria-labelledby`); omit it when a `Scrollbar` inside scrolls. */
  "aria-label"?: string | undefined;
  /**
   * The element or component that renders the container. Default `"section"`. Pass `Paper` to
   * put the table on a surface (`component={Paper}`, as in MUI); name the `Scrollbar` inside
   * then, since a Paper renders a `div`.
   */
  component?: ElementType | undefined;
}

/**
 * `TableContainer`'s call signatures: with `component`, the props of that component (such as
 * Paper's `elevation`), otherwise `TableContainerProps` (a `section`).
 */
export interface TableContainerComponent {
  <C extends ElementType>(
    props: {
      /** The element or component that renders the container, such as `Paper`. */
      component: C;
      ref?: Ref<HTMLElement> | undefined;
    } & Omit<ComponentPropsWithoutRef<C>, "component">,
  ): ReactElement | null;
  (props: TableContainerProps & RefAttributes<HTMLElement>): ReactElement | null;
  displayName?: string | undefined;
}

/**
 * Holds a table. Wrap the table in a `Scrollbar` (the named, focusable scroll region), or name
 * the container itself (`aria-label`) to let it scroll natively.
 */
export const TableContainer = forwardRef<HTMLElement, TableContainerProps>(function TableContainer(
  { component: Component = "section", ...props },
  ref,
) {
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return (
    <Component ref={ref} data-ok-table-container="" tabIndex={named ? 0 : undefined} {...props} />
  );
}) as TableContainerComponent;

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
  return <Icon icon={arrowDownLinear} />;
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

function ChevronIcon({ icon }: { icon: IconData }) {
  return <Icon icon={icon} />;
}

const CHEVRONS: Record<PaginationAction | "down", IconData> = {
  down: altArrowDownLinear,
  first: doubleAltArrowLeftLinear,
  previous: altArrowLeftLinear,
  next: altArrowRightLinear,
  last: doubleAltArrowRightLinear,
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
        <ChevronIcon icon={CHEVRONS.down} />
      </button>
    );
  },
);

export interface TableDetailRowProps extends ComponentPropsWithoutRef<"tr"> {
  /** Referenced by the row's `TableExpandButton`. */
  id: string;
  /** The row is open. */
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
  /** The rows per page. */
  rowsPerPage: number;
  /** Called with the page (0-based) a button moves to. */
  onPageChange: (page: number) => void;
  /** Called when another number of rows per page is picked. */
  onRowsPerPageChange?: ((rowsPerPage: number) => void) | undefined;
  /** Default `[10, 25, 50, 100]`; fewer than two hides the select; `-1` = all. */
  rowsPerPageOptions?: readonly RowsPerPageOption[] | undefined;
  /** Label of the rows-per-page select. Default `"Rows per page:"`. */
  labelRowsPerPage?: ReactNode;
  /** Formats the range text, such as "1–10 of 100". */
  labelDisplayedRows?: ((range: PageRange) => ReactNode) | undefined;
  /** Returns the accessible name of each navigation button. */
  getItemAriaLabel?: ((type: PaginationAction) => string) | undefined;
  /** Shows a button to the first page. */
  showFirstButton?: boolean | undefined;
  /** Shows a button to the last page. */
  showLastButton?: boolean | undefined;
  /** Turns the controls off. */
  disabled?: boolean | undefined;
  /**
   * The rows-per-page select (MUI `SelectProps`): `{ native: false }` makes it a listbox Select
   * (the default stays the native `<select>`); `menuProps` places its menu.
   */
  selectProps?:
    | { native?: boolean | undefined; menuProps?: SelectMenuProps | undefined }
    | undefined;
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
      selectProps,
      ...props
    },
    ref,
  ) {
    const rowsId = useId();
    const last = rowsPerPage === -1 ? 0 : lastPage(rowsPerPage, count);
    const options = rowsPerPageOptions.map((option) =>
      typeof option === "number" ? { label: String(option), value: option } : option,
    );
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
        {options.length > 1 &&
          (selectProps?.native === false ? (
            <div data-ok-table-pagination-rows="">
              <span id={`${rowsId}-label`}>{labelRowsPerPage}</span>
              <SelectRoot
                host="select"
                rootProps={selectBehaviorAttributes()}
                rootRef={null}
                triggerId={rowsId}
                labelId={`${rowsId}-label`}
                error={false}
                disabled={disabled}
                required={false}
                readOnly={false}
                triggerAria={{}}
                value={rowsPerPage}
                onChange={(next) => onRowsPerPageChange?.(Number(next))}
                menuProps={selectProps.menuProps}
              >
                {options.map(({ label, value }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </SelectRoot>
            </div>
          ) : (
            <label data-ok-table-pagination-rows="">
              {labelRowsPerPage}
              <select
                value={rowsPerPage}
                disabled={disabled}
                onChange={(event) => onRowsPerPageChange?.(Number(event.currentTarget.value))}
              >
                {options.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
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
                <ChevronIcon icon={CHEVRONS[action]} />
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
