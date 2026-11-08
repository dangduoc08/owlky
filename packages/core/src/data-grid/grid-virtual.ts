/*
 * Data grid phase 3 (ADR-0020), shared by React and the HTML runtime: the window of rows to render
 * (row virtualization), a scroll watcher that measures the grid and reports the end of the rows
 * (infinite loading), and a cache for server data sources.
 */
import type { GridFilterModel, GridSortModel } from "./data-grid.js";

/** Rows to render: `start` (inclusive) to `end` (exclusive), and the px spacers around them. */
export interface GridRowWindow {
  start: number;
  end: number;
  before: number;
  after: number;
}

/** Pixels rendered above and below the visible rows (MUI X `rowBufferPx`). */
export const GRID_ROW_BUFFER = 150;

/**
 * The rows that intersect the visible area plus a buffer. `offset` is how far the rows are
 * scrolled (px from the first row), `viewport` the visible height of the rows. Without a row
 * height every row is rendered.
 */
export function gridRowWindow(
  count: number,
  rowHeight: number,
  offset: number,
  viewport: number,
  buffer = GRID_ROW_BUFFER,
): GridRowWindow {
  if (!(rowHeight > 0) || count === 0) return { start: 0, end: count, before: 0, after: 0 };
  const start = Math.min(Math.max(Math.floor((offset - buffer) / rowHeight), 0), count);
  const end = Math.min(Math.max(Math.ceil((offset + viewport + buffer) / rowHeight), start), count);
  return { start, end, before: start * rowHeight, after: (count - end) * rowHeight };
}

/** The scroll area is within `threshold` px of its end. */
export const isNearGridScrollEnd = (
  area: { scrollTop: number; clientHeight: number; scrollHeight: number },
  threshold: number,
): boolean => area.scrollHeight - area.scrollTop - area.clientHeight <= threshold;

export interface GridViewport {
  /** Rows scrolled out of view at the top, px. */
  offset: number;
  /** Visible height for rows (below the sticky header), px. */
  viewport: number;
  /** Height of one row, px (0 before any row is measured). */
  rowHeight: number;
  /**
   * The area scrolls (its height is bounded). A grid that grows with its rows doesn't
   * virtualize: every row is visible anyway.
   */
  scrolls: boolean;
  /** Horizontal scroll and visible width, px (column virtualization). */
  left?: number | undefined;
  width?: number | undefined;
}

export interface GridScrollWatcherOptions {
  onChange(viewport: GridViewport): void;
  /** Called when the rows come within `threshold()` px of their end. */
  onScrollEnd(): void;
  threshold(): number;
}

export interface GridScrollWatcher {
  /** Measures again (after rows or density changed). */
  measure(): void;
  destroy(): void;
}

/** Watches a grid's scroll area (`[data-ok-data-grid-main]`) for virtualization and its end. */
export function createGridScrollWatcher(
  main: HTMLElement,
  options: GridScrollWatcherOptions,
): GridScrollWatcher {
  let rowHeight = 0;
  const measure = () => {
    const header = main.querySelector<HTMLElement>("[data-ok-data-grid-header]");
    const row = main.querySelector<HTMLElement>(
      '[data-ok-data-grid-body] > [role="row"]:not([hidden])',
    );
    if (row?.offsetHeight) rowHeight = row.offsetHeight;
    const headerHeight = header?.offsetHeight ?? 0;
    options.onChange({
      offset: main.scrollTop,
      viewport: Math.max(main.clientHeight - headerHeight, 0),
      rowHeight,
      scrolls: main.scrollHeight > main.clientHeight + 1,
      left: Math.abs(main.scrollLeft),
      width: main.clientWidth,
    });
  };
  const onScroll = () => {
    measure();
    if (isNearGridScrollEnd(main, options.threshold())) options.onScrollEnd();
  };
  main.addEventListener("scroll", onScroll, { passive: true });
  const resize = typeof ResizeObserver === "function" ? new ResizeObserver(() => measure()) : null;
  resize?.observe(main);
  return {
    measure,
    destroy() {
      main.removeEventListener("scroll", onScroll);
      resize?.disconnect();
    },
  };
}

export interface GridPaginationParams {
  page: number;
  pageSize: number;
}

/** What a data source is asked for (MUI X `GridGetRowsParams`). */
export interface GridGetRowsParams {
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
  paginationModel?: GridPaginationParams | undefined;
  /** Lazy loading: the row indexes asked for, `[start, end)`. */
  start?: number | undefined;
  end?: number | undefined;
  /** Tree data: the group keys of the parent whose children are asked for (top level: `[]`). */
  groupKeys?: string[] | undefined;
}

export interface GridGetRowsResponse<R> {
  rows: R[];
  /** Total rows on the server (for pagination). */
  rowCount?: number | undefined;
}

/** A server data source (MUI X Pro `dataSource`). */
export interface GridDataSource<R> {
  getRows(params: GridGetRowsParams): Promise<GridGetRowsResponse<R>>;
  /** Saves an edited row; returns the row to show (rejecting keeps the old one). */
  updateRow?(params: { rowId: string; updatedRow: R; previousRow: R }): Promise<R> | R;
  /** Tree data: how many children a row has on the server (0: none). */
  getChildrenCount?(row: R): number;
  /** Tree data: the key of a row among its siblings (its part of the children's group keys). */
  getGroupKey?(row: R): string;
}

export interface GridDataSourceCache<R> {
  get(params: GridGetRowsParams): GridGetRowsResponse<R> | undefined;
  set(params: GridGetRowsParams, response: GridGetRowsResponse<R>): void;
  clear(): void;
}

export interface GridDataSourceCacheOptions {
  /** Responses kept (the oldest goes first). Default 50. */
  limit?: number | undefined;
  /** How long a response stays valid, ms. Default 5 minutes (MUI X). */
  ttl?: number | undefined;
}

/** Responses kept per request, for `ttl` ms (the oldest goes first past `limit`). */
export function createGridDataSourceCache<R>(
  options: number | GridDataSourceCacheOptions = {},
): GridDataSourceCache<R> {
  const { limit = 50, ttl = 300_000 } = typeof options === "number" ? { limit: options } : options;
  const entries = new Map<string, { response: GridGetRowsResponse<R>; at: number }>();
  const key = (params: GridGetRowsParams) => JSON.stringify(params);
  return {
    get(params) {
      const entry = entries.get(key(params));
      if (!entry) return undefined;
      if (Date.now() - entry.at > ttl) {
        entries.delete(key(params));
        return undefined;
      }
      return entry.response;
    },
    set(params, response) {
      entries.delete(key(params));
      entries.set(key(params), { response, at: Date.now() });
      if (entries.size > limit) entries.delete(entries.keys().next().value as string);
    },
    clear: () => entries.clear(),
  };
}
