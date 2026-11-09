/**
 * The Gantt's data table (ADR-0048): HTML pages list their tasks in `table[data-ok-gantt-data]`;
 * React renders the same table from its `tasks`. Header cells name their field
 * (`data-ok-gantt-field`), rows carry the task id, parent, type, color and view state.
 */
import { ganttDay, ganttIsoDay, ganttShortDate } from "./gantt-date.js";
import {
  type GanttColor,
  type GanttTask,
  ganttColors,
  ganttDependencies,
  ganttDependencyText,
  ganttTaskTypes,
  parseGanttDependencies,
} from "./gantt-model.js";
import type { GanttLocaleText } from "./gantt-render.js";

export const ganttFields = [
  "name",
  "startTime",
  "endTime",
  "progress",
  "dependency",
  "baselineStart",
  "baselineEnd",
] as const;
export type GanttField = (typeof ganttFields)[number];

export interface GanttTableCell {
  readonly text: string;
  readonly value?: string | undefined;
}

export interface GanttTableRow {
  readonly attrs: Readonly<Record<string, string>>;
  readonly cells: readonly GanttTableCell[];
}

export interface GanttTableModel {
  readonly fields: readonly GanttField[];
  readonly headers: readonly string[];
  readonly rows: readonly GanttTableRow[];
}

/** Header texts of the data table's fields. */
const headerText = (field: GanttField, text: GanttLocaleText): string => {
  switch (field) {
    case "dependency":
      return text.predecessors;
    case "baselineStart":
      return `${text.baseline} ${text.startTime.toLowerCase()}`;
    case "baselineEnd":
      return `${text.baseline} ${text.endTime.toLowerCase()}`;
    default:
      return text[field];
  }
};

const dateCell = (value: unknown, locale: string): GanttTableCell => {
  const day = ganttDay(value);
  return day === undefined
    ? { text: "" }
    : { text: ganttShortDate(day, locale), value: ganttIsoDay(day) };
};

/** The table React renders for `tasks` (HTML pages write the same markup). */
export function ganttTable(
  tasks: readonly GanttTask[],
  view: {
    readonly text: GanttLocaleText;
    readonly locale: string;
    readonly collapsed: ReadonlySet<string>;
    readonly selected: ReadonlySet<string>;
  },
): GanttTableModel {
  const fields: GanttField[] = ["name", "startTime", "endTime", "progress"];
  if (tasks.some((task) => ganttDependencies(task).length)) fields.push("dependency");
  if (tasks.some((task) => task.baseline)) fields.push("baselineStart", "baselineEnd");
  const rows = tasks.map((task): GanttTableRow => {
    const attrs: Record<string, string> = { "data-ok-task-id": String(task.id) };
    if (task.parentId !== undefined) attrs["data-ok-parent-id"] = String(task.parentId);
    if (task.type === "milestone") attrs["data-ok-type"] = "milestone";
    if (ganttColors.includes(task.color as GanttColor)) attrs["data-ok-color"] = String(task.color);
    if (view.collapsed.has(String(task.id))) attrs["data-ok-collapsed"] = "";
    if (view.selected.has(String(task.id))) attrs["data-ok-selected"] = "";
    const cells = fields.map((field): GanttTableCell => {
      switch (field) {
        case "name":
          return { text: String(task.name ?? "") };
        case "startTime":
          return dateCell(task.startTime, view.locale);
        case "endTime":
          return dateCell(task.endTime, view.locale);
        case "progress":
          return Number.isFinite(task.progress)
            ? { text: `${task.progress}%`, value: String(task.progress) }
            : { text: "" };
        case "dependency":
          return { text: ganttDependencyText(ganttDependencies(task)) };
        case "baselineStart":
          return dateCell(task.baseline?.start, view.locale);
        default:
          return dateCell(task.baseline?.end, view.locale);
      }
    });
    return { attrs, cells };
  });
  return { fields, headers: fields.map((field) => headerText(field, view.text)), rows };
}

/** Reads the tasks of an HTML data table (cells: `data-ok-value`, else their text). */
export function readGanttTable(table: HTMLTableElement): GanttTask[] {
  const head = table.tHead?.rows[0] ?? table.rows[0];
  if (!head) return [];
  const index = new Map<GanttField, number>();
  [...head.cells].forEach((cell, i) => {
    const field = cell.getAttribute("data-ok-gantt-field") as GanttField;
    if (ganttFields.includes(field) && !index.has(field)) index.set(field, i);
  });
  const tasks: GanttTask[] = [];
  for (const body of table.tBodies)
    for (const row of body.rows) {
      const id = row.getAttribute("data-ok-task-id");
      if (!id) continue;
      const read = (field: GanttField): string | undefined => {
        const at = index.get(field);
        const cell = at === undefined ? undefined : row.cells[at];
        if (!cell) return undefined;
        return (cell.getAttribute("data-ok-value") ?? (cell.textContent as string)).trim();
      };
      const progress = read("progress");
      const baselineStart = read("baselineStart");
      const baselineEnd = read("baselineEnd");
      const parentId = row.getAttribute("data-ok-parent-id");
      const type = row.getAttribute("data-ok-type");
      const color = row.getAttribute("data-ok-color") as GanttColor;
      const dependency = parseGanttDependencies(read("dependency"));
      tasks.push({
        id,
        name: read("name") ?? "",
        startTime: read("startTime") || undefined,
        endTime: read("endTime") || undefined,
        ...(progress ? { progress: Number.parseFloat(progress) } : {}),
        ...(parentId ? { parentId } : {}),
        ...(ganttTaskTypes.includes(type as "milestone") ? { type: type as "milestone" } : {}),
        ...(ganttColors.includes(color) ? { color } : {}),
        ...(dependency.length ? { dependency } : {}),
        ...(baselineStart && baselineEnd
          ? { baseline: { start: baselineStart, end: baselineEnd } }
          : {}),
        ...(row.hasAttribute("data-ok-collapsed") ? { collapsed: true } : {}),
      });
    }
  return tasks;
}

/** Ids of the rows marked with `attribute` (`data-ok-collapsed`, `data-ok-selected`). */
export const ganttTableIds = (table: HTMLTableElement, attribute: string): string[] =>
  [...table.querySelectorAll<HTMLTableRowElement>(`tbody > tr[data-ok-task-id][${attribute}]`)].map(
    (row) => row.getAttribute("data-ok-task-id") as string,
  );
