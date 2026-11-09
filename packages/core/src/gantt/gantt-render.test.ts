import { describe, expect, it } from "vitest";
import { ganttAttributes, ganttOptions } from "../anatomy/anatomy.js";
import { ganttDay } from "./gantt-date.js";
import { type GanttTask, ganttModel } from "./gantt-model.js";
import {
  GANTT_DEFAULT_COLUMNS,
  ganttColumns,
  ganttLocale,
  ganttRenderOptions,
  ganttTextAttributes,
} from "./gantt-options.js";
import {
  GANTT_LOCALE_TEXT,
  type GanttNode,
  type GanttRenderOptions,
  ganttBarLabel,
  ganttCellText,
  ganttColumnWidths,
  ganttLinkPath,
  ganttLocaleText,
  ganttNonWorkingDays,
  ganttTooltip,
  parseGanttWeekdays,
  renderGantt,
} from "./gantt-render.js";
import { ganttTable, ganttTableIds, readGanttTable } from "./gantt-table.js";

const day = (iso: string) => ganttDay(iso) as number;
const HOSTILE = '"><img src=x onerror=alert(1)>';

const TASKS: GanttTask[] = [
  { id: "p", name: "Phase" },
  {
    id: "a",
    name: "Alpha",
    parentId: "p",
    startTime: "2025-03-03",
    endTime: "2025-03-07",
    progress: 40,
    color: "info",
  },
  {
    id: "b",
    name: "Beta",
    parentId: "p",
    startTime: "2025-03-10",
    endTime: "2025-03-14",
    dependency: { taskId: "a", type: "FS", lag: 1 },
    baseline: { start: "2025-03-07", end: "2025-03-12" },
  },
  { id: "m", name: "Ship", startTime: "2025-03-17", type: "milestone", dependency: "b" },
];

const options = (extra: Partial<GanttRenderOptions> = {}): GanttRenderOptions => ({
  ...ganttRenderOptions({ today: "2025-03-12" }),
  label: "Project",
  collapsed: new Set(),
  selected: new Set(),
  text: GANTT_LOCALE_TEXT,
  ...extra,
});

/** Every node of a tree, depth first. */
const all = (nodes: readonly GanttNode[]): GanttNode[] =>
  nodes.flatMap((node) => [node, ...all(node.children ?? [])]);
const find = (nodes: readonly GanttNode[], attr: string, value?: string) =>
  all(nodes).filter((node) =>
    value === undefined ? attr in node.attrs : node.attrs[attr] === value,
  );

describe("ganttAttributes", () => {
  it("writes the explicit style defaults", () => {
    expect(ganttAttributes()).toEqual({
      "data-ok-gantt": "",
      "data-ok-view": "week",
      "data-ok-bar-label": "right",
    });
  });

  it("writes every option value and drops invalid ones", () => {
    expect(
      ganttAttributes({
        view: "month",
        pixelsPerDay: 3,
        rowHeight: 48,
        barMargin: 10,
        tasksContainerWidth: 500,
        barLabel: "auto",
        weekStart: 0,
        criticalPath: true,
        baseline: true,
        projectBoundary: true,
        toolbar: true,
        selection: true,
        disableTooltip: true,
      }),
    ).toEqual({
      "data-ok-gantt": "",
      "data-ok-view": "month",
      "data-ok-pixels-per-day": "3",
      "data-ok-row-height": "48",
      "data-ok-bar-margin": "10",
      "data-ok-tasks-container-width": "500",
      "data-ok-bar-label": "auto",
      "data-ok-week-start": "0",
      "data-ok-critical-path": "",
      "data-ok-baseline": "",
      "data-ok-project-boundary": "",
      "data-ok-toolbar": "",
      "data-ok-selection": "",
      "data-ok-disable-tooltip": "",
    });
    expect(
      ganttAttributes({ view: HOSTILE as "day", rowHeight: 2, barLabel: HOSTILE as "left" }),
    ).toEqual({ "data-ok-gantt": "", "data-ok-view": "week", "data-ok-bar-label": "right" });
    expect(Object.keys(ganttOptions.options)).toContain("collapsed");
  });
});

describe("gantt options", () => {
  it("resolves defaults", () => {
    const resolved = ganttRenderOptions({});
    expect(resolved).toMatchObject({
      columns: GANTT_DEFAULT_COLUMNS,
      listWidth: 440,
      density: 16,
      rowHeight: 40,
      barMargin: 8,
      barLabel: "right",
      weekStart: 1,
      locale: "en-US",
      showToday: true,
      showNonWorkingDays: true,
      columnLines: true,
      criticalPath: false,
      toolbar: false,
      selection: false,
    });
    expect(resolved.today).toBe(ganttDay(new Date()));
    expect(ganttRenderOptions({ barLabel: "auto" }).barLabel).toBe("auto");
    expect([...resolved.workingWeekdays]).toEqual([1, 2, 3, 4, 5]);
  });

  it("parses text values and refuses hostile ones", () => {
    const resolved = ganttRenderOptions({
      view: "day",
      pixelsPerDay: 50,
      columns: "progress name nope progress",
      workingWeekdays: "0 6 9 x",
      holidays: "2025-12-25, nope 2025-12-26",
      locale: HOSTILE,
      barLabel: HOSTILE as "left",
      today: "never",
      rowHeight: 1000,
      showToday: false,
      showNonWorkingDays: false,
      columnLines: false,
      tasksContainerWidth: Number.NaN,
    });
    expect(resolved.columns).toEqual(["name", "progress"]);
    expect(resolved.density).toBe(50);
    expect([...resolved.workingWeekdays]).toEqual([0, 6]);
    expect([...resolved.holidays]).toEqual([day("2025-12-25"), day("2025-12-26")]);
    expect(resolved.locale).toBe("en-US");
    expect(resolved.barLabel).toBe("right");
    expect(resolved.today).toBeUndefined();
    expect(resolved.rowHeight).toBe(200);
    expect(resolved.listWidth).toBe(440);
    expect(resolved).toMatchObject({
      showToday: false,
      showNonWorkingDays: false,
      columnLines: false,
    });
    expect([...ganttRenderOptions({ workingWeekdays: [] }).workingWeekdays]).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect([...ganttRenderOptions({ workingWeekdays: [2, 9, 1.5] }).workingWeekdays]).toEqual([2]);
    expect(ganttColumns(["endTime"])).toEqual(["name", "endTime"]);
    expect(ganttColumns(HOSTILE)).toEqual(GANTT_DEFAULT_COLUMNS);
    expect(ganttLocale("de-DE")).toBe("de-DE");
    expect(ganttLocale(5)).toBe("en-US");
    expect([...parseGanttWeekdays(undefined)]).toEqual([]);
  });

  it("writes text attributes", () => {
    expect(ganttTextAttributes({})).toEqual({});
    expect(
      ganttTextAttributes({
        columns: ["name", "endTime"],
        today: new Date(2025, 2, 12),
        locale: "fr-FR",
        workingWeekdays: [1, 2, 3, 4],
        holidays: ["2025-12-26", "2025-12-25"],
      }),
    ).toEqual({
      "data-ok-columns": "name endTime",
      "data-ok-today": "2025-03-12",
      "data-ok-locale": "fr-FR",
      "data-ok-working-weekdays": "1 2 3 4",
      "data-ok-holidays": "2025-12-25 2025-12-26",
    });
    expect(ganttTextAttributes({ today: "nope", workingWeekdays: "1 2" })).toEqual({
      "data-ok-working-weekdays": "1 2",
    });
  });

  it("merges locale texts (own string keys only)", () => {
    const text = ganttLocaleText(
      JSON.parse('{"__proto__": {"x": 1}, "name": "Aufgabe", "days": 5}') as Record<string, string>,
    );
    expect(text.name).toBe("Aufgabe");
    expect(text.days).toBe("{count} d");
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
    expect(ganttLocaleText(null)).toEqual(GANTT_LOCALE_TEXT);
  });
});

describe("renderGantt", () => {
  const model = ganttModel(TASKS);

  it("draws a treegrid with a header, rows, cells and bars", () => {
    const layout = renderGantt(model, options());
    const [viewport] = layout.nodes;
    expect(layout.nodes).toHaveLength(1);
    expect(viewport?.attrs).toEqual({ "data-ok-gantt-viewport": "", tabindex: "-1" });
    const grid = find(layout.nodes, "role", "treegrid")[0] as GanttNode;
    expect(grid.attrs).toMatchObject({
      "aria-label": "Project",
      "aria-rowcount": "5",
      "aria-colcount": "5",
    });
    expect(grid.style?.["--_ok-gantt-columns"]).toBe("152px 112px 88px 88px");
    const rows = find(layout.nodes, "data-ok-gantt-row");
    expect(rows.map((row) => [row.key, row.attrs["aria-level"], row.attrs["tabindex"]])).toEqual([
      ["p", "1", "0"],
      ["a", "2", "-1"],
      ["b", "2", "-1"],
      ["m", "1", "-1"],
    ]);
    expect(rows[0]?.attrs["aria-expanded"]).toBe("true");
    expect(rows[1]?.attrs).toMatchObject({ "aria-posinset": "1", "aria-setsize": "2" });
    expect(rows[1]?.attrs["aria-selected"]).toBeUndefined();
    const cells = find(layout.nodes, "data-ok-gantt-cell", "startTime").map((cell) => cell.text);
    expect(cells).toEqual(["Mar 3, 2025", "Mar 3, 2025", "Mar 10, 2025", "Mar 17, 2025"]);
    const bars = find(layout.nodes, "data-ok-gantt-bar");
    expect(bars.map((bar) => bar.attrs["data-ok-type"])).toEqual([
      "summary",
      "task",
      "task",
      "milestone",
    ]);
    expect(bars[1]?.attrs["data-ok-color"]).toBe("info");
    expect(bars[1]?.style).toMatchObject({
      "--_ok-gantt-w": "80px",
      "--_ok-gantt-progress": "40%",
    });
    expect(bars[3]?.style?.["--_ok-gantt-w"]).toBeUndefined();
    expect(find(layout.nodes, "data-ok-gantt-toggle")).toHaveLength(1);
    expect(find(layout.nodes, "data-ok-gantt-label").map((label) => label.text)).toEqual([
      "Alpha",
      "Beta",
      "Ship",
    ]);
    // Background: non-working days, grid lines, today; one arrow per link.
    expect(find(layout.nodes, "data-ok-gantt-non-working")).toHaveLength(1);
    expect(find(layout.nodes, "data-ok-gantt-today")).toHaveLength(1);
    expect(find(layout.nodes, "data-ok-gantt-link")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-gantt-baseline")).toHaveLength(0);
    expect(find(layout.nodes, "data-ok-gantt-boundary")).toHaveLength(0);
    expect(layout.active).toBe("p");
  });

  it("honors the view state and options", () => {
    const layout = renderGantt(
      model,
      options({
        collapsed: new Set(["p"]),
        selected: new Set(["m"]),
        selection: true,
        active: "m",
        toolbar: true,
        baseline: true,
        projectBoundary: true,
        criticalPath: true,
        showToday: false,
        showNonWorkingDays: false,
        columnLines: false,
        barLabel: "left",
        columns: ["name", "endTime"],
      }),
    );
    expect(layout.nodes[0]?.attrs).toMatchObject({ role: "toolbar", "data-ok-gantt-toolbar": "" });
    expect(find(layout.nodes, "data-ok-gantt-zoom").map((b) => b.attrs["aria-label"])).toEqual([
      "Zoom out",
      "Zoom in",
    ]);
    const rows = find(layout.nodes, "data-ok-gantt-row");
    expect(rows.map((row) => row.key)).toEqual(["p", "m"]);
    expect(rows[0]?.attrs["aria-expanded"]).toBe("false");
    expect(rows.map((row) => row.attrs["aria-selected"])).toEqual(["false", "true"]);
    expect(rows[1]?.attrs["tabindex"]).toBe("0");
    expect(find(layout.nodes, "role", "treegrid")[0]?.attrs["aria-multiselectable"]).toBe("true");
    expect(find(layout.nodes, "data-ok-gantt-cell", "endTime").map((c) => c.text)).toEqual([
      "Mar 14, 2025",
      "Mar 17, 2025",
    ]);
    expect(find(layout.nodes, "data-ok-gantt-today")).toHaveLength(0);
    expect(find(layout.nodes, "data-ok-gantt-non-working")).toHaveLength(0);
    expect(find(layout.nodes, "data-ok-gantt-boundary")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-gantt-label", "left")).toHaveLength(1);
    // Links to hidden rows aren't drawn.
    expect(find(layout.nodes, "data-ok-gantt-link")).toHaveLength(0);
    const grid = find(layout.nodes, "data-ok-gantt-grid-lines")[0];
    expect(grid?.attrs["d"]).not.toContain("V");
  });

  it("marks the critical path and baselines", () => {
    const tight = ganttModel([
      {
        id: "a",
        name: "A",
        startTime: "2025-03-03",
        endTime: "2025-03-05",
        baseline: { start: "2025-03-03", end: "2025-03-04" },
      },
      { id: "b", name: "B", startTime: "2025-03-06", endTime: "2025-03-07", dependency: "a" },
    ]);
    const layout = renderGantt(tight, options({ criticalPath: true, baseline: true }));
    expect(find(layout.nodes, "data-ok-critical")).toHaveLength(3);
    expect(find(layout.nodes, "data-ok-gantt-baseline")).toHaveLength(1);
    const bar = find(layout.nodes, "data-ok-gantt-bar")[0];
    expect(bar?.attrs["aria-label"]).toBe(
      "A, March 3, 2025 to March 5, 2025, 0% complete, Planned March 3, 2025 to March 4, 2025, On the critical path",
    );
  });

  it("places labels inside when they fit (auto) and keeps milestones outside", () => {
    const wide = ganttModel([
      { id: "a", name: "Long enough", startTime: "2025-03-03", endTime: "2025-03-14" },
      { id: "b", name: "Too long for this", startTime: "2025-03-03", endTime: "2025-03-03" },
      { id: "m", name: "M", startTime: "2025-03-05", type: "milestone" },
    ]);
    const auto = renderGantt(wide, options({ barLabel: "auto" }));
    expect(find(auto.nodes, "data-ok-gantt-bar-text").map((n) => n.text)).toEqual(["Long enough"]);
    expect(find(auto.nodes, "data-ok-gantt-label", "right").map((n) => n.text)).toEqual([
      "Too long for this",
      "M",
    ]);
    const inside = renderGantt(wide, options({ barLabel: "inside" }));
    expect(find(inside.nodes, "data-ok-gantt-bar-text")).toHaveLength(2);
  });

  it("renders an empty Gantt and one with only today", () => {
    const empty = renderGantt(ganttModel([]), options({ today: undefined }));
    expect(empty.scale).toBeUndefined();
    expect(find(empty.nodes, "data-ok-gantt-row")).toHaveLength(0);
    expect(find(empty.nodes, "data-ok-gantt-tick")).toHaveLength(0);
    const today = renderGantt(ganttModel([]), options({ columnLines: false }));
    expect(today.scale?.width).toBeGreaterThan(0);
    expect(today.active).toBeUndefined();
    expect(find(today.nodes, "data-ok-gantt-grid-lines")).toHaveLength(0);
    // Every day a working day: nothing to shade.
    const busy = renderGantt(
      ganttModel(TASKS),
      options({ workingWeekdays: new Set([0, 1, 2, 3, 4, 5, 6]) }),
    );
    expect(find(busy.nodes, "data-ok-gantt-non-working")).toHaveLength(0);
    // Unknown placeholders stay as written.
    const text = ganttLocaleText({ days: "{count} {unit}" });
    const custom = renderGantt(ganttModel(TASKS), options({ text }));
    expect(find(custom.nodes, "data-ok-gantt-cell", "duration")[1]?.text).toBe("5 {unit}");
  });
});

describe("gantt texts", () => {
  const model = ganttModel(TASKS);
  const item = (id: string) => model.byId.get(id) as NonNullable<ReturnType<typeof model.byId.get>>;

  it("labels bars with dates, progress and predecessors", () => {
    expect(ganttBarLabel(item("b"), model, GANTT_LOCALE_TEXT, "en-US")).toBe(
      "Beta, March 10, 2025 to March 14, 2025, 0% complete, Depends on Alpha (finish to start, 1 days lag)",
    );
    expect(ganttBarLabel(item("m"), model, GANTT_LOCALE_TEXT, "en-US")).toBe(
      "Ship, Milestone, March 17, 2025, Depends on Beta (finish to start)",
    );
  });

  it("writes cells and tooltips", () => {
    expect(ganttCellText(item("a"), "duration", GANTT_LOCALE_TEXT, "en-US")).toBe("5 d");
    expect(ganttCellText(item("a"), "progress", GANTT_LOCALE_TEXT, "en-US")).toBe("40%");
    expect(ganttCellText(item("m"), "progress", GANTT_LOCALE_TEXT, "en-US")).toBe("");
    expect(ganttCellText(item("m"), "endTime", GANTT_LOCALE_TEXT, "en-US")).toBe("Mar 17, 2025");
    expect(ganttCellText(item("a"), "name", GANTT_LOCALE_TEXT, "en-US")).toBe("Alpha");
    expect(ganttTooltip(item("b"), GANTT_LOCALE_TEXT, "en-US")).toEqual({
      title: "Beta",
      rows: [
        ["Start", "Mar 10, 2025"],
        ["End", "Mar 14, 2025"],
        ["Duration", "5 d"],
        ["Progress", "0%"],
        ["Planned", "Mar 7, 2025 to Mar 12, 2025"],
      ],
    });
    expect(ganttTooltip(item("m"), GANTT_LOCALE_TEXT, "en-US").rows).toEqual([
      ["Start", "Mar 17, 2025"],
    ]);
  });

  it("sizes columns and lists non-working days", () => {
    expect(ganttColumnWidths(["name", "startTime"], 200)).toEqual([120, 112]);
    expect(ganttColumnWidths(["name", "duration"], 400)).toEqual([312, 88]);
    expect(
      ganttNonWorkingDays(
        day("2025-03-07"),
        day("2025-03-12"),
        new Set([1, 2, 3, 4, 5]),
        new Set([day("2025-03-11")]),
      ),
    ).toEqual([
      [day("2025-03-08"), day("2025-03-10")],
      [day("2025-03-11"), day("2025-03-12")],
    ]);
  });
});

describe("ganttLinkPath", () => {
  const from = { x1: 0, x2: 100, y: 20 };
  it("routes forward finish-to-start links with one vertical run", () => {
    const path = ganttLinkPath(
      { from: "a", to: "b", type: "FS", lag: 0 },
      from,
      { x1: 150, x2: 200, y: 60 },
      40,
    );
    expect(path.line).toBe("M100 20L106 20Q110 20 110 24L110 56Q110 60 114 60L145 60");
    expect(path.head).toBe("M150 60l-5 -5v10Z");
  });

  it("routes backward links around the row boundary", () => {
    const back = ganttLinkPath(
      { from: "a", to: "b", type: "FS", lag: 0 },
      from,
      { x1: 50, x2: 80, y: 60 },
      40,
      0,
    );
    expect(back.line).toBe("M100 20L110 20L110 40L40 40L40 60L45 60");
    const up = ganttLinkPath(
      { from: "a", to: "b", type: "SF", lag: 0 },
      from,
      { x1: 50, x2: 80, y: -20 },
      40,
      0,
    );
    expect(up.line).toBe("M0 20L-10 20L-10 0L90 0L90 -20L85 -20");
  });

  it("routes start-to-start and finish-to-finish links on the outer side", () => {
    const ss = ganttLinkPath(
      { from: "a", to: "b", type: "SS", lag: 0 },
      from,
      { x1: 40, x2: 80, y: 60 },
      40,
      0,
    );
    expect(ss.line).toBe("M0 20L-10 20L-10 60L35 60");
    const ff = ganttLinkPath(
      { from: "a", to: "b", type: "FF", lag: 0 },
      from,
      { x1: 40, x2: 130, y: 60 },
      40,
      0,
    );
    expect(ff.line).toBe("M100 20L140 20L140 60L135 60");
    expect(ff.head).toBe("M130 60l5 -5v10Z");
    const sf = ganttLinkPath(
      { from: "a", to: "b", type: "SF", lag: 0 },
      from,
      { x1: -90, x2: -40, y: 60 },
      40,
      0,
    );
    expect(sf.line).toBe("M0 20L-10 20L-10 60L-35 60");
  });
});

describe("gantt data table", () => {
  it("writes the table model React renders", () => {
    const table = ganttTable(TASKS, {
      text: GANTT_LOCALE_TEXT,
      locale: "en-US",
      collapsed: new Set(["p"]),
      selected: new Set(["a"]),
    });
    expect(table.fields).toEqual([
      "name",
      "startTime",
      "endTime",
      "progress",
      "dependency",
      "baselineStart",
      "baselineEnd",
    ]);
    expect(table.headers).toEqual([
      "Task",
      "Start",
      "End",
      "Progress",
      "Predecessors",
      "Planned start",
      "Planned end",
    ]);
    expect(table.rows[0]?.attrs).toEqual({ "data-ok-task-id": "p", "data-ok-collapsed": "" });
    expect(table.rows[1]?.attrs).toEqual({
      "data-ok-task-id": "a",
      "data-ok-parent-id": "p",
      "data-ok-color": "info",
      "data-ok-selected": "",
    });
    expect(table.rows[3]?.attrs).toEqual({ "data-ok-task-id": "m", "data-ok-type": "milestone" });
    expect(table.rows[2]?.cells).toEqual([
      { text: "Beta" },
      { text: "Mar 10, 2025", value: "2025-03-10" },
      { text: "Mar 14, 2025", value: "2025-03-14" },
      { text: "" },
      { text: "a:FS+1" },
      { text: "Mar 7, 2025", value: "2025-03-07" },
      { text: "Mar 12, 2025", value: "2025-03-12" },
    ]);
    const plain = ganttTable(
      [{ id: "x", name: "X", startTime: "2025-03-03", endTime: "2025-03-04", progress: 5 }],
      {
        text: GANTT_LOCALE_TEXT,
        locale: "en-US",
        collapsed: new Set(),
        selected: new Set(),
      },
    );
    expect(plain.fields).toEqual(["name", "startTime", "endTime", "progress"]);
  });

  it("reads tasks back from HTML", () => {
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    for (const field of [
      "name",
      "startTime",
      "endTime",
      "progress",
      "dependency",
      "baselineStart",
      "baselineEnd",
      "bogus",
    ]) {
      const th = document.createElement("th");
      th.setAttribute("data-ok-gantt-field", field);
      head.append(th);
    }
    const body = table.createTBody();
    const row = (attrs: Record<string, string>, cells: (string | [string, string])[]) => {
      const tr = body.insertRow();
      for (const [name, value] of Object.entries(attrs)) tr.setAttribute(name, value);
      for (const cell of cells) {
        const td = tr.insertCell();
        if (Array.isArray(cell)) {
          td.textContent = cell[0];
          td.setAttribute("data-ok-value", cell[1]);
        } else td.textContent = cell;
      }
    };
    row({ "data-ok-task-id": "p", "data-ok-collapsed": "" }, [" Phase "]);
    row(
      {
        "data-ok-task-id": "a",
        "data-ok-parent-id": "p",
        "data-ok-color": "info",
        "data-ok-selected": "",
      },
      [
        "Alpha",
        ["Mar 3", "2025-03-03"],
        "2025-03-07",
        ["40%", "40"],
        "",
        ["x", "2025-03-01"],
        "2025-03-05",
      ],
    );
    row({ "data-ok-task-id": "m", "data-ok-type": "milestone", "data-ok-color": HOSTILE }, [
      "Ship",
      "2025-03-17",
      "",
      "",
      "a:SS+1",
    ]);
    row({}, ["No id"]);
    expect(readGanttTable(table)).toEqual([
      { id: "p", name: "Phase", startTime: undefined, endTime: undefined, collapsed: true },
      {
        id: "a",
        name: "Alpha",
        startTime: "2025-03-03",
        endTime: "2025-03-07",
        progress: 40,
        parentId: "p",
        color: "info",
        baseline: { start: "2025-03-01", end: "2025-03-05" },
      },
      {
        id: "m",
        name: "Ship",
        startTime: "2025-03-17",
        endTime: undefined,
        type: "milestone",
        dependency: [{ taskId: "a", type: "SS", lag: 1 }],
      },
    ]);
    expect(ganttTableIds(table, "data-ok-collapsed")).toEqual(["p"]);
    expect(ganttTableIds(table, "data-ok-selected")).toEqual(["a"]);
    expect(readGanttTable(document.createElement("table"))).toEqual([]);
    // Missing columns read as empty; a header-only table has no tasks.
    const short = document.createElement("table");
    const shortHead = short.createTHead().insertRow();
    const th = document.createElement("th");
    th.setAttribute("data-ok-gantt-field", "startTime");
    shortHead.append(th);
    const shortRow = short.createTBody().insertRow();
    shortRow.setAttribute("data-ok-task-id", "s");
    shortRow.insertCell().textContent = "2025-03-03";
    expect(readGanttTable(short)).toEqual([
      { id: "s", name: "", startTime: "2025-03-03", endTime: undefined },
    ]);
    expect(
      ganttTable([{ id: "n", startTime: "2025-03-03" } as GanttTask], {
        text: GANTT_LOCALE_TEXT,
        locale: "en-US",
        collapsed: new Set(),
        selected: new Set(),
      }).rows[0]?.cells[0],
    ).toEqual({ text: "" });
  });
});
