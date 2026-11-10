import { afterEach, describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartTooltip } from "./chart-active.js";
import { createChartGestures } from "./chart-gestures.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import {
  chartActiveMarks,
  chartMarkAt,
  chartMarkPoint,
  chartSelectedNodes,
  chartSelection,
  hasChartDataPoint,
  toggleChartSelection,
} from "./chart-select.js";
import { chartToolLabels } from "./chart-toolbar.js";

/* Data point selection (4.18.60): hit tests, toggling, outlines and the tooltip state. */

const base = { width: 600, height: 300, idPrefix: "t" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr"];
const draw = (input: Partial<ChartRenderInput>) =>
  renderChart({ ...base, categories: MONTHS, series: [], ...input } as ChartRenderInput);

function find(nodes: readonly ChartNode[], attr: string): ChartNode[] {
  const found: ChartNode[] = [];
  const walk = (list: readonly ChartNode[]) => {
    for (const item of list) {
      if (item.attrs[attr] !== undefined) found.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(nodes);
  return found;
}
const center = (layout: ChartLayout, mark: number) => {
  const m = layout.marks[mark];
  const b = m?.box;
  return b ? [b.x + b.width / 2, b.y + b.height / 2] : [m?.px ?? 0, m?.py ?? 0];
};

describe("selection lists", () => {
  const a = { seriesIndex: 0, dataPointIndex: 1 };
  const b = { seriesIndex: 1, dataPointIndex: 1 };
  const c = { seriesIndex: 0, dataPointIndex: 2 };

  it("validates untrusted lists", () => {
    expect(
      chartSelection([
        a,
        a,
        { seriesIndex: -1, dataPointIndex: 0 },
        { seriesIndex: 0.5, dataPointIndex: 0 },
        { seriesIndex: "2", dataPointIndex: "3" } as never,
        null as never,
      ]),
    ).toEqual([a, { seriesIndex: 2, dataPointIndex: 3 }]);
    expect(chartSelection(undefined)).toEqual([]);
    expect(hasChartDataPoint([a], { ...a })).toBe(true);
    expect(hasChartDataPoint([a], b)).toBe(false);
  });

  it("toggles points: one at a time, or added with multiple", () => {
    expect(toggleChartSelection([], [a])).toEqual([a]);
    expect(toggleChartSelection([a], [c])).toEqual([c]);
    expect(toggleChartSelection([a], [a])).toEqual([]);
    expect(toggleChartSelection([a], [c], true)).toEqual([a, c]);
    // A category's points go together: some selected → all selected; all → none.
    expect(toggleChartSelection([a], [a, b], true)).toEqual([a, b]);
    expect(toggleChartSelection([a, b, c], [a, b])).toEqual([c]);
    expect(toggleChartSelection([a], [])).toEqual([a]);
  });

  it("writes the option attribute only when on", () => {
    expect(chartAttributes({ allowMultipleDataPointsSelection: true })).toHaveProperty(
      "data-ok-allow-multiple-data-points-selection",
      "",
    );
    expect(chartAttributes({})).not.toHaveProperty("data-ok-allow-multiple-data-points-selection");
  });
});

describe("chartMarkAt", () => {
  it("bars: the block under the pointer, with 2px of slack", () => {
    const { layout } = draw({
      type: "bar",
      series: [
        { name: "A", data: [10, 20, 30, 40] },
        { name: "B", data: [5, 15, 25, 35] },
      ],
    });
    const [x, y] = center(layout, 3) as [number, number];
    expect(chartMarkAt(layout, x, y)).toBe(3);
    expect(chartMarkPoint(layout.marks[3] as ChartLayout["marks"][number])).toEqual({
      seriesIndex: 0,
      dataPointIndex: 3,
    });
    const box = layout.marks[3]?.box as NonNullable<ChartLayout["marks"][number]["box"]>;
    expect(chartMarkAt(layout, box.x - 1, box.y + 1)).toBe(3);
    // Above the bars: nothing.
    const [x0] = center(layout, 0) as [number, number];
    expect(chartMarkAt(layout, x0, layout.plot.y + 1)).toBe(null);
  });

  it("lines: the nearest point within 16px", () => {
    const { layout } = draw({
      series: [
        { name: "A", data: [10, 20, 30, 40] },
        { name: "B", data: [12, 22, 32, 42] },
      ],
    });
    const mark = layout.marks.findIndex((m) => m.series === 1 && m.index === 2);
    const m = layout.marks[mark] as ChartLayout["marks"][number];
    expect(chartMarkAt(layout, m.px + 3, m.py - 4)).toBe(mark);
    expect(chartMarkAt(layout, m.px, m.py - 60)).toBe(null);
  });

  it("circular charts, cells, points and Sankey charts", () => {
    const pie = draw({ type: "pie", series: [{ name: "Share", data: [1, 2, 3, 4] }] });
    const slice = pie.layout.marks[2] as ChartLayout["marks"][number];
    expect(chartMarkAt(pie.layout, slice.px, slice.py)).toBe(2);
    expect(chartMarkAt(pie.layout, 1, 1)).toBe(null);
    const heat = draw({
      type: "heatmap",
      series: [
        { name: "Mon", data: [1, 2, 3, 4] },
        { name: "Tue", data: [4, 3, 2, 1] },
      ],
    });
    const cell = heat.layout.marks[5] as ChartLayout["marks"][number];
    expect(chartMarkAt(heat.layout, cell.px, cell.py)).toBe(5);
    const scatter = draw({
      type: "scatter",
      xType: "numeric",
      series: [
        {
          name: "A",
          data: [
            [1, 5],
            [2, null],
            [3, 7],
          ],
        },
      ],
    });
    const second = scatter.layout.marks[1] as ChartLayout["marks"][number];
    expect(chartMarkAt(scatter.layout, second.px, second.py)).toBe(1);
    // Numeric axes: the position among the points with a value.
    expect(chartMarkPoint(second)).toEqual({ seriesIndex: 0, dataPointIndex: 1 });
    const sankey = renderChart({
      ...base,
      type: "sankey",
      edges: [{ source: "a", target: "b", value: 3 }],
    });
    expect(chartMarkAt(sankey.layout, 300, 150)).toBe(null);
    expect(chartActiveMarks(sankey.layout, { kind: "mark", mark: 0 })).toEqual([]);
    expect(chartSelectedNodes(sankey.layout, [{ seriesIndex: 0, dataPointIndex: 0 }])).toEqual([]);
  });

  it("radial bar rings hit by index", () => {
    const { layout } = draw({
      type: "radialBar",
      categories: ["A", "B"],
      series: [{ name: "Goals", data: [40, 80] }],
      hidden: [0],
    });
    const ring = layout.marks[0] as ChartLayout["marks"][number];
    expect(chartMarkAt(layout, ring.px, ring.py)).toBe(0);
    expect(chartMarkPoint(ring).dataPointIndex).toBe(1);
  });
});

describe("chartActiveMarks", () => {
  it("a category's points, one mark, or none", () => {
    const { layout } = draw({
      series: [
        { name: "A", data: [10, 20, 30, 40] },
        { name: "B", data: [12, 22, 32, 42] },
      ],
    });
    expect(
      chartActiveMarks(layout, { kind: "index", index: 1 }).map((i) => layout.marks[i]?.series),
    ).toEqual([0, 1]);
    expect(chartActiveMarks(layout, { kind: "mark", mark: 2 })).toEqual([2]);
    expect(chartActiveMarks(layout, { kind: "mark", mark: 99 })).toEqual([]);
    expect(chartActiveMarks(layout, null)).toEqual([]);
  });
});

describe("outlines", () => {
  const points = [
    { seriesIndex: 0, dataPointIndex: 1 },
    { seriesIndex: 1, dataPointIndex: 2 },
  ];
  it("a frame around blocks, rings around points, under the hover group", () => {
    const { layout } = draw({
      series: [
        { name: "A", type: "bar", data: [10, 20, 30, 40] },
        { name: "B", data: [12, 22, 32, 42] },
      ],
      selectedDataPoints: points,
    });
    const group = find(layout.nodes, "data-ok-chart-selected")[0] as ChartNode;
    expect(group.children?.map((child) => child.tag)).toEqual(["rect", "circle"]);
    const index = layout.nodes.indexOf(group);
    expect(layout.nodes[index + 1]?.attrs["data-ok-chart-active"]).toBe("");
    const frame = group.children?.[0]?.attrs ?? {};
    const box = layout.marks.find((m) => m.series === 0 && m.index === 1)?.box;
    expect(Number(frame["x"])).toBe((box?.x ?? 0) - 2);
    expect(group.children?.[1]?.attrs["r"]).toBe("8");
    // Nothing selected: no group (every chart draws as before).
    expect(
      find(draw({ series: [{ name: "A", data: [1] }] }).layout.nodes, "data-ok-chart-selected"),
    ).toEqual([]);
  });

  it("slices, cells and bubbles", () => {
    const pie = draw({
      type: "donut",
      series: [{ name: "Share", data: [1, 2, 3, 4] }],
      selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 2 }],
    });
    expect(find(pie.layout.nodes, "data-ok-chart-selected-mark")[0]?.tag).toBe("path");
    const heat = draw({
      type: "heatmap",
      series: [{ name: "Mon", data: [1, 2, 3, 4] }],
      selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 3 }],
    });
    expect(find(heat.layout.nodes, "data-ok-chart-selected-mark")[0]?.tag).toBe("rect");
    const bubble = draw({
      type: "bubble",
      xType: "numeric",
      series: [{ name: "A", data: [[1, 2, 30]] }],
      selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 0 }],
    });
    const ring = find(bubble.layout.nodes, "data-ok-chart-selected-mark")[0];
    expect(Number(ring?.attrs["r"])).toBe((bubble.layout.marks[0]?.r ?? 0) + 3);
    // A selected point that isn't drawn (a hidden series) draws nothing.
    const hidden = draw({
      series: [{ name: "A", data: [1, 2] }],
      hidden: [0],
      selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 0 }],
    });
    expect(find(hidden.layout.nodes, "data-ok-chart-selected")).toEqual([]);
  });

  it("funnels and stock panes keep their blocks", () => {
    const funnel = draw({
      type: "funnel",
      series: [{ name: "Leads", data: [40, 30, 20, 10] }],
    });
    const bar = funnel.layout.marks[1] as ChartLayout["marks"][number];
    expect(chartMarkAt(funnel.layout, bar.px - 4, bar.py)).toBe(1);
    const days = Array.from({ length: 20 }, (_, i) =>
      new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
    );
    const stock = renderChart({
      ...base,
      type: "candlestick",
      xType: "datetime",
      categories: days,
      series: [
        {
          name: "ACME",
          data: days.map((_, i) => ({ y: [10 + i, 12 + i, 9 + i, 11 + i], v: 100 + i })),
        },
      ],
      indicators: [{ type: "volume" }],
    });
    const volume = stock.layout.marks.findIndex((m) => m.series === 1 && m.index === 5);
    const [x, y] = center(stock.layout, volume) as [number, number];
    expect(y).toBeGreaterThan(300);
    expect(chartMarkAt(stock.layout, x, y)).toBe(volume);
  });
});

describe("tooltip state", () => {
  it("marks tooltips whose item has a selected point", () => {
    const render = draw({
      series: [
        { name: "A", data: [1, 2, 3, 4] },
        { name: "B", data: [4, 3, 2, 1] },
      ],
    });
    const selected = [{ seriesIndex: 1, dataPointIndex: 2 }];
    const tip = (active: Parameters<typeof chartTooltip>[3]) =>
      chartTooltip(render.data, render.layout, render.format, active, selected);
    expect(tip({ kind: "index", index: 2 })?.selected).toBe(true);
    expect(tip({ kind: "index", index: 1 })?.selected).toBeUndefined();
    const mark = render.layout.marks.findIndex((m) => m.series === 1 && m.index === 2);
    expect(tip({ kind: "mark", mark })?.selected).toBe(true);
    expect(tip(null)).toBe(null);
    expect(
      chartTooltip(render.data, render.layout, render.format, { kind: "index", index: 2 }, [])
        ?.selected,
    ).toBeUndefined();
    expect(chartToolLabels.selected).toBe("Selected");
  });
});

describe("gestures: moved", () => {
  afterEach(() => document.body.replaceChildren());
  it("is set by a drag of 4px or more and reset by the next press", () => {
    const plot = document.createElement("div");
    plot.style.width = "600px";
    plot.style.height = "300px";
    document.body.append(plot);
    const render = draw({ series: [{ name: "A", data: [1, 2, 3, 4] }] });
    const gestures = createChartGestures(plot, {
      layout: () => render.layout,
      mode: () => "zoom",
      range: () => null,
      extent: () => render.extent,
      preview: () => {},
      commit: () => {},
    });
    const box = plot.getBoundingClientRect();
    const fire = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + x,
          clientY: box.top + 100,
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
        }),
      );
    fire("pointerdown", 100);
    fire("pointermove", 102);
    fire("pointerup", 102);
    expect(gestures.moved).toBe(false);
    fire("pointerdown", 100);
    fire("pointermove", 200);
    fire("pointerup", 200);
    expect(gestures.moved).toBe(true);
    fire("pointerdown", 100);
    expect(gestures.moved).toBe(false);
    fire("pointerup", 100);
    gestures.destroy();
  });
});
