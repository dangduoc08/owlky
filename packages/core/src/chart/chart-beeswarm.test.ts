import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import { chartSwarmOffsets } from "./chart-beeswarm.js";
import type { ChartNode } from "./chart-layout.js";
import { chartData } from "./chart-model.js";

/* Beeswarm charts (roadmap 4.18.21): lanes, the swarm, spread, tooltips and keyboard. */

const base = { width: 500, height: 300, idPrefix: "t", type: "beeswarm" as const };
const SERIES = [
  { name: "A", data: [10, 10, 10, 12, 14] },
  { name: "B", data: [20, 22, 24, null, null] },
];
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, series: SERIES, ...input });

function find(nodes: readonly ChartNode[], attr: string): ChartNode[] {
  const found: ChartNode[] = [];
  const walk = (list: readonly ChartNode[]) => {
    for (const node of list) {
      if (node.attrs[attr] !== undefined) found.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}
const dist = (a: ChartNode, b: ChartNode) =>
  Math.hypot(
    Number(a.attrs["cx"]) - Number(b.attrs["cx"]),
    Number(a.attrs["cy"]) - Number(b.attrs["cy"]),
  );

describe("swarm offsets", () => {
  it("keeps equal values a diameter apart, the first in the center", () => {
    const off = chartSwarmOffsets([50, 50, 50, 50], 5);
    expect(off[0]).toBe(0);
    expect(off[1]).toBe(10);
    expect(off[2]).toBe(-10);
    expect(off[3]).toBe(20);
  });

  it("uses less room for values a little apart", () => {
    const off = chartSwarmOffsets([50, 53], 5);
    expect(off[1]).toBeCloseTo(Math.sqrt(100 - 9));
    expect(chartSwarmOffsets([50, 80], 5)).toEqual([0, 0]);
    expect(chartSwarmOffsets([], 5)).toEqual([]);
  });
});

describe("beeswarm layout", () => {
  it("puts one lane per series, a value axis along the bottom", () => {
    const { layout, legend } = draw();
    expect(layout.mode).toBe("point");
    expect(layout.horizontal).toBe(true);
    expect(find(layout.nodes, "data-ok-chart-bee")).toHaveLength(8);
    const ticks = find(layout.nodes, "data-ok-chart-axis").find(
      (group) => group.attrs["data-ok-chart-axis"] === "y",
    );
    expect(ticks?.children?.map((tick) => tick.text)).toEqual(["A", "B"]);
    expect(legend?.map((item) => item.name)).toEqual(["A", "B"]);
    const dots = find(layout.nodes, "data-ok-chart-bee").slice(0, 3);
    expect(dist(dots[0] as ChartNode, dots[1] as ChartNode)).toBeGreaterThanOrEqual(9.9);
  });

  it("turns vertical, shrinks crowded lanes, squeezes what still overflows", () => {
    const { layout } = draw({ orientation: "vertical" });
    expect(layout.horizontal).toBe(false);
    const crowded = (input: Partial<ChartRenderInput>) =>
      draw({
        series: [{ name: "A", data: Array.from({ length: 200 }, () => 50) }],
        height: 80,
        ...input,
      });
    const [auto] = find(crowded({}).layout.nodes, "data-ok-chart-bee");
    expect(Number(auto?.attrs["r"])).toBeLessThan(5);
    expect(Number(auto?.attrs["r"])).toBeGreaterThanOrEqual(2);
    const fixed = crowded({ markerSize: 6 });
    expect(find(fixed.layout.nodes, "data-ok-chart-bee")[0]?.attrs["r"]).toBe("6");
    const inside = find(fixed.layout.nodes, "data-ok-chart-bee").map((dot) =>
      Number(dot.attrs["cy"]),
    );
    const span = Math.max(...inside) - Math.min(...inside);
    expect(span).toBeLessThanOrEqual(fixed.layout.plot.height);
  });

  it("jitter spreads by a fixed sequence; hidden lanes reflow; shapes per lane", () => {
    const jitter = find(draw({ beeswarmSpread: "jitter" }).layout.nodes, "data-ok-chart-bee");
    const again = find(draw({ beeswarmSpread: "jitter" }).layout.nodes, "data-ok-chart-bee");
    expect(jitter).toEqual(again);
    expect(jitter[0]?.attrs["cy"]).not.toEqual(jitter[1]?.attrs["cy"]);
    const { layout } = draw({ hidden: [0] });
    expect(find(layout.nodes, "data-ok-chart-bee")).toHaveLength(3);
    expect(new Set(layout.marks.map((mark) => mark.series))).toEqual(new Set([1]));
    expect(find(layout.nodes, "data-ok-chart-series")[0]?.attrs["data-ok-index"]).toBe("1");
    const cued = draw({ colorBlindMode: true, markerSize: 4 });
    expect(find(cued.layout.nodes, "data-ok-chart-bee").at(-1)?.attrs["data-ok-shape"]).toBe(
      "square",
    );
    expect(cued.legend?.[1]?.shape).toBe("square");
  });

  it("names observations by position, categories or x; ignores empty lanes", () => {
    const named = draw({ categories: ["a", "b", "c", "d", "e"] });
    expect(named.data.categories).toEqual(["a", "b", "c", "d", "e"]);
    expect(named.table.rows).toHaveLength(5);
    expect(draw().data.categories).toEqual(["1", "2", "3", "4", "5"]);
    const xy = draw({
      series: [
        {
          name: "A",
          data: [
            { x: "Ann", y: 1, color: "error" },
            { x: "Bob", y: 3 },
          ],
        },
      ],
    });
    expect(xy.data.categories).toEqual(["Ann", "Bob"]);
    expect(find(xy.layout.nodes, "data-ok-chart-bee")[0]?.attrs["data-ok-color"]).toBe("error");
    const empty = draw({ series: [{ name: "A", data: [null] }] });
    expect(empty.layout.marks).toEqual([]);
    expect(chartData({ type: "beeswarm", xType: "numeric", series: [] }).xType).toBe("category");
  });

  it("writes the option attribute", () => {
    expect(chartAttributes({ beeswarmSpread: "jitter" })).toMatchObject({
      "data-ok-beeswarm-spread": "jitter",
    });
  });
});

describe("beeswarm keyboard and tooltip", () => {
  it("walks the observations and reads the name, lane and value", () => {
    const { data, layout, format } = draw({ categories: ["a", "b", "c", "d", "e"] });
    const active = nextChartActive(layout, null, "Home") ?? null;
    const tip = chartTooltip(data, layout, format, active);
    expect(tip?.title).toMatch(/[a-e]/);
    expect(tip?.rows).toEqual([{ name: "A", value: "10", color: "primary-dark" }]);
    const last = nextChartActive(layout, active, "End") ?? null;
    expect(chartTooltip(data, layout, format, last)?.rows[0]?.name).toBe("B");
    expect(chartActiveNodes(layout, last).over).toHaveLength(1);
  });
});
