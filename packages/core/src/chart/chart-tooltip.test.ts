import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import {
  chartActiveAt,
  chartActiveNodes,
  chartTooltip,
  chartTooltipFixed,
  nextChartActive,
  placeChartTooltip,
} from "./chart-active.js";
import { chartMarkAt, chartTooltipContext } from "./chart-select.js";

/* Tooltips (4.18.63): per-point mode, fixed corners and the custom content's context. */

const base = { width: 640, height: 320, idPrefix: "t" };
const BARS: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "bar",
  categories: ["A", "B", "C"],
  series: [
    { name: "One", data: [30, 10, 20] },
    { name: "Two", data: [10, 30, 25] },
  ],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...BARS, ...input } as ChartRenderInput);

describe("per-point tooltips", () => {
  it("keeps shared tooltips by default", () => {
    expect(draw().layout.mode).toBe("index");
    expect(draw({ tooltip: "shared" }).layout.mode).toBe("index");
    expect(draw({ tooltip: "none" }).layout.mode).toBe("index");
  });

  it("points at the bar under the pointer with one row", () => {
    const render = draw({ tooltip: "point" });
    expect(render.layout.mode).toBe("point");
    const mark = render.layout.marks[1];
    const box = mark?.box as NonNullable<typeof mark>["box"] & object;
    const active = chartActiveAt(render.layout, box.x + 1, box.y + box.height - 1);
    expect(active).toEqual({ kind: "mark", mark: 1 });
    const tip = chartTooltip(render.data, render.layout, render.format, active);
    expect(tip?.rows).toHaveLength(1);
    expect(tip?.rows[0]?.name).toBe(render.data.series[mark?.series as number]?.name);
    // The band of its category behind it, no marker.
    const nodes = chartActiveNodes(render.layout, active);
    expect(nodes.under[0]?.attrs["data-ok-chart-band"]).toBe("");
    expect(nodes.over).toEqual([]);
    // Empty space shows nothing; a click there selects nothing.
    expect(
      chartActiveAt(render.layout, render.layout.plot.x + 2, render.layout.plot.y + 2),
    ).toBeNull();
    expect(chartMarkAt(render.layout, box.x + 1, box.y + box.height - 1)).toBe(1);
  });

  it("moves point by point with the keyboard and keeps lines' markers", () => {
    const render = draw({ type: "line", tooltip: "point" });
    const first = nextChartActive(render.layout, null, "Home");
    expect(first?.kind).toBe("mark");
    const next = nextChartActive(render.layout, first ?? null, "ArrowRight");
    expect(next).not.toEqual(first);
    const nodes = chartActiveNodes(render.layout, next ?? null);
    expect(nodes.over).toHaveLength(1);
    expect(nodes.under).toEqual([]);
    // Radar and circular charts keep their own modes.
    expect(draw({ type: "radar", tooltip: "point" }).layout.mode).toBe("index");
    expect(draw({ type: "pie", tooltip: "point" }).layout.mode).toBe("slice");
  });

  it("horizontal bars get a horizontal band", () => {
    const render = draw({ tooltip: "point", horizontal: true });
    const nodes = chartActiveNodes(render.layout, { kind: "mark", mark: 0 });
    expect(nodes.under[0]?.attrs["width"]).toBe(String(render.layout.plot.width));
  });
});

describe("fixed tooltips and context", () => {
  const size = { width: 100, height: 40 };
  const box = { width: 640, height: 320 };
  const plot = { x: 50, y: 10, width: 580, height: 280 };

  it("places the tooltip in a plot corner", () => {
    const at = (corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight") =>
      placeChartTooltip({ x: 300, y: 100 }, size, box, { corner, plot });
    expect(at("topLeft")).toEqual({ left: 58, top: 18 });
    expect(at("topRight")).toEqual({ left: 522, top: 18 });
    expect(at("bottomLeft")).toEqual({ left: 58, top: 242 });
    expect(at("bottomRight")).toEqual({ left: 522, top: 242 });
    // Kept inside the box.
    expect(
      placeChartTooltip({ x: 0, y: 0 }, { width: 700, height: 400 }, box, {
        corner: "bottomRight",
        plot,
      }),
    ).toEqual({ left: 0, top: 0 });
  });

  it("scales the plot for the drawn size", () => {
    const render = draw();
    expect(chartTooltipFixed(undefined, render.layout, 1)).toBeUndefined();
    const fixed = chartTooltipFixed("topRight", render.layout, 0.5);
    expect(fixed?.plot.width).toBe(render.layout.plot.width * 0.5);
    expect(fixed?.corner).toBe("topRight");
  });

  it("gives custom content the title, rows, selection and points", () => {
    const render = draw({ selectedDataPoints: [{ seriesIndex: 1, dataPointIndex: 0 }] });
    const active = { kind: "index" as const, index: 0 };
    const tip = chartTooltip(render.data, render.layout, render.format, active, [
      { seriesIndex: 1, dataPointIndex: 0 },
    ]);
    const context = chartTooltipContext(render.layout, tip as NonNullable<typeof tip>, active);
    expect(context.title).toBe("A");
    expect(context.rows.map((row) => row.value)).toEqual(["30", "10"]);
    expect(context.selected).toBe(true);
    expect(context.points).toEqual([
      { seriesIndex: 0, dataPointIndex: 0 },
      { seriesIndex: 1, dataPointIndex: 0 },
    ]);
  });

  it("writes the options", () => {
    expect(chartAttributes({ tooltip: "point", tooltipFixed: "bottomLeft" })).toMatchObject({
      "data-ok-tooltip": "point",
      "data-ok-tooltip-fixed": "bottomLeft",
    });
    expect(chartAttributes({})["data-ok-tooltip"]).toBeUndefined();
  });
});
