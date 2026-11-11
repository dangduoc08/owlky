/*
 * Data grid phase 5 (ADR-0021), shared by React and the HTML runtime: tree rows (tree data),
 * column groups (multi-level headers), the window of columns (column virtualization), lazy loading
 * ranges and row reordering (pointer and keyboard).
 */
import type { GridRowWindow } from "./grid-virtual.js";

/* ------------------------------------------------------------------ tree data */

export interface GridTreeRow<R> {
  row: R;
  id: string;
  /** 0 for top-level rows. */
  depth: number;
  parentId: string | null;
  /** Children before filtering. */
  childrenCount: number;
  /** Descendants before filtering (MUI X `descendantCount`). */
  descendantCount: number;
  expanded: boolean;
  /** Position among the shown siblings (1-based) and their count (`aria-posinset` / `setsize`). */
  posInSet: number;
  setSize: number;
}

export interface GridTreeOptions<R> {
  idOf(row: R): string;
  /** The parent's id, or null for top-level rows (unknown parents count as top level). */
  parentOf(row: R): string | null;
  expanded(id: string, depth: number): boolean;
  /** Rows that pass the filter (their ancestors stay shown). Default: all. */
  keep?: ((row: R) => boolean) | undefined;
  /** Order of siblings. Default: as given. */
  compare?: ((a: R, b: R) => number) | undefined;
  /** `keep` decides top-level rows only; their descendants show with them (MUI X `disableChildrenFiltering`). */
  filterRootsOnly?: boolean | undefined;
  /** `compare` orders top-level rows only (MUI X `disableChildrenSorting`). */
  sortRootsOnly?: boolean | undefined;
}

/**
 * Tree rows in display order: siblings sorted, rows filtered (a row shows when it or a
 * descendant passes), children of collapsed rows left out.
 */
export function gridTreeRows<R>(rows: readonly R[], options: GridTreeOptions<R>): GridTreeRow<R>[] {
  const ids = new Set(rows.map(options.idOf));
  const children = new Map<string | null, R[]>();
  for (const row of rows) {
    const parent = options.parentOf(row);
    const key = parent !== null && ids.has(parent) ? parent : null;
    const list = children.get(key) ?? [];
    list.push(row);
    children.set(key, list);
  }
  const descendants = new Map<string, number>();
  const passes = new Map<string, boolean>();
  const visit = (row: R, trail: Set<string>): void => {
    const id = options.idOf(row);
    // A row that is its own ancestor (bad data) ends the branch.
    if (trail.has(id)) return;
    trail.add(id);
    let count = 0;
    let inside = false;
    for (const child of children.get(id) ?? []) {
      visit(child, trail);
      const childId = options.idOf(child);
      count += 1 + (descendants.get(childId) ?? 0);
      inside ||= passes.get(childId) ?? false;
    }
    trail.delete(id);
    descendants.set(id, count);
    const own = options.keep ? options.keep(row) : true;
    // Roots only: a child shows with its root, whatever it holds.
    passes.set(id, options.filterRootsOnly ? trail.size > 0 || own : inside || own);
  };
  for (const row of children.get(null) ?? []) visit(row, new Set());
  const out: GridTreeRow<R>[] = [];
  const walk = (parent: string | null, depth: number, seen: Set<string>) => {
    const shown = (children.get(parent) ?? []).filter((row) => passes.get(options.idOf(row)));
    if (options.compare && (parent === null || !options.sortRootsOnly)) shown.sort(options.compare);
    shown.forEach((row, index) => {
      const id = options.idOf(row);
      if (seen.has(id)) return;
      const kids = children.get(id) ?? [];
      const expanded = kids.length > 0 && options.expanded(id, depth);
      out.push({
        row,
        id,
        depth,
        parentId: parent,
        childrenCount: kids.length,
        descendantCount: descendants.get(id) ?? 0,
        expanded,
        posInSet: index + 1,
        setSize: shown.length,
      });
      if (expanded) walk(id, depth + 1, new Set([...seen, id]));
    });
  };
  walk(null, 0, new Set());
  return out;
}

/** Default expansion: rows at a depth below `depth` are open (`-1`: all). */
export const gridExpandedByDepth = (depth: number, rowDepth: number): boolean =>
  depth === -1 || rowDepth < depth;

/** Parent ids from paths (MUI X `getTreeDataPath`): a row's parent has its path minus the last part. */
export function gridParentsFromPaths<R>(
  rows: readonly R[],
  idOf: (row: R) => string,
  pathOf: (row: R) => readonly string[],
): Map<string, string | null> {
  const byPath = new Map<string, string>();
  for (const row of rows) byPath.set(JSON.stringify(pathOf(row)), idOf(row));
  const parents = new Map<string, string | null>();
  for (const row of rows) {
    const path = pathOf(row);
    // An empty path has no parent (not the last row with an empty path: that made a loop).
    parents.set(
      idOf(row),
      path.length > 1 ? (byPath.get(JSON.stringify(path.slice(0, -1))) ?? null) : null,
    );
  }
  return parents;
}

/* ------------------------------------------------------------------ column groups */

export interface GridColumnGroup {
  groupId: string;
  headerName?: string | undefined;
  description?: string | undefined;
  children: readonly (GridColumnGroup | { field: string })[];
}

/** For each field, the group ids from the top level down (MUI X `columnGroupingModel`). */
export function gridGroupPaths(model: readonly GridColumnGroup[]): Map<string, string[]> {
  const paths = new Map<string, string[]>();
  const walk = (node: GridColumnGroup | { field: string }, trail: string[]) => {
    if ("field" in node) {
      paths.set(node.field, trail);
      return;
    }
    for (const child of node.children) walk(child, [...trail, node.groupId]);
  };
  for (const group of model) walk(group, []);
  return paths;
}

/** Groups by id (to find their names). */
export function gridGroupsById(model: readonly GridColumnGroup[]): Map<string, GridColumnGroup> {
  const byId = new Map<string, GridColumnGroup>();
  const walk = (node: GridColumnGroup | { field: string }) => {
    if ("field" in node) return;
    byId.set(node.groupId, node);
    for (const child of node.children) walk(child);
  };
  for (const group of model) walk(group);
  return byId;
}

export interface GridGroupCell {
  /** null: no group at this level (an empty cell). */
  groupId: string | null;
  /** Index of the first column (0-based, in the shown columns) and how many it spans. */
  start: number;
  span: number;
  fields: string[];
}

/**
 * The cells of each header level above the column headers: neighbouring shown columns of the same
 * group (at that level) share one cell. Hiding or moving columns splits a group into several.
 */
export function gridGroupRows(
  fields: readonly string[],
  paths: ReadonlyMap<string, readonly string[]>,
): GridGroupCell[][] {
  const levels = Math.max(0, ...fields.map((f) => paths.get(f)?.length ?? 0));
  const rows: GridGroupCell[][] = [];
  for (let level = 0; level < levels; level++) {
    const cells: GridGroupCell[] = [];
    fields.forEach((field, index) => {
      const groupId = paths.get(field)?.[level] ?? null;
      const last = cells[cells.length - 1];
      // Neighbours merge when they share the whole group chain down to this level.
      const same =
        last &&
        last.groupId !== null &&
        last.groupId === groupId &&
        JSON.stringify(paths.get(last.fields[0] as string)?.slice(0, level + 1)) ===
          JSON.stringify(paths.get(field)?.slice(0, level + 1));
      if (same) {
        last.span++;
        last.fields.push(field);
      } else cells.push({ groupId, start: index, span: 1, fields: [field] });
    });
    rows.push(cells);
  }
  return rows;
}

/** Moving `field` next to `target` keeps groups whole (both share their group chain). */
export const gridCanMoveColumn = (
  paths: ReadonlyMap<string, readonly string[]>,
  field: string,
  target: string,
): boolean => JSON.stringify(paths.get(field) ?? []) === JSON.stringify(paths.get(target) ?? []);

/* ------------------------------------------------------------------ column window */

/**
 * The scrolling columns (between the pinned ones) that meet the visible width plus a buffer.
 * `widths` are the scrolling columns' px widths, `offset` the horizontal scroll, `viewport` the
 * width left by the pinned columns.
 */
export function gridColumnWindow(
  widths: readonly number[],
  offset: number,
  viewport: number,
  buffer = 150,
): GridRowWindow {
  let start = 0;
  let position = 0;
  while (start < widths.length && position + (widths[start] as number) < offset - buffer) {
    position += widths[start] as number;
    start++;
  }
  const before = position;
  let end = start;
  while (end < widths.length && position < offset + viewport + buffer) {
    position += widths[end] as number;
    end++;
  }
  const total = widths.reduce((sum, w) => sum + w, 0);
  return { start, end, before, after: total - position };
}

/* ------------------------------------------------------------------ lazy loading */

/**
 * The ranges of row indexes `[start, end)` within `window` that aren't loaded yet, grown to whole
 * chunks of `size` rows (the requests a lazy grid sends).
 */
export function gridMissingRanges(
  loaded: (index: number) => boolean,
  window: { start: number; end: number },
  size: number,
  count: number,
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  const step = Math.max(1, Math.floor(size));
  for (let chunk = Math.floor(window.start / step) * step; chunk < window.end; chunk += step) {
    const end = Math.min(chunk + step, count);
    let missing = false;
    for (let i = chunk; i < end && !missing; i++) missing = !loaded(i);
    if (!missing) continue;
    const last = ranges[ranges.length - 1];
    if (last && last.end === chunk) last.end = end;
    else ranges.push({ start: chunk, end });
  }
  return ranges;
}

/* ------------------------------------------------------------------ row reordering */

/** Where a dragged row lands: above or below the row `target`. */
export interface GridRowDrop {
  target: string;
  position: "above" | "below";
}

export interface GridRowReorderOptions {
  /** Reordering is allowed now (no sort, no filter; read on each move). */
  canReorder(): boolean;
  /**
   * Move the row `id` to the place of the row with this `aria-rowindex` (owners convert it);
   * `drop` names the row it lands next to (tree data moves between parents with it).
   */
  onMove(id: string, rowIndex: number, drop: GridRowDrop): void;
  /** Whether `id` may land there (MUI X `isValidRowReorder`); refused targets get no drop mark. */
  canDrop?(id: string, drop: GridRowDrop): boolean;
}

export interface GridRowReorder {
  destroy(): void;
}

const HANDLE = "[data-ok-data-grid-reorder-handle]";
const BODY_ROW = '[data-ok-data-grid-body] > [role="row"][data-ok-row-id]';

/**
 * Row reordering, shared by React and the HTML runtime: drag a row's handle onto another row, or
 * press Alt + Up / Down on the handle (WCAG 2.5.7). Reports intent; the owner moves the row and
 * announces it.
 */
export function createGridRowReorder(
  grid: HTMLElement,
  options: GridRowReorderOptions,
): GridRowReorder {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;
  const rowsNow = () => [...grid.querySelectorAll<HTMLElement>(BODY_ROW)].filter((r) => !r.hidden);
  const indexOf = (row: HTMLElement) => Number(row.getAttribute("aria-rowindex"));
  const clearMarks = () => {
    for (const row of grid.querySelectorAll("[data-ok-drop]")) row.removeAttribute("data-ok-drop");
  };
  const levelOf = (row: HTMLElement) => Number(row.getAttribute("aria-level") ?? 1);
  const dropOf = (row: HTMLElement, after: boolean): GridRowDrop => ({
    target: row.getAttribute("data-ok-row-id") as string,
    position: after ? "below" : "above",
  });
  const allowed = (source: HTMLElement, row: HTMLElement, after: boolean) =>
    !options.canDrop ||
    options.canDrop(source.getAttribute("data-ok-row-id") as string, dropOf(row, after));

  grid.addEventListener(
    "pointerdown",
    (event) => {
      const handle = (event.target as Element).closest(HANDLE);
      if (!handle || event.button !== 0 || !options.canReorder()) return;
      const source = handle.closest<HTMLElement>(BODY_ROW);
      // `isRowReorderable` false: the row stays (its handle is left out or hidden).
      if (!source || source.getAttribute("data-ok-reorderable") === "false") return;
      event.preventDefault();
      source.setAttribute("data-ok-dragging", "");
      let over: { row: HTMLElement; after: boolean } | null = null;
      const move = (e: PointerEvent) => {
        clearMarks();
        const row = doc.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>(BODY_ROW);
        if (!row || row === source || !grid.contains(row)) {
          over = null;
          return;
        }
        const box = row.getBoundingClientRect();
        const after = e.clientY > box.top + box.height / 2;
        if (!allowed(source, row, after)) {
          over = null;
          return;
        }
        over = { row, after };
        row.setAttribute("data-ok-drop", over.after ? "after" : "before");
      };
      const up = () => {
        doc.removeEventListener("pointermove", move);
        doc.removeEventListener("pointerup", up);
        source.removeAttribute("data-ok-dragging");
        clearMarks();
        if (!over) return;
        // Row indexes: drop before or after the target.
        const from = indexOf(source);
        let to = indexOf(over.row) + (over.after ? 1 : 0);
        if (to > from) to--;
        if (to !== from)
          options.onMove(
            source.getAttribute("data-ok-row-id") as string,
            to,
            dropOf(over.row, over.after),
          );
      };
      doc.addEventListener("pointermove", move, { signal });
      doc.addEventListener("pointerup", up, { signal });
    },
    { signal },
  );

  grid.addEventListener(
    "keydown",
    (event) => {
      const handle = (event.target as Element).closest(HANDLE);
      if (!handle || !event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown"))
        return;
      event.preventDefault();
      if (!options.canReorder()) return;
      const row = handle.closest<HTMLElement>(BODY_ROW) as HTMLElement;
      if (row.getAttribute("data-ok-reorderable") === "false") return;
      const rows = rowsNow();
      const up = event.key === "ArrowUp";
      let at = rows.indexOf(row) + (up ? -1 : 1);
      // Tree rows: down goes past the row's own children (they move with it).
      if (!up) while (rows[at] && levelOf(rows[at] as HTMLElement) > levelOf(row)) at++;
      const neighbour = rows[at];
      if (neighbour && allowed(row, neighbour, !up))
        options.onMove(
          row.getAttribute("data-ok-row-id") as string,
          indexOf(neighbour),
          dropOf(neighbour, !up),
        );
    },
    { signal },
  );

  return {
    destroy() {
      abort.abort();
    },
  };
}

/**
 * Tree data reordering (MUI X `setTreeDataPath`): `source` and its descendants move above or below
 * `drop.target`, among the target's siblings. `order` is every tree row in display order (open or
 * not), `parentOf` their parents. `null`: a move into its own subtree, onto itself, or to another
 * parent without `crossParents`.
 */
export function gridTreeRowMove(
  order: readonly string[],
  parentOf: (id: string) => string | null,
  source: string,
  drop: GridRowDrop,
  crossParents: boolean,
): { order: string[]; parent: string | null; moved: string[] } | null {
  const inside = (id: string, ancestor: string) => {
    let parent = parentOf(id);
    // A loop in the data ends the walk.
    for (let guard = 0; parent !== null && guard < order.length; guard++) {
      if (parent === ancestor) return true;
      parent = parentOf(parent);
    }
    return false;
  };
  const { target, position } = drop;
  if (target === source || inside(target, source) || !order.includes(source)) return null;
  const parent = parentOf(target);
  if (!crossParents && parent !== parentOf(source)) return null;
  const moved = order.filter((id) => id === source || inside(id, source));
  const block = new Set(moved);
  const rest = order.filter((id) => !block.has(id));
  let at = rest.indexOf(target);
  if (at < 0) return null;
  // Below a row: after its own children too.
  if (position === "below") {
    at++;
    while (at < rest.length && inside(rest[at] as string, target)) at++;
  }
  return { order: [...rest.slice(0, at), ...moved, ...rest.slice(at)], parent, moved };
}

/** A path moved under a new parent: the parent's path, then the part from the moved row on. */
export const gridMovedTreePath = (
  path: readonly string[],
  depth: number,
  parentPath: readonly string[],
): string[] => [...parentPath, ...path.slice(depth)];

/** The order after moving `id` to `index`. */
export function moveGridRow(ids: readonly string[], id: string, index: number): string[] {
  const rest = ids.filter((other) => other !== id);
  if (rest.length === ids.length) return [...ids];
  const at = Math.min(Math.max(index, 0), rest.length);
  return [...rest.slice(0, at), id, ...rest.slice(at)];
}

/* ------------------------------------------------------------------ rows to export */

/**
 * Shortcuts for the rows an export holds (ApexGrid `source`): `filtered` (default: the rows that
 * pass the filters, sorted), `selected` (the selected ones among them), `page` (the current
 * page's), `all` (every data row in its original order, filters aside).
 */
export const gridExportSources = ["filtered", "selected", "page", "all"] as const;
export type GridExportSource = (typeof gridExportSources)[number];

/** The row id lists `getRowsToExport` gets (MUI X selectors' results, as values). */
export interface GridRowsToExportIds {
  /** Rows that pass the filters, in the shown order (MUI X `gridFilteredSortedRowIdsSelector`). */
  filteredSortedRowIds: readonly string[];
  /** Every data row in its original order (MUI X `gridRowIdsSelector`). */
  rowIds: readonly string[];
  /** The current page's rows (MUI X `gridPaginatedVisibleSortedGridRowIdsSelector`). */
  paginatedRowIds: readonly string[];
  /** The selected rows. */
  selectedRowIds: readonly string[];
}

/** What `getRowsToExport` gets (MUI X `GridGetRowsToExportParams`): the grid's API and id lists. */
export interface GridGetRowsToExportParams extends GridRowsToExportIds {
  /** React: the `apiRef`; HTML: `{ current: instance }`. */
  apiRef: { readonly current: unknown };
}

/** The ids an export holds: `getRowsToExport`'s answer, else the `source` shortcut's. */
export function gridRowsToExport(
  ids: GridGetRowsToExportParams,
  source: GridExportSource | undefined,
  getRowsToExport?: ((params: GridGetRowsToExportParams) => readonly string[]) | undefined,
): string[] {
  if (getRowsToExport) {
    const known = new Set(ids.rowIds);
    return [...new Set(getRowsToExport(ids).map(String))].filter((id) => known.has(id));
  }
  switch (source) {
    case "selected": {
      const chosen = new Set(ids.selectedRowIds);
      return ids.filteredSortedRowIds.filter((id) => chosen.has(id));
    }
    case "page":
      return [...ids.paginatedRowIds];
    case "all":
      return [...ids.rowIds];
    default:
      return [...ids.filteredSortedRowIds];
  }
}

/** A `source` from untrusted input (`undefined`: not a known shortcut). */
export const parseGridExportSource = (input: unknown): GridExportSource | undefined =>
  (gridExportSources as readonly unknown[]).includes(input)
    ? (input as GridExportSource)
    : undefined;

/* ------------------------------------------------------------------ export options from markup */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * CSV or print options from an attribute's JSON (`data-ok-csv-options`, `data-ok-print-options`):
 * only known keys with values of the right type; anything else is dropped.
 */
export function parseGridExportOptions(json: string | null): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json ?? "null");
  } catch {
    return {};
  }
  if (!isRecord(parsed)) return {};
  const out: Record<string, unknown> = {};
  for (const key of ["fileName", "delimiter"])
    if (typeof parsed[key] === "string") out[key] = parsed[key];
  for (const key of [
    "includeHeaders",
    "utf8WithBom",
    "allColumns",
    "hideToolbar",
    "hideFooter",
    "includeCheckboxes",
  ])
    if (typeof parsed[key] === "boolean") out[key] = parsed[key];
  if (Array.isArray(parsed["fields"]))
    out["fields"] = parsed["fields"].filter((f): f is string => typeof f === "string");
  const source = parseGridExportSource(parsed["source"]);
  if (source) out["source"] = source;
  // One character only: a delimiter can't smuggle formulas or new lines into the file.
  if (typeof out["delimiter"] === "string" && !/^[^\r\n"=+\-@]$/.test(out["delimiter"]))
    delete out["delimiter"];
  return out;
}
