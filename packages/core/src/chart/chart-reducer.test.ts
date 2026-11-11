import { describe, expect, it } from "vitest";
import { renderChart } from "./chart.js";
import type { ChartNode } from "./chart-layout.js";
import { chartLttb, chartReduceRuns } from "./chart-reducer.js";

const wave = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 20) * 50 + 100);
const points = wave.map((y, x) => [x, y] as const);

describe("LTTB", () => {
  it("keeps the first and last points and about the target", () => {
    const kept = chartLttb(points, 100);
    expect(kept).toHaveLength(100);
    expect(kept[0]).toBe(0);
    expect(kept.at(-1)).toBe(999);
    expect([...kept].sort((a, b) => a - b)).toEqual(kept);
  });

  it("keeps a spike", () => {
    const line = Array.from({ length: 500 }, (_, x) => [x, x === 250 ? 1000 : 1] as const);
    expect(chartLttb(line, 20)).toContain(250);
  });

  it("returns everything when there are few points", () => {
    expect(chartLttb(points.slice(0, 5), 100)).toEqual([0, 1, 2, 3, 4]);
    expect(chartLttb(points.slice(0, 10), 1)).toHaveLength(3);
  });

  it("reduces runs between gaps on their own and leaves short series", () => {
    const withGap = points.map((point, i) => (i === 500 ? null : point));
    const kept = chartReduceRuns(withGap, { target: 100, threshold: 200 });
    expect(kept.has(500)).toBe(false);
    expect(kept.has(499)).toBe(true);
    expect(kept.has(501)).toBe(true);
    expect(kept.size).toBeLessThan(120);
    expect(chartReduceRuns(points.slice(0, 50), { target: 10, threshold: 200 }).size).toBe(50);
  });
});

describe("renderChart dataReducer", () => {
  const input = {
    categories: wave.map((_, i) => String(i)),
    series: [{ name: "A", data: wave }],
    width: 640,
    height: 320,
    idPrefix: "t",
  };
  const line = (render: ReturnType<typeof renderChart>) => {
    const all = (nodes: readonly ChartNode[]): ChartNode[] =>
      nodes.flatMap((item) => [item, ...all(item.children ?? [])]);
    return all(render.layout.nodes).find((n) => n.attrs["data-ok-chart-line"] !== undefined)?.attrs[
      "d"
    ] as string;
  };

  it("draws fewer points, keeps every mark and every table row", () => {
    const render = renderChart({
      ...input,
      dataReducer: true,
      dataReducerTargetPoints: 60,
      dataReducerThreshold: 100,
    });
    const plain = renderChart(input);
    expect(line(render).length).toBeLessThan(line(plain).length / 5);
    expect(render.layout.marks).toHaveLength(1000);
    expect(render.table.rows).toHaveLength(1000);
  });

  it("keeps short series, stays off without the flag and leaves bars alone", () => {
    const render = renderChart({ ...input, dataReducer: true, dataReducerThreshold: 5000 });
    expect(line(render)).toBe(line(renderChart(input)));
    const bars = renderChart({
      ...input,
      type: "bar",
      dataReducer: true,
      dataReducerThreshold: 10,
    });
    const all = (nodes: readonly ChartNode[]): ChartNode[] =>
      nodes.flatMap((item) => [item, ...all(item.children ?? [])]);
    expect(
      all(bars.layout.nodes).filter((n) => n.attrs["data-ok-chart-bar"] !== undefined),
    ).toHaveLength(1000);
  });

  it("drops the markers and data labels of points it leaves out", () => {
    const small = { ...input, markerSize: 3, dataLabels: true };
    const render = renderChart({
      ...small,
      dataReducer: true,
      dataReducerTargetPoints: 20,
      dataReducerThreshold: 30,
    });
    const all = (nodes: readonly ChartNode[]): ChartNode[] =>
      nodes.flatMap((item) => [item, ...all(item.children ?? [])]);
    expect(
      all(render.layout.nodes).filter((n) => n.attrs["data-ok-chart-marker"] !== undefined).length,
    ).toBeLessThan(30);
    expect(
      all(render.layout.nodes).filter((n) => n.attrs["data-ok-chart-data-label"] !== undefined)
        .length,
    ).toBeLessThan(30);
  });

  it("reduces the zoomed window, not the whole series", () => {
    const zoom = { min: 100, max: 700 };
    const render = renderChart({
      ...input,
      dataReducer: true,
      dataReducerTargetPoints: 60,
      dataReducerThreshold: 100,
      zoom,
    });
    expect(render.layout.marks).toHaveLength(601);
    expect(line(render)).toBeTruthy();
  });
});
