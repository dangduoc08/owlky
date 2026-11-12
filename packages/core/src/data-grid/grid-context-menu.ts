/*
 * Data grid context menu (roadmap 4.18.13, ADR-0057; ApexGrid / AG Grid cell menus): which items
 * a cell's menu holds, and a controller that opens it from a right click, Shift + F10 or the Menu
 * key. Shared by React and the HTML runtime; the owner renders the menu and runs the actions.
 */

/** Built-in items of the cell menu; `separator` draws a line between two items. */
export const gridContextMenuItemNames = [
  "copy",
  "paste",
  "export",
  "chart-range",
  "pin",
  "separator",
] as const;
export type GridContextMenuItemName = (typeof gridContextMenuItemNames)[number];

/** What the grid's options allow in the cell menu. */
export interface GridContextMenuFeatures {
  /** Editable columns and clipboard paste on. */
  paste: boolean;
  /** Cell selection and the charts integration on. */
  chart: boolean;
  /** Column pinning on. */
  pin: boolean;
}

/**
 * The default items: Copy, Paste, Export (CSV, Excel, Print), Chart from selection, Pin column
 * (Pin to left, Pin to right, Unpin), with separators. Items the options rule out are left out.
 */
export const gridDefaultContextMenuItems = (
  features: GridContextMenuFeatures,
): GridContextMenuItemName[] => [
  "copy",
  ...(features.paste ? (["paste"] as const) : []),
  "separator",
  "export",
  ...(features.chart ? (["chart-range"] as const) : []),
  ...(features.pin ? (["separator", "pin"] as const) : []),
];

/** One entry of a menu, and whether a line follows it (a separator came next). */
export interface GridContextMenuEntry<T> {
  item: T;
  divider: boolean;
}

/**
 * Menu entries from a list of items and separators: a separator becomes the line below the item
 * before it; separators first, last or twice in a row draw nothing.
 */
export function gridContextMenuEntries<T>(
  items: readonly (T | "separator")[],
): GridContextMenuEntry<T>[] {
  const entries: GridContextMenuEntry<T>[] = [];
  for (const item of items) {
    if (item === "separator") {
      const last = entries.at(-1);
      if (last) last.divider = true;
    } else entries.push({ item: item as T, divider: false });
  }
  const last = entries.at(-1);
  if (last) last.divider = false;
  return entries;
}

/** A point in the viewport, in px (Popover `anchorPosition`). */
export interface GridContextMenuPoint {
  top: number;
  left: number;
}

export interface GridContextMenuOptions {
  /** The menu is on (read on each press). */
  enabled(): boolean;
  /**
   * Opens the menu of `cell` at `point` (the pointer, or the cell's lower start corner from the
   * keyboard). Return `false` to leave the browser's own menu.
   */
  onOpen(cell: HTMLElement, point: GridContextMenuPoint, reason: "pointer" | "keyboard"): boolean;
}

export interface GridContextMenuController {
  destroy(): void;
}

const BODY_CELL =
  '[data-ok-data-grid-body] :is([role="gridcell"], [role="rowheader"])[data-ok-field]';
/** Fields, and anything inside a cell being edited (a Select editor's trigger and listbox). */
const EDITING =
  'input, textarea, select, [contenteditable], :is([role="gridcell"], [role="rowheader"])[data-ok-editing] *';
/** How long after a keyboard open the browser's own `contextmenu` event is swallowed, ms. */
const KEY_WINDOW = 1000;

/**
 * Opens a cell's menu: a right click (the pointer's position), Shift + F10 or the Menu key (the
 * focused cell's corner). The cell takes the focus first, so the menu gives it back when it
 * closes. Fields being edited keep the browser's menu; so do grids inside cells.
 */
export function createGridContextMenu(
  grid: HTMLElement,
  options: GridContextMenuOptions,
): GridContextMenuController {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;
  let keyedUntil = 0;
  const cellOf = (target: EventTarget | null): HTMLElement | null => {
    const element = target instanceof Element ? target : null;
    const cell = element?.closest<HTMLElement>(BODY_CELL);
    if (!cell || element?.closest(EDITING) || !grid.contains(cell)) return null;
    // A grid inside a cell (a date picker's calendar) has cells of its own.
    return cell.closest("[data-ok-data-grid-main]") === grid ? cell : null;
  };
  grid.addEventListener(
    "contextmenu",
    (event) => {
      // Swallowed after a keyboard open (the document listener below runs first).
      if (event.defaultPrevented) return;
      const cell = cellOf(event.target);
      if (!cell || !options.enabled()) return;
      cell.focus({ preventScroll: true });
      if (options.onOpen(cell, { top: event.clientY, left: event.clientX }, "pointer"))
        event.preventDefault();
    },
    { signal },
  );
  grid.addEventListener(
    "keydown",
    (event) => {
      const menuKey =
        event.key === "ContextMenu" ||
        (event.key === "F10" && event.shiftKey && !event.ctrlKey && !event.altKey);
      if (!menuKey || !options.enabled()) return;
      const cell = cellOf(event.target);
      if (!cell) return;
      const box = cell.getBoundingClientRect();
      const rtl = getComputedStyle(cell).direction === "rtl";
      const point = { top: box.bottom, left: rtl ? box.right : box.left };
      if (!options.onOpen(cell, point, "keyboard")) return;
      event.preventDefault();
      // Some systems fire `contextmenu` after the key too (Windows: on key up).
      keyedUntil = performance.now() + KEY_WINDOW;
    },
    { signal },
  );
  doc.addEventListener(
    "contextmenu",
    (event) => {
      // A right click is the person's own (mouse buttons report 2).
      if (performance.now() < keyedUntil && event.button !== 2) {
        keyedUntil = 0;
        event.preventDefault();
      }
    },
    { signal, capture: true },
  );
  // Any press ends the window: the next menu is a pointer's.
  doc.addEventListener("pointerdown", () => (keyedUntil = 0), { signal, capture: true });
  return {
    destroy() {
      abort.abort();
    },
  };
}
