import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import { chartGeoContains, chartProject, readChartGeoTable } from "./chart-geo.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import { chartSelectedNodes } from "./chart-select.js";

const square = (id: string, x: number, y: number, side = 10) => ({
  type: "Feature",
  properties: { name: id, code: id.toUpperCase() },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, y],
        [x + side, y],
        [x + side, y + side],
        [x, y + side],
        [x, y],
      ],
    ],
  },
});

const GEOMETRY = {
  type: "FeatureCollection" as const,
  features: [square("west", -40, 0), square("middle", -10, 0), square("east", 20, 0)],
};
const REGIONS = [
  { id: "west", name: "West", value: 1 },
  { id: "middle", name: "Middle", value: 5 },
  { id: "east", name: "East", value: 9 },
];

const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({
    type: "geo",
    geometry: GEOMETRY,
    regions: REGIONS,
    joinBy: "name",
    width: 400,
    height: 300,
    idPrefix: "t",
    ...input,
  });

const collect = (nodes: readonly ChartNode[], attr: string): ChartNode[] =>
  nodes.flatMap((item) => [
    ...(item.attrs[attr] !== undefined ? [item] : []),
    ...collect(item.children ?? [], attr),
  ]);
const regionsOf = (layout: ChartLayout) => collect(layout.nodes, "data-ok-chart-region");

describe("renderChart geo: projections and fit", () => {
  it("projects with the Equal Earth formulas", () => {
    expect(chartProject("equalEarth", 0, 0)).toEqual([0, 0]);
    const [x, y] = chartProject("equalEarth", 180, 0);
    // At the equator x = λ / (M × A1), y = 0.
    expect(x).toBeCloseTo(Math.PI / ((Math.sqrt(3) / 2) * 1.340264), 3);
    expect(y).toBe(0);
    expect(chartProject("equalEarth", 0, 90)[1]).toBeGreaterThan(0);
    expect(chartProject("mercator", 0, 90)[1]).toBeCloseTo(
      Math.log(Math.tan(Math.PI / 4 + (85.05113 * Math.PI) / 360)),
      4,
    );
    expect(chartProject("equirectangular", 90, 45)).toEqual([Math.PI / 2, Math.PI / 4]);
  });

  it("fits the regions in the plot, north up", () => {
    const { layout } = draw();
    const regions = regionsOf(layout);
    expect(regions.map((item) => item.attrs["data-ok-chart-region"])).toEqual([
      "west",
      "middle",
      "east",
    ]);
    const west = layout.marks[0];
    const east = layout.marks[2];
    expect(west && east && west.px < east.px).toBe(true);
    for (const mark of layout.marks) {
      expect(mark.px).toBeGreaterThanOrEqual(0);
      expect(mark.px).toBeLessThanOrEqual(400);
      expect(mark.py).toBeGreaterThanOrEqual(0);
      expect(mark.py).toBeLessThanOrEqual(300);
    }
  });

  it("draws the sphere and the graticule, and fits the whole globe", () => {
    const { layout } = draw({ sphere: true, graticule: true });
    expect(collect(layout.nodes, "data-ok-chart-sphere")).toHaveLength(1);
    expect(collect(layout.nodes, "data-ok-chart-graticule")).toHaveLength(1);
    const framed = draw({ sphere: true }).layout.marks[0];
    const free = draw().layout.marks[0];
    expect(framed && free && Math.abs(framed.px) !== Math.abs(free.px)).toBe(true);
  });

  it("draws geometry without data but makes it not reachable", () => {
    const { layout } = draw({ regions: REGIONS.slice(0, 2) });
    expect(regionsOf(layout)).toHaveLength(3);
    expect(layout.marks).toHaveLength(2);
    expect(regionsOf(layout)[2]?.attrs).toHaveProperty("data-ok-no-data");
  });

  it("joins by the feature's id, a chosen property or a name", () => {
    expect(draw({ joinBy: "code", regions: [{ id: "WEST", value: 1 }] }).layout.marks).toHaveLength(
      1,
    );
    const withIds = {
      type: "FeatureCollection" as const,
      features: [{ ...square("a", 0, 0), id: 7 }],
    };
    expect(
      draw({ geometry: withIds, joinBy: undefined, regions: [{ id: "7", value: 1 }] }).layout.marks,
    ).toHaveLength(1);
  });

  it("tolerates nothing to draw, bad geometry and more than the limit", () => {
    expect(draw({ geometry: null, regions: [] }).layout.marks).toHaveLength(0);
    const bad = {
      type: "FeatureCollection" as const,
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [1, 2] } },
        {
          type: "Feature",
          properties: { name: "west" },
          geometry: { type: "Polygon", coordinates: "x" },
        },
        { type: "Feature", properties: { name: "west" } },
        {
          type: "Feature",
          properties: { name: "west" },
          geometry: { type: "Polygon", coordinates: [[[1, 2]], "nope"] },
        },
      ],
    };
    expect(draw({ geometry: bad }).layout.marks).toHaveLength(0);
    // A single feature and a list of features are accepted too.
    expect(draw({ geometry: square("west", 0, 0) }).layout.marks).toHaveLength(1);
    expect(draw({ geometry: [square("west", 0, 0)] }).layout.marks).toHaveLength(1);
    const many = Array.from({ length: 3000 }, (_, i) => ({ id: `r${i}`, value: i }));
    expect(draw({ regions: many }).table.rows).toHaveLength(2000);
  });
});

describe("renderChart geo: scale and legend", () => {
  it("colors regions by class and lists the classes", () => {
    const { layout, legend } = draw({ scaleClasses: 3 });
    const fills = regionsOf(layout).map((item) => item.attrs["data-ok-color"]);
    expect(new Set(fills).size).toBe(3);
    expect(legend).toHaveLength(3);
    expect(legend?.[0]?.name).toContain("–");
    expect(legend?.every((item) => !item.hidden)).toBe(true);
  });

  it("uses the color given and the method and thresholds given", () => {
    const { layout } = draw({
      colors: ["info"],
      scaleMethod: "threshold",
      scaleThresholds: [2, 8],
    });
    expect(regionsOf(layout)[0]?.attrs["data-ok-color"]).toBe("info-lighter");
    expect(regionsOf(layout)[2]?.attrs["data-ok-color"]).toBe("info-darker");
    const ramp = draw({ colors: ["info", "error"], scaleClasses: 2 });
    expect(regionsOf(ramp.layout)[0]?.attrs["data-ok-color"]).toBe("info");
  });

  it("mutes the classes turned off in the legend", () => {
    const { layout, legend } = draw({ scaleClasses: 3, hidden: [0] });
    expect(legend?.[0]?.hidden).toBe(true);
    expect(regionsOf(layout)[0]?.attrs["fill-opacity"]).toBe("0.18");
    expect(regionsOf(layout)[1]?.attrs["fill-opacity"]).toBeUndefined();
  });

  it("shows regions without a value as no data, with text", () => {
    const render = draw({
      regions: [
        { id: "west", value: null },
        { id: "middle", value: "x" },
      ],
    });
    expect(regionsOf(render.layout)[0]?.attrs).toHaveProperty("data-ok-no-data");
    const tip = chartTooltip(render.data, render.layout, render.format, { kind: "mark", mark: 0 });
    expect(tip?.rows[0]?.value).toBe("No data");
    expect(draw({ regions: [] }).legend).toBeNull();
  });
});

describe("renderChart geo: interaction", () => {
  it("hits the region under the pointer, not its bounding box", () => {
    const { layout } = draw();
    const mark = layout.marks[1];
    expect(mark).toBeDefined();
    expect(chartActiveAt(layout, mark?.px as number, mark?.py as number)).toEqual({
      kind: "mark",
      mark: 1,
    });
    expect(chartActiveAt(layout, 1, 1)).toBeNull();
  });

  it("treats nested rings even-odd", () => {
    const geo = {
      d: "",
      title: "",
      rows: [],
      rings: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        [
          [3, 3],
          [7, 3],
          [7, 7],
          [3, 7],
        ],
      ],
    } as Parameters<typeof chartGeoContains>[0];
    expect(chartGeoContains(geo, 1, 1)).toBe(true);
    expect(chartGeoContains(geo, 5, 5)).toBe(false);
  });

  it("moves between regions with the arrow keys", () => {
    const { layout } = draw();
    expect(nextChartActive(layout, null, "Home")).toEqual({ kind: "mark", mark: 0 });
    expect(nextChartActive(layout, { kind: "mark", mark: 0 }, "ArrowRight")).toEqual({
      kind: "mark",
      mark: 1,
    });
    expect(nextChartActive(layout, { kind: "mark", mark: 1 }, "End")).toEqual({
      kind: "mark",
      mark: 2,
    });
  });

  it("outlines the active and the selected region and gives its tooltip", () => {
    const render = draw();
    const active = chartActiveNodes(render.layout, { kind: "mark", mark: 2 });
    expect(active.over[0]?.attrs["d"]).toBe(regionsOf(render.layout)[2]?.attrs["d"]);
    const selected = chartSelectedNodes(render.layout, [{ seriesIndex: 0, dataPointIndex: 2 }]);
    expect(collect(selected, "data-ok-chart-selected-mark")).toHaveLength(1);
    const tip = chartTooltip(render.data, render.layout, render.format, { kind: "mark", mark: 2 });
    expect(tip?.title).toBe("East");
    expect(tip?.rows[0]?.value).toBe("9");
  });

  it("uses the localized labels and the table headers", () => {
    const render = draw({ partLabels: { y: "People", noData: "Nothing" } });
    expect(render.table.head.map((cell) => cell.text)).toEqual(["Name", "People"]);
    const tip = chartTooltip(
      render.data,
      draw({ regions: [{ id: "west", value: null }], partLabels: { noData: "Nothing" } }).layout,
      render.format,
      { kind: "mark", mark: 0 },
    );
    expect(tip?.rows[0]?.value).toBe("Nothing");
  });
});

describe("renderChart geo: hex tiles", () => {
  const CELLS = [
    { id: "west", col: 0, row: 0 },
    { id: "middle", col: 1, row: 0 },
    { id: "east", col: 0, row: 1 },
  ];

  it("draws one hexagon per placed region, without geometry", () => {
    const { layout, table } = draw({ geoLayout: "hex", hexCells: CELLS, geometry: null });
    expect(regionsOf(layout)).toHaveLength(3);
    expect(regionsOf(layout)[0]?.attrs["d"]?.split("L")).toHaveLength(6);
    const west = layout.marks[0];
    const middle = layout.marks[1];
    const east = layout.marks[2];
    expect(west && middle && west.px < middle.px && west.py === middle.py).toBe(true);
    expect(east && west && east.py > west.py && east.px > west.px).toBe(true);
    expect(table.rows[0]?.header.attrs["data-ok-cell"]).toBe("0,0");
  });

  it("places cells from the geometry when none are given", () => {
    const { layout } = draw({ geoLayout: "hex" });
    expect(layout.marks).toHaveLength(3);
    const xs = [...layout.marks].sort((a, b) => a.index - b.index).map((mark) => mark.px);
    expect((xs[0] as number) < (xs[1] as number) && (xs[1] as number) < (xs[2] as number)).toBe(
      true,
    );
  });

  it("ignores cells of unknown regions and invalid numbers", () => {
    const { layout } = draw({
      geoLayout: "hex",
      geometry: null,
      hexCells: [
        { id: "west", col: 0, row: 0 },
        { id: "nowhere", col: 1, row: 0 },
        { id: "middle", col: Number.NaN, row: 0 },
      ],
    });
    expect(layout.marks).toHaveLength(1);
  });

  it("labels tiles that fit and uses the short label", () => {
    const { layout } = draw({
      geoLayout: "hex",
      hexCells: CELLS,
      geometry: null,
      dataLabels: true,
      regions: REGIONS.map((region) => ({ ...region, label: region.id.slice(0, 2).toUpperCase() })),
    });
    const labels = collect(layout.nodes, "data-ok-chart-partition-label");
    expect(labels.map((item) => item.text)).toEqual(["WE", "MI", "EA"]);
    expect(labels.map((item) => item.attrs["data-ok-chart-partition-label"])).toContain("inside");
  });
});

describe("readChartGeoTable", () => {
  it("reads regions, hex cells and the headers back from a table", () => {
    const table = document.createElement("table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const [part, text] of [
      ["name", "State"],
      ["y", "People"],
    ]) {
      const th = document.createElement("th");
      th.setAttribute("data-ok-part", part as string);
      th.textContent = text as string;
      headRow.append(th);
    }
    head.append(headRow);
    const body = document.createElement("tbody");
    const row = (name: string, attrs: Record<string, string>, value: string) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = name;
      for (const [key, attr] of Object.entries(attrs)) th.setAttribute(key, attr);
      const td = document.createElement("td");
      if (value) td.setAttribute("data-ok-value", value);
      tr.append(th, td);
      body.append(tr);
    };
    row(
      "California",
      { "data-ok-value": "CA", "data-ok-label": "CA", "data-ok-cell": "1,4" },
      "39.5",
    );
    row("Empty", {}, "");
    table.append(head, body);
    const { regions, hexCells, partLabels } = readChartGeoTable(table);
    expect(regions).toEqual([
      { id: "CA", name: "California", label: "CA", value: "39.5" },
      { id: "Empty", name: "Empty", value: null },
    ]);
    expect(hexCells).toEqual([{ id: "CA", col: 1, row: 4 }]);
    expect(partLabels).toEqual({ name: "State", y: "People" });
  });
});

describe("renderChart geo: edges", () => {
  const point = (x: number, y: number, id: string) => ({
    type: "Feature",
    properties: { name: id },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [x, y],
          [x, y],
          [x, y],
          [x, y],
        ],
      ],
    },
  });

  it("draws MultiPolygons and skips geometry it can't read", () => {
    const multi = {
      type: "Feature",
      properties: { name: "west" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 0],
            ],
          ],
          "nope",
          ["nope"],
        ],
      },
    };
    expect(draw({ geometry: multi as never }).layout.marks).toHaveLength(1);
    const broken = {
      type: "Feature",
      properties: { name: "west" },
      geometry: { type: "MultiPolygon", coordinates: "x" },
    };
    expect(draw({ geometry: broken as never }).layout.marks).toHaveLength(0);
    // Rings with too few valid positions, and a feature with no key at all, are not regions.
    const shortRing = {
      type: "Feature",
      properties: { name: "west" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [1, 2],
            ["a", "b"],
          ],
        ],
      },
    };
    expect(draw({ geometry: shortRing as never }).layout.marks).toHaveLength(0);
    const noKey = { type: "Feature", properties: null, geometry: square("x", 0, 0).geometry };
    const render = draw({ geometry: noKey as never, joinBy: undefined });
    expect(render.layout.marks).toHaveLength(0);
    expect(regionsOf(render.layout)[0]?.attrs["data-ok-chart-region"]).toBe("");
  });

  it("handles shapes with no area and a lone centroid", () => {
    const { layout } = draw({
      geometry: {
        type: "FeatureCollection",
        features: [point(0, 0, "west"), point(0, 0, "middle")],
      },
    });
    expect(layout.marks).toHaveLength(2);
    expect(layout.marks.every((mark) => Number.isFinite(mark.px))).toBe(true);
  });

  it("uses the id as the name and leaves out labels that don't fit", () => {
    const render = draw({
      regions: [{ id: "west", value: 1 }],
      dataLabels: true,
      width: 60,
      height: 40,
    });
    expect(
      chartTooltip(render.data, render.layout, render.format, { kind: "mark", mark: 0 })?.title,
    ).toBe("west");
    expect(collect(render.layout.nodes, "data-ok-chart-partition-label")).toHaveLength(0);
    const named = draw({ regions: [{ id: "west", label: "W", value: 1 }], dataLabels: true });
    expect(collect(named.layout.nodes, "data-ok-chart-partition-label")).toHaveLength(1);
  });

  it("frames a Mercator and an equirectangular globe with graticule", () => {
    for (const projection of ["mercator", "equirectangular"] as const) {
      const { layout } = draw({ projection, sphere: true, graticule: true });
      expect(collect(layout.nodes, "data-ok-chart-graticule")).toHaveLength(1);
    }
  });

  it("stacks auto hex cells when the regions share a meridian, and skips nothing placed", () => {
    const tall = {
      type: "FeatureCollection" as const,
      features: [square("west", 0, 0), square("middle", 0, 30), square("east", 0, 60)],
    };
    const { layout } = draw({ geoLayout: "hex", geometry: tall });
    expect(layout.marks).toHaveLength(3);
    // No cells: nothing to draw.
    expect(draw({ geoLayout: "hex", geometry: null }).layout.marks).toHaveLength(0);
  });

  it("stops at the coordinate limit", () => {
    const ring = Array.from({ length: 400_001 }, () => [0, 0]);
    const huge = {
      type: "Feature",
      properties: { name: "west" },
      geometry: { type: "Polygon", coordinates: [ring] },
    };
    expect(draw({ geometry: huge as never }).layout.marks).toHaveLength(0);
  });

  it("reads a table without a header or usable cells", () => {
    const table = document.createElement("table");
    const row = table.insertRow();
    const th = document.createElement("th");
    th.setAttribute("data-ok-cell", "x,y");
    th.textContent = "Solo";
    row.append(th);
    table.insertRow().insertCell().textContent = "";
    const { regions, hexCells } = readChartGeoTable(table);
    expect(regions).toEqual([{ id: "Solo", name: "Solo", value: null }]);
    expect(hexCells).toEqual([]);
  });
});

describe("renderChart geo: pixel maps (4.18.96)", () => {
  const cells = (d: string) => d.split("M").length - 1;

  it("draws each region as lattice cells, keeping the region's outline for hits", () => {
    const { layout } = draw({ geoLayout: "pixel" });
    const series = collect(layout.nodes, "data-ok-chart-series")[0];
    expect(series?.attrs["data-ok-layout"]).toBe("pixel");
    const [west] = regionsOf(layout);
    const d = String(west?.attrs["d"]);
    // Circles: two arcs per cell.
    expect(d).toContain("a");
    expect(cells(d)).toBeGreaterThan(4);
    const mark = layout.marks[0];
    const geo = mark?.geo;
    expect(geo?.d.startsWith("M")).toBe(true);
    expect(cells(geo?.d ?? "")).toBe(1);
    expect(geo && mark ? chartGeoContains(geo, mark.px, mark.py) : false).toBe(true);
  });

  it("draws squares and hexagons, sized and spaced by the options", () => {
    const d = (input: Partial<ChartRenderInput>) =>
      String(regionsOf(draw({ geoLayout: "pixel", ...input }).layout)[0]?.attrs["d"]);
    const squares = d({ pixelShape: "square", pixelSpacing: 20 });
    const fine = d({ pixelShape: "square", pixelSpacing: 5 });
    expect(squares).not.toContain("a");
    expect(cells(fine)).toBeGreaterThan(cells(squares));
    const hex = d({ pixelShape: "hexagon", pixelSize: 100 });
    expect(hex.split("M")[1]?.split("L")).toHaveLength(6);
    // Invalid options fall back to circles; spacing and size are clamped.
    expect(d({ pixelShape: "star" as never, pixelSpacing: 0.5, pixelSize: 500 })).toContain("a");
  });

  it("pixelates regions without data too", () => {
    const { layout } = draw({ geoLayout: "pixel", regions: REGIONS.slice(0, 1) });
    const empty = regionsOf(layout).filter((item) => item.attrs["data-ok-no-data"] !== undefined);
    expect(empty).toHaveLength(2);
    expect(cells(String(empty[0]?.attrs["d"]))).toBeGreaterThan(1);
  });

  it("leaves other layouts' trees unchanged", () => {
    const series = collect(draw().layout.nodes, "data-ok-chart-series")[0];
    expect(series?.attrs["data-ok-layout"]).toBeUndefined();
  });
});
