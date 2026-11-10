/*
 * Data grid editing models (roadmap 4.18.50), shared by React and the HTML runtime: the cell and
 * row modes models (MUI X `cellModesModel` / `rowModesModel`). The grid edits one cell (or one
 * row) at a time: the first entry in `edit` mode wins. Pure functions; owners keep the models.
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
