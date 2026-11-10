/*
 * Data grid editing models (roadmap 4.18.50), shared by React and the HTML runtime: the cell and
 * row modes models (MUI X `cellModesModel` / `rowModesModel`). The grid edits one cell (or one
 * row) at a time: the first entry in `edit` mode wins. Pure functions; owners keep the models.
 * Undo and redo (roadmap 4.18.9): a stack of steps (one edit, or one paste) and the keys.
 */

/** A cell's or a row's mode (MUI X `GridCellModes` / `GridRowModes`). */
export type GridEditModeValue = "edit" | "view";

/** One cell's entry of the cell modes model. */
export interface GridCellModeEntry {
  mode: GridEditModeValue;
  /** With `view`: leave without saving (Escape). */
  ignoreModifications?: boolean | undefined;
}

/** Cells in edit mode, by row id and field (MUI X `GridCellModesModel`). */
export type GridCellModesModel = Record<string, Record<string, GridCellModeEntry>>;

/** One row's entry of the row modes model. */
export interface GridRowModeEntry {
  mode: GridEditModeValue;
  /** With `view`: leave without saving (Escape). */
  ignoreModifications?: boolean | undefined;
  /** With `edit`: the field whose input takes the focus (default: the first editable one). */
  fieldToFocus?: string | undefined;
}

/** Rows in edit mode, by row id (MUI X `GridRowModesModel`). */
export type GridRowModesModel = Record<string, GridRowModeEntry>;

/** What a modes model puts in edit mode: a cell (`field`), or a row (`field` null). */
export interface GridEditTarget {
  id: string;
  field: string | null;
  fieldToFocus?: string | undefined;
}

const isEntry = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && !Array.isArray(input);
const entryOf = (input: unknown): GridRowModeEntry | null => {
  if (!isEntry(input) || (input["mode"] !== "edit" && input["mode"] !== "view")) return null;
  return {
    mode: input["mode"],
    ...(input["ignoreModifications"] === true ? { ignoreModifications: true } : {}),
    ...(typeof input["fieldToFocus"] === "string" ? { fieldToFocus: input["fieldToFocus"] } : {}),
  };
};

/** A cell modes model from untrusted input: known modes only. */
export function sanitizeGridCellModes(input: unknown): GridCellModesModel {
  const out: GridCellModesModel = {};
  if (!isEntry(input)) return out;
  for (const [id, fields] of Object.entries(input)) {
    if (!isEntry(fields)) continue;
    for (const [field, raw] of Object.entries(fields)) {
      const entry = entryOf(raw);
      if (!entry) continue;
      const { fieldToFocus: _, ...cell } = entry;
      out[id] = { ...out[id], [field]: cell };
    }
  }
  return out;
}

/** A row modes model from untrusted input: known modes only. */
export function sanitizeGridRowModes(input: unknown): GridRowModesModel {
  const out: GridRowModesModel = {};
  if (!isEntry(input)) return out;
  for (const [id, raw] of Object.entries(input)) {
    const entry = entryOf(raw);
    if (entry) out[id] = entry;
  }
  return out;
}

/** The cell (cell mode) or row (row mode) a modes model edits: its first `edit` entry. */
export function gridEditTarget(
  cells: GridCellModesModel | undefined,
  rows: GridRowModesModel | undefined,
  editMode: "cell" | "row",
): GridEditTarget | null {
  if (editMode === "row") {
    for (const [id, entry] of Object.entries(rows ?? {}))
      if (entry?.mode === "edit")
        return {
          id,
          field: null,
          ...(entry.fieldToFocus ? { fieldToFocus: entry.fieldToFocus } : {}),
        };
    return null;
  }
  for (const [id, fields] of Object.entries(cells ?? {}))
    for (const [field, entry] of Object.entries(fields ?? {}))
      if (entry?.mode === "edit") return { id, field };
  return null;
}

/** The mode of one cell (row mode: its row's) in the models. */
export function gridEditModeOf(
  cells: GridCellModesModel | undefined,
  rows: GridRowModesModel | undefined,
  editMode: "cell" | "row",
  id: string,
  field?: string,
): GridEditModeValue {
  const target = gridEditTarget(cells, rows, editMode);
  if (!target || target.id !== id) return "view";
  return editMode === "row" || target.field === field ? "edit" : "view";
}

/** The modes models for an edit that starts (`mode: edit`) or stops (`view`, maybe cancelled). */
export function gridEditModes(
  editMode: "cell" | "row",
  id: string,
  field: string,
  mode: GridEditModeValue,
  ignoreModifications = false,
): { cells: GridCellModesModel; rows: GridRowModesModel } {
  const entry: GridRowModeEntry = {
    mode,
    ...(mode === "view" && ignoreModifications ? { ignoreModifications: true } : {}),
  };
  if (editMode === "row")
    return {
      cells: {},
      rows: { [id]: mode === "edit" ? { ...entry, fieldToFocus: field } : entry },
    };
  return { cells: { [id]: { [field]: entry } }, rows: {} };
}

/* ------------------------------------------------------------------ undo and redo */

/** One row of a step: the row before and after (only the fields that differ are restored). */
export interface GridHistoryChange<R> {
  id: string;
  before: R;
  after: R;
}

/** One undoable step: an edited cell or row, or every row of a paste. */
export interface GridHistoryStep<R> {
  changes: GridHistoryChange<R>[];
}

/** The grid's undo and redo methods (MUI X `apiRef.current.history`). */
export interface GridHistoryApi {
  /** Undoes the last step; resolves `false` when there is none or it failed. */
  undo(): Promise<boolean>;
  /** Redoes the last undone step; resolves `false` when there is none or it failed. */
  redo(): Promise<boolean>;
  /** Forgets every step. */
  clear(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

/** The undo and redo stacks of an owner (most recent last). */
export interface GridHistoryStack<R> {
  /** Adds a step (the oldest goes past `size`; redo steps are dropped). */
  push(step: GridHistoryStep<R>): void;
  /** The step `undo` / `redo` would apply, or null. */
  peek(direction: "undo" | "redo"): GridHistoryStep<R> | null;
  /**
   * After applying the peeked step: `ok` moves it to the other stack; a failure drops it with the
   * steps behind it (MUI X: an undo failure drops the earlier steps, a redo failure the later ones).
   */
  settle(direction: "undo" | "redo", ok: boolean): void;
  clear(): void;
  /** Steps to undo and to redo. */
  readonly sizes: { undo: number; redo: number };
}

/** An undo / redo stack of at most `size` steps (0: nothing is kept). */
export function createGridHistoryStack<R>(size: number): GridHistoryStack<R> {
  let past: GridHistoryStep<R>[] = [];
  let future: GridHistoryStep<R>[] = [];
  const limit = Math.max(0, Math.floor(size) || 0);
  return {
    push(step) {
      if (limit === 0 || step.changes.length === 0) return;
      past.push(step);
      if (past.length > limit) past = past.slice(past.length - limit);
      future = [];
    },
    peek(direction) {
      return (direction === "undo" ? past.at(-1) : future.at(-1)) ?? null;
    },
    settle(direction, ok) {
      const from = direction === "undo" ? past : future;
      const step = from.pop();
      if (!step) return;
      if (!ok) {
        if (direction === "undo") past = [];
        else future = [];
        return;
      }
      (direction === "undo" ? future : past).push(step);
    },
    clear() {
      past = [];
      future = [];
    },
    get sizes() {
      return { undo: past.length, redo: future.length };
    },
  };
}

/**
 * Whether two cell values are the same: identical, the same time (dates), or the same text when
 * one is text (the HTML runtime reads values back from attributes).
 */
export function gridSameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return (typeof a === "string" || typeof b === "string") && text(a) === text(b);
}

/** The fields whose values differ between two rows. */
export function gridChangedFields(
  before: Readonly<Record<string, unknown>>,
  after: Readonly<Record<string, unknown>>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => !gridSameValue(before[key], after[key]));
}

/**
 * The row to write for an undo (the change's `before` values) or a redo (`after`): the current row
 * with the changed fields, or `null` when the current row no longer holds the values the step left
 * (changed elsewhere: the step can't apply).
 */
export function gridHistoryRow<R extends Readonly<Record<string, unknown>>>(
  current: R,
  change: GridHistoryChange<R>,
  direction: "undo" | "redo",
): R | null {
  const fields = gridChangedFields(change.before, change.after);
  const expected = direction === "undo" ? change.after : change.before;
  const source = direction === "undo" ? change.before : change.after;
  if (!fields.every((field) => gridSameValue(current[field], expected[field]))) return null;
  return { ...current, ...Object.fromEntries(fields.map((field) => [field, source[field]])) };
}

export interface GridHistoryKeyOptions {
  /** Undo and redo are on (read on each press). */
  enabled(): boolean;
  undo(): void;
  redo(): void;
}

const HISTORY_EDITING = "input, textarea, select, [contenteditable]";

/**
 * Undo and redo keys on the grid's cells and headers: Ctrl / Cmd + Z undoes, Ctrl / Cmd + Shift + Z
 * and Ctrl / Cmd + Y redo. Fields keep their own undo (typing in an editor or a filter).
 */
export function createGridHistoryKeys(
  grid: HTMLElement,
  options: GridHistoryKeyOptions,
): { destroy(): void } {
  const abort = new AbortController();
  grid.addEventListener(
    "keydown",
    (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      const target = event.target as Element;
      if (!target.closest('[role="gridcell"], [role="columnheader"]')) return;
      if (target.closest(HISTORY_EDITING) || !options.enabled()) return;
      event.preventDefault();
      if (key === "z" && !event.shiftKey) options.undo();
      else options.redo();
    },
    { signal: abort.signal },
  );
  return {
    destroy() {
      abort.abort();
    },
  };
}
