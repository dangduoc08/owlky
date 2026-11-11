/*
 * The cell selection's fill handle (MUI X `cellSelectionFillHandle`), shared by React and the HTML
 * runtime: drag the handle at the selection's corner to repeat its cells down, up, right or left,
 * or press Ctrl / Cmd + D (down) or Ctrl / Cmd + R (right) as in spreadsheets (WCAG 2.5.7).
 * Pure plans plus a controller that reports intent; owners write the cells (through
 * `processRowUpdate`) as one undo step.
 */

import {
  type GridCellPosition,
  type GridCellSelectionModel,
  gridSelectedBlock,
  isGridCellSelected,
} from "./grid-cells.js";

/** A cell to fill and the cell its value comes from. */
export interface GridFillCell {
  id: string;
  field: string;
  from: GridCellPosition;
}

export type GridFillDirection = "up" | "down" | "left" | "right";

/** The selected rectangle (rows and fields next to each other, every cell selected), or `null`. */
export function gridFillSource(
  model: GridCellSelectionModel,
  rowIds: readonly string[],
  fields: readonly string[],
): { ids: string[]; fields: string[] } | null {
  const block = gridSelectedBlock(model, rowIds, fields);
  if (!block.ids.length || !block.fields.length) return null;
  const next = (list: readonly string[], all: readonly string[]) =>
    list.every(
      (item, i) => i === 0 || all.indexOf(item) === all.indexOf(list[i - 1] as string) + 1,
    );
  if (!next(block.ids, rowIds) || !next(block.fields, fields)) return null;
  for (const id of block.ids)
    for (const field of block.fields) if (!isGridCellSelected(model, id, field)) return null;
  return block;
}

/** Index of the source line a target line repeats (the pattern starts next to the source). */
const repeat = (distance: number, size: number, backwards: boolean) =>
  backwards ? size - 1 - ((distance - 1) % size) : (distance - 1) % size;

/**
 * The cells a drag of the handle to `target` fills: the source repeated along the longer way out
 * of it (rows win a tie), in display order. `null` while the target is inside the source.
 */
export function gridFillCells(
  source: { ids: readonly string[]; fields: readonly string[] },
  rowIds: readonly string[],
  fields: readonly string[],
  target: GridCellPosition,
): { direction: GridFillDirection; cells: GridFillCell[] } | null {
  const r0 = rowIds.indexOf(source.ids[0] as string);
  const r1 = r0 + source.ids.length - 1;
  const c0 = fields.indexOf(source.fields[0] as string);
  const c1 = c0 + source.fields.length - 1;
  const tr = rowIds.indexOf(target.id);
  const tc = fields.indexOf(target.field);
  if (r0 < 0 || c0 < 0 || tr < 0 || tc < 0) return null;
  const dr = tr < r0 ? r0 - tr : tr > r1 ? tr - r1 : 0;
  const dc = tc < c0 ? c0 - tc : tc > c1 ? tc - c1 : 0;
  if (!dr && !dc) return null;
  const cells: GridFillCell[] = [];
  if (dr >= dc) {
    const up = tr < r0;
    const [from, to] = up ? [tr, r0 - 1] : [r1 + 1, tr];
    for (let r = from; r <= to; r++) {
      const at = repeat(up ? r0 - r : r - r1, source.ids.length, up);
      for (const field of source.fields)
        cells.push({
          id: rowIds[r] as string,
          field,
          from: { id: source.ids[at] as string, field },
        });
    }
    return { direction: up ? "up" : "down", cells };
  }
  const left = tc < c0;
  const [from, to] = left ? [tc, c0 - 1] : [c1 + 1, tc];
  for (const id of source.ids)
    for (let c = from; c <= to; c++) {
      const at = repeat(left ? c0 - c : c - c1, source.fields.length, left);
      cells.push({
        id,
        field: fields[c] as string,
        from: { id, field: source.fields[at] as string },
      });
    }
  return { direction: left ? "left" : "right", cells };
}

/**
 * Ctrl / Cmd + D and + R (spreadsheets): the selection's first row (or column) fills the others;
 * a selection one row high (or wide) takes the row above (or the column before) instead.
 */
export function gridFillWithin(
  source: { ids: readonly string[]; fields: readonly string[] },
  rowIds: readonly string[],
  fields: readonly string[],
  direction: "down" | "right",
): GridFillCell[] {
  const cells: GridFillCell[] = [];
  if (direction === "down") {
    const above = rowIds[rowIds.indexOf(source.ids[0] as string) - 1];
    const [from, targets] =
      source.ids.length > 1 ? [source.ids[0], source.ids.slice(1)] : [above, source.ids];
    if (from === undefined) return cells;
    for (const id of targets)
      for (const field of source.fields) cells.push({ id, field, from: { id: from, field } });
    return cells;
  }
  const before = fields[fields.indexOf(source.fields[0] as string) - 1];
  const [from, targets] =
    source.fields.length > 1 ? [source.fields[0], source.fields.slice(1)] : [before, source.fields];
  if (from === undefined) return cells;
  for (const id of source.ids)
    for (const field of targets) cells.push({ id, field, from: { id, field: from } });
  return cells;
}

/** The selection after a fill: the source and the filled cells. */
export function gridFillSelection(
  source: { ids: readonly string[]; fields: readonly string[] },
  cells: readonly GridFillCell[],
): GridCellSelectionModel {
  const out: GridCellSelectionModel = {};
  for (const id of source.ids)
    for (const field of source.fields) out[id] = { ...out[id], [field]: true };
  for (const { id, field } of cells) out[id] = { ...out[id], [field]: true };
  return out;
}

export interface GridFillHandleOptions {
  /** The fill handle is on (read on each press and key). */
  enabled(): boolean;
  /** The cells a drag to `target` would fill (marked `data-ok-fill-target` while dragging). */
  preview(target: GridCellPosition): readonly GridCellPosition[];
  /** The handle was released over `target`. */
  onFill(target: GridCellPosition): void;
  /** Ctrl / Cmd + D (`down`) or + R (`right`) on a body cell. */
  onFillKey(direction: "down" | "right"): void;
}

export interface GridFillHandle {
  destroy(): void;
}

const HANDLE = "[data-ok-data-grid-fill-handle]";
const BODY_CELL =
  '[data-ok-data-grid-body] :is([role="gridcell"], [role="rowheader"])[data-ok-field]';
const MARK = "data-ok-fill-target";

const positionOf = (cell: Element): GridCellPosition | null => {
  const row = cell.closest('[role="row"][data-ok-row-id]');
  const field = cell.getAttribute("data-ok-field");
  return row && field ? { id: row.getAttribute("data-ok-row-id") as string, field } : null;
};

export function createGridFillHandle(
  grid: HTMLElement,
  options: GridFillHandleOptions,
): GridFillHandle {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;
  const clear = () => {
    for (const cell of grid.querySelectorAll(`[${MARK}]`)) cell.removeAttribute(MARK);
  };
  const mark = (cells: readonly GridCellPosition[]) => {
    clear();
    for (const { id, field } of cells)
      grid
        .querySelector(
          `[data-ok-data-grid-body] [role="row"][data-ok-row-id="${CSS.escape(id)}"] > [data-ok-field="${CSS.escape(field)}"]`,
        )
        ?.setAttribute(MARK, "");
  };

  grid.addEventListener(
    "pointerdown",
    (event) => {
      const handle = (event.target as Element).closest(HANDLE);
      if (!handle || event.button !== 0 || !options.enabled()) return;
      // The press stays the handle's: no new selection, no text selection.
      event.preventDefault();
      let over: GridCellPosition | null = null;
      const move = (e: PointerEvent) => {
        const cell = doc.elementFromPoint(e.clientX, e.clientY)?.closest(BODY_CELL);
        const at = cell && grid.contains(cell) ? positionOf(cell) : null;
        if (!at || (over && at.id === over.id && at.field === over.field)) return;
        over = at;
        mark(options.preview(at));
      };
      const stop = () => {
        doc.removeEventListener("pointermove", move);
        doc.removeEventListener("pointerup", up);
        doc.removeEventListener("keydown", cancel, true);
        clear();
      };
      const up = () => {
        const target = over;
        stop();
        if (target) options.onFill(target);
      };
      const cancel = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        stop();
      };
      doc.addEventListener("pointermove", move, { signal });
      doc.addEventListener("pointerup", up, { signal });
      doc.addEventListener("keydown", cancel, { signal, capture: true });
    },
    { signal },
  );

  grid.addEventListener(
    "keydown",
    (event) => {
      const key = event.key.toLowerCase();
      if (
        (key !== "d" && key !== "r") ||
        !(event.ctrlKey || event.metaKey) ||
        event.shiftKey ||
        event.altKey ||
        !options.enabled()
      )
        return;
      // On the cell itself, not in a field it holds (an editor keeps its own keys).
      const cell = event.target as Element;
      if (!cell.matches(BODY_CELL) || !grid.contains(cell)) return;
      event.preventDefault();
      options.onFillKey(key === "d" ? "down" : "right");
    },
    { signal },
  );

  return {
    destroy() {
      clear();
      abort.abort();
    },
  };
}
