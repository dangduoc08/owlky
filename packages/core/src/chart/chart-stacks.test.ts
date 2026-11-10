import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartTooltip } from "./chart-active.js";
import type { ChartNode } from "./chart-layout.js";
import { chartTextAttributes, parseChartColors } from "./chart-text.js";

/* Stacks and bars (4.18.61): 100% stacks, stackOnlyBar, totals, label positions, ranges, tracks. */

const base = { width: 640, height: 320, idPrefix: "t" };
const STACK: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "bar",
  stacked: true,
  categories: ["A", "B", "C"],
  series: [
    { name: "One", data: [30, 10, 0] },
    { name: "Two", data: [10, 30, 0] },
  ],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...STACK, ...input } as ChartRenderInput);

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
const texts = (nodes: readonly ChartNode[], attr: string, value?: string) =>
  find(nodes, attr, value).map((node) => node.text);
const yTicks = (input: Partial<ChartRenderInput>) =>
  find(draw(input).layout.nodes, "data-ok-chart-axis", "y").flatMap((g) =>
    (g.children ?? []).map((t) => t.text),
  );

describe("100% stacks", () => {
  it("draws shares on an axis to 100% and keeps the values in tooltips and tables", () => {
    expect(yTicks({ stackType: "100%" })).toEqual(["0%", "20%", "40%", "60%", "80%", "100%"]);
    const render = draw({ stackType: "100%", dataLabels: true });
    expect(texts(render.layout.nodes, "data-ok-chart-data-label", "inside")).toEqual([
      "75%",
      "25%",
      "25%",
      "75%",
    ]);
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows.map((row) => row.value)).toEqual(["30", "10"]);
    expect(render.table.rows[0]?.cells.map((cell) => cell.text)).toEqual(["30", "10"]);
    // Both categories reach the top of the plot.
    const tops = render.layout.marks.filter((mark) => mark.series === 1).map((mark) => mark.py);
    expect(tops[0]).toBe(tops[1]);
    expect(tops[0]).toBe(render.layout.plot.y);
  });

  it("stacks lines as shares and ignores the type without stacking", () => {
    const lines = draw({ type: "line", stackType: "100%", dataLabels: true });
    expect(texts(lines.layout.nodes, "data-ok-chart-data-label", "outside")).toContain("75%");
    expect(yTicks({ stacked: false, stackType: "100%" })).not.toContain("100%");
    expect(yTicks({ stackType: "normal" })).not.toContain("100%");
  });
});

describe("stackOnlyBar and totals", () => {
  const mixed: Partial<ChartRenderInput> = {
    yMax: 60,
    stackOnlyBar: true,
    stackTotals: true,
    series: [
      { name: "One", data: [30, 10, 5] },
      { name: "Two", data: [10, -30, 5] },
      { name: "Goal", type: "line", data: [35, 35, 35] },
    ],
  };

  it("keeps lines on their own values with stackOnlyBar", () => {
    const off = draw({ ...mixed, stackOnlyBar: false });
    const on = draw(mixed);
    const goal = (render: ReturnType<typeof draw>) =>
      render.layout.marks.filter((mark) => mark.series === 2).map((mark) => mark.py);
    // Stacked: the line sits on the bars; stackOnlyBar: a flat line.
    expect(new Set(goal(on)).size).toBe(1);
    expect(new Set(goal(off)).size).toBeGreaterThan(1);
  });

  it("prints the total past each stack's end, negatives below", () => {
    const render = draw(mixed);
    const totals = find(render.layout.nodes, "data-ok-chart-data-label", "total");
    expect(totals.map((node) => node.text)).toEqual(["40", "10", "10", "-30"]);
    const ends = render.layout.marks.filter((mark) => mark.series === 1);
    // A's total is 12px above its stack's top.
    expect(Number(totals[0]?.attrs["y"])).toBeCloseTo((ends[0]?.py as number) - 12, 1);
    // B's negative total is below the negative stack.
    expect(Number(totals[3]?.attrs["y"])).toBeGreaterThan(ends[1]?.py as number);
    expect(
      find(
        draw({ stackTotals: true, stacked: false }).layout.nodes,
        "data-ok-chart-data-label",
        "total",
      ),
    ).toEqual([]);
  });

  it("places horizontal totals beside the stack", () => {
    const render = draw({ ...mixed, horizontal: true, series: mixed.series?.slice(0, 2) });
    const totals = find(render.layout.nodes, "data-ok-chart-data-label", "total");
    expect(totals[0]?.attrs["text-anchor"]).toBe("start");
    expect(totals.at(-1)?.attrs["text-anchor"]).toBe("end");
  });
});

describe("data label positions", () => {
  const ys = (position?: "top" | "bottom" | "center") =>
    find(
      renderChart({
        ...base,
        type: "bar",
        dataLabels: true,
        dataLabelPosition: position,
        categories: ["A"],
        series: [{ name: "One", data: [50] }],
      }).layout.nodes,
      "data-ok-chart-data-label",
      "inside",
    ).map((node) => Number(node.attrs["y"]))[0] as number;

  it("moves the labels to the value end or the base", () => {
    expect(ys("top")).toBeLessThan(ys("center"));
    expect(ys("bottom")).toBeGreaterThan(ys("center"));
    expect(ys()).toBe(ys("center"));
  });
});

describe("bar color ranges and background bars", () => {
  it("colors bars by value range, a point's color wins", () => {
    const render = renderChart({
      ...base,
      type: "bar",
      colorRanges: [
        { from: -100, to: -1, color: "error" },
        { from: 0, to: 100, color: "success" },
      ],
      categories: ["A", "B", "C"],
      series: [{ name: "One", data: [10, -5, { y: 3, color: "info" }] }],
    });
    expect(
      find(render.layout.nodes, "data-ok-chart-bar").map((n) => n.attrs["data-ok-color"]),
    ).toEqual(["success", "error", "info"]);
    expect(render.layout.marks.map((mark) => mark.color)).toEqual(["success", "error", "info"]);
  });

  it("draws one track per bar slot behind the series", () => {
    const render = draw({ stacked: false, backgroundBars: true });
    const group = render.layout.nodes.findIndex(
      (n) => n.attrs["data-ok-chart-background-bars"] !== undefined,
    );
    const crosshair = render.layout.nodes.findIndex(
      (n) => n.attrs["data-ok-chart-crosshair"] !== undefined,
    );
    expect(group).toBe(crosshair - 1);
    const tracks = find(render.layout.nodes, "data-ok-chart-background-bar");
    expect(tracks).toHaveLength(6);
    expect(tracks[0]?.attrs["height"]).toBe(String(render.layout.plot.height));
    expect(tracks[0]?.attrs["rx"]).toBe("4");
    expect(tracks[0]?.attrs["data-ok-color"]).toBeUndefined();
    expect(
      find(draw({ backgroundBars: true }).layout.nodes, "data-ok-chart-background-bar"),
    ).toHaveLength(3);
  });

  it("cycles track colors per category with an opacity and radius", () => {
    const render = draw({
      horizontal: true,
      backgroundBarColors: ["info", "warning"],
      backgroundBarOpacity: 2,
      backgroundBarRadius: 0,
    });
    const tracks = find(render.layout.nodes, "data-ok-chart-background-bar");
    expect(tracks.map((n) => n.attrs["data-ok-color"])).toEqual(["info", "warning", "info"]);
    expect(tracks[0]?.attrs["fill-opacity"]).toBe("1");
    expect(tracks[0]?.attrs["rx"]).toBe("0");
    expect(tracks[0]?.attrs["width"]).toBe(String(render.layout.plot.width));
    expect(find(draw({ type: "line" }).layout.nodes, "data-ok-chart-background-bar")).toEqual([]);
  });

  it("writes and reads the options", () => {
    expect(
      chartAttributes({
        stackType: "100%",
        stackOnlyBar: true,
        stackTotals: true,
        dataLabelPosition: "top",
        backgroundBars: true,
        backgroundBarOpacity: 0.5,
        backgroundBarRadius: 2,
      }),
    ).toMatchObject({
      "data-ok-stack-type": "100%",
      "data-ok-stack-only-bar": "",
      "data-ok-stack-totals": "",
      "data-ok-data-label-position": "top",
      "data-ok-background-bars": "",
      "data-ok-background-bar-opacity": "0.5",
      "data-ok-background-bar-radius": "2",
    });
    expect(chartAttributes({})["data-ok-stack-type"]).toBeUndefined();
    expect(
      chartTextAttributes({ backgroundBarColors: ["info", "nope" as "info", "error-light"] }),
    ).toEqual({
      "data-ok-background-bar-colors": "info error-light",
    });
    expect(chartTextAttributes({ backgroundBarColors: [] })).toEqual({});
    expect(parseChartColors(" info  bogus warning-dark ")).toEqual(["info", "warning-dark"]);
    expect(parseChartColors(null)).toEqual([]);
    expect(parseChartColors("x".repeat(2001))).toEqual([]);
  });
});
