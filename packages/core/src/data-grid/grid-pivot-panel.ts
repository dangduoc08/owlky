/*
 * Data grid pivot panel (MUI X Premium), shared by React and the HTML runtime: derived columns of
 * date fields, the panel's sections (fields in the model's order) and moves between them, and the
 * pointer drag of a field from its handle. The drag reports intent; the owner changes the model.
 */

import type { GridColumn } from "./data-grid.js";
import type { GridPivotModel } from "./grid-premium.js";

/** A pivot field the grid derives from another column (MUI X `getPivotDerivedColumns`). */
export interface GridPivotDerivedColumn extends GridColumn {
  /** The derived value, from the source column's value. */
  derive(value: unknown): unknown;
}

/** A date from a value: `YYYY-MM-DD` texts are local days (not UTC midnight). */
function localDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const day = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  const date = day
    ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
    : value instanceof Date
      ? value
      : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The default derived columns (MUI X): a year and a quarter (`Q1`…`Q4`) for every `date` column,
 * `<field>-year` and `<field>-quarter`, named "<header> (Year)" and "<header> (Quarter)".
 */
export function gridPivotDerivedColumns(
  column: GridColumn,
  labels: { year: string; quarter: string } = { year: "(Year)", quarter: "(Quarter)" },
): GridPivotDerivedColumn[] | undefined {
  if (column.type !== "date") return undefined;
  const header = column.headerName ?? column.field;
  return [
    {
      field: `${column.field}-year`,
      headerName: `${header} ${labels.year}`,
      derive: (value) => localDate(value)?.getFullYear() ?? null,
    },
    {
      field: `${column.field}-quarter`,
      headerName: `${header} ${labels.quarter}`,
      derive: (value) => {
        const date = localDate(value);
        return date ? `Q${Math.floor(date.getMonth() / 3) + 1}` : null;
      },
    },
  ];
}

/** A section of the pivot panel: unused fields, or a part of the model. */
export type GridPivotSection = "none" | "rows" | "columns" | "values";
export const gridPivotSectionNames: readonly GridPivotSection[] = [
  "none",
  "rows",
  "columns",
  "values",
];

/** The fields of each section in order: the model's, and the unused ones in column order. */
export function gridPivotSections(
  model: GridPivotModel,
  fields: readonly string[],
): Record<GridPivotSection, string[]> {
  const known = (list: { field: string }[]) =>
    list.map((item) => item.field).filter((field) => fields.includes(field));
  const rows = known(model.rows);
  const columns = known(model.columns);
  const values = known(model.values);
  const used = new Set([...rows, ...columns, ...values]);
  return { none: fields.filter((field) => !used.has(field)), rows, columns, values };
}

/**
 * The model after moving `field` to `index` of `section` (counted without the field itself). A
 * field keeps its options (sort, function) within its section; new values take `aggFunc`.
 */
export function moveGridPivotField(
  model: GridPivotModel,
  field: string,
  section: GridPivotSection,
  index: number,
  aggFunc = "sum",
): GridPivotModel {
  const next: GridPivotModel = {
    rows: model.rows.filter((r) => r.field !== field),
    columns: model.columns.filter((c) => c.field !== field),
    values: model.values.filter((v) => v.field !== field),
  };
  if (section === "none") return next;
  const at = (length: number) => Math.min(Math.max(Math.trunc(index) || 0, 0), length);
  if (section === "rows") {
    const own = model.rows.find((r) => r.field === field) ?? { field };
    next.rows.splice(at(next.rows.length), 0, own);
  } else if (section === "columns") {
    const own = model.columns.find((c) => c.field === field) ?? { field };
    next.columns.splice(at(next.columns.length), 0, own);
  } else {
    const own = model.values.find((v) => v.field === field) ?? { field, aggFunc };
    next.values.splice(at(next.values.length), 0, own);
  }
  return next;
}

export interface GridPivotDragOptions {
  /** A field was dropped at `index` of `section` (counted without the field itself). */
  onMove(field: string, section: GridPivotSection, index: number): void;
}

export interface GridPivotDrag {
  destroy(): void;
}

const SECTION = "[data-ok-data-grid-pivot-section]";
const FIELD = "[data-ok-data-grid-pivot-field]";

/**
 * Drags pivot fields by their handle (`[data-ok-data-grid-pivot-handle]`) between and within the
 * panel's sections. While dragging, the field has `data-ok-dragging`, the section under the
 * pointer `data-ok-drop-target` and the field it would drop next to `data-ok-drop`
 * (`before` | `after`). Escape cancels. The drag only reports the move: keyboard and single-pointer
 * users move fields with the role select and the Move up / Move down buttons (WCAG 2.5.7).
 */
export function createGridPivotDrag(
  panel: HTMLElement,
  options: GridPivotDragOptions,
): GridPivotDrag {
  let drag: {
    field: string;
    row: HTMLElement;
    x: number;
    y: number;
    pointer: number;
    on: boolean;
  } | null = null;
  let target: { section: GridPivotSection; index: number } | null = null;
  const unmark = () => {
    for (const marked of panel.querySelectorAll("[data-ok-drop], [data-ok-drop-target]")) {
      marked.removeAttribute("data-ok-drop");
      marked.removeAttribute("data-ok-drop-target");
    }
  };
  const end = (commit: boolean) => {
    if (!drag) return;
    const { field, on } = drag;
    drag.row.removeAttribute("data-ok-dragging");
    unmark();
    const dropped = target;
    drag = null;
    target = null;
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", cancel);
    document.removeEventListener("keydown", key, true);
    if (commit && on && dropped) options.onMove(field, dropped.section, dropped.index);
  };
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.on) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
      drag.on = true;
      drag.row.setAttribute("data-ok-dragging", "");
    }
    unmark();
    const section = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>(SECTION);
    if (!section || !panel.contains(section)) {
      target = null;
      return;
    }
    const dragged = drag.row;
    const fields = [...section.querySelectorAll<HTMLElement>(`:scope > ${FIELD}`)].filter(
      (row) => row !== dragged,
    );
    let index = fields.findIndex((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    if (index < 0) index = fields.length;
    section.setAttribute("data-ok-drop-target", "");
    const next = fields[index];
    if (next) next.setAttribute("data-ok-drop", "before");
    else fields.at(-1)?.setAttribute("data-ok-drop", "after");
    target = {
      section: section.getAttribute("data-ok-data-grid-pivot-section") as GridPivotSection,
      index,
    };
  };
  const up = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.pointer) end(true);
  };
  const cancel = () => end(false);
  const key = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !drag?.on) return;
    event.preventDefault();
    end(false);
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || drag) return;
    const handle = (event.target as Element).closest?.("[data-ok-data-grid-pivot-handle]");
    const row = handle?.closest<HTMLElement>(FIELD);
    if (!handle || !row || !panel.contains(row)) return;
    // No text selection while dragging.
    event.preventDefault();
    drag = {
      field: row.getAttribute("data-ok-field") as string,
      row,
      x: event.clientX,
      y: event.clientY,
      pointer: event.pointerId,
      on: false,
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("keydown", key, true);
  };
  panel.addEventListener("pointerdown", down);
  return {
    destroy() {
      end(false);
      panel.removeEventListener("pointerdown", down);
    },
  };
}
