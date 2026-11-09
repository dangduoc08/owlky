/**
 * Gantt options (ADR-0048): values from React props or HTML attributes → render options. Text
 * options outside the schema (columns, dates, locale) live on the root as `data-ok-*` text.
 */
import { ganttDay } from "./gantt-date.js";
import {
  type GanttBarLabel,
  type GanttColumnKey,
  type GanttRenderOptions,
  ganttBarLabels,
  ganttColumnKeys,
  parseGanttWeekdays,
} from "./gantt-render.js";
import { type GanttView, ganttDensity, ganttViews } from "./gantt-scale.js";

/** Root text attributes (never markup, never a selector). */
export const GANTT_TEXT_ATTRIBUTES = {
  columns: "data-ok-columns",
  today: "data-ok-today",
  locale: "data-ok-locale",
  workingWeekdays: "data-ok-working-weekdays",
  holidays: "data-ok-holidays",
} as const;

export const GANTT_DEFAULT_COLUMNS: readonly GanttColumnKey[] = [
  "name",
  "startTime",
  "duration",
  "progress",
];

export interface GanttOptionValues {
  readonly view?: GanttView | undefined;
  readonly pixelsPerDay?: number | undefined;
  readonly rowHeight?: number | undefined;
  readonly barMargin?: number | undefined;
  readonly tasksContainerWidth?: number | undefined;
  readonly barLabel?: GanttBarLabel | undefined;
  readonly weekStart?: number | undefined;
  readonly showToday?: boolean | undefined;
  readonly showNonWorkingDays?: boolean | undefined;
  readonly columnLines?: boolean | undefined;
  readonly criticalPath?: boolean | undefined;
  readonly baseline?: boolean | undefined;
  readonly projectBoundary?: boolean | undefined;
  readonly toolbar?: boolean | undefined;
  readonly selection?: boolean | undefined;
  readonly editable?: boolean | undefined;
  readonly taskDrag?: boolean | undefined;
  readonly taskResize?: boolean | undefined;
  readonly progressDrag?: boolean | undefined;
  /** Task-list columns (default name, start, duration, progress). */
  readonly columns?: readonly GanttColumnKey[] | string | undefined;
  /** The day of the today line (default the current day). */
  readonly today?: string | Date | undefined;
  readonly locale?: string | undefined;
  /** Working weekdays, 0 = Sunday (default Monday to Friday). */
  readonly workingWeekdays?: readonly number[] | string | undefined;
  /** Non-working days, ISO dates. */
  readonly holidays?: readonly (string | Date)[] | string | undefined;
}

/** Valid task-list columns: known keys, once each, the name first (default when none is valid). */
export function ganttColumns(value: GanttOptionValues["columns"]): GanttColumnKey[] {
  const list = typeof value === "string" ? value.slice(0, 200).split(/[\s,]+/) : (value ?? []);
  const keys = [...new Set(list)].filter((key): key is GanttColumnKey =>
    ganttColumnKeys.includes(key as GanttColumnKey),
  );
  if (!keys.length) return [...GANTT_DEFAULT_COLUMNS];
  return ["name", ...keys.filter((key) => key !== "name")];
}

const LOCALE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
/** A BCP 47 tag as given (`en-US` when it isn't one). */
export const ganttLocale = (value: unknown): string =>
  typeof value === "string" && value.length <= 35 && LOCALE.test(value) ? value : "en-US";

const numberOr = (
  value: unknown,
  fallback: number,
  min: number,
  max = Number.POSITIVE_INFINITY,
) => {
  const number = Number(value);
  return value !== undefined && value !== null && value !== "" && Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
};

const holidaysOf = (value: GanttOptionValues["holidays"]): Set<number> => {
  const list = typeof value === "string" ? value.slice(0, 4000).split(/[\s,]+/) : (value ?? []);
  const days = new Set<number>();
  for (const entry of list) {
    const day = ganttDay(entry);
    if (day !== undefined) days.add(day);
  }
  return days;
};

/** Render options from option values (invalid values → defaults). */
export function ganttRenderOptions(
  values: GanttOptionValues,
): Omit<GanttRenderOptions, "label" | "collapsed" | "selected" | "active" | "text" | "titles"> {
  const view = ganttViews.includes(values.view as GanttView) ? (values.view as GanttView) : "week";
  const weekdays =
    typeof values.workingWeekdays === "string"
      ? parseGanttWeekdays(values.workingWeekdays)
      : new Set(
          (values.workingWeekdays ?? [1, 2, 3, 4, 5]).filter(
            (day) => Number.isInteger(day) && day >= 0 && day <= 6,
          ),
        );
  const today = values.today === undefined ? ganttDay(new Date()) : ganttDay(values.today);
  return {
    columns: ganttColumns(values.columns),
    listWidth: numberOr(values.tasksContainerWidth, 440, 120, 2000),
    density: ganttDensity(values.pixelsPerDay, view),
    rowHeight: numberOr(values.rowHeight, 40, 24, 200),
    barMargin: numberOr(values.barMargin, 8, 0, 40),
    barLabel: ganttBarLabels.includes(values.barLabel as GanttBarLabel)
      ? (values.barLabel as GanttBarLabel)
      : "right",
    weekStart: Math.round(numberOr(values.weekStart, 1, 0, 6)),
    locale: ganttLocale(values.locale),
    today,
    showToday: values.showToday !== false,
    showNonWorkingDays: values.showNonWorkingDays !== false,
    workingWeekdays: weekdays.size ? weekdays : new Set([1, 2, 3, 4, 5]),
    holidays: holidaysOf(values.holidays),
    columnLines: values.columnLines !== false,
    criticalPath: values.criticalPath === true,
    baseline: values.baseline === true,
    projectBoundary: values.projectBoundary === true,
    toolbar: values.toolbar === true,
    selection: values.selection === true,
    editable: values.editable === true,
    taskDrag: values.taskDrag !== false,
    taskResize: values.taskResize !== false,
    progressDrag: values.progressDrag !== false,
  };
}

/** The text attributes React writes on the root (the HTML runtime reads the same). */
export function ganttTextAttributes(values: GanttOptionValues): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (values.columns !== undefined)
    attrs[GANTT_TEXT_ATTRIBUTES.columns] = ganttColumns(values.columns).join(" ");
  if (values.today !== undefined) {
    const day = ganttDay(values.today);
    if (day !== undefined)
      attrs[GANTT_TEXT_ATTRIBUTES.today] = new Date(day * 86_400_000).toISOString().slice(0, 10);
  }
  if (values.locale !== undefined) attrs[GANTT_TEXT_ATTRIBUTES.locale] = ganttLocale(values.locale);
  if (values.workingWeekdays !== undefined)
    attrs[GANTT_TEXT_ATTRIBUTES.workingWeekdays] = (
      typeof values.workingWeekdays === "string"
        ? [...parseGanttWeekdays(values.workingWeekdays)]
        : [...values.workingWeekdays]
    ).join(" ");
  if (values.holidays !== undefined)
    attrs[GANTT_TEXT_ATTRIBUTES.holidays] = [...holidaysOf(values.holidays)]
      .sort((a, b) => a - b)
      .map((day) => new Date(day * 86_400_000).toISOString().slice(0, 10))
      .join(" ");
  return attrs;
}
