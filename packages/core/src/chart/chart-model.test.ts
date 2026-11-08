import { describe, expect, it } from "vitest";
import {
  chartColors,
  chartData,
  chartDefaultColors,
  chartTable,
  parseChartNumber,
  readChartTable,
} from "./chart-model.js";

const HOSTILE = '"><img src=x onerror=alert(1)>';

const table = (markup: string) => {
  const element = document.createElement("table");
  // Test fixture only (library code never parses markup).
  element.innerHTML = markup;
  return element;
};

describe("parseChartNumber", () => {
  it.each([
    [12, 12],
    ["1,234.5", 1234.5],
    [" -12% ", -12],
    ["−5", -5],
    ["1e3", 1000],
  ] as const)("%j → %j", (input, expected) => {
    expect(parseChartNumber(input)).toBe(expected);
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "",
    "abc",
    "1e999",
    HOSTILE,
    "9".repeat(50),
    null,
    {},
  ])("rejects %j", (input) => {
    expect(parseChartNumber(input)).toBeNull();
  });
});

describe("chartData", () => {
  it("indexes category points, defaults colors and types", () => {
    const data = chartData({
      series: [
        { name: "A", data: [1, null, 3] },
        { name: "B", data: [2], type: "bar" },
      ],
      categories: ["Jan", "Feb", "Mar"],
    });
    expect(data).toMatchObject({
      type: "line",
      xType: "category",
      categories: ["Jan", "Feb", "Mar"],
    });
    expect(data.series[0]).toEqual({
      name: "A",
      type: "line",
      color: "primary-dark",
      points: [
        { x: 0, y: 1 },
        { x: 1, y: null },
        { x: 2, y: 3 },
      ],
    });
    expect(data.series[1]).toMatchObject({ type: "bar", color: "warning" });
  });

  it("rejects unknown types and colors (untrusted input never reaches the DOM)", () => {
    const data = chartData({
      type: HOSTILE,
      xType: HOSTILE,
      colors: [HOSTILE as never, "info"],
      series: [
        {
          name: "A",
          data: [{ y: 1, color: HOSTILE as never }],
          type: HOSTILE as never,
          color: HOSTILE as never,
        },
        { name: "B", data: [{ y: 2, color: "error-dark" }] },
      ],
    });
    expect(data).toMatchObject({ type: "line", xType: "category" });
    expect(data.series[0]).toMatchObject({ type: "line", color: "info", points: [{ x: 0, y: 1 }] });
    expect(data.series[1]?.points[0]).toEqual({ x: 0, y: 2, color: "error-dark" });
    expect(chartColors).toContain("primary-darker");
    expect(chartColors).not.toContain(HOSTILE);
  });

  it("cycles the default palette", () => {
    const series = Array.from({ length: chartDefaultColors.length + 1 }, (_, i) => ({
      name: `S${i}`,
      data: [i],
    }));
    const data = chartData({ series });
    expect(data.series[chartDefaultColors.length]?.color).toBe(chartDefaultColors[0]);
  });

  it("scatter: numeric x from pairs and objects; invalid x is dropped", () => {
    const data = chartData({
      type: "scatter",
      series: [{ name: "A", data: [[1.5, 2], { x: 3, y: 4, color: "info" }, ["bad", 1], 5] }],
    });
    expect(data.xType).toBe("numeric");
    expect(data.series[0]?.points).toEqual([
      { x: 1.5, y: 2 },
      { x: 3, y: 4, color: "info" },
    ]);
  });

  it("datetime: categories become timestamps; pairs collect them when no categories are given", () => {
    const given = chartData({
      xType: "datetime",
      categories: ["2011-01-01", "bad", new Date(Date.UTC(2011, 1, 1))],
      series: [{ name: "A", data: [1, 2] }],
    });
    expect(given.categories).toEqual([Date.UTC(2011, 0, 1), Date.UTC(2011, 1, 1)]);
    const pairs = chartData({
      xType: "datetime",
      series: [
        {
          name: "A",
          data: [
            ["2011-01-01", 1],
            ["2011-02-01", 2],
            ["oops", 3],
          ],
        },
        { name: "B", data: [["2011-02-01", 4]] },
      ],
    });
    expect(pairs.categories).toEqual([Date.UTC(2011, 0, 1), Date.UTC(2011, 1, 1)]);
    expect(pairs.series[1]?.points).toEqual([{ x: 1, y: 4 }]);
    // With categories given, pairs on a datetime axis keep their position.
    const positional = chartData({
      xType: "datetime",
      categories: ["2011-01-01"],
      series: [{ name: "A", data: [["2011-01-01", 7]] }],
    });
    expect(positional.series[0]?.points).toEqual([{ x: 0, y: 7 }]);
  });
});

describe("chartTable", () => {
  const format = {
    xLabel: "Month",
    formatX: (x: string | number) => (typeof x === "number" ? `#${x}` : x),
    formatValue: (value: number) => `${value}%`,
  };

  it("one row per category, one column per series; raw values when the text differs", () => {
    const data = chartData({
      categories: ["Jan", "Feb"],
      series: [
        { name: "A", data: [1, { y: -2, color: "info" }] },
        { name: "B", data: [null], type: "bar" },
      ],
    });
    const model = chartTable(data, { ...format, seriesTypes: true });
    expect(model.head).toEqual([
      { text: "Month", attrs: {} },
      { text: "A", attrs: { "data-ok-type": "line", "data-ok-color": "primary-dark" } },
      { text: "B", attrs: { "data-ok-type": "bar", "data-ok-color": "warning" } },
    ]);
    expect(model.rows[1]).toEqual({
      header: { text: "Feb", attrs: {} },
      cells: [
        { text: "-2%", attrs: { "data-ok-value": "-2", "data-ok-color": "info" } },
        { text: "", attrs: {} },
      ],
    });
    const plain = chartTable(data, { ...format, formatValue: String });
    expect(plain.head[1]?.attrs).toEqual({ "data-ok-color": "primary-dark" });
    expect(plain.rows[0]?.cells[0]).toEqual({ text: "1", attrs: {} });
  });

  it("datetime rows carry ISO dates; numeric rows the raw x when formatted", () => {
    const dates = chartData({
      xType: "datetime",
      categories: ["2011-01-01", Date.UTC(2011, 0, 1, 10)],
      series: [{ name: "A", data: [1, 2] }],
    });
    const rows = chartTable(dates, format).rows;
    expect(rows[0]?.header.attrs).toEqual({ "data-ok-value": "2011-01-01" });
    expect(rows[1]?.header.attrs).toEqual({ "data-ok-value": "2011-01-01T10:00:00Z" });
    const scatter = chartData({
      type: "scatter",
      series: [
        {
          name: "A",
          data: [
            [2, 1],
            [1, 3],
          ],
        },
        { name: "B", data: [[2, 5]] },
      ],
    });
    const numeric = chartTable(scatter, format).rows;
    expect(numeric.map((row) => row.header)).toEqual([
      { text: "#1", attrs: { "data-ok-value": "1" } },
      { text: "#2", attrs: { "data-ok-value": "2" } },
    ]);
    expect(numeric[0]?.cells[1]).toEqual({ text: "", attrs: {} });
    expect(chartTable(scatter, { ...format, formatX: String }).rows[0]?.header.attrs).toEqual({});
    // Several points of a series at one x: one row each.
    const repeated = chartData({
      type: "scatter",
      series: [
        {
          name: "A",
          data: [
            [1, 1],
            [1, 2],
          ],
        },
        { name: "B", data: [[1, 5]] },
      ],
    });
    expect(
      chartTable(repeated, { ...format, formatX: String }).rows.map((row) =>
        row.cells.map((cell) => cell.text),
      ),
    ).toEqual([
      ["1%", "5%"],
      ["2%", ""],
    ]);
  });
});

describe("readChartTable", () => {
  it("reads category tables: names, types, colors, raw values and gaps", () => {
    const result = readChartTable(
      table(`<thead><tr><th>Month</th><th data-ok-type="bar" data-ok-color="info">A</th><th data-ok-type="&quot;&gt;&lt;img onerror=x&gt;" data-ok-color="nope">B</th></tr></thead>
        <tbody><tr><th>Jan</th><td data-ok-value="1.5">1.5 pts</td><td></td></tr>
        <tr><th>Feb</th><td data-ok-color="error">-2</td><td>oops</td></tr><tr><th>Mar</th></tr><tr></tr></tbody>`),
      "category",
    );
    expect(result.categories).toEqual(["Jan", "Feb", "Mar", ""]);
    expect(result.series).toEqual([
      { name: "A", type: "bar", color: "info", data: [1.5, { y: -2, color: "error" }, null, null] },
      { name: "B", data: [null, null, null, null] },
    ]);
  });

  it("reads datetime tables and drops rows without a valid date", () => {
    const result = readChartTable(
      table(
        `<tr><th>Date</th><th>A</th></tr><tr><th data-ok-value="2011-01-01">Jan 2011</th><td>1</td></tr><tr><th>never</th><td>2</td></tr><tr><th data-ok-value="2011-02-01">Feb</th><td>3</td></tr>`,
      ),
      "datetime",
    );
    expect(result.categories).toEqual([Date.UTC(2011, 0, 1), Date.UTC(2011, 1, 1)]);
    expect(result.series[0]?.data).toEqual([1, 3]);
  });

  it("reads numeric tables as pairs, skipping empty cells", () => {
    const result = readChartTable(
      table(
        `<tr><th>X</th><th>A</th><th>B</th></tr><tr><th>1</th><td>2</td><td></td></tr><tr><th data-ok-value="2.5">2.5 kg</th><td></td><td>4</td></tr>`,
      ),
      "numeric",
    );
    expect(result.series).toEqual([
      { name: "A", data: [["1", 2]] },
      { name: "B", data: [["2.5", 4]] },
    ]);
  });

  it("an empty table has no series", () => {
    expect(readChartTable(table(""), "category")).toEqual({ series: [], categories: [] });
  });
});
