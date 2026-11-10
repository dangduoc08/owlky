import { afterEach, describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import {
  type ChartGroupFilter,
  chartBrushCategories,
  chartFilter,
  chartFilterCategories,
  chartFilterHidden,
  chartFilterNodes,
  chartFilterText,
  filterChartData,
} from "./chart-filter.js";
import type { ChartNode } from "./chart-layout.js";
import { type ChartLink, type ChartLinkMember, linkChart } from "./chart-link.js";

/* Crossfilter (4.18.19, ADR-0054): the group filter in the registry, filter and highlight. */

const base = { width: 640, height: 320, idPrefix: "t" };
const REGIONS = ["North", "South", "East", "West"];
const bars = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({
    ...base,
    type: "bar",
    categories: REGIONS,
    series: [{ name: "Orders", data: [4, 3, 2, 5] }],
    ...input,
  } as ChartRenderInput);

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

const links: ChartLink[] = [];
afterEach(() => {
  for (const link of links.splice(0)) link.unlink();
});

/** A registry member that records what it was told. */
function member(group: string | undefined, crossfilter = true) {
  const told: (ChartGroupFilter | null)[] = [];
  let cleared = 0;
  const entry: ChartLinkMember = {
    group,
    zoom: () => null,
    showIndex: () => undefined,
    applyZoom: () => undefined,
    select: () => undefined,
    ...(crossfilter
      ? {
          filter: (filter: ChartGroupFilter | null) => {
            told.push(filter);
          },
          cleared: () => {
            cleared++;
          },
        }
      : {}),
  };
  const link = linkChart(entry);
  links.push(link);
  return { link, told, cleared: () => cleared };
}

describe("crossfilter helpers", () => {
  it("turns selections and brushes into categories", () => {
    const data = bars().data;
    expect(
      chartFilterCategories(data, [
        { seriesIndex: 0, dataPointIndex: 3 },
        { seriesIndex: 1, dataPointIndex: 1 },
        { seriesIndex: 0, dataPointIndex: 3 },
      ]),
    ).toEqual([1, 3]);
    expect(chartFilterCategories(data, [])).toBeNull();
    const scatter = renderChart({
      ...base,
      type: "scatter",
      series: [{ name: "A", data: [[1, 2]] }],
    }).data;
    expect(chartFilterCategories(scatter, [{ seriesIndex: 0, dataPointIndex: 0 }])).toBeNull();
    expect(chartBrushCategories({ min: 0.5, max: 3 })).toEqual([1, 2, 3]);
    expect(chartBrushCategories({ min: 2.2, max: 2.8 })).toBeNull();
    expect(chartBrushCategories(null)).toBeNull();
    expect(chartFilter([3, 1, 1, -1, 2.5])).toEqual([1, 3]);
    expect(chartFilter([])).toBeNull();
    expect(chartFilter(undefined)).toBeNull();
  });

  it("writes the status text with the chart's names", () => {
    const { data, format } = bars();
    expect(chartFilterText(data, [0, 3], format.title)).toBe("Filter: North, West");
    expect(chartFilterText(data, null, format.title)).toBe("Filter cleared");
    expect(chartFilterText(data, [1], format.title, { filter: "Filtre" })).toBe("Filtre: South");
    expect(chartFilterText(data, [], format.title, { filterCleared: "Aucun filtre" })).toBe(
      "Aucun filtre",
    );
    const many = Array.from({ length: 22 }, (_, i) => i);
    expect(chartFilterText(data, many, format.title)).toMatch(/\(\+2\)$/);
  });

  it("filters data and slices; numeric and Sankey data stay", () => {
    const { data } = bars();
    const filtered = filterChartData(data, [1]);
    expect(filtered.series[0]?.points.map((point) => point.y)).toEqual([null, 3, null, null]);
    const scatter = renderChart({
      ...base,
      type: "scatter",
      series: [{ name: "A", data: [[1, 2]] }],
    }).data;
    expect(filterChartData(scatter, [0])).toBe(scatter);
    const donut = renderChart({
      ...base,
      type: "donut",
      categories: REGIONS,
      series: [{ name: "Returns", data: [1, 2, 3, 4] }],
    }).data;
    expect(chartFilterHidden(donut, [0, 2])).toEqual([1, 3]);
  });
});

describe("crossfilter rendering", () => {
  it("is off without crossfilter, even with a filter", () => {
    expect(bars({ filter: [1] }).layout.nodes).toEqual(bars().layout.nodes);
  });

  it("filter: only the filtered categories keep bars; the table keeps every value", () => {
    const render = bars({ crossfilter: "filter", filter: [1, 3] });
    expect(find(render.layout.nodes, "data-ok-chart-bar")).toHaveLength(2);
    expect(render.table.rows.map((row) => row.cells[0]?.text)).toEqual(["4", "3", "2", "5"]);
    expect(render.layout.slots).toHaveLength(4);
    // Circular charts hide the other slices; the legend keeps them shown.
    const donut = renderChart({
      ...base,
      type: "donut",
      categories: REGIONS,
      series: [{ name: "Returns", data: [1, 2, 3, 4] }],
      crossfilter: "filter",
      filter: [0],
    });
    expect(find(donut.layout.nodes, "data-ok-chart-slice")).toHaveLength(1);
    expect(donut.legend?.every((item) => !item.hidden)).toBe(true);
  });

  it("highlight: a band per filtered category behind the series, every value kept", () => {
    const render = bars({ crossfilter: "highlight", filter: [2] });
    expect(find(render.layout.nodes, "data-ok-chart-bar")).toHaveLength(4);
    const layerAt = render.layout.nodes.findIndex(
      (node) => node.attrs["data-ok-chart-filter-layer"] !== undefined,
    );
    const crosshairAt = render.layout.nodes.findIndex(
      (node) => node.attrs["data-ok-chart-crosshair"] !== undefined,
    );
    expect(layerAt).toBe(crosshairAt - 1);
    const band = find(render.layout.nodes, "data-ok-chart-filter-band")[0];
    const slot = render.layout.slots[2];
    expect(Number(band?.attrs["x"])).toBeCloseTo((slot?.pos ?? 0) - render.layout.band / 2, 1);
    // Horizontal bars get horizontal bands.
    const turned = bars({ crossfilter: "highlight", filter: [0], horizontal: true });
    const horizontal = find(turned.layout.nodes, "data-ok-chart-filter-band")[0];
    expect(horizontal?.attrs["x"]).toBe(String(turned.layout.plot.x));
  });

  it("highlight: slice halos, cell frames; none for radar and Sankey charts", () => {
    const donut = renderChart({
      ...base,
      type: "donut",
      categories: REGIONS,
      series: [{ name: "Returns", data: [1, 2, 3, 4] }],
      crossfilter: "highlight",
      filter: [1, 2],
    });
    expect(find(donut.layout.nodes, "data-ok-chart-filter-band").map((n) => n.tag)).toEqual([
      "path",
      "path",
    ]);
    const heatmap = renderChart({
      ...base,
      type: "heatmap",
      categories: ["A", "B"],
      series: [
        { name: "One", data: [1, 2] },
        { name: "Two", data: [3, 4] },
      ],
      crossfilter: "highlight",
      filter: [1],
    });
    const frames = find(heatmap.layout.nodes, "data-ok-chart-filter-band");
    expect(frames).toHaveLength(2);
    // Cells have no crosshair: the layer goes before the series group.
    const at = heatmap.layout.nodes.findIndex(
      (node) => node.attrs["data-ok-chart-filter-layer"] !== undefined,
    );
    expect(heatmap.layout.nodes[at + 1]?.attrs["data-ok-chart-series-group"]).toBe("");
    const radar = renderChart({
      ...base,
      type: "radar",
      categories: REGIONS,
      series: [{ name: "A", data: [1, 2, 3, 4] }],
      crossfilter: "highlight",
      filter: [1],
    });
    expect(find(radar.layout.nodes, "data-ok-chart-filter-band")).toEqual([]);
    expect(chartFilterNodes(radar.layout, [1])).toEqual([]);
    expect(chartFilterNodes(bars().layout, null)).toEqual([]);
  });

  it("writes the option", () => {
    expect(chartAttributes({ crossfilter: "filter" })).toMatchObject({
      "data-ok-crossfilter": "filter",
    });
    expect(chartAttributes({})).not.toHaveProperty("data-ok-crossfilter");
  });
});

describe("crossfilter registry", () => {
  it("tells the group, marks the source, and replaces filters", () => {
    const a = member("g");
    const b = member("g");
    const outsider = member("other");
    const plain = member("g", false);
    a.link.filtered([1, 2]);
    expect(a.told.at(-1)).toEqual({ categories: [1, 2], own: true });
    expect(b.told.at(-1)).toEqual({ categories: [1, 2], own: false });
    expect(outsider.told).toEqual([]);
    b.link.filtered([3]);
    expect(a.told.at(-1)).toEqual({ categories: [3], own: false });
    // A's own filter is gone already: emptying its selection changes nothing.
    a.link.filtered(null);
    expect(b.told.at(-1)).toEqual({ categories: [3], own: true });
    b.link.filtered(null);
    expect(a.told.at(-1)).toBeNull();
    // Members without crossfilter can't set filters.
    plain.link.filtered([1]);
    expect(a.told.at(-1)).toBeNull();
  });

  it("clears from any chart; the source clears its selection", () => {
    const a = member("g");
    const b = member("g");
    a.link.filtered([0]);
    b.link.clearFilter();
    expect(a.told.at(-1)).toBeNull();
    expect(b.told.at(-1)).toBeNull();
    expect(a.cleared()).toBe(1);
    // Nothing to clear.
    b.link.clearFilter();
    expect(a.cleared()).toBe(1);
  });

  it("gives late members the filter; a leaving source takes it along", () => {
    const a = member("g");
    a.link.filtered([2]);
    const late = member("g");
    expect(late.told).toEqual([{ categories: [2], own: false }]);
    a.link.unlink();
    expect(late.told.at(-1)).toBeNull();
    // Charts without a group never filter.
    const lonely = member(undefined);
    lonely.link.filtered([1]);
    lonely.link.clearFilter();
    expect(lonely.told).toEqual([]);
  });
});
