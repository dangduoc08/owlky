import { describe, expect, it } from "vitest";
import { chartAttributes, chartOptions } from "../anatomy/anatomy.js";
import { chartIdPrefix, renderChart } from "./chart.js";
import { chartFormat } from "./chart-format.js";
import { chartData } from "./chart-model.js";

const HOSTILE = '"><img src=x onerror=alert(1)>';
const base = { width: 400, height: 240, idPrefix: "t" };

describe("chartAttributes", () => {
  it("writes every style with explicit defaults, flags and valid numbers", () => {
    expect(chartAttributes()).toEqual({
      "data-ok-chart": "",
      "data-ok-type": "line",
      "data-ok-x-type": "category",
      "data-ok-curve": "smooth",
      "data-ok-legend": "top",
      "data-ok-fill": "gradient",
    });
    expect(
      chartAttributes({
        type: "bar",
        stacked: true,
        horizontal: true,
        height: 300,
        markerSize: 4,
        columnWidth: 58,
        barHeight: 30,
        yMin: -60,
        yMax: 20,
      }),
    ).toMatchObject({
      "data-ok-type": "bar",
      "data-ok-stacked": "",
      "data-ok-horizontal": "",
      "data-ok-height": "300",
      "data-ok-marker-size": "4",
      "data-ok-column-width": "58",
      "data-ok-bar-height": "30",
      "data-ok-y-min": "-60",
      "data-ok-y-max": "20",
    });
  });

  it("rejects invalid values", () => {
    const attrs = chartAttributes({
      type: HOSTILE as never,
      height: 10,
      columnWidth: 0,
      markerSize: -1,
    });
    expect(attrs["data-ok-type"]).toBe("line");
    expect(attrs).not.toHaveProperty("data-ok-height");
    expect(attrs).not.toHaveProperty("data-ok-column-width");
    expect(attrs).not.toHaveProperty("data-ok-marker-size");
    expect(chartOptions.name).toBe("chart");
  });
});

describe("chartFormat", () => {
  const data = chartData({ series: [{ name: "A", data: [1] }], categories: ["a"] });

  it("values with prefix / suffix and locale grouping; ticks without grouping", () => {
    const format = chartFormat(data, { valuePrefix: "$", valueSuffix: " k" });
    expect(format.value(1234.567, 0)).toBe("$1,234.57 k");
    expect(format.tick(1500, 0)).toBe("$1500 k");
    expect(format.tick(-0, 1)).toBe("$0.0 k");
    expect(format.tick(2.5, 1)).toBe("$2.5 k");
    expect(format.axis("Jan")).toEqual({ text: "Jan", major: false });
    expect(format.title("Jan")).toBe("Jan");
  });

  it("custom formatters win, and always give text", () => {
    const format = chartFormat(data, {
      valueFormatter: (value, series) => `${series}:${value}`,
      labelFormatter: (x) => (x === "a" ? (42 as never) : (undefined as never)),
    });
    expect(format.value(3, 1)).toBe("1:3");
    expect(format.tick(3, 0)).toBe("-1:3");
    expect(format.axis("a")).toEqual({ text: "42", major: false });
    expect(format.title("b")).toBe("");
  });

  it("numeric and datetime axes; unknown locales fall back", () => {
    const numeric = chartFormat(
      chartData({ type: "scatter", series: [{ name: "A", data: [[1, 1]] }] }),
      { locale: "bad locale!" },
    );
    expect(numeric.axis(2.5, 1).text).toBe("2.5");
    expect(numeric.title(1234.5)).toBe("1,234.5");
    expect(numeric.value(2, 0)).toBe("2");
    const dates = chartFormat(
      chartData({
        xType: "datetime",
        categories: ["2011-01-01", "2011-02-01"],
        series: [{ name: "A", data: [1, 2] }],
      }),
    );
    expect(dates.dateUnit).toBe("month");
    expect(dates.axis(Date.UTC(2012, 0, 1))).toEqual({ text: "2012", major: true });
    expect(dates.title(Date.UTC(2012, 0, 1))).toBe("Jan 2012");
    const vi = chartFormat(data, { locale: "vi-VN" });
    expect(vi.value(1234.5, 0)).toBe("1.234,5");
  });
});

describe("renderChart", () => {
  it("legend for two or more series, hidden state, table header by axis type", () => {
    const render = renderChart({
      ...base,
      hidden: [1],
      categories: ["a"],
      series: [
        { name: "A", data: [1] },
        { name: "B", data: [2] },
      ],
    });
    expect(render.legend).toEqual([
      { index: 0, name: "A", color: "primary-dark", hidden: false },
      { index: 1, name: "B", color: "warning", hidden: true },
    ]);
    expect(render.table.head[0]?.text).toBe("Category");
    expect(render.table.head[1]?.attrs).not.toHaveProperty("data-ok-type");
  });

  it("no legend for one series or legend none; mixed tables carry series types", () => {
    expect(renderChart({ ...base, series: [{ name: "A", data: [1] }] }).legend).toBeNull();
    const none = renderChart({
      ...base,
      legend: "none",
      series: [
        { name: "A", data: [1] },
        { name: "B", data: [1], type: "bar" },
      ],
    });
    expect(none.legend).toBeNull();
    expect(none.table.head[2]?.attrs["data-ok-type"]).toBe("bar");
    expect(renderChart({ ...base, xType: "datetime", series: [] }).table.head[0]?.text).toBe(
      "Date",
    );
    expect(renderChart({ ...base, type: "scatter", series: [] }).table.head[0]?.text).toBe("X");
    expect(renderChart({ ...base, xLabel: "Month", series: [] }).table.head[0]?.text).toBe("Month");
  });

  it("gradient id prefixes keep only safe characters", () => {
    expect(chartIdPrefix("«r1»:x y")).toBe("ok-chart-r1xy");
    expect(chartIdPrefix(HOSTILE)).toBe("ok-chart-imgsrcxonerroralert1");
  });
});
