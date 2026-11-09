/**
 * Gantt render (ADR-0048): the model and the view state → a tree of nodes that React maps to
 * elements and the HTML runtime builds with DOM methods, so both implementations draw the same
 * markup. Rows and bars are HTML (names, focus, hit testing); the grid, non-working days, today
 * line, project boundary and dependency arrows are one `aria-hidden` SVG behind the rows.
 */
import { chartTextWidth } from "../chart/chart-layout.js";
import { ganttLongDate, ganttShortDate, ganttWeekday } from "./gantt-date.js";
import {
  type GanttDependencyType,
  type GanttItem,
  type GanttLinkModel,
  type GanttModel,
  ganttCriticalPath,
  ganttLinkKey,
  ganttVisibleItems,
} from "./gantt-model.js";
import { type GanttScale, ganttScale } from "./gantt-scale.js";

export interface GanttNode {
  readonly tag: string;
  readonly attrs: Readonly<Record<string, string>>;
  /** Private custom properties (`--_ok-gantt-*`): React `style`, HTML CSSOM. */
  readonly style?: Readonly<Record<string, string>> | undefined;
  /** Identity among siblings (rows: the task id). */
  readonly key?: string | undefined;
  readonly children?: readonly GanttNode[] | undefined;
  readonly text?: string | undefined;
}

export const ganttColumnKeys = ["name", "startTime", "endTime", "duration", "progress"] as const;
export type GanttColumnKey = (typeof ganttColumnKeys)[number];
export const ganttBarLabels = ["right", "inside", "left", "auto"] as const;
export type GanttBarLabel = (typeof ganttBarLabels)[number];

/** Widths of the task-list columns in px (the name column takes what is left). */
export const GANTT_COLUMN_WIDTHS: Readonly<Record<Exclude<GanttColumnKey, "name">, number>> = {
  startTime: 112,
  endTime: 112,
  duration: 88,
  progress: 88,
};
const MIN_NAME = 120;

/** Texts of the Gantt (React `localeText`, HTML `setLocaleText()`); `{…}` are placeholders. */
export interface GanttLocaleText {
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly duration: string;
  readonly progress: string;
  readonly timeline: string;
  /** Duration cell: `{count}` days. */
  readonly days: string;
  readonly milestone: string;
  readonly critical: string;
  /** Header of the data table's dependency column. */
  readonly predecessors: string;
  /** `{list}` of predecessors. */
  readonly dependsOn: string;
  readonly finishToStart: string;
  readonly startToStart: string;
  readonly finishToFinish: string;
  readonly startToFinish: string;
  /** Lag in days: `{count}`. */
  readonly lag: string;
  /** `{start}` to `{end}`. */
  readonly range: string;
  /** `{value}` percent. */
  readonly complete: string;
  /** Label of the planned dates (baseline). */
  readonly baseline: string;
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly toolbar: string;
}

export const GANTT_LOCALE_TEXT: GanttLocaleText = {
  name: "Task",
  startTime: "Start",
  endTime: "End",
  duration: "Duration",
  progress: "Progress",
  timeline: "Timeline",
  days: "{count} d",
  milestone: "Milestone",
  critical: "On the critical path",
  predecessors: "Predecessors",
  dependsOn: "Depends on {list}",
  finishToStart: "finish to start",
  startToStart: "start to start",
  finishToFinish: "finish to finish",
  startToFinish: "start to finish",
  lag: "{count} days lag",
  range: "{start} to {end}",
  complete: "{value}% complete",
  baseline: "Planned",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  toolbar: "Gantt tools",
};

/** Merges partial locale texts (own string keys only). */
export function ganttLocaleText(text?: Partial<GanttLocaleText> | null): GanttLocaleText {
  const merged: Record<string, string> = { ...GANTT_LOCALE_TEXT };
  if (text)
    for (const key of Object.keys(GANTT_LOCALE_TEXT))
      if (Object.hasOwn(text, key) && typeof (text as Record<string, unknown>)[key] === "string")
        merged[key] = (text as Record<string, string>)[key] as string;
  return merged as unknown as GanttLocaleText;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (all, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : all,
  );

export interface GanttRenderOptions {
  /** Accessible name of the treegrid. */
  readonly label: string;
  readonly columns: readonly GanttColumnKey[];
  /** Column titles (default from `text`). */
  readonly titles?: Partial<Record<GanttColumnKey, string>> | undefined;
  /** Width of the task list in px. */
  readonly listWidth: number;
  readonly density: number;
  readonly rowHeight: number;
  readonly barMargin: number;
  readonly barLabel: GanttBarLabel;
  readonly weekStart: number;
  readonly locale: string;
  /** Day number of today (no line without it). */
  readonly today?: number | undefined;
  readonly showToday: boolean;
  readonly showNonWorkingDays: boolean;
  readonly workingWeekdays: ReadonlySet<number>;
  readonly holidays: ReadonlySet<number>;
  readonly columnLines: boolean;
  readonly criticalPath: boolean;
  readonly baseline: boolean;
  readonly projectBoundary: boolean;
  readonly toolbar: boolean;
  readonly selection: boolean;
  readonly collapsed: ReadonlySet<string>;
  readonly selected: ReadonlySet<string>;
  /** The row that holds the tab stop (default the first). */
  readonly active?: string | undefined;
  readonly text: GanttLocaleText;
}

export interface GanttLayout {
  readonly nodes: GanttNode[];
  readonly scale: GanttScale | undefined;
  readonly rows: readonly GanttItem[];
  /** The tab stop's row id. */
  readonly active: string | undefined;
}

const px = (value: number) => `${Math.round(value * 100) / 100}px`;
const n2 = (value: number) => String(Math.round(value * 100) / 100);
const el = (
  tag: string,
  attrs: Record<string, string>,
  children?: GanttNode[],
  extra: { style?: Record<string, string>; key?: string; text?: string } = {},
): GanttNode => ({
  tag,
  attrs,
  ...(extra.style ? { style: extra.style } : {}),
  ...(extra.key !== undefined ? { key: extra.key } : {}),
  ...(children ? { children } : {}),
  ...(extra.text !== undefined ? { text: extra.text } : {}),
});

const ICON = { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" };
const icon = (d: string) =>
  el("svg", ICON, [
    el("path", {
      d,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ]);
const CHEVRON = "m9 6 6 6-6 6";
const ZOOM_IN = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4M8 11h6M11 8v6";
const ZOOM_OUT = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4M8 11h6";

/** Widths of the visible task-list columns (the name column fills `listWidth`). */
export function ganttColumnWidths(columns: readonly GanttColumnKey[], listWidth: number): number[] {
  const fixed = columns.reduce(
    (sum, key) => sum + (key === "name" ? 0 : GANTT_COLUMN_WIDTHS[key]),
    0,
  );
  return columns.map((key) =>
    key === "name" ? Math.max(MIN_NAME, listWidth - fixed) : GANTT_COLUMN_WIDTHS[key],
  );
}

const TYPE_TEXT: Record<GanttDependencyType, keyof GanttLocaleText> = {
  FS: "finishToStart",
  SS: "startToStart",
  FF: "finishToFinish",
  SF: "startToFinish",
};

/** The accessible name of a bar: name, dates, progress, critical path and predecessors. */
export function ganttBarLabel(
  item: GanttItem,
  model: GanttModel,
  text: GanttLocaleText,
  locale: string,
  flags: { critical?: boolean; baseline?: boolean } = {},
): string {
  const parts = [item.name];
  if (item.kind === "milestone")
    parts.push(`${text.milestone}, ${ganttLongDate(item.start, locale)}`);
  else {
    parts.push(
      fill(text.range, {
        start: ganttLongDate(item.start, locale),
        end: ganttLongDate(item.end - 1, locale),
      }),
    );
    parts.push(fill(text.complete, { value: Math.round(item.progress) }));
  }
  if (flags.baseline && item.baseline)
    parts.push(
      `${text.baseline} ${fill(text.range, {
        start: ganttLongDate(item.baseline.start, locale),
        end: ganttLongDate(item.baseline.end - 1, locale),
      })}`,
    );
  if (flags.critical) parts.push(text.critical);
  if (item.links.length)
    parts.push(
      fill(text.dependsOn, {
        list: item.links
          .map((link) => {
            const from = (model.byId.get(link.from) as GanttItem).name;
            const lag = link.lag ? `, ${fill(text.lag, { count: link.lag })}` : "";
            return `${from} (${text[TYPE_TEXT[link.type]]}${lag})`;
          })
          .join(", "),
      }),
    );
  return parts.join(", ");
}

/** The duration in days shown in the task list. */
const days = (item: GanttItem) => item.end - item.start;

/** Lines of the tooltip: title, then label / value pairs. */
export function ganttTooltip(
  item: GanttItem,
  text: GanttLocaleText,
  locale: string,
): { title: string; rows: [string, string][] } {
  const rows: [string, string][] = [[text.startTime, ganttShortDate(item.start, locale)]];
  if (item.kind !== "milestone") {
    rows.push([text.endTime, ganttShortDate(item.end - 1, locale)]);
    rows.push([text.duration, fill(text.days, { count: days(item) })]);
    rows.push([text.progress, `${Math.round(item.progress)}%`]);
  }
  if (item.baseline)
    rows.push([
      text.baseline,
      fill(text.range, {
        start: ganttShortDate(item.baseline.start, locale),
        end: ganttShortDate(item.baseline.end - 1, locale),
      }),
    ]);
  return { title: item.name, rows };
}

/** Text of a task-list cell. */
export function ganttCellText(
  item: GanttItem,
  key: GanttColumnKey,
  text: GanttLocaleText,
  locale: string,
): string {
  switch (key) {
    case "name":
      return item.name;
    case "startTime":
      return ganttShortDate(item.start, locale);
    case "endTime":
      return ganttShortDate(item.kind === "milestone" ? item.start : item.end - 1, locale);
    case "duration":
      return fill(text.days, { count: days(item) });
    default:
      return item.kind === "milestone" ? "" : `${Math.round(item.progress)}%`;
  }
}

const OUT = 10;
const HEAD = 5;

/** The orthogonal route of a dependency arrow, with rounded corners, and its head. */
export function ganttLinkPath(
  link: GanttLinkModel,
  from: { x1: number; x2: number; y: number },
  to: { x1: number; x2: number; y: number },
  rowHeight: number,
  radius = 4,
): { line: string; head: string } {
  const fromStart = link.type === "SS" || link.type === "SF";
  const toStart = link.type === "FS" || link.type === "SS";
  const sx = fromStart ? from.x1 : from.x2;
  const sDir = fromStart ? -1 : 1;
  const ex = toStart ? to.x1 : to.x2;
  const aDir = toStart ? 1 : -1;
  const p1 = sx + sDir * OUT;
  const q = ex - aDir * OUT;
  let points: [number, number][];
  if (sDir === aDir ? (aDir > 0 ? q >= p1 : q <= p1) : true) {
    // One vertical run: FS / SF forward, SS / FF always.
    const x = sDir !== aDir ? (sDir < 0 ? Math.min(p1, q) : Math.max(p1, q)) : p1;
    points = [
      [sx, from.y],
      [x, from.y],
      [x, to.y],
      [ex, to.y],
    ];
  } else {
    // Backwards: down to the row boundary, across, then down into the target.
    const mid = to.y > from.y ? from.y + rowHeight / 2 : from.y - rowHeight / 2;
    points = [
      [sx, from.y],
      [p1, from.y],
      [p1, mid],
      [q, mid],
      [q, to.y],
      [ex, to.y],
    ];
  }
  const head = `M${n2(ex)} ${n2(to.y)}l${n2(-aDir * HEAD)} ${-HEAD}v${HEAD * 2}Z`;
  points[points.length - 1] = [ex - aDir * HEAD, to.y];
  return { line: rounded(points, radius), head };
}

/** A polyline with rounded corners (each radius clamped to half the shorter segment). */
function rounded(points: [number, number][], radius: number): string {
  const [first] = points as [[number, number]];
  let d = `M${n2(first[0])} ${n2(first[1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px0, py0] = points[i - 1] as [number, number];
    const [x, y] = points[i] as [number, number];
    const [nx, ny] = points[i + 1] as [number, number];
    const before = Math.hypot(x - px0, y - py0);
    const after = Math.hypot(nx - x, ny - y);
    const r = Math.min(radius, before / 2, after / 2);
    if (r <= 0) {
      d += `L${n2(x)} ${n2(y)}`;
      continue;
    }
    const ax = x - ((x - px0) / before) * r;
    const ay = y - ((y - py0) / before) * r;
    const bx = x + ((nx - x) / after) * r;
    const by = y + ((ny - y) / after) * r;
    d += `L${n2(ax)} ${n2(ay)}Q${n2(x)} ${n2(y)} ${n2(bx)} ${n2(by)}`;
  }
  const last = points[points.length - 1] as [number, number];
  return `${d}L${n2(last[0])} ${n2(last[1])}`;
}

/** Day spans that aren't working days (merged runs) between `start` and `end`. */
export function ganttNonWorkingDays(
  start: number,
  end: number,
  workingWeekdays: ReadonlySet<number>,
  holidays: ReadonlySet<number>,
): [number, number][] {
  const spans: [number, number][] = [];
  for (let day = start; day < end; day++) {
    if (workingWeekdays.has(ganttWeekday(day)) && !holidays.has(day)) continue;
    const last = spans[spans.length - 1];
    if (last && last[1] === day) last[1] = day + 1;
    else spans.push([day, day + 1]);
  }
  return spans;
}

/** Lays out the whole Gantt: toolbar (optional) and the treegrid. */
export function renderGantt(model: GanttModel, options: GanttRenderOptions): GanttLayout {
  const { text, locale, rowHeight, columns } = options;
  const rows = ganttVisibleItems(model, options.collapsed);
  const active =
    options.active !== undefined && rows.some((row) => row.id === options.active)
      ? options.active
      : rows[0]?.id;
  const critical = options.criticalPath ? ganttCriticalPath(model) : undefined;
  const widths = ganttColumnWidths(columns, options.listWidth);
  const listWidth = widths.reduce((a, b) => a + b, 0);
  const lefts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));
  const first = model.start ?? options.today ?? 0;
  const last = model.end ?? first + 1;
  const scale =
    model.items.length || options.today !== undefined
      ? ganttScale(first, last, {
          density: options.density,
          weekStart: options.weekStart,
          locale,
        })
      : undefined;
  const timeline = scale?.width ?? 0;
  const bodyHeight = rows.length * rowHeight;
  const titles = { ...options.titles };
  const title = (key: GanttColumnKey) => titles[key] ?? text[key];

  // Header.
  const headCells: GanttNode[] = columns.map((key, i) =>
    el(
      "div",
      {
        role: "columnheader",
        "data-ok-gantt-column": key,
        "aria-colindex": String(i + 1),
      },
      undefined,
      { style: { "--_ok-gantt-left": px(lefts[i] as number) }, text: title(key) },
    ),
  );
  const tierNodes = (tier: "top" | "bottom") =>
    el(
      "div",
      { "data-ok-gantt-tier": tier },
      (scale?.[tier] ?? []).map((tick) =>
        el("span", { "data-ok-gantt-tick": "" }, undefined, {
          style: { "--_ok-gantt-x": px(tick.x), "--_ok-gantt-w": px(tick.width) },
          text: tick.label,
        }),
      ),
    );
  headCells.push(
    el(
      "div",
      {
        role: "columnheader",
        "data-ok-gantt-column": "timeline",
        "aria-colindex": String(columns.length + 1),
      },
      [
        el("span", { "data-ok-gantt-visually-hidden": "" }, undefined, { text: text.timeline }),
        el("div", { "data-ok-gantt-scale": "", "aria-hidden": "true" }, [
          tierNodes("top"),
          tierNodes("bottom"),
        ]),
      ],
    ),
  );
  const head = el("div", { role: "rowgroup", "data-ok-gantt-head": "" }, [
    el("div", { role: "row", "aria-rowindex": "1" }, headCells),
  ]);

  // Geometry of each visible row's bar.
  const index = new Map(rows.map((row, i) => [row.id, i]));
  const geometry = (item: GanttItem, on: GanttScale) => {
    const i = index.get(item.id) as number;
    const x1 = on.x(item.start);
    const x2 = on.x(item.end);
    const half = item.kind === "milestone" ? (rowHeight - options.barMargin * 2) / 2 : 0;
    return { x1: x1 - half, x2: x2 + half, y: i * rowHeight + rowHeight / 2 };
  };

  // Background SVG.
  const svgChildren: GanttNode[] = [];
  if (scale) {
    if (options.showNonWorkingDays && scale.density >= 8) {
      const spans = ganttNonWorkingDays(
        scale.start,
        scale.end,
        options.workingWeekdays,
        options.holidays,
      );
      if (spans.length)
        svgChildren.push(
          el("path", {
            "data-ok-gantt-non-working": "",
            d: spans
              .map(
                ([a, b]) =>
                  `M${n2(scale.x(a))} 0H${n2(scale.x(b))}V${n2(bodyHeight)}H${n2(scale.x(a))}Z`,
              )
              .join(""),
          }),
        );
    }
    let grid = "";
    for (let i = 1; i <= rows.length; i++) grid += `M0 ${i * rowHeight - 0.5}H${n2(timeline)}`;
    if (options.columnLines)
      for (const tick of scale.bottom.slice(1)) grid += `M${n2(tick.x - 0.5)} 0V${n2(bodyHeight)}`;
    if (grid) svgChildren.push(el("path", { "data-ok-gantt-grid-lines": "", d: grid }));
    if (options.projectBoundary && model.start !== undefined && model.end !== undefined)
      for (const day of [model.start, model.end])
        svgChildren.push(
          el("path", {
            "data-ok-gantt-boundary": "",
            d: `M${n2(scale.x(day))} 0V${n2(bodyHeight)}`,
          }),
        );
    if (
      options.showToday &&
      options.today !== undefined &&
      options.today >= scale.start &&
      options.today < scale.end
    )
      svgChildren.push(
        el("path", {
          "data-ok-gantt-today": "",
          d: `M${n2(scale.x(options.today + 0.5))} 0V${n2(bodyHeight)}`,
        }),
      );
    const linkNodes: GanttNode[] = [];
    for (const link of model.links) {
      const from = model.byId.get(link.from) as GanttItem;
      const to = model.byId.get(link.to) as GanttItem;
      if (!index.has(from.id) || !index.has(to.id)) continue;
      const path = ganttLinkPath(link, geometry(from, scale), geometry(to, scale), rowHeight);
      const attrs: Record<string, string> = {
        "data-ok-gantt-link": "",
        "data-ok-type": link.type,
      };
      if (critical?.links.has(ganttLinkKey(link))) attrs["data-ok-critical"] = "";
      linkNodes.push(
        el("g", attrs, [
          el("path", { "data-ok-gantt-link-line": "", d: path.line }),
          el("path", { "data-ok-gantt-link-head": "", d: path.head }),
        ]),
      );
    }
    if (linkNodes.length) svgChildren.push(el("g", { "data-ok-gantt-links": "" }, linkNodes));
  }
  const canvas = el(
    "svg",
    {
      "data-ok-gantt-canvas": "",
      "aria-hidden": "true",
      focusable: "false",
      width: n2(timeline),
      height: n2(bodyHeight),
      viewBox: `0 0 ${n2(timeline)} ${n2(bodyHeight)}`,
    },
    svgChildren,
  );

  // Rows.
  const siblings = new Map<string | undefined, string[]>();
  for (const item of model.items)
    siblings.set(item.parentId, [...(siblings.get(item.parentId) ?? []), item.id]);
  const rowNodes = rows.map((item, i) => {
    const isCritical = critical?.tasks.has(item.id) ?? false;
    const set = siblings.get(item.parentId) as string[];
    const attrs: Record<string, string> = {
      role: "row",
      "data-ok-gantt-row": "",
      "data-ok-task-id": item.id,
      "data-ok-type": item.kind,
      "aria-rowindex": String(i + 2),
      "aria-level": String(item.level),
      "aria-posinset": String(set.indexOf(item.id) + 1),
      "aria-setsize": String(set.length),
      tabindex: item.id === active ? "0" : "-1",
    };
    if (item.children.length)
      attrs["aria-expanded"] = options.collapsed.has(item.id) ? "false" : "true";
    if (options.selection)
      attrs["aria-selected"] = options.selected.has(item.id) ? "true" : "false";
    const cells = columns.map((key, c) => {
      const style: Record<string, string> = { "--_ok-gantt-left": px(lefts[c] as number) };
      const cellAttrs = {
        role: "gridcell",
        "data-ok-gantt-cell": key,
        "aria-colindex": String(c + 1),
      };
      if (key !== "name")
        return el("div", cellAttrs, undefined, {
          style,
          text: ganttCellText(item, key, text, locale),
        });
      style["--_ok-gantt-indent"] = px((item.level - 1) * 20);
      return el(
        "div",
        cellAttrs,
        [
          item.children.length
            ? el("span", { "data-ok-gantt-toggle": "", "aria-hidden": "true" }, [icon(CHEVRON)])
            : el("span", { "data-ok-gantt-toggle-space": "", "aria-hidden": "true" }),
          el("span", { "data-ok-gantt-name": "" }, undefined, { text: item.name }),
        ],
        { style },
      );
    });
    cells.push(
      el(
        "div",
        {
          role: "gridcell",
          "data-ok-gantt-cell": "timeline",
          "aria-colindex": String(columns.length + 1),
        },
        timelineCell(item, model, options, scale as GanttScale, isCritical),
      ),
    );
    return el("div", attrs, cells, { key: item.id });
  });

  const gridAttrs: Record<string, string> = {
    role: "treegrid",
    "data-ok-gantt-grid": "",
    "aria-label": options.label,
    "aria-rowcount": String(rows.length + 1),
    "aria-colcount": String(columns.length + 1),
  };
  if (options.selection) gridAttrs["aria-multiselectable"] = "true";
  const grid = el(
    "div",
    gridAttrs,
    [head, el("div", { role: "rowgroup", "data-ok-gantt-body": "" }, [canvas, ...rowNodes])],
    {
      style: {
        "--_ok-gantt-columns": widths.map(px).join(" "),
        "--_ok-gantt-name": px(widths[0] as number),
        "--_ok-gantt-list": px(listWidth),
        "--_ok-gantt-timeline": px(timeline),
        "--_ok-gantt-row": px(rowHeight),
        "--_ok-gantt-bar-margin": px(options.barMargin),
      },
    },
  );
  const nodes: GanttNode[] = [];
  if (options.toolbar)
    nodes.push(
      el(
        "div",
        { role: "toolbar", "data-ok-gantt-toolbar": "", "aria-label": text.toolbar },
        [zoomButton("out", text.zoomOut, ZOOM_OUT), zoomButton("in", text.zoomIn, ZOOM_IN)],
        { key: "toolbar" },
      ),
    );
  nodes.push(
    el(
      "div",
      // Rows hold the tab stop: Firefox would otherwise add the scroll container as one more.
      { "data-ok-gantt-viewport": "", tabindex: "-1" },
      [grid],
      { key: "viewport" },
    ),
  );
  return { nodes, scale, rows, active };
}

const zoomButton = (direction: "in" | "out", label: string, d: string) =>
  el(
    "button",
    {
      type: "button",
      "data-ok-icon-button": "",
      "data-ok-color": "default",
      "data-ok-size": "sm",
      "data-ok-gantt-zoom": direction,
      "aria-label": label,
    },
    [icon(d)],
  );

function timelineCell(
  item: GanttItem,
  model: GanttModel,
  options: GanttRenderOptions,
  scale: GanttScale,
  isCritical: boolean,
): GanttNode[] {
  const { text, locale } = options;
  const x1 = scale.x(item.start);
  const width = scale.x(item.end) - x1;
  const barAttrs: Record<string, string> = {
    "data-ok-gantt-bar": "",
    "data-ok-type": item.kind,
    role: "img",
    "aria-label": ganttBarLabel(item, model, text, locale, {
      critical: isCritical,
      baseline: options.baseline,
    }),
  };
  if (item.color) barAttrs["data-ok-color"] = item.color;
  if (isCritical) barAttrs["data-ok-critical"] = "";
  const style: Record<string, string> = { "--_ok-gantt-x": px(x1) };
  if (item.kind !== "milestone") {
    style["--_ok-gantt-w"] = px(Math.max(width, 2));
    style["--_ok-gantt-progress"] = `${n2(item.progress)}%`;
  }
  const out: GanttNode[] = [];
  if (options.baseline && item.baseline) {
    const bx = scale.x(item.baseline.start);
    out.push(
      el("span", { "data-ok-gantt-baseline": "", "aria-hidden": "true" }, undefined, {
        style: {
          "--_ok-gantt-x": px(bx),
          "--_ok-gantt-w": px(Math.max(scale.x(item.baseline.end) - bx, 2)),
        },
      }),
    );
  }
  if (item.kind === "summary") {
    out.push(el("div", barAttrs, undefined, { style }));
    return out;
  }
  const label = item.name;
  const barHeight = options.rowHeight - options.barMargin * 2;
  const fits = chartTextWidth(label, 13) + 16 <= width;
  const position =
    item.kind === "milestone"
      ? options.barLabel === "left"
        ? "left"
        : "right"
      : options.barLabel === "auto"
        ? fits
          ? "inside"
          : "right"
        : options.barLabel;
  if (position === "inside") {
    out.push(
      el(
        "div",
        barAttrs,
        [el("span", { "data-ok-gantt-bar-text": "" }, undefined, { text: label })],
        {
          style,
        },
      ),
    );
    return out;
  }
  out.push(el("div", barAttrs, undefined, { style }));
  const half = item.kind === "milestone" ? barHeight / 2 : 0;
  out.push(
    el("span", { "data-ok-gantt-label": position, "aria-hidden": "true" }, undefined, {
      style: { "--_ok-gantt-x": px(position === "left" ? x1 - half : x1 + width + half) },
      text: label,
    }),
  );
  return out;
}

/** The weekday names used by the `workingWeekdays` text (`1 2 3 4 5`, Sunday = 0). */
export function parseGanttWeekdays(text: string | null | undefined): Set<number> {
  const days = new Set<number>();
  for (const part of (text ?? "").slice(0, 100).split(/[\s,]+/)) {
    const day = Number(part);
    if (part !== "" && Number.isInteger(day) && day >= 0 && day <= 6) days.add(day);
  }
  return days;
}
