/*
 * Data grid phase 6 (ADR-0021), shared by React and the HTML runtime: cell range selection (the
 * model, its edges and a pointer / keyboard controller) and clipboard copy and paste as
 * tab-separated text (MUI X Premium). The clipboard goes through the browser's own copy and paste
 * of a short-lived text area, on the user's key press: no permission is asked for.
 */

/** Selected cells: row id → field → true (MUI X `cellSelectionModel`). */
export type GridCellSelectionModel = Record<string, Record<string, boolean>>;

export interface GridCellPosition {
  id: string;
  field: string;
}

const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);

/** The cells of the rectangle between two cells (in the rows' and fields' display order). */
export function gridCellRange(
  rowIds: readonly string[],
  fields: readonly string[],
  anchor: GridCellPosition,
  focus: GridCellPosition,
): GridCellSelectionModel {
  const r = [rowIds.indexOf(anchor.id), rowIds.indexOf(focus.id)];
  const c = [fields.indexOf(anchor.field), fields.indexOf(focus.field)];
  if (r.some((i) => i < 0) || c.some((i) => i < 0)) return {};
  const [top, bottom] = [Math.min(...r), Math.max(...r)];
  const [left, right] = [Math.min(...c), Math.max(...c)];
  const model: GridCellSelectionModel = {};
  for (let i = top; i <= bottom; i++) {
    const cells: Record<string, boolean> = {};
    for (let j = left; j <= right; j++) cells[fields[j] as string] = true;
    model[rowIds[i] as string] = cells;
  }
  return model;
}

export const isGridCellSelected = (
  model: GridCellSelectionModel,
  id: string,
  field: string,
): boolean => Object.hasOwn(model, id) && model[id]?.[field] === true;

/** Adds the cells of `other` (Ctrl / Cmd + click or drag adds a range). */
export function mergeGridCellSelection(
  model: GridCellSelectionModel,
  other: GridCellSelectionModel,
): GridCellSelectionModel {
  const out: GridCellSelectionModel = {};
  for (const source of [model, other])
    for (const [id, cells] of Object.entries(source))
      for (const [field, on] of Object.entries(cells))
        if (on) out[id] = { ...out[id], [field]: true };
  return out;
}

/** Toggles one cell. */
export function toggleGridCell(
  model: GridCellSelectionModel,
  id: string,
  field: string,
): GridCellSelectionModel {
  if (!isGridCellSelected(model, id, field))
    return mergeGridCellSelection(model, { [id]: { [field]: true } });
  const out: GridCellSelectionModel = {};
  for (const [rowId, cells] of Object.entries(model)) {
    const kept = Object.fromEntries(
      Object.entries(cells).filter(([f, on]) => on && !(rowId === id && f === field)),
    );
    if (Object.keys(kept).length) out[rowId] = kept;
  }
  return out;
}

/** Sides of a selected cell on the edge of its range (its neighbour there isn't selected). */
export function gridCellEdges(
  model: GridCellSelectionModel,
  rowIds: readonly string[],
  fields: readonly string[],
  id: string,
  field: string,
): string {
  if (!isGridCellSelected(model, id, field)) return "";
  const r = rowIds.indexOf(id);
  const c = fields.indexOf(field);
  const on = (dr: number, dc: number) => {
    const rowId = rowIds[r + dr];
    const f = fields[c + dc];
    return rowId !== undefined && f !== undefined && isGridCellSelected(model, rowId, f);
  };
  return [
    on(-1, 0) ? "" : "top",
    on(0, 1) ? "" : "right",
    on(1, 0) ? "" : "bottom",
    on(0, -1) ? "" : "left",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The selected cells as a block: the rows with a selected cell and the fields with one, in display
 * order (cells outside the selection are empty).
 */
export function gridSelectedBlock(
  model: GridCellSelectionModel,
  rowIds: readonly string[],
  fields: readonly string[],
): { ids: string[]; fields: string[] } {
  const ids = rowIds.filter((id) => fields.some((f) => isGridCellSelected(model, id, f)));
  const used = fields.filter((f) => ids.some((id) => isGridCellSelected(model, id, f)));
  return { ids, fields: used };
}

/** A cell selection model from untrusted input. */
export function sanitizeGridCellSelection(input: unknown): GridCellSelectionModel {
  const out: GridCellSelectionModel = {};
  if (typeof input !== "object" || input === null || Array.isArray(input)) return out;
  for (const [id, cells] of Object.entries(input as Record<string, unknown>)) {
    if (UNSAFE.has(id) || typeof cells !== "object" || cells === null) continue;
    for (const [field, on] of Object.entries(cells as Record<string, unknown>))
      if (!UNSAFE.has(field) && on === true) out[id] = { ...out[id], [field]: true };
  }
  return out;
}

/* ------------------------------------------------------------------ tab-separated text */

/** Tab-separated text of cells (CRLF lines; cells with tabs, new lines or quotes are quoted). */
export function gridToTsv(cells: readonly (readonly string[])[], delimiter = "\t"): string {
  const field = (text: string) =>
    text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  return cells.map((row) => row.map(field).join(delimiter)).join("\r\n");
}

/** Cells from pasted text (spreadsheets' tab-separated text; quoted cells may hold new lines). */
export function parseGridClipboard(text: string, delimiter = "\t"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const body = text.replace(/\r?\n$/, "");
  for (let i = 0; i < body.length; i++) {
    const ch = body[i] as string;
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && body[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

/* ------------------------------------------------------------------ controllers */

const BODY_CELL =
  '[data-ok-data-grid-body] :is([role="gridcell"], [role="rowheader"])[data-ok-field]';
const CONTROL =
  "button, a, input, label, select, textarea, [contenteditable], [data-ok-data-grid-fill-handle]";

export interface GridCellSelectionOptions {
  /** Cell selection is on (read on each press). */
  enabled(): boolean;
  /**
   * A press, drag or Shift + arrow: `replace` the selection with the range, `extend` it from the
   * anchor, or `add` the range (Ctrl / Cmd).
   */
  onSelect(anchor: GridCellPosition, focus: GridCellPosition, mode: "replace" | "add"): void;
  /** Alt + F1 on a cell: chart the selected cells (spreadsheets' quick chart; ADR-0055). */
  onRangeChart?(): void;
  /**
   * Alt + Shift + F1 on a cell: the active range chart draws the selected cells instead (the
   * keyboard path to resizing its range, WCAG 2.5.7; 4.18.89).
   */
  onRangeChartUpdate?(): void;
}

export interface GridCellSelectionController {
  destroy(): void;
}

const positionOf = (cell: Element): GridCellPosition | null => {
  const row = cell.closest('[role="row"][data-ok-row-id]');
  const field = cell.getAttribute("data-ok-field");
  return row && field ? { id: row.getAttribute("data-ok-row-id") as string, field } : null;
};

/**
 * Cell range selection: press a cell (Shift: extend from the anchor, Ctrl / Cmd: add a range),
 * drag across cells, or Shift + arrows from the focused cell; Alt + F1 asks for a range chart.
 * Reports intent; the owner keeps the model. Register it after the navigation controller (Shift + arrows read the moved focus).
 */
export function createGridCellSelection(
  grid: HTMLElement,
  options: GridCellSelectionOptions,
): GridCellSelectionController {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;
  let anchor: GridCellPosition | null = null;
  /** The cell the last range ended on (Shift + arrows go on from there). */
  let last: GridCellPosition | null = null;
  let mode: "replace" | "add" = "replace";
  const same = (a: GridCellPosition | null, b: GridCellPosition) =>
    !!a && a.id === b.id && a.field === b.field;
  const report = (from: GridCellPosition, to: GridCellPosition, how: "replace" | "add") => {
    last = to;
    options.onSelect(from, to, how);
  };
  grid.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target as Element;
      const cell = target.closest(BODY_CELL);
      if (!cell || event.button !== 0 || !options.enabled() || target.closest(CONTROL)) return;
      const here = positionOf(cell) as GridCellPosition;
      if (!event.shiftKey || !anchor) anchor = here;
      mode = event.ctrlKey || event.metaKey ? "add" : "replace";
      report(anchor, here, mode);
      const move = (e: PointerEvent) => {
        const over = doc.elementFromPoint(e.clientX, e.clientY)?.closest(BODY_CELL);
        const at = over && grid.contains(over) ? positionOf(over) : null;
        if (!at || same(last, at)) return;
        report(anchor as GridCellPosition, at, mode);
      };
      const up = () => {
        doc.removeEventListener("pointermove", move);
        doc.removeEventListener("pointerup", up);
      };
      doc.addEventListener("pointermove", move, { signal });
      doc.addEventListener("pointerup", up, { signal });
    },
    { signal },
  );
  grid.addEventListener(
    "keydown",
    (event) => {
      if (!options.enabled()) return;
      const arrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key);
      const cell = (event.target as Element).closest(BODY_CELL);
      if (cell && event.key === "F1" && event.altKey && !event.ctrlKey && !event.metaKey) {
        const run = event.shiftKey ? options.onRangeChartUpdate : options.onRangeChart;
        if (run) {
          event.preventDefault();
          run();
        }
        return;
      }
      if (!arrow || !cell) return;
      const before = positionOf(cell) as GridCellPosition;
      if (!event.shiftKey) {
        anchor = null;
        return;
      }
      // From anywhere but the end of the last range, a range starts at the focused cell.
      if (!anchor || !same(last, before)) anchor = before;
      // The navigation controller has moved the focus.
      const moved = (doc.activeElement as Element | null)?.closest(BODY_CELL);
      const at = moved && grid.contains(moved) ? positionOf(moved) : null;
      if (at) report(anchor, at, "replace");
    },
    { signal },
  );
  return {
    destroy() {
      abort.abort();
    },
  };
}

export interface GridClipboardOptions {
  /** Text to copy for Ctrl / Cmd + C (`null`: let the browser copy). */
  copyText(): string | null;
  /** Ctrl / Cmd + V pastes (read on each press). */
  canPaste(): boolean;
  onPaste(text: string): void;
  onCopy?(text: string): void;
}

export interface GridClipboard {
  /**
   * Copies `text` from a menu or a button (call it in the press: browsers copy only then). Uses
   * the Clipboard API, else the browser's copy command. `false` when neither copied.
   */
  copy(text: string): Promise<boolean>;
  /**
   * Reads the clipboard's text (the browser may ask the person first) and pastes it like
   * Ctrl / Cmd + V. `false` when pasting is off, or the browser can't or won't give the text.
   */
  paste(): Promise<boolean>;
  destroy(): void;
}

const EDITING = "input, textarea, select, [contenteditable]";

/**
 * Clipboard copy and paste on the grid's cells: Ctrl / Cmd + C copies `copyText()`, Ctrl / Cmd + V
 * reads plain text. Both run the browser's own copy or paste on a hidden text area that holds the
 * focus for that key press, then give the focus back.
 */
export function createGridClipboard(
  grid: HTMLElement,
  options: GridClipboardOptions,
): GridClipboard {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;
  /** `text`: what to copy (a text area keeps no carriage returns: the event gets it as is). */
  const relay = (text: string | null) => {
    const previous = doc.activeElement as HTMLElement | null;
    const area = doc.createElement("textarea");
    area.setAttribute("aria-hidden", "true");
    area.tabIndex = -1;
    area.style.position = "fixed";
    area.style.insetBlockStart = "0";
    area.style.insetInlineStart = "-9999px";
    area.style.opacity = "0";
    // The browser copies the selection: the text area holds the text, selected.
    area.value = text ?? "";
    doc.body.append(area);
    area.focus({ preventScroll: true });
    area.select();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      area.remove();
      previous?.focus({ preventScroll: true });
    };
    area.addEventListener(
      "copy",
      (event) => {
        event.clipboardData?.setData("text/plain", text ?? "");
        event.preventDefault();
        finish();
        if (text !== null) options.onCopy?.(text);
      },
      { once: true },
    );
    area.addEventListener(
      "paste",
      (event) => {
        const pasted = event.clipboardData?.getData("text/plain") ?? "";
        event.preventDefault();
        finish();
        if (text === null) options.onPaste(pasted);
      },
      { once: true },
    );
    // The browser copies or pastes right after the key press; anything else ends it.
    setTimeout(finish, 0);
  };
  grid.addEventListener(
    "keydown",
    (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "c" && key !== "v") return;
      const target = event.target as Element;
      if (
        !target.closest('[role="gridcell"], [role="rowheader"], [role="columnheader"]') ||
        target.closest(EDITING)
      )
        return;
      if (key === "c") {
        // Text the person selected inside the grid is theirs to copy.
        if (doc.getSelection()?.toString()) return;
        const text = options.copyText();
        if (text !== null) relay(text);
      } else if (options.canPaste()) relay(null);
    },
    { signal },
  );
  const api = doc.defaultView?.navigator.clipboard;
  return {
    async copy(text) {
      try {
        if (!api?.writeText) throw new Error("no clipboard");
        await api.writeText(text);
        options.onCopy?.(text);
        return true;
      } catch {
        // Older paths: the copy command on the relay's text area (the press is still on).
        relay(text);
        return doc.execCommand("copy");
      }
    },
    async paste() {
      if (!options.canPaste() || !api?.readText) return false;
      try {
        options.onPaste(await api.readText());
        return true;
      } catch {
        return false;
      }
    },
    destroy() {
      abort.abort();
    },
  };
}
