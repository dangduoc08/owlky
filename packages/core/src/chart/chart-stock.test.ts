import { afterEach, describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip } from "./chart-active.js";
import { createChartGestures } from "./chart-gestures.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import { readChartTable } from "./chart-model.js";
import { chartTextAttributes } from "./chart-text.js";
import type { ChartZoom } from "./chart-zoom.js";

/* Stock charts (ADR-0047, phase 2.2): panes, generated series, the table and the navigator. */

const DAYS = Array.from({ length: 40 }, (_, i) =>
  new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
);
const BARS = DAYS.map((_, i) => {
  const open = 100 + 10 * Math.sin(i / 5);
  const close = open + 3 * Math.cos(i);
  return {
    y: [open, Math.max(open, close) + 1, Math.min(open, close) - 1, close].map(
      (v) => Math.round(v * 100) / 100,
    ),
    v: 1000 + i * 10,
  };
});
const STOCK: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "candlestick",
  xType: "datetime",
  valuePrefix: "$",
  categories: DAYS,
  series: [{ name: "ACME", data: BARS }],
};
const base = { width: 600, height: 300, idPrefix: "t" };
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...STOCK, ...input } as ChartRenderInput);

function find(nodes: readonly ChartNode[], attr: string, value?: string): ChartNode[] {
  const found: ChartNode[] = [];
  const walk = (list: readonly ChartNode[]) => {
    for (const node of list) {
      if (node.attrs[attr] !== undefined && (value === undefined || node.attrs[attr] === value))
        found.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}

describe("stock layout", () => {
  it("stacks the price and one pane per oscillator on one x axis", () => {
    const { layout, data } = draw({
      indicators: [{ type: "sma", period: 5 }, { type: "volume" }, { type: "rsi", period: 5 }],
      paneHeight: 100,
    });
    expect(data.series.map((s) => s.name)).toEqual(["ACME", "SMA 5", "Volume", "RSI 5"]);
    const panes = find(layout.nodes, "data-ok-chart-pane");
    expect(panes.map((p) => p.attrs["data-ok-chart-pane"])).toEqual(["0", "1", "2"]);
    expect(panes[0]?.attrs["transform"]).toBeUndefined();
    expect(panes[1]?.attrs["transform"]).toBe("translate(0 310)");
    expect(panes[2]?.attrs["transform"]).toBe("translate(0 420)");
    // Height: the price pane, two panes and their gaps.
    expect(layout.height).toBe(300 + 2 * (100 + 10));
    // One crosshair and one hover group, at the top level only.
    expect(find(layout.nodes, "data-ok-chart-crosshair")).toHaveLength(1);
    expect(layout.nodes[0]?.attrs["data-ok-chart-crosshair"]).toBe("");
    expect(find(layout.nodes, "data-ok-chart-active")).toHaveLength(1);
    // Only the last pane prints x labels; panes share the left edge.
    const axes = find(layout.nodes, "data-ok-chart-axis", "x");
    expect(axes.map((a) => a.children?.length ?? 0).filter(Boolean)).toHaveLength(1);
    // Series keep their global index; the RSI pane has its guides and title.
    const series = find(layout.nodes, "data-ok-chart-series").map((s) => s.attrs["data-ok-index"]);
    expect(series).toEqual(expect.arrayContaining(["0", "1", "2", "3"]));
    expect(find(layout.nodes, "data-ok-chart-guide")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-chart-pane-title").map((t) => t.text)).toEqual([
      "Volume",
      "RSI 5",
    ]);
    expect(find(layout.nodes, "data-ok-chart-pane-divider")).toHaveLength(2);
    // The plot spans every pane (the crosshair runs through them).
    expect(layout.plot.y + layout.plot.height).toBeGreaterThan(420);
  });

  it("marks carry global series and pane offsets; one tooltip reads every pane", () => {
    const render = draw({ indicators: [{ type: "volume" }, { type: "rsi", period: 5 }] });
    const { layout, data, format } = render;
    const rsi = layout.marks.find((m) => m.series === 2 && m.index === 20);
    expect(rsi?.py).toBeGreaterThan(300);
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 20 });
    const names = tip?.rows.map((r) => r.name);
    expect(names).toEqual(["Open", "High", "Low", "Close", "Volume", "RSI 5"]);
    // Oscillators and volumes are plain numbers; prices keep their prefix.
    expect(tip?.rows[0]?.value.startsWith("$")).toBe(true);
    expect(tip?.rows[4]?.value).toBe("1,200");
    expect(tip?.rows[5]?.value.startsWith("$")).toBe(false);
    // The crosshair line covers every pane; markers on the lines of the panes.
    const hover = chartActiveNodes(layout, { kind: "index", index: 20 });
    expect(hover.under[0]?.attrs["data-ok-chart-band"]).toBeDefined();
    expect(hover.over.length).toBeGreaterThan(0);
    // Pointer in a lower pane picks the category.
    const slot = layout.slots.find((s) => s.index === 20)?.pos as number;
    expect(chartActiveAt(layout, slot, 380)).toEqual({ kind: "index", index: 20 });
  });

  it("fits the price scale to the zoom window and keeps oscillator scales", () => {
    const whole = draw({ indicators: [{ type: "rsi" }] }).layout;
    const zoomed = draw({ indicators: [{ type: "rsi" }], zoom: { min: 30, max: 39 } }).layout;
    expect(zoomed.y?.min).not.toBe(whole.y?.min);
    const ticks = (layout: ChartLayout) =>
      find(layout.nodes, "data-ok-chart-axis", "y")
        .flatMap((axis) => axis.children ?? [])
        .map((t) => t.text);
    expect(ticks(zoomed)).toContain("100");
    expect(ticks(zoomed)).toContain("0");
    // Lines and areas of the price don't start at zero.
    const line = draw({
      type: "area",
      series: [{ name: "P", data: BARS.map((b) => b.y[3] as number) }],
      navigator: true,
    });
    expect(line.layout.y?.min).toBeGreaterThan(50);
  });

  it("hides series through the legend in their own pane", () => {
    const render = draw({
      indicators: [{ type: "sma", period: 5 }, { type: "rsi" }],
      hidden: [1, 2],
    });
    expect(render.legend?.map((i) => [i.name, i.hidden])).toEqual([
      ["ACME", false],
      ["SMA 5", true],
      ["RSI 14", true],
    ]);
    expect(render.layout.marks.some((m) => m.series === 1 || m.series === 2)).toBe(false);
  });

  it("draws a navigator with the zoom as a brush", () => {
    const whole = draw({ navigator: true }).layout;
    expect(whole.navigator?.x).toMatchObject({ kind: "index", min: 0, max: 39 });
    const nav = find(whole.nodes, "data-ok-chart-navigator")[0] as ChartNode;
    expect(find([nav], "data-ok-chart-line")).toHaveLength(1);
    expect(find([nav], "data-ok-chart-handle")).toHaveLength(2);
    expect(whole.height).toBe(300 + 12 + 48 + 2);
    const zoomed = draw({ navigator: true, zoom: { min: 10, max: 19 } });
    expect(zoomed.zoomable).toBe(true);
    const selection = find(zoomed.layout.nodes, "data-ok-chart-navigator")[0] as ChartNode;
    const rect = find([selection], "data-ok-chart-selection")[0];
    expect(Number(rect?.attrs["width"])).toBeLessThan(whole.width / 3);
    // Too little data: no navigator.
    expect(
      draw({
        navigator: true,
        categories: ["2025-01-01"],
        series: [{ name: "A", data: [BARS[0] as never] }],
      }).layout.navigator,
    ).toBeUndefined();
  });

  it("never lets date labels of trading days touch", () => {
    // Weekdays only: calendar steps don't map to even px steps.
    const days: string[] = [];
    for (let t = Date.UTC(2024, 0, 1); days.length < 260; t += 86_400_000) {
      const day = new Date(t).getUTCDay();
      if (day !== 0 && day !== 6) days.push(new Date(t).toISOString().slice(0, 10));
    }
    const { layout } = renderChart({
      width: 400,
      height: 240,
      idPrefix: "w",
      type: "line",
      xType: "datetime",
      categories: days,
      series: [{ name: "P", data: days.map((_, i) => 100 + Math.sin(i / 9) * 10) }],
      navigator: true,
    });
    const labels = find(layout.nodes, "data-ok-chart-axis", "x").flatMap((a) => a.children ?? []);
    expect(labels.length).toBeGreaterThan(2);
    const width = (text: string) => text.length * 7.3;
    for (let i = 1; i < labels.length; i++) {
      const a = labels[i - 1] as ChartNode;
      const b = labels[i] as ChartNode;
      const gap =
        Number(b.attrs["x"]) -
        width(b.text ?? "") / 2 -
        (Number(a.attrs["x"]) + width(a.text ?? "") / 2);
      expect(gap).toBeGreaterThan(0);
    }
  });

  it("only applies to time charts with an x axis", () => {
    expect(draw({ type: "pie", indicators: [{ type: "rsi" }] }).data.series).toHaveLength(1);
    expect(
      draw({ indicators: [{ type: "rsi" }], horizontal: true, type: "bar" }).data.series,
    ).toHaveLength(1);
    expect(draw({ indicators: [] }).layout.navigator).toBeUndefined();
  });
});

describe("stock table", () => {
  it("writes the volume part and indicator columns; reading skips the indicators", () => {
    const { table } = draw({
      indicators: [{ type: "sma", period: 5 }, { type: "volume" }, { type: "macd" }],
    });
    expect(table.head.map((c) => c.text)).toEqual([
      "Date",
      "ACME",
      "SMA 5",
      "Histogram",
      "MACD 12, 26",
      "Signal 9",
    ]);
    expect(table.head[1]?.colSpan).toBe(5);
    expect(table.head[2]?.attrs).toEqual({
      "data-ok-indicator": "sma",
      "data-ok-color": "warning",
    });
    expect(table.parts.map((c) => c.attrs["data-ok-part"])).toEqual([
      "open",
      "high",
      "low",
      "close",
      "volume",
    ]);
    expect(table.rows[0]?.cells[4]).toEqual({ text: "1,000", attrs: { "data-ok-value": "1000" } });
    expect(table.rows[0]?.cells[5]?.text).toBe("");
    expect(table.rows[10]?.cells[5]?.text).not.toBe("");
    // Back from HTML: the price and its volume, not the computed columns.
    const element = document.createElement("table");
    const head = element.createTHead();
    for (const cells of [table.head, table.parts]) {
      const tr = head.insertRow();
      for (const cell of cells) {
        const th = document.createElement("th");
        th.textContent = cell.text;
        if (cell.colSpan) th.colSpan = cell.colSpan;
        if (cell.rowSpan) th.rowSpan = cell.rowSpan;
        for (const [k, v] of Object.entries(cell.attrs)) th.setAttribute(k, v);
        tr.append(th);
      }
    }
    const body = element.createTBody();
    for (const row of table.rows) {
      const tr = body.insertRow();
      const th = document.createElement("th");
      th.textContent = row.header.text;
      for (const [k, v] of Object.entries(row.header.attrs)) th.setAttribute(k, v);
      tr.append(th);
      for (const cell of row.cells) {
        const td = tr.insertCell();
        td.textContent = cell.text;
        for (const [k, v] of Object.entries(cell.attrs)) td.setAttribute(k, v);
      }
    }
    const read = readChartTable(element, "datetime", "candlestick");
    expect(read.series).toHaveLength(1);
    expect(read.series[0]?.data[0]).toEqual({ y: BARS[0]?.y, v: 1000 });
    expect(read.partLabels?.volume).toBe("Volume");
  });

  it("gives line prices a value and a volume column", () => {
    const { table } = draw({
      type: "line",
      series: [{ name: "P", data: [{ y: 1, v: 5 }, 2] }],
      categories: ["2025-01-01", "2025-01-02"],
      indicators: [{ type: "volume" }],
    });
    expect(table.parts.map((c) => c.attrs["data-ok-part"])).toEqual(["y", "volume"]);
    expect(table.rows[1]?.cells.map((c) => c.text)).toEqual(["$2", ""]);
  });

  it("writes the options and indicators as attributes", () => {
    expect(chartAttributes({ navigator: true, paneHeight: 90 })).toMatchObject({
      "data-ok-navigator": "",
      "data-ok-pane-height": "90",
    });
    expect(
      chartTextAttributes({ indicators: [{ type: "rsi", period: 9 }, { type: "volume" }] }),
    ).toEqual({
      "data-ok-indicators": "rsi 9; volume",
    });
    expect(chartTextAttributes({ indicators: [] })).toEqual({});
  });
});

describe("navigator gestures", () => {
  afterEach(() => document.body.replaceChildren());
  const setup = (range: ChartZoom | null) => {
    const plot = document.createElement("div");
    plot.style.width = "600px";
    document.body.append(plot);
    const render = draw({ navigator: true, zoom: range });
    const state = { range, commits: [] as (ChartZoom | null)[], previews: 0 };
    createChartGestures(plot, {
      layout: () => render.layout,
      mode: () => "zoom",
      range: () => state.range,
      extent: () => render.extent,
      preview: () => {
        state.previews++;
      },
      commit: (r) => {
        state.commits.push(r);
        state.range = r;
      },
    });
    const box = plot.getBoundingClientRect();
    const nav = render.layout.navigator as NonNullable<ChartLayout["navigator"]>;
    const at = (i: number) => box.left + nav.x.from + ((nav.x.to - nav.x.from) * i) / 39;
    const y = box.top + nav.plot.y + nav.plot.height / 2;
    const fire = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
        }),
      );
    return { state, at, fire };
  };

  it("a drag on the whole axis draws a window; no preview", () => {
    const { state, at, fire } = setup(null);
    fire("pointerdown", at(5));
    fire("pointermove", at(15));
    fire("pointerup", at(15));
    expect(state.commits.at(-1)).toEqual({ min: 5, max: 15 });
    expect(state.previews).toBe(0);
  });

  it("moves the window from inside and resizes it from an edge", () => {
    const moved = setup({ min: 10, max: 20 });
    moved.fire("pointerdown", moved.at(15));
    moved.fire("pointermove", moved.at(20));
    moved.fire("pointerup", moved.at(20));
    expect(moved.state.commits.at(-1)).toEqual({ min: 15, max: 25 });
    document.body.replaceChildren();
    const resized = setup({ min: 10, max: 20 });
    resized.fire("pointerdown", resized.at(20) + 6);
    resized.fire("pointermove", resized.at(30));
    resized.fire("pointercancel", resized.at(30));
    expect(resized.state.commits.at(-1)).toEqual({ min: 10, max: 30 });
  });
});
