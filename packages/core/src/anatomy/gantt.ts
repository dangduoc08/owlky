import { type GanttBarLabel, ganttBarLabels } from "../gantt/gantt-render.js";
import { type GanttView, ganttViews } from "../gantt/gantt-scale.js";
import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Gantt (ADR-0048) ---------------------------------------------------------------------------

export const ganttOptions = defineOptions("gantt", "data-ok-gantt", {
  view: style(
    "data-ok-view",
    ganttViews,
    "week",
    "Zoom preset: `day`, `week`, `month`, `quarter` or `year` (36, 16, 5, 1.6 or 0.5 px per day). The header tiers follow the zoom.",
  ),
  pixelsPerDay: number(
    "data-ok-pixels-per-day",
    undefined,
    "Zoom in px per day (0.25 to 120), instead of the view's. The zoom buttons write it.",
    { min: 0.25 },
  ),
  rowHeight: number("data-ok-row-height", 40, "Height of a task row in px (at least 24).", {
    min: 24,
  }),
  barMargin: number("data-ok-bar-margin", 8, "Space above and below a bar inside its row, in px.", {
    min: 0,
  }),
  tasksContainerWidth: number(
    "data-ok-tasks-container-width",
    440,
    "Width of the task list in px from 600px up (the name column takes what the other columns leave). Below 600px only the name column shows.",
    { min: 120 },
  ),
  barLabel: style(
    "data-ok-bar-label",
    ganttBarLabels,
    "right",
    "Where the task name sits: `right` of the bar, `inside` it, `left` of it, or `auto` (inside when it fits).",
  ),
  weekStart: number("data-ok-week-start", 1, "First day of a week, 0 = Sunday (default Monday).", {
    min: 0,
  }),
  showToday: behavior("data-ok-show-today", true, "Draws a line on today's date."),
  showNonWorkingDays: behavior(
    "data-ok-show-non-working-days",
    true,
    "Shades weekends and holidays at day and week zoom.",
  ),
  columnLines: behavior(
    "data-ok-column-lines",
    true,
    "Vertical lines between the timeline's columns.",
  ),
  criticalPath: flag(
    "data-ok-critical-path",
    "Highlights the tasks and dependencies with no slack (the critical path).",
  ),
  baseline: flag("data-ok-baseline", "Draws each task's planned dates as a thin bar under it."),
  projectBoundary: flag(
    "data-ok-project-boundary",
    "Dashed lines at the project's first and last day.",
  ),
  toolbar: flag("data-ok-toolbar", "A toolbar with zoom out and zoom in buttons."),
  selection: flag(
    "data-ok-selection",
    "Rows can be selected: click, Ctrl or Cmd + click, Shift + click, Space and Ctrl + A.",
  ),
  disableTooltip: flag("data-ok-disable-tooltip", "No tooltip on bar hover or row focus."),
  height: number(
    "data-ok-height",
    undefined,
    "Height of the chart's scroll area in px (default: as tall as its rows). With a height, only the rows in view are rendered.",
    { min: 80 },
  ),
  disableVirtualization: flag(
    "data-ok-disable-virtualization",
    "Renders every row even with a `height`.",
  ),
  exportFormat: style(
    "data-ok-export-format",
    ["svg", "png", "csv"] as const,
    "svg",
    "Format of the toolbar's download button: `svg`, `png` or `csv` (the data table).",
    { optional: true },
  ),
  disableExport: flag("data-ok-disable-export", "No download button in the toolbar."),
  editable: flag(
    "data-ok-editable",
    "Tasks can be edited: drag bars, their edges and their progress handles, or press Enter on a row (arrows move, Shift + arrows change the end, Page Up / Page Down the progress, Enter saves, Escape cancels). Double click or F2 asks for your own edit form.",
  ),
  taskDrag: behavior(
    "data-ok-task-drag",
    true,
    "With `editable`: bars move by drag and arrow keys.",
  ),
  taskResize: behavior(
    "data-ok-task-resize",
    true,
    "With `editable`: bar edges change the dates (drag, Shift + arrow keys).",
  ),
  progressDrag: behavior(
    "data-ok-progress-drag",
    true,
    "With `editable`: the progress handle sets the progress (drag, Page Up / Page Down).",
  ),
  collapsed: state(
    "data-ok-collapsed",
    "Collapsed parent rows: `data-ok-collapsed` on their rows of the data table (`aria-expanded` on the grid rows).",
    "toggle",
  ),
  selected: state(
    "data-ok-selected",
    "Selected rows: `data-ok-selected` on their rows of the data table (`aria-selected` on the grid rows).",
    "selectionchange",
  ),
});

export interface GanttAnatomyOptions {
  view?: GanttView | undefined;
  pixelsPerDay?: number | undefined;
  rowHeight?: number | undefined;
  barMargin?: number | undefined;
  tasksContainerWidth?: number | undefined;
  barLabel?: GanttBarLabel | undefined;
  weekStart?: number | undefined;
  criticalPath?: boolean | undefined;
  baseline?: boolean | undefined;
  projectBoundary?: boolean | undefined;
  toolbar?: boolean | undefined;
  selection?: boolean | undefined;
  disableTooltip?: boolean | undefined;
  editable?: boolean | undefined;
  height?: number | undefined;
  disableVirtualization?: boolean | undefined;
  exportFormat?: "svg" | "png" | "csv" | undefined;
  disableExport?: boolean | undefined;
}

/** `data-ok-*` attributes of a Gantt root (behavior options are written by the owner when off). */
export const ganttAttributes = (options: GanttAnatomyOptions = {}): DataAttributes =>
  optionAttributes(ganttOptions, { ...options });
