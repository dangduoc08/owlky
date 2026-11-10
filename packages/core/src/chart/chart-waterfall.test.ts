import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveNodes, chartTooltip } from "./chart-active.js";
import { type ChartNode, chartSigned } from "./chart-layout.js";
import { chartData, readChartTable } from "./chart-model.js";
import { chartMarkAt } from "./chart-select.js";

/* Waterfall charts (4.18.21, ApexCharts `waterfall`, `isTotal`, `isSubtotal`). */

const base = { width: 640, height: 320, idPrefix: "t" };
const CASH: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "waterfall",
  categories: ["Open", "Sales", "Costs", "Half", "Tax", "Close"],
  series: [{ name: "Cash", data: [120, 80, -50, { isSubtotal: true }, -30, { isTotal: true }] }],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...CASH, ...input } as ChartRenderInput);

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

describe("waterfall data", () => {
  it("keeps each step and its running totals; sums show the total so far", () => {
    const data = chartData({ ...CASH, series: CASH.series ?? [] });
    expect(data.type).toBe("waterfall");
    const points = data.series[0]?.points ?? [];
    expect(points.map((point) => point.y)).toEqual([120, 80, -50, 150, -30, 120]);
    expect(points.map((point) => point.range)).toEqual([
      [0, 120],
      [120, 200],
      [200, 150],
      [0, 150],
      [150, 120],
      [0, 120],
    ]);
    expect(points.map((point) => point.sum)).toEqual([
      undefined,
      undefined,
      undefined,
      "subtotal",
      undefined,
      "total",
    ]);
  });

  it("skips gaps, takes points in x order and ignores sums elsewhere", () => {
    const gaps = chartData({
      type: "waterfall",
      series: [
        {
          name: "A",
          data: [
            { x: "b", y: 5 },
            { x: "a", y: null },
            { x: "c", y: 10, isTotal: true },
          ],
        },
      ],
    });
    expect(gaps.series[0]?.points.map((point) => [point.y, point.range])).toEqual([
      [5, [0, 5]],
      [null, undefined],
      [5, [0, 5]],
    ]);
    // Sum flags only mean something on waterfall series.
    const line = chartData({
      type: "line",
      series: [{ name: "A", data: [{ y: 2, isTotal: true }] }],
    });
    expect(line.series[0]?.points[0]).toEqual({ x: 0, y: 2 });
  });

  it("writes one cell per point, sums with data-ok-sum, and reads them back", () => {
    const render = draw();
    expect(render.table.parts).toEqual([]);
    const cells = render.table.rows.map((row) => row.cells[0]);
    expect(cells.map((cell) => cell?.text)).toEqual(["120", "80", "-50", "150", "-30", "120"]);
    expect(cells[3]?.attrs).toEqual({ "data-ok-sum": "subtotal" });
    expect(cells[5]?.attrs).toEqual({ "data-ok-sum": "total" });
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    head.append(document.createElement("th"), document.createElement("th"));
    (head.cells[1] as HTMLElement).textContent = "Cash";
    const body = table.createTBody();
    render.table.rows.forEach((row) => {
      const tr = body.insertRow();
      const th = document.createElement("th");
      th.textContent = row.header.text;
      const td = document.createElement("td");
      td.textContent = row.cells[0]?.text ?? "";
      for (const [name, value] of Object.entries(row.cells[0]?.attrs ?? {}))
        td.setAttribute(name, value);
      tr.append(th, td);
    });
    const read = readChartTable(table, "category", "waterfall");
    expect(read.series[0]?.data).toEqual([
      120,
      80,
      -50,
      { y: 150, isSubtotal: true },
      -30,
      { y: 120, isTotal: true },
    ]);
  });
});

describe("waterfall layout", () => {
  it("draws floating bars colored by step, totals and subtotals, with connectors", () => {
    const render = draw();
    const bars = find(render.layout.nodes, "data-ok-chart-bar");
    expect(bars.map((bar) => bar.attrs["data-ok-chart-step"])).toEqual([
      "up",
      "up",
      "down",
      "subtotal",
      "down",
      "total",
    ]);
    expect(bars.map((bar) => bar.attrs["data-ok-color"])).toEqual([
      "success",
      "success",
      "error",
      "primary-dark",
      "error",
      "primary-dark",
    ]);
    // The second bar starts where the first ends.
    const [first, second] = bars;
    expect(second?.attrs["y"]).not.toBe(first?.attrs["y"]);
    expect(Number(second?.attrs["y"]) + Number(second?.attrs["height"])).toBeCloseTo(
      Number(first?.attrs["y"]),
      1,
    );
    const connectors = find(render.layout.nodes, "data-ok-chart-connector");
    expect(connectors).toHaveLength(5);
    // Connectors run at the running total: the first at the top of the first bar.
    expect(connectors[0]?.attrs["y1"]).toBe(first?.attrs["y"]);
    expect(find(draw({ hideConnectors: true }).layout.nodes, "data-ok-chart-connector")).toEqual(
      [],
    );
    // The value scale includes zero.
    expect(render.layout.y?.min).toBe(0);
  });

  it("takes its own colors and a point's color", () => {
    const render = draw({
      waterfallPositiveColor: "info",
      waterfallNegativeColor: "warning",
      waterfallTotalColor: "secondary",
      waterfallSubtotalColor: "info-dark",
      series: [
        {
          name: "Cash",
          data: [
            10,
            { y: -4, color: "error-dark" },
            -2,
            { isSubtotal: true },
            1,
            { isTotal: true },
          ],
        },
      ],
    });
    expect(
      find(render.layout.nodes, "data-ok-chart-bar").map((bar) => bar.attrs["data-ok-color"]),
    ).toEqual(["info", "error-dark", "warning", "info-dark", "info", "secondary"]);
    // Subtotals default to the total color.
    const subtotal = draw({ waterfallTotalColor: "secondary" });
    expect(
      find(subtotal.layout.nodes, "data-ok-chart-step", "subtotal")[0]?.attrs["data-ok-color"],
    ).toBe("secondary");
  });

  it("turns horizontal and prints signed data labels that fit", () => {
    const render = draw({ horizontal: true, dataLabels: true, barHeight: 60 });
    expect(render.layout.horizontal).toBe(true);
    const bar = find(render.layout.nodes, "data-ok-chart-bar")[1];
    expect(Number(bar?.attrs["x"])).toBeGreaterThan(render.layout.plot.x);
    const connector = find(render.layout.nodes, "data-ok-chart-connector")[0];
    expect(connector?.attrs["x1"]).toBe(connector?.attrs["x2"]);
    expect(find(render.layout.nodes, "data-ok-chart-data-label").map((n) => n.text)).toEqual([
      "+120",
      "+80",
      "-50",
      "150",
      "-30",
      "120",
    ]);
    expect(chartSigned(0, "0")).toBe("0");
    expect(chartSigned(5, "+5")).toBe("+5");
  });

  it("draws several series side by side and zooms like bars", () => {
    const render = draw({
      series: [
        { name: "A", data: [1, 2, 3, 4, 5, { isTotal: true }] },
        { name: "B", data: [2, -1, 1, 1, -1, { isTotal: true }] },
      ],
      zoom: { min: 1, max: 3 },
    });
    expect(render.zoomable).toBe(true);
    expect(find(render.layout.nodes, "data-ok-chart-series")).toHaveLength(2);
    expect(find(render.layout.nodes, "data-ok-chart-bar")).toHaveLength(6);
    expect(render.legend?.map((item) => item.name)).toEqual(["A", "B"]);
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 1,
    });
    expect(tip?.rows.map((row) => row.name)).toEqual(["A", "A (Total)", "B", "B (Total)"]);
  });
});

describe("waterfall interaction", () => {
  it("shows the signed step and the running total; sums one row", () => {
    const render = draw();
    const at = (index: number) =>
      chartTooltip(render.data, render.layout, render.format, { kind: "index", index });
    expect(at(1)?.rows.map((row) => [row.name, row.value, row.color])).toEqual([
      ["Cash", "+80", "success"],
      ["Total", "200", "success"],
    ]);
    expect(at(2)?.rows.map((row) => row.value)).toEqual(["-50", "150"]);
    expect(at(3)?.rows.map((row) => [row.name, row.value])).toEqual([["Cash", "150"]]);
    // Localized part label.
    const localized = draw({ partLabels: { total: "Summe" } });
    expect(
      chartTooltip(localized.data, localized.layout, localized.format, { kind: "index", index: 0 })
        ?.rows[1]?.name,
    ).toBe("Summe");
    // Blocks: a band, no hover marker.
    const hover = chartActiveNodes(render.layout, { kind: "index", index: 1 });
    expect(hover.under[0]?.attrs["data-ok-chart-band"]).toBe("");
    expect(hover.over).toEqual([]);
  });

  it("selects the bar under a click", () => {
    const render = draw();
    const mark = render.layout.marks[4];
    const hit = chartMarkAt(render.layout, (mark?.box?.x ?? 0) + 2, (mark?.box?.y ?? 0) + 2);
    expect(hit).toBe(4);
    expect(render.layout.marks[5]?.sum).toBe("total");
  });

  it("writes the options as attributes", () => {
    expect(
      chartAttributes({
        type: "waterfall",
        waterfallPositiveColor: "info",
        waterfallNegativeColor: "warning",
        waterfallTotalColor: "secondary",
        waterfallSubtotalColor: "info-dark",
        hideConnectors: true,
      }),
    ).toMatchObject({
      "data-ok-type": "waterfall",
      "data-ok-waterfall-positive-color": "info",
      "data-ok-waterfall-negative-color": "warning",
      "data-ok-waterfall-total-color": "secondary",
      "data-ok-waterfall-subtotal-color": "info-dark",
      "data-ok-hide-connectors": "",
    });
    expect(chartAttributes({ type: "waterfall" })).not.toHaveProperty(
      "data-ok-waterfall-positive-color",
    );
  });
});
