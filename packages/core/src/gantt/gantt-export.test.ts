import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import ganttCss from "../../../styles/dist/components/gantt.css?raw";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import { createGanttController } from "./gantt-controller.js";
import { exportGantt, ganttExportColors, ganttSvgText } from "./gantt-export.js";
import { type GanttTask, ganttModel, ganttVisibleItems } from "./gantt-model.js";
import { ganttRenderOptions } from "./gantt-options.js";
import {
  GANTT_LOCALE_TEXT,
  type GanttNode,
  type GanttRenderOptions,
  ganttRowWindow,
  renderGantt,
} from "./gantt-render.js";
import { ganttTable } from "./gantt-table.js";

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
    startTime: "2025-03-08",
    endTime: "2025-03-12",
    dependency: "a",
    baseline: { start: "2025-03-09", end: "2025-03-11" },
  },
  { id: "m", name: "Ship", startTime: "2025-03-13", type: "milestone", dependency: "b" },
];

const options = (extra: Partial<GanttRenderOptions> = {}): GanttRenderOptions => ({
  ...ganttRenderOptions({ today: "2025-03-05", view: "day" }),
  label: "Project",
  collapsed: new Set(),
  selected: new Set(),
  text: GANTT_LOCALE_TEXT,
  ...extra,
});

const all = (nodes: readonly GanttNode[]): GanttNode[] =>
  nodes.flatMap((node) => [node, ...all(node.children ?? [])]);

beforeAll(() => {
  const style = document.createElement("style");
  style.textContent = `${tokensCss}\n${ganttCss}`;
  document.head.append(style);
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function build(node: GanttNode, svg = false): Element {
  const inSvg = svg || node.tag === "svg";
  const element = inSvg
    ? document.createElementNS("http://www.w3.org/2000/svg", node.tag)
    : document.createElement(node.tag);
  for (const [name, value] of Object.entries(node.attrs)) element.setAttribute(name, value);
  for (const [name, value] of Object.entries(node.style ?? {}))
    (element as HTMLElement).style.setProperty(name, value);
  if (node.text !== undefined) element.textContent = node.text;
  else for (const child of node.children ?? []) element.append(build(child, inSvg));
  return element;
}

/** A drawn Gantt with its data table (as the owners render it). */
function drawn(extra: Partial<GanttRenderOptions> = {}, caption = "Release plan") {
  const root = document.createElement("div");
  root.setAttribute("data-ok-gantt", "");
  root.setAttribute("data-ok-ready", "");
  const table = document.createElement("table");
  table.setAttribute("data-ok-gantt-data", "");
  if (caption) table.createCaption().textContent = caption;
  const model = ganttTable(TASKS, {
    text: GANTT_LOCALE_TEXT,
    locale: "en-US",
    collapsed: new Set(),
    selected: new Set(),
  });
  const head = table.createTHead().insertRow();
  model.fields.forEach((field, i) => {
    const th = document.createElement("th");
    th.setAttribute("data-ok-gantt-field", field);
    th.textContent = model.headers[i] as string;
    head.append(th);
  });
  const body = table.createTBody();
  for (const row of model.rows) {
    const tr = body.insertRow();
    for (const [name, value] of Object.entries(row.attrs)) tr.setAttribute(name, value);
    for (const cell of row.cells) {
      const td = tr.insertCell();
      td.textContent = cell.text;
      if (cell.value !== undefined) td.setAttribute("data-ok-value", cell.value);
    }
  }
  const layout = renderGantt(ganttModel(TASKS), options(extra));
  root.append(table, ...layout.nodes.map((node) => build(node)));
  document.body.append(root);
  return { root, layout };
}

describe("ganttRowWindow", () => {
  it("covers the rows in view plus overscan, clamped, with the active row", () => {
    expect(ganttRowWindow({ scrollTop: 0, height: 400, rowHeight: 40, total: 100 })).toEqual({
      start: 0,
      end: 26,
    });
    expect(ganttRowWindow({ scrollTop: 2000, height: 400, rowHeight: 40, total: 100 })).toEqual({
      start: 42,
      end: 68,
    });
    expect(ganttRowWindow({ scrollTop: 9000, height: 400, rowHeight: 40, total: 100 })).toEqual({
      start: 74,
      end: 100,
    });
    expect(ganttRowWindow({ scrollTop: 0, height: 400, rowHeight: 40, total: 5 })).toEqual({
      start: 0,
      end: 5,
    });
    expect(
      ganttRowWindow({ scrollTop: 0, height: 400, rowHeight: 40, total: 100, active: 60 }),
    ).toEqual({ start: 43, end: 69 });
    expect(
      ganttRowWindow({ scrollTop: 2000, height: 400, rowHeight: 40, total: 100, active: 3 }),
    ).toEqual({ start: 0, end: 26 });
    expect(
      ganttRowWindow({
        scrollTop: 0,
        height: 80,
        rowHeight: 40,
        total: 100,
        overscan: 0,
        active: -1,
      }),
    ).toEqual({ start: 0, end: 2 });
  });
});

describe("renderGantt windows and toolbar", () => {
  it("renders only the window's rows, keeping indexes and the body height", () => {
    const layout = renderGantt(
      ganttModel(TASKS),
      options({ window: { start: 1, end: 3 }, height: 200, active: "a" }),
    );
    const rows = all(layout.nodes).filter((node) => node.attrs["data-ok-gantt-row"] !== undefined);
    expect(rows.map((row) => [row.key, row.attrs["aria-rowindex"]])).toEqual([
      ["a", "3"],
      ["b", "4"],
    ]);
    const body = all(layout.nodes).find((node) => node.attrs["data-ok-gantt-body"] !== undefined);
    expect(body?.style).toEqual({ "--_ok-gantt-offset": "40px", "--_ok-gantt-body": "160px" });
    expect(layout.nodes.at(-1)?.style).toEqual({ "--_ok-gantt-height": "200px" });
    // Every link is still drawn.
    expect(
      all(layout.nodes).filter((node) => node.attrs["data-ok-gantt-link"] !== undefined),
    ).toHaveLength(2);
  });

  it("adds a download button to the toolbar unless disabled", () => {
    const button = (extra: Partial<GanttRenderOptions>) =>
      all(renderGantt(ganttModel(TASKS), options({ toolbar: true, ...extra })).nodes).find(
        (node) => node.attrs["data-ok-gantt-export"] !== undefined,
      );
    expect(button({})?.attrs).toMatchObject({
      "data-ok-gantt-export": "svg",
      "aria-label": "Download SVG",
    });
    expect(button({ exportFormat: "csv" })?.attrs["aria-label"]).toBe("Download CSV");
    expect(button({ disableExport: true })).toBeUndefined();
    expect(button({ exportFormat: undefined })?.attrs["aria-label"]).toBe("Download SVG");
    expect(ganttRenderOptions({ exportFormat: "csv" }).exportFormat).toBe("csv");
    expect(ganttRenderOptions({ height: 40 }).height).toBeUndefined();
    expect(ganttRenderOptions({ height: 300, exportFormat: "gif" as "svg" })).toMatchObject({
      height: 300,
      exportFormat: "svg",
    });
  });
});

describe("gantt export", () => {
  it("draws the whole chart as a standalone SVG in the page's colors", () => {
    const { root, layout } = drawn({
      baseline: true,
      criticalPath: true,
      projectBoundary: true,
      barLabel: "left",
    });
    expect(root.querySelectorAll("[data-ok-gantt-link][data-ok-critical]").length).toBeGreaterThan(
      0,
    );
    const colors = ganttExportColors(root);
    expect(colors.bars.get("a")?.[0]).not.toBe("");
    expect(colors.parts.size).toBeGreaterThan(2);
    const text = ganttSvgText(layout, colors);
    const svg = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
    expect(svg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    expect(Number(svg.getAttribute("height"))).toBe(56 + 4 * 40);
    const texts = [...svg.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(
      expect.arrayContaining(["Task", "Phase", "Alpha", "Mar 3, 2025", "Ship", "March 2025"]),
    );
    expect(svg.querySelectorAll("path[d*='Z']").length).toBeGreaterThan(0);
    expect(text).not.toContain("--_ok");
    // Labels inside bars and to the right are drawn too.
    const inside = drawn({ barLabel: "inside" });
    expect(ganttSvgText(inside.layout, ganttExportColors(inside.root))).toContain(">Alpha</text>");
    // Colors fall back when a bar or a part wasn't found.
    const bare = ganttSvgText(layout, { ...colors, bars: new Map(), parts: new Map() });
    expect(bare).toContain("<svg");
  });

  it("downloads SVG, PNG and CSV only during a user gesture", async () => {
    const { root, layout } = drawn();
    const activation = { isActive: false };
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue(activation as UserActivation);
    await expect(exportGantt(root, layout, "csv")).rejects.toThrow(/gesture/);
    activation.isActive = true;
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download);
    });
    await exportGantt(root, layout, "csv");
    await exportGantt(root, layout, "svg");
    await exportGantt(root, layout, "png");
    expect(clicks).toEqual(["release-plan.csv", "release-plan.svg", "release-plan.png"]);
    await expect(exportGantt(root, layout, "gif" as never)).rejects.toThrow(TypeError);
    const empty = document.createElement("div");
    await expect(exportGantt(empty, layout, "csv")).rejects.toThrow(/table/);
    document.body.replaceChildren();
    const unnamed = drawn({}, "");
    await exportGantt(unnamed.root, unnamed.layout, "svg");
    expect(clicks.at(-1)).toBe("gantt.svg");
  });
});

describe("virtualized keyboard", () => {
  it("walks rows outside the window through rowList and keeps the owner's selection", async () => {
    const many: GanttTask[] = Array.from({ length: 60 }, (_, i) => ({
      id: `t${i}`,
      name: `Task ${i}`,
      startTime: "2025-03-03",
      endTime: "2025-03-04",
    }));
    const model = ganttModel(many);
    const visible = ganttVisibleItems(model, new Set());
    const root = document.createElement("div");
    root.setAttribute("data-ok-gantt", "");
    document.body.append(root);
    let active = "t0";
    let selected: string[] = ["t59"];
    const render = () => {
      const index = visible.findIndex((item) => item.id === active);
      const layout = renderGantt(
        model,
        options({
          active,
          selection: true,
          toolbar: true,
          selected: new Set(selected),
          height: 120,
          window: ganttRowWindow({
            scrollTop: 0,
            height: 120,
            rowHeight: 40,
            total: 60,
            active: index,
            overscan: 1,
          }),
        }),
      );
      root.replaceChildren(...layout.nodes.map((node) => build(node)));
      controller.sync();
    };
    const onExport = vi.fn();
    const controller = createGanttController(root, {
      // An owner that renders after the controller asks (like React).
      onActiveChange: (id) => {
        active = id;
        queueMicrotask(render);
      },
      onSelectionChange: (ids) => {
        selected = ids;
        render();
      },
      rowList: () => visible.map((item) => ({ id: item.id, level: item.level })),
      selection: () => selected,
      onExport,
    });
    render();
    expect(root.querySelectorAll("[data-ok-gantt-row]")).toHaveLength(5);
    (root.querySelector('[data-ok-gantt-row][tabindex="0"]') as HTMLElement).focus();
    await userEvent.keyboard("{End}");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement?.getAttribute("data-ok-task-id")).toBe("t59");
    await userEvent.keyboard("{Home}");
    await new Promise((resolve) => setTimeout(resolve, 0));
    await userEvent.keyboard("{ArrowDown}");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement?.getAttribute("data-ok-task-id")).toBe("t1");
    // Space adds to the owner's selection, which holds a row outside the window.
    await userEvent.keyboard(" ");
    expect(selected).toEqual(["t59", "t1"]);
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(selected).toHaveLength(60);
    (root.querySelector("[data-ok-gantt-export]") as HTMLElement).click();
    expect(onExport).toHaveBeenCalledTimes(1);
    controller.destroy();
  });
});
