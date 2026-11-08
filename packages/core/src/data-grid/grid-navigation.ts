/*
 * Keyboard navigation of a data grid (WAI-ARIA grid pattern), shared by React and the HTML runtime:
 * one tab stop (roving tabindex) over the header cells and the cells of the visible rows, arrows,
 * Home / End (Ctrl: grid corners), Page Up / Down, and intents for sorting, the column menu and
 * selection. The owner renders every cell (and every control inside one) with `tabindex="-1"`;
 * the controller moves `tabindex="0"`.
 */

const CELL = '[role="columnheader"], [role="gridcell"]';
/** Controls that take focus instead of their cell (checkboxes, action buttons, links). */
const INNER =
  'input:not([type="hidden"]), select, textarea, a[href], button:not([data-ok-data-grid-menu-button])';

export interface GridNavigationOptions {
  /** Enter / Space on a sortable header (Shift: add to the sort). */
  onSort(field: string, multi: boolean): void;
  /** Ctrl / Cmd + Enter on a header: open its column menu. */
  onColumnMenu(field: string, header: HTMLElement): void;
  /** Space on a body cell (checkbox selection): toggle that row. */
  onToggleRow(row: HTMLElement): void;
  /** Ctrl / Cmd + A: select every row. */
  onSelectAll(): void;
  /**
   * Enter, F2 or a printable key on a body cell: start editing it (`key`: the typed character,
   * which replaces the value).
   */
  onEdit?(cell: HTMLElement, reason: GridEditStartReason, key?: string): void;
  /** Alt + Left / Right on a header: make the column narrower / wider by `delta` px. */
  onResizeKey?(field: string, delta: number): void;
}

export type GridEditStartReason =
  | "cellDoubleClick"
  | "enterKeyDown"
  | "f2KeyDown"
  | "printableKeyDown";

export interface GridNavigation {
  /** Keeps exactly one tab stop after the owner re-rendered or re-paged rows. */
  sync(): void;
  destroy(): void;
}

const visibleRows = (grid: HTMLElement) =>
  [...grid.querySelectorAll<HTMLElement>('[role="row"]')].filter(
    (row) => !row.hidden && !row.closest("[hidden]"),
  );
/** Cells that take focus: shown, and not covered by a row span. */
const cellsOf = (row: HTMLElement) =>
  [...row.querySelectorAll<HTMLElement>(CELL)].filter(
    (cell) => !cell.hidden && !cell.hasAttribute("data-ok-covered"),
  );
/** Columns a cell occupies: its `aria-colindex` and `aria-colspan`. */
const columnsOf = (cell: HTMLElement) => {
  const start = Number(cell.getAttribute("aria-colindex")) || 0;
  return [start, start + (Number(cell.getAttribute("aria-colspan")) || 1) - 1] as const;
};

/** The element that holds focus for a cell: its first control, else the cell itself. */
export const gridFocusTarget = (cell: HTMLElement): HTMLElement =>
  cell.querySelector<HTMLElement>(INNER) ?? cell;

/** The cell position after a navigation key, clamped to the grid (`null` for other keys). */
export function moveGridCell(
  position: { row: number; col: number },
  key: string,
  size: { rows: number; cols: (row: number) => number; page: number },
  ctrl = false,
): { row: number; col: number } | null {
  const last = size.rows - 1;
  const clampCol = (row: number, col: number) => Math.min(Math.max(col, 0), size.cols(row) - 1);
  switch (key) {
    case "ArrowUp":
      return { row: Math.max(position.row - 1, 0), col: clampCol(position.row - 1, position.col) };
    case "ArrowDown": {
      const row = Math.min(position.row + 1, last);
      return { row, col: clampCol(row, position.col) };
    }
    case "ArrowLeft":
      return { row: position.row, col: Math.max(position.col - 1, 0) };
    case "ArrowRight":
      return { row: position.row, col: clampCol(position.row, position.col + 1) };
    case "Home":
      return ctrl ? { row: 0, col: 0 } : { row: position.row, col: 0 };
    case "End":
      return ctrl
        ? { row: last, col: size.cols(last) - 1 }
        : { row: position.row, col: size.cols(position.row) - 1 };
    case "PageDown": {
      const row = Math.min(position.row + size.page, last);
      return { row, col: clampCol(row, position.col) };
    }
    case "PageUp": {
      const row = Math.max(position.row - size.page, 0);
      return { row, col: clampCol(row, position.col) };
    }
    default:
      return null;
  }
}

export function createGridNavigation(
  grid: HTMLElement,
  options: GridNavigationOptions,
): GridNavigation {
  const abort = new AbortController();
  const { signal } = abort;
  let active: HTMLElement | null = null;

  const setStop = (cell: HTMLElement) => {
    for (const element of grid.querySelectorAll<HTMLElement>('[tabindex="0"]'))
      element.setAttribute("tabindex", "-1");
    active = cell;
    gridFocusTarget(cell).setAttribute("tabindex", "0");
  };

  const sync = () => {
    const rows = visibleRows(grid);
    const all = rows.flatMap(cellsOf);
    if (active && all.includes(active) && grid.contains(active)) {
      if (gridFocusTarget(active).getAttribute("tabindex") !== "0") setStop(active);
      return;
    }
    const first = all[0];
    if (first) setStop(first);
  };

  const position = (cell: HTMLElement) => {
    const rows = visibleRows(grid);
    const row = rows.indexOf(cell.closest('[role="row"]') as HTMLElement);
    return { rows, row, col: cellsOf(rows[row] as HTMLElement).indexOf(cell) };
  };

  grid.addEventListener(
    "focusin",
    (event) => {
      const cell = (event.target as Element).closest<HTMLElement>(CELL);
      if (cell && grid.contains(cell) && cell !== active) setStop(cell);
    },
    { signal },
  );

  grid.addEventListener(
    "keydown",
    (event) => {
      const target = event.target as HTMLElement;
      const cell = target.closest<HTMLElement>(CELL);
      if (!cell || !grid.contains(cell)) return;
      // Typing in a field inside a cell (editing, later phases) keeps its keys.
      if (target.matches("input:not([type='checkbox']), select, textarea")) return;
      const ctrl = event.ctrlKey || event.metaKey;
      const header = cell.getAttribute("role") === "columnheader";
      const field = cell.getAttribute("data-ok-field") ?? "";

      if (event.key === "a" && ctrl) {
        event.preventDefault();
        options.onSelectAll();
        return;
      }
      if (header && field && (event.key === "Enter" || event.key === " ") && target === cell) {
        event.preventDefault();
        if (ctrl && event.key === "Enter") options.onColumnMenu(field, cell);
        else if (cell.hasAttribute("aria-sort")) options.onSort(field, event.shiftKey);
        return;
      }
      if (
        header &&
        field &&
        event.altKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        event.preventDefault();
        // Right to left, the edge to drag is on the left: Left makes the column wider.
        const wider = (event.key === "ArrowRight") !== (getComputedStyle(grid).direction === "rtl");
        options.onResizeKey?.(field, wider ? 10 : -10);
        return;
      }
      if (!header && (event.key === "Enter" || event.key === "F2") && target === cell) {
        if (options.onEdit) {
          event.preventDefault();
          options.onEdit(cell, event.key === "F2" ? "f2KeyDown" : "enterKeyDown");
        }
        return;
      }
      // Typing a character on a cell starts editing with it (Space selects rows).
      if (
        !header &&
        target === cell &&
        event.key.length === 1 &&
        event.key !== " " &&
        !ctrl &&
        !event.altKey &&
        options.onEdit
      ) {
        event.preventDefault();
        options.onEdit(cell, "printableKeyDown", event.key);
        return;
      }
      if (!header && event.key === " " && target === cell) {
        const row = cell.closest<HTMLElement>('[role="row"]');
        if (row?.hasAttribute("aria-selected")) {
          event.preventDefault();
          options.onToggleRow(row);
        }
        return;
      }
      const { rows, row, col } = position(cell);
      const body = grid.querySelector<HTMLElement>("[data-ok-data-grid-body]");
      const height = (rows[rows.length - 1] as HTMLElement).offsetHeight || 52;
      const page = Math.max(Math.floor((body?.clientHeight ?? 0) / height), 1);
      // Right to left, Left moves to the next cell.
      const rtl = getComputedStyle(grid).direction === "rtl";
      const key =
        rtl && event.key === "ArrowLeft"
          ? "ArrowRight"
          : rtl && event.key === "ArrowRight"
            ? "ArrowLeft"
            : event.key;
      const next = moveGridCell(
        { row, col },
        key,
        {
          rows: rows.length,
          cols: (r) => cellsOf(rows[r] as HTMLElement).length,
          page,
        },
        ctrl,
      );
      if (!next) return;
      event.preventDefault();
      let destination = cellsOf(rows[next.row] as HTMLElement)[next.col] as HTMLElement;
      // Up and down keep the column, past spans: the cell of that column, or the next row's.
      const vertical = ["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(key);
      if (vertical && next.row !== row && cell.hasAttribute("aria-colindex")) {
        const column = columnsOf(cell)[0];
        const step = next.row > row ? 1 : -1;
        // No cell of the column further on (a span reaches the edge): stay.
        destination = cell;
        for (let r = next.row; r >= 0 && r < rows.length; r += step) {
          const found = cellsOf(rows[r] as HTMLElement).find((c) => {
            const [from, to] = columnsOf(c);
            return from <= column && column <= to;
          });
          if (found) {
            destination = found;
            break;
          }
        }
      }
      setStop(destination);
      gridFocusTarget(destination).focus();
      destination.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    },
    { signal },
  );

  sync();
  return {
    sync,
    destroy() {
      abort.abort();
    },
  };
}
