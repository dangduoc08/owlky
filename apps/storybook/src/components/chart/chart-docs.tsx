import { chartOptions } from "@owlky/core";
import chartApi from "@owlky/docs-content/api/chart.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Chart } from "@owlky/react";
import animationsGroup from "../../../../../packages/html/src/components/chart/examples/animations-group.html?raw";
import annotationsGroup from "../../../../../packages/html/src/components/chart/examples/annotations-group.html?raw";
import axisScalesGroup from "../../../../../packages/html/src/components/chart/examples/axis-scales-group.html?raw";
import beeswarmGroup from "../../../../../packages/html/src/components/chart/examples/beeswarm-group.html?raw";
import brushGroup from "../../../../../packages/html/src/components/chart/examples/brush-group.html?raw";
import colorBlindGroup from "../../../../../packages/html/src/components/chart/examples/color-blind-group.html?raw";
import columnDataLabelsGroup from "../../../../../packages/html/src/components/chart/examples/column-data-labels-group.html?raw";
import columnRangesGroup from "../../../../../packages/html/src/components/chart/examples/column-ranges-group.html?raw";
import columnSingle from "../../../../../packages/html/src/components/chart/examples/column-single-group.html?raw";
import crossfilterGroup from "../../../../../packages/html/src/components/chart/examples/crossfilter-group.html?raw";
import dataLabelsGroup from "../../../../../packages/html/src/components/chart/examples/data-labels-group.html?raw";
import dumbbellGroup from "../../../../../packages/html/src/components/chart/examples/dumbbell-group.html?raw";
import funnelGroup from "../../../../../packages/html/src/components/chart/examples/funnel-group.html?raw";
import gridGroup from "../../../../../packages/html/src/components/chart/examples/grid-group.html?raw";
import icicleGroup from "../../../../../packages/html/src/components/chart/examples/icicle-group.html?raw";
import legendGroup from "../../../../../packages/html/src/components/chart/examples/legend-group.html?raw";
import localizedGroup from "../../../../../packages/html/src/components/chart/examples/localized-group.html?raw";
import markerShapesGroup from "../../../../../packages/html/src/components/chart/examples/marker-shapes-group.html?raw";
import mixedGroup from "../../../../../packages/html/src/components/chart/examples/mixed-group.html?raw";
import multipleYAxesGroup from "../../../../../packages/html/src/components/chart/examples/multiple-y-axes-group.html?raw";
import selectionGroup from "../../../../../packages/html/src/components/chart/examples/selection-group.html?raw";
import sparklinesGroup from "../../../../../packages/html/src/components/chart/examples/sparklines-group.html?raw";
import stackTotalsGroup from "../../../../../packages/html/src/components/chart/examples/stack-totals-group.html?raw";
import streamgraphGroup from "../../../../../packages/html/src/components/chart/examples/streamgraph-group.html?raw";
import sunburstGroup from "../../../../../packages/html/src/components/chart/examples/sunburst-group.html?raw";
import synchronizedGroup from "../../../../../packages/html/src/components/chart/examples/synchronized-group.html?raw";
import timelineGroup from "../../../../../packages/html/src/components/chart/examples/timeline-group.html?raw";
import tooltipCustomGroup from "../../../../../packages/html/src/components/chart/examples/tooltip-custom-group.html?raw";
import treeGroup from "../../../../../packages/html/src/components/chart/examples/tree-group.html?raw";
import unitGroup from "../../../../../packages/html/src/components/chart/examples/unit-group.html?raw";
import violinGroup from "../../../../../packages/html/src/components/chart/examples/violin-group.html?raw";
import waffleGroup from "../../../../../packages/html/src/components/chart/examples/waffle-group.html?raw";
import waterfallGroup from "../../../../../packages/html/src/components/chart/examples/waterfall-group.html?raw";
import zoomGroup from "../../../../../packages/html/src/components/chart/examples/zoom-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SALES = [
  { name: "Online", data: [31, 40, 28, 51, 42, 69] },
  { name: "In store", data: [11, 32, 45, 32, 34, 52] },
];

/** Docs preview prices: 60 days of a smooth walk with volumes. */
const STOCK_DAYS = Array.from({ length: 60 }, (_, i) =>
  new Date(Date.UTC(2025, 0, 2 + i)).toISOString().slice(0, 10),
);
const STOCK_BARS = STOCK_DAYS.map((_, i) => {
  const open = Math.round((100 + 8 * Math.sin(i / 7) + 2 * Math.cos(i * 1.3)) * 100) / 100;
  const close = Math.round((open + 1.6 * Math.sin(i * 2.1)) * 100) / 100;
  return {
    y: [open, Math.max(open, close) + 0.8, Math.min(open, close) - 0.8, close],
    v: Math.round(1_000_000 + 400_000 * Math.sin(i * 0.9)),
  };
});

const GEO_PREVIEW_REGIONS = [
  { id: "Washington", name: "Washington", label: "WA", value: 7.71 },
  { id: "Montana", name: "Montana", label: "MT", value: 1.08 },
  { id: "Oregon", name: "Oregon", label: "OR", value: 4.24 },
  { id: "Idaho", name: "Idaho", label: "ID", value: 1.84 },
  { id: "California", name: "California", label: "CA", value: 39.54 },
  { id: "Nevada", name: "Nevada", label: "NV", value: 3.1 },
  { id: "Utah", name: "Utah", label: "UT", value: 3.27 },
];
const GEO_PREVIEW_CELLS = [
  { id: "Washington", col: 0, row: 0 },
  { id: "Montana", col: 1, row: 0 },
  { id: "Oregon", col: 0, row: 1 },
  { id: "Idaho", col: 1, row: 1 },
  { id: "California", col: 0, row: 2 },
  { id: "Nevada", col: 1, row: 2 },
  { id: "Utah", col: 2, row: 2 },
];

export const chartSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A chart shows values as lines, areas, columns, bars, points, slices, rings, a radar, box plots, cells, bubbles, funnels or slopes, at full size or as a sparkline. In HTML, you write the data as a table. The runtime reads the table and draws the chart as SVG next to it, with a legend and a tooltip. The table stays in the page, visually hidden, so screen readers can read every value. Without JavaScript, the table stays visible. In React, you pass the data as props, and the component renders the same chart and table.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<figure data-ok-chart data-ok-type="line" data-ok-x-type="category" data-ok-curve="smooth"
  data-ok-legend="top" data-ok-fill="gradient">
  <table data-ok-chart-data>
    <caption>Monthly sales</caption>
    <thead>
      <tr><th scope="col">Month</th><th scope="col" data-ok-color="primary-dark">Online</th><th scope="col" data-ok-color="warning">In store</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Jan</th><td>31</td><td>11</td></tr>
      <tr><th scope="row">Feb</th><td>40</td><td>32</td></tr>
      <!-- One row per month -->
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function MonthlySales() {
  return (
    <Chart
      label="Monthly sales"
      categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
      series={[
        { name: "Online", data: [31, 40, 28, 51, 42, 69] },
        { name: "In store", data: [11, 32, 45, 32, 34, 52] },
      ]}
    />
  );
}`,
  },
  {
    id: "types",
    title: "Choose a chart type",
    body: `Set \`type\` to choose how the values are drawn:

- **\`line\`:** values joined by a line. \`curve\` sets its shape: \`smooth\` (the default), \`straight\` or \`stepline\`. \`markerSize\` adds a dot on each value.
- **\`area\`:** a line with the area below it filled. \`fill\` sets a fading \`gradient\` (the default) or a \`solid\` tint.
- **\`bar\`:** columns. Add \`horizontal\` for bars that run left to right, which suits long category names. \`columnWidth\` and \`barHeight\` set their thickness as a percentage of a category.
- **\`scatter\`:** points placed by two numbers. The x axis is numeric.
- **\`pie\` and \`donut\`:** one slice per category, sized by its share of the total. See "Show parts of a whole".
- **\`radialBar\`:** one ring per category, filled to its value. With one category, it is a gauge. See "Show progress as rings and gauges".
- **\`radar\`:** one axis per category around a center, and one shape per series.
- **\`boxPlot\` and \`rangeArea\`:** the spread of values in each category. See "Show ranges and distributions".
- **\`heatmap\` and \`treemap\`:** values as shaded cells. See "Show values as cells".
- **\`bubble\`:** points placed by two numbers and sized by a third.
- **\`funnel\` and \`slope\`:** stages that narrow, or the change between a few categories. See "Show stages and changes".
- **Stock charts:** add \`indicators\`, panes and a \`navigator\` to a candlestick, line, area or column chart of dates. See "Show stock prices with indicators".
- **\`sankey\`:** flows between nodes, each as wide as its value. See "Show flows between stages".
- **\`waterfall\`:** how a start value changes step by step into an end value. See "Show changes step by step".
- **\`dumbbell\`:** two values per category, such as before and after, joined by a line. See "Compare two values per category".
- **\`tree\`:** a hierarchy of nodes joined by links, such as teams or a site map. See "Show a hierarchy as a tree".
- **\`sunburst\`:** a hierarchy as rings, each node an arc sized by its value. See "Show parts of a hierarchy as rings".
- **\`geo\`:** regions from GeoJSON or hex tiles, colored by value classes, with no map tiles. See "Draw a map without tiles".
- **\`icicle\`:** a hierarchy as bands, each node a cell sized by its value, such as a flame graph. See "Show parts of a hierarchy as bands".
- **\`streamgraph\`:** stacked bands around a moving baseline, for how a mix changes over time. See "Show a changing mix over time".
- **\`violin\`:** the distribution of observations in each category as a mirrored density curve. See "Compare distributions".
- **\`beeswarm\`:** each observation as a dot in its series' lane, along the value axis. See "Show every observation".
- **\`waffle\`:** a grid of cells where each category fills a share. See "Show parts of a whole as cells".
- **\`unit\`:** each value as a number of marks, in blobs, stacked columns or seats on an arc. See "Show quantities as marks".

To mix types in line, area, bar, scatter, box plot, bubble and range area charts, give a series its own \`type\`. In HTML, set \`data-ok-type\` on the column header of the series.`,
    html: `${snippetElement(mixedGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

export function ChartTypes() {
  return (
    <Chart
      label="Points per month"
      type="bar"
      yTitle="Points"
      categories={["Jan", "Feb", "Mar"]}
      series={[
        { name: "Team A", type: "bar", data: [22, 12, 21] },
        { name: "Team B", type: "line", data: [31, 26, 35] },
      ]}
    />
  );
}`,
  },
  {
    id: "data",
    title: "Write the data",
    body: `Each series is a column of the table and each category is a row. A row header holds the category, and an empty cell is a gap in the line.

- **Categories:** text labels, such as months. In React, pass them in \`categories\`.
- **Dates:** set \`xType\` to \`datetime\` and give each row header an ISO 8601 date in \`data-ok-value\`, such as \`2012-01-01\`. In React, pass dates or ISO strings in \`categories\`. Axis labels then mark new years and months.
- **Numbers:** scatter charts use \`xType="numeric"\`. Each row header is an x value, and each cell holds a y value. In React, pass \`[x, y]\` pairs.

Cells may show formatted text, such as "12%". Put the raw number in \`data-ok-value\` when the text isn't a plain number.`,
    html: `<!-- Dates: the raw date in data-ok-value, readable text in the cell -->
<tr><th scope="row" data-ok-value="2012-01-01">Jan 2012</th><td data-ok-value="-12.5">-12.5%</td></tr>`,
    react: `import { Chart } from "@owlky/react";

export function ChartData() {
  return (
    <Chart
      label="Cash flow"
      type="bar"
      xType="datetime"
      valueSuffix="%"
      categories={["2012-01-01", "2012-02-01", "2012-03-01"]}
      series={[{ name: "Cash flow", data: [-12.5, 3.2, 7.1] }]}
    />
  );
}`,
  },
  {
    id: "colors",
    title: "Set colors",
    body: "Series use the theme palette in order: primary dark, warning, info, error, success and then darker shades. To pick colors, use `colors` in React or `data-ok-color` on each column header in HTML. A color is a palette name, such as `info`, or a palette name and a shade, such as `primary-dark`. To color a single value, such as negative columns, give the point a `color` (React) or the cell a `data-ok-color` (HTML). Colors follow the theme and the preset, in light and dark mode.",
    html: `<td data-ok-color="error">-41.2</td>`,
    react: `import { Chart } from "@owlky/react";

export function CashFlow() {
  return (
    <Chart
      label="Cash flow"
      type="bar"
      categories={["Q1", "Q2"]}
      series={[{ name: "Cash flow", data: [{ y: 19.8, color: "success" }, { y: -41.2, color: "error" }] }]}
    />
  );
}`,
  },
  {
    id: "circular",
    title: "Show parts of a whole",
    body: `Pie and donut charts draw the first series, one slice per category. The legend lists the categories, and selecting one hides its slice. The other slices then share the whole circle.

- **Data labels:** set \`dataLabels\` to print the percentage of each slice on it. Slices too narrow for the text show none.
- **Total:** set \`totalLabel\` on a donut to show the total in its hole, such as "Total". The total is the sum of the visible slices, unless you set \`total\`.
- **Colors:** slices use the palette in order, or \`colors\`. In HTML, each cell carries its slice color in \`data-ok-color\`.`,
    html: `<figure data-ok-chart data-ok-type="donut" data-ok-x-type="category" data-ok-curve="smooth"
  data-ok-legend="top" data-ok-fill="gradient" data-ok-height="240" data-ok-total-label="Total">
  <table data-ok-chart-data>
    <caption>Visits by device</caption>
    <thead>
      <tr><th scope="col">Device</th><th scope="col">Visits</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Desktop</th><td data-ok-color="primary-dark">44</td></tr>
      <tr><th scope="row">Mobile</th><td data-ok-color="warning">55</td></tr>
      <tr><th scope="row">Tablet</th><td data-ok-color="info-dark">13</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function VisitsByDevice() {
  return (
    <Chart
      label="Visits by device"
      type="donut"
      height={240}
      totalLabel="Total"
      xLabel="Device"
      colors={["primary-dark", "warning", "info-dark"]}
      categories={["Desktop", "Mobile", "Tablet"]}
      series={[{ name: "Visits", data: [44, 55, 13] }]}
    />
  );
}`,
  },
  {
    id: "radial",
    title: "Show progress as rings and gauges",
    body: `Radial bar charts draw one ring per category on a grey track. Values are percentages: a ring is full at 100, or at \`yMax\` when you set it. Values print with a percent sign unless you set \`valueSuffix\`.

- **Gauges:** with one category, the center shows the value and the category name. Set \`startAngle\` and \`endAngle\` in degrees, clockwise from 12 o'clock. For example, -90 and 90 draw a semicircle.
- **Dashes:** \`dashArray\` splits the ring into dashes of that length in pixels. \`trackWidth\` sets the thickness of the track as a percentage of the ring (50 by default).
- **Total:** with several rings, \`totalLabel\` shows a total in the center. It is the average of the rings, unless you set \`total\`.
- **Fill:** rings fade from a lighter tone of their color. Set \`fill\` to \`solid\` for a single color.`,
    html: `<figure data-ok-chart data-ok-type="radialBar" data-ok-x-type="category" data-ok-curve="smooth"
  data-ok-legend="top" data-ok-fill="gradient" data-ok-height="260"
  data-ok-start-angle="-135" data-ok-end-angle="135" data-ok-dash-array="4" data-ok-track-width="100">
  <table data-ok-chart-data>
    <caption>Median ratio</caption>
    <thead>
      <tr><th scope="col">Category</th><th scope="col">Ratio</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Median ratio</th><td data-ok-value="75" data-ok-color="error">75%</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function MedianRatio() {
  return (
    <Chart
      label="Median ratio"
      type="radialBar"
      height={260}
      startAngle={-135}
      endAngle={135}
      dashArray={4}
      trackWidth={100}
      colors={["error"]}
      categories={["Median ratio"]}
      series={[{ name: "Ratio", data: [75] }]}
    />
  );
}`,
  },
  {
    id: "ranges",
    title: "Show ranges and distributions",
    body: `Some charts need several values for each point. In React, pass them as an array in \`y\`. In HTML, give each value its own column under a second header row. The series header spans its columns, and each value header names its part in \`data-ok-part\`.

- **Box plots:** five values per category: the minimum, the first quartile, the median, the third quartile and the maximum (\`min\`, \`q1\`, \`median\`, \`q3\`, \`max\`). \`boxUpperColor\` and \`boxLowerColor\` color the boxes above and below the median.
- **Range areas:** a low and a high value (\`low\`, \`high\`). Add a \`line\` series for an average.
- **Bubbles:** a value and a size (\`y\`, \`z\`). In React, pass \`[x, y, size]\`. The area of a bubble follows its size.

The tooltip lists every value, and screen readers read each cell with its series and part, such as "Scores, Q1".`,
    html: `<figure data-ok-chart data-ok-type="boxPlot" data-ok-x-type="category" data-ok-curve="smooth"
  data-ok-legend="top" data-ok-fill="gradient" data-ok-box-upper-color="info" data-ok-box-lower-color="error">
  <table data-ok-chart-data>
    <caption>Build times</caption>
    <thead>
      <tr><th scope="col" rowspan="2">Week</th><th scope="colgroup" colspan="5">Minutes</th></tr>
      <tr>
        <th scope="col" data-ok-part="min">Minimum</th><th scope="col" data-ok-part="q1">Q1</th>
        <th scope="col" data-ok-part="median">Median</th><th scope="col" data-ok-part="q3">Q3</th>
        <th scope="col" data-ok-part="max">Maximum</th>
      </tr>
    </thead>
    <tbody>
      <tr><th scope="row">Week 1</th><td>4</td><td>6</td><td>7</td><td>9</td><td>14</td></tr>
      <!-- One row per week -->
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function BuildTimes() {
  return (
    <Chart
      label="Build times"
      type="boxPlot"
      boxUpperColor="info"
      boxLowerColor="error"
      categories={["Week 1", "Week 2", "Week 3"]}
      series={[
        {
          name: "Minutes",
          data: [{ y: [4, 6, 7, 9, 14] }, { y: [3, 5, 6, 8, 11] }, { y: [5, 7, 9, 10, 16] }],
        },
      ]}
    />
  );
}`,
  },
  {
    id: "cells",
    title: "Show values as cells",
    body: `Heatmaps and treemaps draw each value as a cell in the color of its series. A larger value gets a stronger shade, so the colors still follow the theme. Selecting a cell, or moving to it with the arrow keys, shows its value.

- **Heatmaps:** one row per series and one column per category, such as metrics over time. The first series is the bottom row.
- **Treemaps:** one group per series, with one rectangle per category sized by its value. Each series lists its own categories: in React, give each point an \`x\` name. In HTML, write one row per category and leave the cells of the other series empty. Names print in the cells that fit them.`,
    html: `<figure data-ok-chart data-ok-type="treemap" data-ok-x-type="category" data-ok-curve="smooth"
  data-ok-legend="top" data-ok-fill="gradient">
  <table data-ok-chart-data>
    <caption>Visits by page and device</caption>
    <thead>
      <tr><th scope="col">Page</th><th scope="col">Desktops</th><th scope="col">Mobile</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Home</th><td>60</td><td></td></tr>
      <tr><th scope="row">Docs</th><td></td><td>51</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function ChartCells() {
  return (
    <Chart
      label="Visits by page and device"
      type="treemap"
      series={[
        { name: "Desktops", data: [{ x: "Home", y: 60 }, { x: "Pricing", y: 41 }] },
        { name: "Mobile", data: [{ x: "Docs", y: 51 }, { x: "Blog", y: 30 }] },
      ]}
    />
  );
}`,
  },
  {
    id: "stages",
    title: "Show stages and changes",
    body: `- **Funnels:** \`funnel\` draws the first series as bars centered on one axis, each as long as its share of the largest value, such as the stages of a sign-up flow. For a pyramid, order the values from the smallest to the largest. \`barHeight\` sets the thickness (80% by default).
- **Slopes:** \`slope\` joins each series' values across a few categories, usually two, such as before and after. The values print beside the first and last points, and the scale fits the data.`,
    html: `${snippetElement(funnelGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const steps = ["Visited", "Signed up", "Activated", "Paid"];

export function ChartStages() {
  return (
    <Chart label="Sign-ups" type="funnel" dataLabels categories={steps} series={[{ name: "People", data: [1380, 990, 548, 200] }]} />
  );
}`,
  },
  {
    id: "sparklines",
    title: "Fit charts in cards and table cells",
    body: "Set `sparkline` (`data-ok-sparkline` in HTML) to draw a chart without axes, grid or legend, such as a trend in a dashboard card or a table cell. A sparkline fills its container: give the container a height, or set `height` for the least height (40px by default). The tooltip, the keyboard and the data table still work.",
    html: `<div class="card-trend">
${snippetElement(sparklinesGroup, "data-ok-chart ")
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")}
</div>`,
    react: `import { Chart } from "@owlky/react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const visits = [{ name: "Visits", data: [32, 41, 35, 51, 49, 62, 69] }];

export function ChartSparklines() {
  return (
    <Chart label="Visits this week" type="area" sparkline height={48} categories={days} series={visits} />
  );
}`,
  },
  {
    id: "live",
    title: "Update data live",
    body: `Charts redraw only what changed, so they can follow live data, such as requests per second.

- **React:** pass new \`series\` and \`categories\` arrays. To keep a sliding window, drop the oldest points yourself.
- **HTML:** call \`updateSeries(series, categories)\` to replace the data, or \`appendData([{ data: [value] }], { categories: [label], limit })\` to add points to each series in order. \`limit\` keeps the last points only. The runtime rewrites the data table to match, so screen readers read the same values.

Updates keep the hidden series and the category under the pointer or the keyboard, so the tooltip shows the new value.`,
    html: `<script type="module">
  import { getRuntime } from "@owlky/html";

  const chart = getRuntime().get(document.querySelector("#requests"), "chart");
  // Add the newest value and keep the last 12.
  function onData(time, requests) {
    chart.appendData([{ data: [requests] }], { categories: [time], limit: 12 });
  }
</script>`,
    react: `import { Chart } from "@owlky/react";
import { useEffect, useState } from "react";

interface Point {
  time: string;
  value: number;
}

export function Requests({
  source,
}: {
  source: { subscribe(listener: (point: Point) => void): () => void };
}) {
  const [points, setPoints] = useState<Point[]>([]);
  useEffect(
    () => source.subscribe((point) => setPoints((current) => [...current, point].slice(-12))),
    [source],
  );
  return (
    <Chart
      label="Requests per second"
      type="area"
      categories={points.map((point) => point.time)}
      series={[{ name: "Requests", data: points.map((point) => point.value) }]}
    />
  );
}`,
  },
  {
    id: "zoom",
    title: "Zoom, pan and export",
    body: `Set \`zoom\` (\`data-ok-zoom\` in HTML) to let people zoom into the x axis of line, area, column, scatter, candlestick and other charts drawn from left to right. The value axis keeps its scale, so values stay comparable while you move.

- **Mouse:** drag across the plot to zoom to that range. Hold Ctrl (or ⌘ on a Mac) and use the wheel to zoom around the pointer. A plain wheel still scrolls the page.
- **Touch:** pinch with two fingers. On a zoomed chart, drag with one finger to pan. A tap still shows the tooltip.
- **Keyboard:** \`+\` and \`-\` zoom, Shift with the Left or Right arrow pans, \`0\` resets. Escape hides the tooltip first, then resets the zoom.

Set \`toolbar\` (\`data-ok-toolbar\`) to add buttons for zooming in and out, resetting, panning with the mouse, and downloading the chart as SVG, PNG or CSV. Downloads start only when someone selects a button or presses a key, and a failure is announced to screen readers. In React, \`zoomRange\` and \`onZoomRangeChange(range, reason)\` control the zoom. A zoom that reaches the newest point keeps following new points, so a live dashboard stays on its latest data.`,
    html: `${snippetElement(zoomGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const days = ["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06"];
const users = [{ name: "Users", data: [1200, 1350, 1280, 1490, 1610, 1580] }];

export function ChartZoom() {
  return (
    <Chart label="Daily active users" type="area" xType="datetime" zoom toolbar categories={days} series={users} />
  );
}`,
  },
  {
    id: "sync",
    title: "Synchronize charts",
    body: "Give charts the same `group` (`data-ok-group` in HTML) to synchronize them, such as requests, errors and latency of one service. Moving the pointer or the keyboard over one chart shows the same category in all of them, and zooming one zooms the others. Synchronized charts should share their categories.",
    html: `${snippetElement(synchronizedGroup, "data-ok-chart ")}
${snippetElement(synchronizedGroup, "data-ok-chart ", 1)}`,
    react: `import { Chart } from "@owlky/react";

const minutes = ["10:00", "10:01", "10:02", "10:03", "10:04", "10:05"];
const requests = [{ name: "Requests", data: [120, 140, 135, 160, 150, 170] }];
const errors = [{ name: "Errors", data: [0, 1, 0, 3, 2, 1] }];

export function ChartSync() {
  return (
    <>
      <Chart label="Requests" group="service" zoom categories={minutes} series={requests} />
      <Chart label="Errors" group="service" type="bar" categories={minutes} series={errors} />
    </>
  );
}`,
  },
  {
    id: "brush",
    title: "Brush a chart",
    body: "A brush chart is a small overview that zooms another chart. Give the main chart an `id`, then set `brushTarget` (`data-ok-brush-target` in HTML) on the overview to that id. Drag across the overview to select a range, drag the selection to move it, or drag its handles to resize it. The keys of a zoomable chart work on the overview too. The selection follows the main chart when it zooms by itself.",
    html: `${snippetElement(brushGroup, "data-ok-chart ")}
${snippetElement(brushGroup, "data-ok-chart ", 1)}`,
    react: `import { Chart } from "@owlky/react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const builds = [{ name: "Builds", data: [12, 15, 9, 20, 18, 7, 5] }];

export function ChartBrush() {
  return (
    <>
      <Chart id="builds" label="Builds per day" type="area" categories={days} series={builds} />
      <Chart label="Builds, overview" type="bar" brushTarget="builds" height={120} categories={days} series={builds} />
    </>
  );
}`,
  },
  {
    id: "crossfilter",
    title: "Filter linked charts",
    body: `Charts of one \`group\` can filter each other: selecting a column, a bar or a slice in one chart filters the others, such as showing the revenue of the regions whose orders you selected. Set \`crossfilter\` (\`data-ok-crossfilter\` in HTML) on every chart that takes part. Its value says how the chart shows the filter that another chart sets:

- **\`filter\`:** only the filtered categories keep their values, and the value axis fits them. Pie and donut charts hide the other slices.
- **\`highlight\`:** every value stays, and a tint marks the filtered categories.

A click, Enter or Space selects values as described in "Select data points", and the selected categories become the group's filter. Set \`allowMultipleDataPointsSelection\` to filter by several categories. A brush chart with \`crossfilter\` filters its group by the categories its selection covers. The charts of a group match categories by position, so give them the same categories in the same order.

Every chart that takes part shows a **Clear filter** button under the plot while the group is filtered. It clears the filter and the selection that set it. The chart you act on announces the change to screen readers, such as "Filter: North, West". Rename the texts with \`localeText\`: \`clearFilter\`, \`filter\` and \`filterCleared\`.

- **React:** \`onFilterChange(categories, own)\` is called with the filtered category indexes (\`null\` when cleared) and whether this chart set the filter.
- **HTML:** \`ok:chart:filter\` fires with \`detail.categories\` and \`detail.own\`. The instance has \`filter\` and \`clearFilter()\`.`,
    html: `${snippetElement(crossfilterGroup, "data-ok-chart ")}
${snippetElement(crossfilterGroup, "data-ok-chart ", 1)}
<script>
  // Each change of the group's filter, as this chart sees it.
  document.querySelector("[data-ok-chart]").addEventListener("ok:chart:filter", (event) => {
    console.log(event.detail.categories, event.detail.own);
  });
</script>`,
    react: `import { Chart } from "@owlky/react";
import { useState } from "react";

const regions = ["North", "South", "East", "West", "Central"];
const orders = [{ name: "Orders", data: [420, 310, 280, 390, 150] }];
const revenue = [{ name: "Revenue", data: [96, 71, 64, 88, 35] }];

export function RegionsCrossfilter() {
  const [filtered, setFiltered] = useState("every region");
  return (
    <>
      <Chart
        label="Orders by region"
        type="bar"
        group="regions"
        crossfilter="highlight"
        allowMultipleDataPointsSelection
        categories={regions}
        series={orders}
        onFilterChange={(categories) =>
          setFiltered(categories ? categories.map((i) => regions[i]).join(", ") : "every region")
        }
      />
      <Chart
        label="Revenue by region"
        type="bar"
        group="regions"
        crossfilter="filter"
        categories={regions}
        series={revenue}
      />
      <p>Showing: {filtered}</p>
    </>
  );
}`,
  },
  {
    id: "annotations",
    title: "Annotate charts",
    body: `Annotations mark a moment, a range, a threshold or a point, such as a deploy or an incident. In React, pass \`annotations\`. In HTML, list them after the data table in \`ul[data-ok-chart-annotations]\`, one \`li\` each, with its label as text.

- **\`x\`:** a vertical line at a category, a date or a number, or a band up to \`x2\`.
- **\`y\`:** a horizontal line at a value, or a band up to \`y2\`.
- **\`point\`:** a marker at \`x\` and \`y\`.

Each annotation takes a \`color\` (\`info\` by default). The list stays readable by screen readers once the chart is drawn.`,
    html: `${snippetElement(annotationsGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const minutes = ["10:00", "10:01", "10:02", "10:03", "10:04", "10:05"];
const errors = [{ name: "Errors", data: [0, 1, 0, 3, 2, 1] }];

export function ChartAnnotations() {
  return (
    <Chart
      label="Error rate"
      categories={minutes}
      series={errors}
      annotations={[
        { axis: "x", x: "10:04", label: "Deploy", color: "warning" },
        { axis: "y", y: 2, label: "Threshold", color: "error" },
      ]}
    />
  );
}`,
  },
  {
    id: "finance",
    title: "Show prices, ranges and plans",
    body: `- **Candlesticks:** \`candlestick\` takes four values per point in \`y\`: open, high, low and close. Rising candles use \`candleUpColor\` (\`success\` by default), falling ones \`candleDownColor\` (\`error\`). Add a \`line\` series for an average.
- **Range bars:** \`rangeBar\` takes a start and an end value per point, such as the fastest and slowest response of a service. Set \`horizontal\` to draw them from left to right.
- **Timelines:** \`timeline\` draws tasks from their start date to their end date, one row per task. Give each point a text \`x\` (the task) and two dates in \`y\`. The axis shows minutes, hours, days, months or years, depending on the span.

In the data table, each value gets its own column under a second header row, such as Open, High, Low and Close.`,
    html: `${snippetElement(timelineGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

export function ChartFinance() {
  return (
    <Chart
      label="Release plan"
      type="timeline"
      series={[{ name: "Release", data: [{ x: "Design", y: ["2026-03-02", "2026-03-13"] }] }]}
    />
  );
}`,
  },
  {
    id: "waterfall",
    title: "Show changes step by step",
    body: `A waterfall chart shows how a start value becomes an end value through gains and losses, such as a cash flow. Set \`type\` to \`waterfall\` and give each step its change: a positive number raises the running total, a negative number lowers it. Each bar floats from the total before the step to the total after it, and a dashed connector joins it to the next bar.

- **Totals:** a point \`{ isTotal: true }\` draws the running total as a bar from zero, such as a closing balance. \`{ isSubtotal: true }\` does the same in the middle of the chart. In HTML, the cell carries \`data-ok-sum="total"\` or \`data-ok-sum="subtotal"\` and shows the total as its text.
- **Colors:** rising steps use \`waterfallPositiveColor\` (\`success\` by default) and falling steps \`waterfallNegativeColor\` (\`error\`). Totals use \`waterfallTotalColor\` (the series color) and subtotals \`waterfallSubtotalColor\` (the total color). A point's own \`color\` wins.
- **Connectors:** \`hideConnectors\` (\`data-ok-hide-connectors\`) removes the dashed lines.
- **Direction:** \`horizontal\` draws the bars from left to right.

The tooltip and the data labels show each change with its sign, such as +85, so the direction doesn't rely on color. The tooltip also shows the running total after the step.`,
    html: `${snippetElement(waterfallGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const items = ["Opening", "Sales", "Services", "Salaries", "Rent", "First half", "Taxes", "Closing"];
const cash = [
  {
    name: "Cash",
    data: [120, 260, 85, -190, -45, { isSubtotal: true }, -60, { isTotal: true }],
  },
];

export function CashFlowWaterfall() {
  return (
    <Chart
      label="Cash flow in 2025 (thousands of dollars)"
      type="waterfall"
      dataLabels
      categories={items}
      series={cash}
    />
  );
}`,
  },
  {
    id: "dumbbell",
    title: "Compare two values per category",
    body: `A dumbbell chart draws two values per category as two markers joined by a line, such as a page's load time before and after an update. Set \`type\` to \`dumbbell\` and give each point a start and an end value in \`y\`, such as \`{ y: [3.2, 1.8] }\`. The order matters: the start is a ring and the end is a filled disc, so the direction of the change doesn't rely on color.

- **Colors:** \`dumbbellColors\` sets the start and end colors of each series, such as \`[["warning-dark", "info-dark"]]\`. In HTML, write the pairs in \`data-ok-dumbbell-colors\`, separated by semicolons. Without it, both ends take the series color.
- **Size:** \`markerSize\` sets the radius of the markers in pixels (6 by default).
- **Direction:** \`horizontal\` draws the dumbbells from left to right.
- **Names:** the table and the tooltip call the values Start and End. Rename them with \`localeText\`, such as \`{ start: "Before", end: "After" }\`. In HTML, the text of the part headers in the table names them.

The value axis fits the data, with some room on both sides for the markers and their data labels.`,
    html: `${snippetElement(dumbbellGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const pages = ["Home", "Search", "Product", "Cart", "Checkout"];
const loadTimes = [
  {
    name: "Load time",
    data: [
      { y: [3.2, 1.8] },
      { y: [2.6, 1.9] },
      { y: [4.1, 2.2] },
      { y: [1.9, 2.3] },
      { y: [3.6, 2.4] },
    ],
  },
];

export function PageLoadDumbbell() {
  return (
    <Chart
      label="Median page load in seconds, before and after the update"
      type="dumbbell"
      dataLabels
      xLabel="Page"
      localeText={{ start: "Before", end: "After" }}
      categories={pages}
      series={loadTimes}
    />
  );
}`,
  },
  {
    id: "tree",
    title: "Show a hierarchy as a tree",
    body: `A tree chart draws a hierarchy, such as teams and their members or the sections of a website, as nodes joined by links. Set \`type\` to \`tree\` and describe the nodes instead of series:

- **React:** pass \`hierarchy\`, a node or a list of root nodes. Each node is \`{ name, value, color, children }\`, and every field is optional. A node's \`id\` defaults to its name. Repeated names get a number, such as \`Other-2\`.
- **HTML:** write one table row per node, in order, with each parent before its children. The node's name is the row header, then the parent's name and an optional value. Mark the column headers with \`data-ok-part="name"\`, \`"parent"\` and \`"y"\`. Leave the parent cell empty for a root. When an id differs from the name, put the id in \`data-ok-value\` on the node's cell and on the parent cells that point to it. Put a branch color in \`data-ok-color\` on the node's cell.

A parent's value is the sum of its children. Nodes take their branch color: the children of the root (or each root, when there are several) take \`colors\` in order, then the chart palette. A node's own \`color\` applies to its whole subtree.

- **\`direction\`:** where the root sits: \`top\` (the default), \`bottom\`, \`left\` or \`right\`, or \`radial\` for a root in the center and one ring per level.
- **\`layoutType\`:** \`tree\` (the default) packs each level as closely as the subtrees allow. \`cluster\` draws a dendrogram, with every leaf on the last level.
- **\`edgeStyle\`:** links with right angles (\`orthogonal\`, the default), \`curved\` or \`straight\`.
- **\`markerSize\`:** the radius of the nodes in pixels (5 by default).
- **\`dataLabels\`:** adds each node's value after its name.
- **\`enableExpandCollapse\`:** a click, Enter or Space on a node with children hides or shows them. A collapsed node is hollow. In React, read and set the collapsed ids with \`collapsedNodes\`, \`defaultCollapsedNodes\` and \`onCollapsedNodesChange\`. In HTML, they are in \`data-ok-collapsed-nodes\`, separated by semicolons.

Point at a node, or move to it with the arrow keys, to highlight its path from the root. The tooltip shows the path, the value, the level and the number of children. Names that don't fit are shortened with an ellipsis, or left out when nodes are close together. The tooltip and the data table keep the whole name.`,
    html: `${snippetElement(treeGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const teams = {
  name: "Product",
  children: [
    {
      name: "Web",
      children: [
        { name: "Checkout", value: 6 },
        { name: "Search", value: 4 },
        { name: "Accounts", value: 3 },
      ],
    },
    {
      name: "Mobile",
      children: [
        { name: "iOS", value: 5 },
        { name: "Android", value: 5 },
      ],
    },
    {
      name: "Platform",
      children: [
        { name: "Payments", value: 4 },
        { name: "Data", value: 7 },
      ],
    },
  ],
};

export function ProductTeams() {
  return (
    <Chart
      label="Product teams and their engineers"
      type="tree"
      enableExpandCollapse
      dataLabels
      height={360}
      hierarchy={teams}
    />
  );
}`,
  },
  {
    id: "sunburst",
    title: "Show parts of a hierarchy as rings",
    body: `A sunburst chart shows how a total splits into parts and their own parts, such as cloud spend by service. Each level is a ring, and each node is an arc of its parent, sized by its value. Set \`type\` to \`sunburst\` and describe the nodes as for a tree chart: \`hierarchy\` in React, or one table row per node with its parent in HTML. See "Show a hierarchy as a tree". The first ring holds the roots, and each root's branch keeps the root's color.

- **\`innerSize\`:** the hole in the center, in percent of the radius (15 by default). Set it to \`0\` for a solid chart.
- **\`startAngle\` and \`endAngle\`:** the part of the circle to fill, such as \`-90\` and \`90\` for a half circle.
- **\`leaf\`:** branches that end before the deepest level \`extend\` to the edge (the default) or \`stop\` at their ring.
- **\`spacing\`:** the gap between arcs in pixels (1 by default).
- **\`tint\`:** how much paler each ring is than the one its color starts at, from 0 to 1 (0.14 by default).
- **\`dataLabels\`:** adds each node's value after its name.

Select an arc, or press Enter or Space on it, to zoom into its branch: it fills the center and its children fill the rings. Select the center, press Escape or select **Back** above the chart to zoom out one level. The path of the branch shows next to **Back**, and screen readers announce it. Set \`disableZoomOnClick\` to keep the chart still. In React, read and set the branch with \`drillNode\`, \`defaultDrillNode\` and \`onDrillNodeChange\`. In HTML, the branch's id is in \`data-ok-drill-node\`.

Labels follow the radius or the ring, whichever leaves more room, and are left out on arcs that are too small. The tooltip and the data table keep every name and value.`,
    html: `${snippetElement(sunburstGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const spend = [
  {
    name: "Compute",
    children: [
      { name: "Virtual machines", value: 42 },
      { name: "Containers", value: 28 },
      { name: "Functions", value: 9 },
    ],
  },
  {
    name: "Storage",
    children: [
      { name: "Objects", value: 21 },
      { name: "Disks", value: 14 },
      {
        name: "Backups",
        children: [
          { name: "Daily", value: 5 },
          { name: "Archive", value: 3 },
        ],
      },
    ],
  },
  {
    name: "Network",
    children: [
      { name: "Transfer", value: 12 },
      { name: "CDN", value: 7 },
    ],
  },
  { name: "Databases", value: 24 },
];

export function CloudSpend() {
  return (
    <Chart
      label="Cloud spend by service, thousands of dollars per month"
      type="sunburst"
      valuePrefix="$"
      valueSuffix="k"
      height={400}
      hierarchy={spend}
    />
  );
}`,
  },
  {
    id: "geo",
    title: "Draw a map without tiles",
    body: `A geo chart draws regions as SVG from your GeoJSON: no tile service, no WebGL and no extra download, and the chart stays a themed picture with the legend, tooltip, keyboard and data table of every other chart. Use the Map component instead when people need to pan and zoom, or to see streets. Set \`type\` to \`geo\`.

- **\`geometry\`:** the shapes as a GeoJSON \`FeatureCollection\`, one feature or a list. In HTML, put the JSON in a \`<script type="application/json">\` element and set \`data-ok-geometry\` to its id, or pass it to \`setGeometry()\` on the chart's instance.
- **\`regions\`:** the data, one object per region with \`id\`, \`name\` and \`value\`. Set \`joinBy\` to the feature property that holds the id. In HTML, the regions are the rows of the chart's table.
- **\`projection\`:** \`equalEarth\` (the default, which keeps areas comparable), \`mercator\` or \`equirectangular\`. The geometry must be split at ±180°.
- **\`sphere\` and \`graticule\`:** draw the outline of the globe and lines every 30 degrees. With \`sphere\` the whole globe fits the chart, not only your regions.
- **\`scaleMethod\`, \`scaleClasses\` and \`scaleThresholds\`:** sort the values into classes as \`mapScale\` does: \`quantile\` (the default), \`equalInterval\`, \`jenks\` or \`threshold\`. \`colors\` takes one color, used in its five shades, or your own ramp.

The legend lists the classes with their ranges as text, so values never depend on color alone. Select a class to mute its regions. Press the arrow keys to move between regions and hear their name and value, and press Enter to select one. A region without a value says "No data". Text and table labels come from \`localeText\`, for example \`localeText={{ y: "Population", noData: "No data" }}\`.`,
    html: `<script type="application/json" id="shapes">
  {"type":"FeatureCollection","features":[
    {"type":"Feature","properties":{"name":"Nevada"},"geometry":{"type":"Polygon","coordinates":[[[-120,35],[-114,35],[-114,42],[-120,42],[-120,35]]]}},
    {"type":"Feature","properties":{"name":"Utah"},"geometry":{"type":"Polygon","coordinates":[[[-114,37],[-109,37],[-109,42],[-114,42],[-114,37]]]}}
  ]}
</script>
<figure data-ok-chart data-ok-type="geo" data-ok-join-by="name" data-ok-geometry="shapes" data-ok-height="300">
  <table data-ok-chart-data>
    <caption>Population, millions</caption>
    <thead>
      <tr><th scope="col" data-ok-part="name">State</th><th scope="col" data-ok-part="y">Population</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Nevada</th><td data-ok-value="3.1">3.1</td></tr>
      <tr><th scope="row">Utah</th><td data-ok-value="3.27">3.27</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

const shapes = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Nevada" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-120, 35], [-114, 35], [-114, 42], [-120, 42], [-120, 35]]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Utah" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-114, 37], [-109, 37], [-109, 42], [-114, 42], [-114, 37]]],
      },
    },
  ],
};
const regions = [
  { id: "Nevada", name: "Nevada", value: 3.1 },
  { id: "Utah", name: "Utah", value: 3.27 },
];

export function PopulationMap() {
  return (
    <Chart
      label="Population, millions"
      type="geo"
      geometry={shapes}
      regions={regions}
      joinBy="name"
      height={300}
    />
  );
}`,
  },
  {
    id: "hex-tiles",
    title: "Show regions as equal hex tiles",
    body: `A hex tile map gives every region the same size, so small regions with large values stay visible. Set \`geoLayout\` to \`hex\`. With \`hexCells\`, one object per region with \`id\`, \`col\` and \`row\` in an offset grid where odd rows sit half a tile to the right, the map needs no geometry at all. In HTML, write the position on the table's row header as \`data-ok-cell="col,row"\`. Without cells, the chart places a tile for each region near its position in the geometry. Set \`dataLabels\` to show each region's short \`label\`.`,
    html: `<figure data-ok-chart data-ok-type="geo" data-ok-geo-layout="hex" data-ok-data-labels data-ok-height="240">
  <table data-ok-chart-data>
    <caption>Population, millions</caption>
    <thead>
      <tr><th scope="col" data-ok-part="name">State</th><th scope="col" data-ok-part="y">Population</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row" data-ok-cell="0,0" data-ok-label="WA">Washington</th><td data-ok-value="7.71">7.71</td></tr>
      <tr><th scope="row" data-ok-cell="1,0" data-ok-label="ID">Idaho</th><td data-ok-value="1.84">1.84</td></tr>
      <tr><th scope="row" data-ok-cell="0,1" data-ok-label="OR">Oregon</th><td data-ok-value="4.24">4.24</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function HexMap() {
  return (
    <Chart
      label="Population, millions"
      type="geo"
      geoLayout="hex"
      dataLabels
      height={240}
      regions={[
        { id: "Washington", name: "Washington", label: "WA", value: 7.71 },
        { id: "Idaho", name: "Idaho", label: "ID", value: 1.84 },
        { id: "Oregon", name: "Oregon", label: "OR", value: 4.24 },
      ]}
      hexCells={[
        { id: "Washington", col: 0, row: 0 },
        { id: "Idaho", col: 1, row: 0 },
        { id: "Oregon", col: 0, row: 1 },
      ]}
    />
  );
}`,
  },
  {
    id: "icicle",
    title: "Show parts of a hierarchy as bands",
    body: `An icicle chart shows the same hierarchy as a sunburst, in bands: one band per level, and each node a cell as long as its share of its parent. Long names and deep trees read better in bands than in rings, and cells of one level are easy to compare by length. Set \`type\` to \`icicle\` and describe the nodes as for a tree chart. See "Show a hierarchy as a tree".

- **\`direction\`:** where the root sits: \`top\` (the default), \`bottom\` (a flame graph), \`left\` or \`right\`.
- **\`leaf\`:** branches that end before the deepest level \`stop\` at their band (the default) or \`extend\` to the far edge.
- **\`zoomType\`:** when you zoom into a branch, \`value\` (the default) keeps its ancestors as full bands above it, and \`both\` makes the branch the top level.
- **\`spacing\`, \`tint\` and \`dataLabels\`:** as for sunburst charts.

Select a cell, or press Enter or Space on it, to zoom into its branch: the branch fills the width. Select the branch's own cell or one of its ancestors, press Escape or select **Back** to zoom out. The arrow pointing away from the root goes to the first child, the opposite arrow to the parent, and the other two arrows move along the level. Names are drawn in cells at least 30 pixels long and a line tall.`,
    html: `${snippetElement(icicleGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const steps = {
  name: "Page load",
  children: [
    {
      name: "Network",
      children: [
        { name: "DNS", value: 40 },
        { name: "Connect", value: 90 },
        { name: "Download", value: 220 },
      ],
    },
    {
      name: "Scripts",
      children: [
        { name: "Parse", value: 120 },
        {
          name: "Run",
          children: [
            { name: "Framework", value: 160 },
            { name: "App", value: 110 },
          ],
        },
      ],
    },
    {
      name: "Render",
      children: [
        { name: "Layout", value: 70 },
        { name: "Paint", value: 50 },
      ],
    },
  ],
};

export function PageLoadSteps() {
  return (
    <Chart
      label="Page load time by step, milliseconds"
      type="icicle"
      valueSuffix=" ms"
      height={320}
      hierarchy={steps}
    />
  );
}`,
  },
  {
    id: "streamgraph",
    title: "Show a changing mix over time",
    body: `A streamgraph stacks its series as bands around a baseline that moves, so the outer edges stay as flat as the data allows. It suits many series whose mix shifts over time, where you read the overall shape more than exact values. Set \`type\` to \`streamgraph\` and pass series as for a line or area chart. Series are joined on x: a missing value counts as zero, and so does a negative one.

- **\`streamOffset\`:** the baseline: \`wiggle\` (the default), \`silhouette\` (centered on one line), \`zero\` (a stacked area) or \`expand\` (each x value fills the chart, as shares).
- **\`streamOrder\`:** the stacking order: \`inside-out\` (series that peak first sit in the middle, the default), \`inverse\` or \`none\` (the series order).
- **\`hideStreamLabels\`:** removes the series names drawn on the bands. A name is drawn on a band where it fits. \`streamLabelMinWidth\` sets the thinnest band that gets a name, in pixels (24 by default).
- **\`curve\`:** as for lines: \`smooth\` (the default), \`straight\` or \`stepline\`.
- **\`tooltip="point"\`:** the tooltip follows one band, and the other bands fade to \`streamHoverOpacity\` (0.35 by default).
- **\`colorBlindMode\` and \`fillPattern\`:** fill the bands with patterns, so they differ by more than their color.

The value axis and the grid are hidden, because a moving baseline makes their values misleading. Set \`yaxis={{ show: true }}\` and \`grid="y"\` to show them. The tooltip lists each band's value from the top down, then the total of the column, except with \`expand\`. The left and right arrow keys move between x values. The data table keeps the values you supplied, never the stacked positions.`,
    html: `${snippetElement(streamgraphGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ListeningByGenre() {
  return (
    <Chart
      label="Listening time by genre, thousands of hours per month"
      type="streamgraph"
      valueSuffix="k"
      height={320}
      categories={months}
      series={[
        { name: "Pop", data: [42, 48, 55, 60, 52, 44, 40, 38, 45, 50, 58, 62] },
        { name: "Rock", data: [30, 28, 26, 32, 40, 46, 50, 44, 36, 30, 26, 24] },
        { name: "Jazz", data: [12, 14, 18, 20, 22, 26, 24, 20, 18, 16, 14, 12] },
        { name: "Hip hop", data: [20, 24, 30, 36, 44, 52, 58, 62, 56, 48, 40, 30] },
        { name: "Classical", data: [18, 16, 14, 12, 12, 14, 16, 18, 22, 26, 30, 34] },
      ]}
    />
  );
}`,
  },
  {
    id: "violin",
    title: "Compare distributions",
    body: `A violin chart shows how the observations of each category spread, as a density curve mirrored around a line. It shows what a box plot hides, such as two clusters in one category. Set \`type\` to \`violin\`, and give each category its observations in \`y\` as a list of numbers. To draw a precomputed curve, set \`y\` to \`{ density: [[value, weight]], points: [value] }\`: the curve is drawn as given and \`points\` are optional. In HTML, the table cell of a category holds the summary as text, and the observations in \`data-ok-samples\`, separated by spaces, or the curve in \`data-ok-density\` as \`value:weight\` pairs.

- **\`violinNormalize\`:** \`individual\` (the default) scales each violin to its own peak, and \`group\` shares one density scale, so widths compare across categories.
- **\`violinSide\`:** \`both\` (the default) or half a violin: \`left\` and \`right\` for vertical charts, \`top\` and \`bottom\` for \`horizontal\` ones.
- **\`kdeBandwidth\` and \`kdeResolution\`:** the kernel width in value units (Silverman's rule of thumb by default) and the samples per curve (64 by default). \`bandwidthScale\` scales the drawn width instead.
- **\`violinBox\`:** adds a box of the quartiles and a median line. \`violinWhiskers\` ends the whiskers at the extremes (\`minmax\`, the default) or at Tukey's fences (\`tukey\`).
- **\`hideViolinPoints\`, \`violinPointSize\`, \`violinJitter\`, \`violinMaxPoints\`, \`unconstrainedViolinPoints\`:** the dots of the observations. The spread is a fixed sequence, so the dots stay in place between renders.

The tooltip lists the five numbers and the count. The arrow keys move between categories, and the data table shows the same summary. Use \`colorBlindMode\` to give each series its own pattern and marker shape.`,
    html: `${snippetElement(violinGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const hours = [12, 14, 16, 18, 19, 20, 21, 22, 24, 25, 27, 30, 34, 38, 41, 48];

export function DeliveryTimes() {
  return (
    <Chart
      label="Delivery time, in hours"
      type="violin"
      violinBox
      valueSuffix=" h"
      height={320}
      categories={["Basic"]}
      series={[{ name: "Delivery time", data: [{ y: hours }] }]}
    />
  );
}`,
  },
  {
    id: "beeswarm",
    title: "Show every observation",
    body: `A beeswarm chart draws one dot per observation, in a lane per series, along the value axis. Dots with close values move apart across the lane, so you see the shape of the data and every value in it. Set \`type\` to \`beeswarm\` and pass one series per lane. Each value is an observation. Name observations with \`categories\`, or \`{ x, y }\` points. Without names, they are numbered.

- **\`beeswarmSpread\`:** \`swarm\` (the default) pushes dots apart just enough not to overlap, and \`jitter\` spreads them across the lane by a fixed sequence.
- **\`orientation\`:** the value axis runs \`horizontal\`, the default, or \`vertical\`.
- **\`markerSize\`:** the dot radius in pixels. Without it, the dots shrink to fit a crowded lane.
- **\`colorBlindMode\` and \`markerShape\`:** give each lane its own shape, so lanes differ by more than color and position.

The tooltip shows one observation with its name and value. Arrow keys move through the observations in reading order, Home and End go to the first and last, and Enter or Space selects one. The data table lists one row per observation.`,
    html: `${snippetElement(beeswarmGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const people = ["Ann", "Ben", "Caro", "Dan", "Eve", "Finn", "Gia", "Hugo", "Ivy", "Jon", "Kim", "Leo"];

export function SalariesByDepartment() {
  return (
    <Chart
      label="Salaries by department, thousands of dollars"
      type="beeswarm"
      valueSuffix="k"
      height={300}
      categories={people}
      series={[
        { name: "Sales", data: [55, 62, 58, 71, 66, 60, 64, 58, 73, 69, 61, 57] },
        { name: "Design", data: [72, 80, 75, 78, 83, 90, 68, 74, null, null, null, null] },
        { name: "Support", data: [41, 44, 39, 47, 45, 42, 40, 43, 46, null, null, null] },
      ]}
    />
  );
}`,
  },
  {
    id: "waffle",
    title: "Show parts of a whole as cells",
    body: `A waffle chart fills a grid of cells, where each category colors its share of the cells. Counting cells is easier than comparing slice angles, so it suits rounded percentages. Set \`type\` to \`waffle\` and pass one series with one value per category, as for a pie chart.

- **\`total\`:** the cells shared out between the categories, such as \`100\` for a percentage waffle. The cells always add up exactly (the largest remainders get the extra ones). Without it, one cell stands for one unit, or \`unitValue\` units.
- **\`columns\`:** cells per row (10 by default). **\`fillFrom\`:** the row where the fill starts, \`bottom\` (the default) or \`top\`.
- **\`split\`:** one mini waffle per category, filled to its value out of \`splitMax\`, or the largest value. \`tileColumns\` sets the tiles per row and \`trackColor\` the color of the empty cells.
- **\`cellRadius\`:** the corner radius of the cells in pixels (2 by default). \`spacing\` sets the gap between them.
- **\`colorBlindMode\` and \`markerShape\`:** draw a different shape per category, so categories differ by more than color.

A category is one item for the tooltip and the keyboard: the arrow keys move between categories and its cells light up together. Selecting a category with a click, Enter or Space works as for pie slices. The legend hides categories.`,
    html: `${snippetElement(waffleGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

export function BudgetShares() {
  return (
    <Chart
      label="Budget by department, in percent"
      type="waffle"
      total={100}
      valueSuffix="%"
      height={320}
      categories={["Engineering", "Marketing", "Support", "Operations"]}
      series={[{ name: "Budget", data: [38, 27, 21, 14] }]}
    />
  );
}`,
  },
  {
    id: "unit",
    title: "Show quantities as marks",
    body: `A unit chart draws a mark per unit of a value, so an amount reads as a crowd you can count. It suits small numbers that stand for people or things, such as seats, volunteers or tickets. Set \`type\` to \`unit\` and pass one series with one value per category, as for a pie chart.

- **\`unitLayout\`:** \`grouped\` (the default, a blob per category), \`packed\` (one blob, with the smallest group in the middle unless \`disableSortByGroup\` is set), \`columns\` (stacked dots), \`grid\` (a lattice, as in a waffle chart) or \`arc\` (rows of seats).
- **\`unitValue\`:** how many units one mark stands for, such as \`1000\`. **\`maxUnits\`:** the most marks drawn (5000 by default); counts scale down above it.
- **\`clusterLabels\`:** names under each cluster (\`grouped\`) or column (\`columns\`).
- **\`arcRows\`:** the rows of an \`arc\` (by default, the fewest that seat everyone). \`innerSize\` and \`startAngle\` / \`endAngle\` shape it (40%, and -90° to 90°, by default).
- **\`markerShape\` and \`colorBlindMode\`:** a shape instead of circles, or a different shape per category, so categories differ by more than color.
- **\`markerSize\` and \`spacing\`:** the mark radius and the gap in pixels. They fit the box by default.

As in waffle charts, a category is one item: the arrow keys and pointer move between categories, its marks light up together, and a click, Enter or Space selects it. The tooltip shows the category and its value. The legend lists and hides categories.`,
    html: `${snippetElement(unitGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

export function VolunteersByCity() {
  return (
    <Chart
      label="Volunteers by city"
      type="unit"
      unitLayout="grouped"
      clusterLabels
      height={280}
      categories={["Hanoi", "Da Nang", "Hue", "Can Tho"]}
      series={[{ name: "Volunteers", data: [64, 28, 18, 42] }]}
    />
  );
}`,
  },
  {
    id: "stock",
    title: "Show stock prices with indicators",
    body: `A stock chart is a candlestick, line, area or column chart of prices over time, with technical indicators, panes and a navigator. The first series is the price. Give each point a volume in \`v\`, such as \`{ y: [open, high, low, close], v: 1200000 }\`. In HTML, the volume is a column of the price series under the header \`data-ok-part="volume"\`.

Set \`indicators\` to compute indicators from the price. Each indicator is a type and optional parameters:

- **Overlays,** drawn over the price: \`sma\` and \`ema\` (moving averages, \`period\`), \`bollinger\` (\`period\`, \`stdDev\`), \`vwap\`, \`donchian\` (\`period\`) and \`keltner\` (\`period\`, \`atrPeriod\`, \`multiplier\`).
- **Oscillators,** each in a pane of its own under the price: \`volume\`, \`rsi\` (\`period\`), \`macd\` (\`fastPeriod\`, \`slowPeriod\`, \`signalPeriod\`), \`stochastic\` (\`period\`, \`signalPeriod\`), \`atr\`, \`cci\` (\`period\`) and \`pvt\`.

In HTML, list the indicators in \`data-ok-indicators\`, separated by semicolons. Write the type, then its numbers in the order above, then an optional color, such as \`"sma 20 warning; rsi 14"\`.

The panes share the date axis, so a zoom applies to all of them. The price axis fits the visible dates. \`paneHeight\` sets the height of each pane in pixels (120 by default). Set \`navigator\` to add a small line of the whole price under the chart. Drag the window on it to move through time, or drag its edges to show more or fewer dates. The navigator also turns on the zoom keys, so the keyboard reaches every date.

The tooltip is one readout of the active date in every pane: open, high, low, close, volume and each indicator. The legend shows and hides each indicator. The data table lists every computed value in its own column (\`th[data-ok-indicator]\`), so screen readers reach them too. In HTML, the runtime writes those columns. It never reads them back as data.`,
    html: `<figure data-ok-chart data-ok-type="candlestick" data-ok-x-type="datetime" data-ok-navigator
  data-ok-value-prefix="$" data-ok-indicators="sma 20; volume; rsi 14">
  <table data-ok-chart-data>
    <caption>ACME share price</caption>
    <thead>
      <tr><th scope="col" rowspan="2">Date</th><th scope="colgroup" colspan="5" data-ok-color="primary-dark">ACME</th></tr>
      <tr><th scope="col" data-ok-part="open">Open</th><th scope="col" data-ok-part="high">High</th><th scope="col" data-ok-part="low">Low</th><th scope="col" data-ok-part="close">Close</th><th scope="col" data-ok-part="volume">Volume</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row" data-ok-value="2025-01-02">02 Jan 2025</th><td data-ok-value="100">$100</td><td data-ok-value="101.15">$101.15</td><td data-ok-value="98.48">$98.48</td><td data-ok-value="100.02">$100.02</td><td data-ok-value="1661387">1,661,387</td></tr>
      <tr><th scope="row" data-ok-value="2025-01-03">03 Jan 2025</th><td data-ok-value="100.02">$100.02</td><td data-ok-value="103.33">$103.33</td><td data-ok-value="99.52">$99.52</td><td data-ok-value="101.79">$101.79</td><td data-ok-value="1750206">1,750,206</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function SharePrice() {
  return (
    <Chart
      label="ACME share price"
      type="candlestick"
      xType="datetime"
      valuePrefix="$"
      navigator
      indicators={[{ type: "sma", period: 20 }, { type: "volume" }, { type: "rsi", period: 14 }]}
      categories={["2025-01-02", "2025-01-03"]}
      series={[
        {
          name: "ACME",
          data: [
            { y: [100, 101.15, 98.48, 100.02], v: 1661387 },
            { y: [100.02, 103.33, 99.52, 101.79], v: 1750206 },
          ],
        },
      ]}
    />
  );
}`,
  },
  {
    id: "sankey",
    title: "Show flows between stages",
    body: `A Sankey chart shows how a quantity flows from sources to destinations, such as energy from its sources to its uses. Set \`type\` to \`sankey\` and describe the links instead of series:

- **React:** pass \`edges\`, one \`{ source, target, value }\` per link, with node ids as \`source\` and \`target\`. Pass \`nodes\` (\`{ id, title, color }\`) to name and color the nodes. Nodes without a color take \`colors\` in order, then the chart palette.
- **HTML:** write one table row per link: the source as the row header, then the target and the value. Mark the three column headers with \`data-ok-part="source"\`, \`"target"\` and \`"y"\`. When a node's id differs from its name, put the id in \`data-ok-value\`. Put a node's color in \`data-ok-color\` on its cells.

The chart places each node in a column by its distance from the sources, sizes it by the larger of what flows in and out, and moves nodes to reduce crossings. A link that goes back to an earlier column, such as recycled material, is drawn as a dashed loop under the chart.

- **\`orientation\`:** \`horizontal\` (the default) or \`vertical\`, which suits flows with many stages on a phone.
- **\`nodeWidth\`:** the thickness of the nodes in pixels (20 by default).
- **\`whitespace\`:** the share of the fullest column left between its nodes (0.18 by default).
- **\`fill\`:** \`gradient\` (the default) fades each link from the source color to the target color. \`solid\` uses the source color, or the link's own \`color\`.
- **\`edgeOpacity\`:** the opacity of the links (0.4 by default).
- **\`axisTitles\`:** a title above each column, such as years in an alluvial chart. In HTML, separate the titles with semicolons in \`data-ok-axis-titles\`.
- **\`dataLabels\`:** adds each node's value after its name.

Point at a node to highlight its links and see what flows in and out. Point at a link to see its source, target and value. The keyboard moves through the nodes and links column by column. Names that don't fit between two columns are shortened with an ellipsis, or left out on narrow screens. The tooltip and the data table keep the whole name.`,
    html: `<figure data-ok-chart data-ok-type="sankey" data-ok-fill="gradient" data-ok-value-suffix=" MWh">
  <table data-ok-chart-data>
    <caption>Office energy use</caption>
    <thead>
      <tr><th scope="col" data-ok-part="source">From</th><th scope="col" data-ok-part="target">To</th><th scope="col" data-ok-part="y">Value</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row" data-ok-color="warning">Solar panels</th><td data-ok-color="primary">Building</td><td data-ok-value="42">42 MWh</td></tr>
      <tr><th scope="row" data-ok-color="info-dark">Grid</th><td data-ok-color="primary">Building</td><td data-ok-value="64">64 MWh</td></tr>
      <tr><th scope="row" data-ok-color="primary">Building</th><td data-ok-color="error">Heating</td><td data-ok-value="48">48 MWh</td></tr>
      <tr><th scope="row" data-ok-color="primary">Building</th><td data-ok-color="info">Computers</td><td data-ok-value="58">58 MWh</td></tr>
    </tbody>
  </table>
</figure>`,
    react: `import { Chart } from "@owlky/react";

export function EnergyUse() {
  return (
    <Chart
      label="Office energy use"
      type="sankey"
      valueSuffix=" MWh"
      nodes={[
        { id: "solar", title: "Solar panels", color: "warning" },
        { id: "grid", title: "Grid", color: "info-dark" },
        { id: "building", title: "Building", color: "primary" },
        { id: "heating", title: "Heating", color: "error" },
        { id: "computers", title: "Computers", color: "info" },
      ]}
      edges={[
        { source: "solar", target: "building", value: 42 },
        { source: "grid", target: "building", value: 64 },
        { source: "building", target: "heating", value: 48 },
        { source: "building", target: "computers", value: 58 },
      ]}
    />
  );
}`,
  },
  {
    id: "animations",
    title: "Animate charts",
    body: "Set `animations` (`data-ok-animations` in HTML) to grow the series in when the chart first draws, and to move bars, points and lines to their new values when the data changes. Animations never play when the system asks for reduced motion. Live charts that update often read better without them.",
    html: `${snippetElement(animationsGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const deploys = [{ name: "Deploys", data: [3, 5, 2, 6, 4] }];

export function ChartAnimations() {
  return (
    <Chart label="Deploys per weekday" type="bar" animations categories={days} series={deploys} />
  );
}`,
  },
  {
    id: "localize",
    title: "Localize texts",
    body: "`locale` formats numbers and month names. The names of the values in tables and tooltips, such as Minimum or Open, come from the second header row of the HTML table. In React, pass them in `localeText`, together with the toolbar's button names and the download error. In HTML, call `setLocaleText(text)` on the instance for the toolbar.",
    html: `${snippetElement(localizedGroup, "data-ok-chart ")}
<script type="module">
  import { getRuntime } from "@owlky/html";
  const element = document.querySelector("[data-ok-chart]");
  getRuntime().get(element, "chart").setLocaleText({ zoomIn: "Phóng to", svg: "Tải SVG" });
</script>`,
    react: `import { Chart } from "@owlky/react";

const series = [
  {
    name: "Thời gian phản hồi",
    data: [
      { x: "Thứ Hai", y: [12, 20, 25, 31, 40] },
      { x: "Thứ Ba", y: [10, 18, 22, 28, 36] },
    ],
  },
];

export function ChartLocalize() {
  return (
    <Chart label="Thời gian phản hồi" type="boxPlot" locale="vi-VN" localeText={{ min: "Nhỏ nhất", median: "Trung vị", zoomIn: "Phóng to" }} series={series} />
  );
}`,
  },
  {
    id: "labels",
    title: "Print values on the chart",
    body: "Set `dataLabels` (`data-ok-data-labels` in HTML) to print values on the chart: percentages on pie and donut slices, values inside columns and bars, and values above the points of lines, areas and radars. A label is left out where it doesn't fit, such as on a short column. The tooltip and the data table still show every value. Set `dataLabelBackground` to put the labels above points on a badge, which keeps them readable over lines. For your own text, pass `dataLabelFormatter(value, series, index)` in React, or call `setFormatters({ dataLabel })` on the HTML instance. Pie and donut labels get the percentage.",
    html: `${snippetElement(dataLabelsGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const devices = ["Mobile", "Desktop", "Tablet"];
const visits = [{ name: "Visits", data: [540, 320, 90] }];

export function ChartLabels() {
  return (
    <Chart label="Share of visits" type="pie" dataLabels categories={devices} series={visits} />
  );
}`,
  },
  {
    id: "stacked",
    title: "Stack and compare series",
    body: `Set \`stacked\` to put the series of a category on top of each other, so the column shows their total. Without it, columns of several series stand side by side. Only the end of each column is rounded.

- **Shares:** set \`stackType="100%"\` (\`data-ok-stack-type="100%"\` in HTML) to stack each category's values as shares of their total. The value axis runs to 100%, and data labels print the shares. The tooltip and the data table keep the values.
- **Totals:** set \`stackTotals\` (\`data-ok-stack-totals\`) to print the total of each stack past its end. Negative stacks get their total below.
- **Bars only:** in a mixed chart, set \`stackOnlyBar\` (\`data-ok-stack-only-bar\`) to stack the bar series and keep a line, such as a target, on its own values.`,
    html: `${snippetElement(stackTotalsGroup, "data-ok-chart ", 1)}`,
    react: `import { Chart } from "@owlky/react";

const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
const orders = [
  { name: "Store A", data: [30, 42, 28, 51, 39, 47] },
  { name: "Store B", data: [21, 18, 26, 22, 31, 25] },
  { name: "Target", type: "line" as const, data: [50, 55, 55, 60, 65, 65] },
];

export function ChartStackTotals() {
  return (
    <Chart
      label="Orders by store and the weekly target"
      type="bar"
      stacked
      stackOnlyBar
      stackTotals
      colors={["info", "info-dark", "error"]}
      categories={weeks}
      series={orders}
    />
  );
}`,
  },
  {
    id: "bars",
    title: "Style bars",
    body: `Bars take options of their own:

- **Label position:** \`dataLabelPosition\` (\`data-ok-data-label-position\`) puts data labels by the value end (\`top\`), in the middle (\`center\`, the default) or by the base (\`bottom\`) of each bar.
- **Value ranges:** \`colorRanges\` colors each bar by the range that holds its value, such as red for losses and green for profits. A point's own \`color\` wins. In HTML, write the ranges as text: \`data-ok-color-ranges="-100 -1 error Loss; 0 100 success Profit"\`.
- **Tracks:** \`backgroundBars\` (\`data-ok-background-bars\`) draws a grey track the height of the plot behind each bar, which helps when values are parts of a fixed maximum. \`backgroundBarColors\` (\`data-ok-background-bar-colors\`, palette names separated by spaces) colors the tracks category by category, \`backgroundBarOpacity\` sets their opacity from 0 to 1, and \`backgroundBarRadius\` their corner radius in pixels.

Color alone shouldn't carry the meaning of a range: name the ranges in the label or the text around the chart, as the data table only holds the values.`,
    html: `${snippetElement(columnRangesGroup, "data-ok-chart ")}
${snippetElement(columnDataLabelsGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const balance = [{ name: "Balance", data: [12, 18, -7, -21, 9, 27] }];
const inflation = [{ name: "Inflation", data: [2.3, 3.1, 4.0, 10.1, 4.0, 3.6] }];

export function ChartBars() {
  return (
    <>
      <Chart
        label="Monthly balance: losses in red, profits in green"
        type="bar"
        colorRanges={[
          { from: -100, to: -1, color: "error", name: "Loss" },
          { from: 0, to: 100, color: "success", name: "Profit" },
        ]}
        categories={months}
        series={balance}
      />
      <Chart
        label="Monthly inflation"
        type="bar"
        dataLabels
        dataLabelPosition="top"
        backgroundBars
        valueSuffix="%"
        categories={months}
        series={inflation}
      />
    </>
  );
}`,
  },
  {
    id: "cues",
    title: "Tell series apart without color",
    body: `Some people can't tell the series of a chart apart by color, and printed charts often lose it. Give series a second cue, so color is never the only way to read the chart:

- **Marker shapes:** \`markerShape\` (\`data-ok-marker-shape\`) sets the shape of every marker: \`circle\`, \`square\`, \`triangle\`, \`diamond\`, \`cross\`, \`plus\` or \`star\`. A series can set its own \`markerShape\`. In HTML, write it on the series' column header. Lines draw markers only with \`markerSize\`, and scatter points always.
- **Patterns:** \`fill="pattern"\` fills bars, areas and pie, donut and polar area slices with a pattern, a different one per series or slice. \`fillPattern\` (\`data-ok-fill-pattern\`) picks one for all of them: \`slantedLines\`, \`squares\`, \`circles\`, \`horizontalLines\` or \`verticalLines\`. A series can set its own \`fillPattern\`.
- **Dashes and widths:** \`dashArray\` and \`strokeWidth\` set the dash length and line width of every line in pixels. A series can set its own \`dashArray\` and \`strokeWidth\` (\`data-ok-dash-array\` and \`data-ok-stroke-width\` on its column header).
- **All at once:** \`colorBlindMode\` (\`data-ok-color-blind-mode\`) gives each series its own marker shape, pattern and dash, and adds markers to lines.

The legend and the tooltip repeat each series' shape or pattern on its marker. To call out single points, such as a record, pass \`discreteMarkers\`: \`{ seriesIndex, dataPointIndex, color, size, shape }\` objects in React, or text such as \`data-ok-discrete-markers="0 4 error star 8"\` in HTML. They draw a marker on that point even when its series has none.`,
    html: `${snippetElement(markerShapesGroup, "data-ok-chart ")}
${snippetElement(colorBlindGroup, "data-ok-chart ", 1)}`,
    react: `import { Chart } from "@owlky/react";

const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];
const sessions = [
  { name: "Search", markerShape: "circle" as const, data: [45, 52, 38, 24, 33, 26, 21] },
  { name: "Social", markerShape: "square" as const, data: [35, 41, 62, 42, 13, 18, 29] },
  { name: "Email", markerShape: "triangle" as const, data: [87, 57, 74, 99, 75, 38, 62] },
];
const quarters = ["Q1", "Q2", "Q3", "Q4"];
const revenue = [
  { name: "Free", data: [8, 12, 15, 19] },
  { name: "Pro", data: [21, 25, 30, 34] },
  { name: "Team", data: [14, 18, 17, 24] },
];

export function ChartCues() {
  return (
    <>
      <Chart
        label="Weekly sessions by source"
        markerSize={5}
        curve="straight"
        discreteMarkers={[
          { seriesIndex: 0, dataPointIndex: 4, color: "error", size: 8, shape: "star" },
        ]}
        categories={weeks}
        series={sessions}
      />
      <Chart
        label="Revenue by plan per quarter"
        type="bar"
        colorBlindMode
        categories={quarters}
        series={revenue}
      />
    </>
  );
}`,
  },
  {
    id: "values",
    title: "Format values and axes",
    body: "`valuePrefix` and `valueSuffix` add text around every value, such as a currency or a percent sign. `locale` sets the number format and the month names. `yMin` and `yMax` fix the value axis, and `yTitle` names it. For anything else, pass `valueFormatter(value, series)` and `labelFormatter(x)` in React, or call `setFormatters({ value, label })` on the HTML instance. The axis gets `series` -1.",
    html: `${snippetElement(columnSingle, "data-ok-chart ").replace(
      "<figure data-ok-chart ",
      '<figure data-ok-chart data-ok-value-prefix="$" data-ok-locale="de-DE" data-ok-y-min="0" data-ok-y-max="100" ',
    )}`,
    react: `import { Chart } from "@owlky/react";

const series = [{ name: "Revenue", data: [42, 57, 61, 75] }];

export function ChartValues() {
  return (
    <Chart label="Revenue" valuePrefix="$" locale="de-DE" yMin={0} yMax={100} series={series} />
  );
}`,
  },
  {
    id: "axes",
    title: "Add value axes and change their scale",
    body: `Pass \`yaxis\` to set up the value axis, or a list of axes to draw series of different units on one chart, such as visits and mentions. In HTML, write the axes in \`data-ok-yaxis\`, separated by semicolons, and mark each series' column header with the index of its axis in \`data-ok-y-axis\`.

- **\`seriesName\`:** the series drawn on this axis, by name. A series that no axis names goes to the axis at its own position.
- **\`opposite\`:** draws the axis on the right of the plot (\`opposite\` in HTML).
- **\`logarithmic\` and \`logBase\`:** a logarithmic scale for values that grow by factors, such as downloads. Ticks sit at whole powers of the base (10 by default). Values of zero and below aren't drawn, and series on the axis don't stack.
- **\`reversed\`:** the highest value at the bottom, such as a ranking where 1 is best.
- **\`tickAmount\`:** the number of intervals between ticks (\`tick-amount\` in HTML). Other axes take the number of intervals of the first axis, so their labels line up with its grid lines.
- **\`min\`, \`max\`, \`title\` and \`show\`:** fix the range, name the axis, or hide its labels while its series keep its scale (\`min\`, \`max\`, \`title\` and \`hidden\` in HTML, with the title last).

Several axes work on charts drawn from left to right with an x axis. \`xTitle\` (\`data-ok-x-title\` in HTML) names the x axis under its labels, and is also the header of the data table's first column unless you set \`xLabel\`.`,
    html: `${snippetElement(multipleYAxesGroup, "data-ok-chart ")}
${snippetElement(axisScalesGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const visits = [440, 505, 414, 671, 227, 413];
const mentions = [23, 42, 35, 27, 43, 22];
const downloads = [{ name: "Downloads", data: [12, 45, 180, 920, 3400, 15800] }];

export function ChartAxes() {
  return (
    <>
      <Chart
        label="Blog visits and social mentions"
        xTitle="Month"
        yaxis={[
          { title: "Blog visits" },
          { seriesName: "Social mentions", opposite: true, title: "Social mentions" },
        ]}
        categories={months}
        series={[
          { name: "Blog visits", type: "bar", data: visits },
          { name: "Social mentions", type: "line", data: mentions },
        ]}
      />
      <Chart
        label="Monthly downloads"
        type="area"
        yaxis={{ logarithmic: true, title: "Downloads" }}
        categories={months}
        series={downloads}
      />
    </>
  );
}`,
  },
  {
    id: "tooltip",
    title: "Change the tooltip",
    body: `By default, the tooltip lists the values of every series in the category under the pointer or the keyboard. Change it with these options:

- **One value:** \`tooltip="point"\` (\`data-ok-tooltip="point"\` in HTML) shows only the column, bar or point under the pointer, and the arrow keys move value by value.
- **No tooltip:** \`tooltip="none"\` shows no tooltip. Screen readers still announce the values the keyboard moves to, because the tooltip stays as a hidden status region.
- **Fixed position:** \`tooltipFixed\` (\`data-ok-tooltip-fixed\`) keeps the tooltip in a corner of the plot, so it never covers the values: \`topLeft\`, \`topRight\`, \`bottomLeft\` or \`bottomRight\`.

To show your own content, pass \`tooltipContent(context)\` in React. It gets the \`title\`, the \`rows\` (\`name\`, \`value\` and \`color\` of each value), \`selected\` and the data \`points\`, and returns what the tooltip shows. In HTML, add a \`<template data-ok-chart-tooltip>\` to the chart. The chart copies it into the tooltip and writes text into its slots: \`data-ok-chart-tooltip-slot="title"\`, \`"state"\` (removed unless the value is selected), and \`"row"\`, which is repeated for each value with its \`"name"\`, \`"value"\` and \`"marker"\`. The slots only ever get text, so data can't inject markup.`,
    html: `${snippetElement(tooltipCustomGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const orders = [
  { name: "Online", data: [44, 55, 41, 67, 22] },
  { name: "In store", data: [13, 23, 20, 8, 13] },
];

export function ChartTooltip() {
  return (
    <Chart
      label="Orders per weekday"
      type="bar"
      categories={days}
      series={orders}
      tooltipContent={({ title, rows, selected }) => (
        <>
          <div data-ok-chart-tooltip-title="">
            <span>Orders on </span>
            <span>{title}</span>
          </div>
          {selected && <div data-ok-chart-tooltip-state="">Selected</div>}
          <div data-ok-chart-tooltip-rows="">
            {rows.map((row) => (
              <div key={row.name} data-ok-chart-tooltip-row="">
                <span data-ok-chart-tooltip-marker="" data-ok-color={row.color} />
                <span>{row.name}</span>
                <span data-ok-chart-tooltip-value="">{row.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    />
  );
}`,
  },
  {
    id: "select",
    title: "Select data points",
    body: `People can select a value to act on it, such as opening the orders of one weekday. A click selects the column, bar, slice, cell or point under the pointer, and a second click clears it. With the keyboard, Enter or Space selects the item the tooltip shows. On a category with several series, it selects the value of every series. A selected value gets an outline in the text color, and its tooltip says **Selected**, so screen readers announce it too.

By default, a new selection replaces the previous one. Set \`allowMultipleDataPointsSelection\` (\`data-ok-allow-multiple-data-points-selection\` in HTML) to let selections add up.

- **React:** \`onDataPointSelection(detail)\` is called with \`seriesIndex\`, \`dataPointIndex\`, \`selected\` and \`selectedDataPoints\`. Pass \`selectedDataPoints\` to control the selection, or \`defaultSelectedDataPoints\` to start with one.
- **HTML:** \`ok:chart:select\` fires with the same \`detail\`. The instance has \`selectedDataPoints\`, \`setSelectedDataPoints(list)\` and \`toggleDataPointSelection(seriesIndex, dataPointIndex)\`.

\`dataPointIndex\` is the category's index, or the slice's in pie and donut charts. On numeric axes, it is the point's position in its series. A drag that zooms or pans selects nothing, and brush charts don't select.`,
    html: `${snippetElement(selectionGroup, "data-ok-chart ")}
<script>
  const chart = document.querySelector("[data-ok-chart]");
  // Each selected or cleared value, and every selected one.
  chart.addEventListener("ok:chart:select", (event) => {
    const { dataPointIndex, selected, selectedDataPoints } = event.detail;
    console.log(dataPointIndex, selected, selectedDataPoints.length);
  });
</script>`,
    react: `import { Chart } from "@owlky/react";
import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const orders = [{ name: "Orders", data: [44, 55, 41, 67, 22] }];

export function ChartSelection() {
  const [day, setDay] = useState("none");
  return (
    <>
      <Chart
        label="Orders per weekday"
        type="bar"
        categories={days}
        series={orders}
        onDataPointSelection={(detail) =>
          setDay(detail.selected ? (days[detail.dataPointIndex] ?? "none") : "none")
        }
      />
      <p>Selected day: {day}</p>
    </>
  );
}`,
  },
  {
    id: "legend",
    title: "Use the legend",
    body: "The legend shows one button per series, or one per category in pie, donut and radial bar charts. Selecting a button hides its series and fits the axis to the series that are left. Select it again to show the series. `legend` places the legend at the `top` (the default), `right` or `bottom`, or hides it with `none`. Charts with one series have no legend, unless you set `showForSingleSeries`. On screens narrower than 600px, a right legend moves below the chart. Set `legendValues` to show each item's value next to its name: the slice or ring value, or the last value of a series. `donutSize` sets the size of a donut's hole in percent of its radius (72 by default).",
  },
  {
    id: "legend-grid",
    title: "Customize the legend and the grid",
    body: `Change how the legend looks and works:

- **Alignment:** \`legendAlign\` (\`data-ok-legend-align\`) lines the items up on the \`left\`, in the \`center\` or on the \`right\`.
- **Names:** \`customLegendItems\` shows these names instead of the series names. The first name stands for the first series, with its color and its button. In HTML, separate the names with semicolons in \`data-ok-custom-legend-items\`.
- **Fixed series:** \`disableLegendToggle\` (\`data-ok-disable-legend-toggle\`) turns the items into labels, for charts whose series must always show.

The grid draws horizontal lines along the value ticks by default. \`grid\` (\`data-ok-grid\`) draws \`x\` (vertical) lines, \`both\` or \`none\`. Stripes make rows or columns easier to follow: \`gridRowColors\` and \`gridColumnColors\` take colors in turn, such as palette names, \`grey\` or \`transparent\` (in HTML, separated by spaces in \`data-ok-grid-row-colors\` and \`data-ok-grid-column-colors\`). \`gridRowOpacity\` and \`gridColumnOpacity\` set their opacity, 0.5 by default.`,
    html: `${snippetElement(legendGroup, "data-ok-chart ", 1)}
${snippetElement(gridGroup, "data-ok-chart ")}`,
    react: `import { Chart } from "@owlky/react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const money = [
  { name: "Income", data: [42, 48, 45, 51, 49, 56] },
  { name: "Spending", data: [38, 40, 47, 44, 46, 49] },
];
const visits = [{ name: "Visits", data: [10, 41, 35, 51, 49, 62] }];

export function ChartLegendGrid() {
  return (
    <>
      <Chart
        label="Income and spending"
        legend="bottom"
        legendAlign="center"
        disableLegendToggle
        customLegendItems={["Income (after tax)", "Spending (all accounts)"]}
        colors={["success", "error"]}
        categories={months}
        series={money}
      />
      <Chart
        label="Monthly visits"
        curve="straight"
        markerSize={4}
        grid="both"
        gridRowColors={["grey", "transparent"]}
        categories={months}
        series={visits}
      />
    </>
  );
}`,
  },
  {
    id: "size",
    title: "Size",
    body: "A chart fills the width of its container and redraws when that width changes, so text keeps its size. `height` sets the height of the plot in pixels (320 by default). Before the width is measured, for example while the page loads, the chart is drawn 640px wide and scaled to fit.",
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the data and the text. They aren't options, because HTML writes them as markup or text attributes.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:chart:toggle\`** (cancelable) fires when a legend button is selected, with \`detail.index\`, \`detail.hidden\` and \`detail.hiddenSeries\`. Call \`preventDefault()\` to keep the series as it is.
- **\`ok:chart:active\`** fires with \`detail.active\`: the category (\`{ kind: "index", index }\`) or point (\`{ kind: "mark", mark }\`) under the pointer or the keyboard, or \`null\`.
- **Instance:** \`runtime.get(element, "chart")\` returns \`{ hiddenSeries, setHiddenSeries(list), active, setActive(active), setFormatters(formatters), refresh(), updateSeries(series, categories), appendData(data, options) }\`. The methods don't fire events. The chart redraws by itself when the table or an option changes. See "Update data live".
- **\`ok:chart:select\`** fires for each value a click, Enter or Space selects or clears, with \`detail.seriesIndex\`, \`detail.dataPointIndex\`, \`detail.selected\` and \`detail.selectedDataPoints\`. See "Select data points".
- **\`ok:chart:filter\`** fires when the group's crossfilter changes, with \`detail.categories\` (\`null\` when cleared) and \`detail.own\`. The instance has \`filter\` and \`clearFilter()\`. See "Filter linked charts".
- **\`ok:chart:zoom\`** fires when the zoom changes, with \`detail.range\` (\`{ min, max }\` or \`null\`) and \`detail.reason\`: \`user\` for the chart's own gestures, keys and buttons (cancelable), \`group\` or \`brush\` when a linked chart zoomed it.
- **\`ok:chart:drill\`** (cancelable) fires before a sunburst or icicle chart zooms into a branch or out of it, with \`detail.id\` (\`null\` at the top) and \`detail.path\`, the names from the root. The instance has \`drillNode\` and \`setDrillNode(id)\`.
- **\`ok:chart:expand\`** (cancelable) fires before a click, Enter or Space hides or shows a tree node's children, with \`detail.id\`, \`detail.expanded\` and \`detail.collapsedNodes\`. The instance has \`collapsedNodes\` and \`setCollapsedNodes(ids)\`.
- **Phase 4 methods:** \`zoomRange\`, \`setZoomRange(range)\` (its group and brushes follow), \`exportChart("svg" | "png" | "csv")\` (a promise that rejects outside a user gesture) and \`setLocaleText(text)\`.
- **Selection methods:** \`selectedDataPoints\`, \`setSelectedDataPoints(list)\` and \`toggleDataPointSelection(seriesIndex, dataPointIndex)\`.
- **React:** \`onDataPointSelection(detail)\`, controlled with \`selectedDataPoints\`; \`onHiddenSeriesChange(hidden)\` and \`onActiveChange(active)\`; controlled with \`hiddenSeries\`, uncontrolled with \`defaultHiddenSeries\`. The zoom: \`zoomRange\` / \`defaultZoomRange\` and \`onZoomRangeChange(range, reason)\`. To export from your own button, call \`exportChart(figure, format)\` from \`@owlky/core\` with the chart's \`ref\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The plot is one tab stop. When it gets focus from the keyboard, the tooltip shows the first category. The arrow keys move through the categories, through the slices or rings of circular charts, or through the points of a scatter chart. Hidden slices are skipped. In heatmaps and treemaps, each arrow key moves to the nearest cell in its direction.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give every chart a \`label\` (React) or a table \`caption\` (HTML). It names the plot and the data table.
- The data table holds every value, including hidden series. Screen readers can read it instead of the drawing, which they skip.
- The tooltip is a status region, so screen readers announce the values the keyboard moves to, and whether they are selected.
- Selected values get an outline, not only a color change, and Enter or Space selects them without a pointer.
- Crossfilters are set with the same clicks and keys, the chart you act on announces the filter, and a **Clear filter** button clears it. Filtered charts keep every value in their data table.
- Marker shapes, patterns and dashes (\`colorBlindMode\` turns them all on) tell series apart without color, and the legend and the tooltip repeat them.
- Legend buttons report their state with \`aria-pressed\`. A hidden series keeps a hollow marker and crossed-out text, so the state doesn't rely on color.
- Axis labels use the secondary text color, which meets a contrast ratio of at least 4.5:1 in light and dark mode.`,
  },
  apiReferenceSection(chartApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Chart label="Monthly sales" categories={MONTHS} series={SALES} />
    </Preview>
  ),
  types: () => (
    <Preview>
      <Chart
        label="Points per month"
        type="bar"
        yTitle="Points"
        categories={MONTHS}
        series={[
          { name: "Team A", type: "bar", data: [22, 12, 21, 28, 12, 21] },
          { name: "Team B", type: "line", data: [31, 26, 35, 31, 44, 36] },
        ]}
      />
    </Preview>
  ),
  circular: () => (
    <Preview>
      <Chart
        label="Visits by device"
        type="donut"
        height={240}
        totalLabel="Total"
        xLabel="Device"
        colors={["primary-dark", "warning", "info-dark"]}
        categories={["Desktop", "Mobile", "Tablet"]}
        series={[{ name: "Visits", data: [44, 55, 13] }]}
      />
    </Preview>
  ),
  radial: () => (
    <Preview>
      <Chart
        label="Median ratio"
        type="radialBar"
        height={260}
        startAngle={-135}
        endAngle={135}
        dashArray={4}
        trackWidth={100}
        colors={["error"]}
        categories={["Median ratio"]}
        series={[{ name: "Ratio", data: [75] }]}
      />
    </Preview>
  ),
  ranges: () => (
    <Preview>
      <Chart
        label="Build times"
        type="boxPlot"
        height={240}
        boxUpperColor="info"
        boxLowerColor="error"
        categories={["Week 1", "Week 2", "Week 3"]}
        series={[
          {
            name: "Minutes",
            data: [{ y: [4, 6, 7, 9, 14] }, { y: [3, 5, 6, 8, 11] }, { y: [5, 7, 9, 10, 16] }],
          },
        ]}
      />
    </Preview>
  ),
  cells: () => (
    <Preview>
      <Chart
        label="Visits by page and device"
        type="treemap"
        height={240}
        colors={["primary", "warning"]}
        series={[
          {
            name: "Desktops",
            data: [
              { x: "Home", y: 60 },
              { x: "Pricing", y: 41 },
            ],
          },
          {
            name: "Mobile",
            data: [
              { x: "Docs", y: 51 },
              { x: "Blog", y: 30 },
            ],
          },
        ]}
      />
    </Preview>
  ),
  sparklines: () => (
    <Preview>
      <Chart
        label="Visits this week"
        type="area"
        sparkline
        height={48}
        categories={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
        series={[{ name: "Visits", data: [22, 8, 35, 50, 82, 84, 77] }]}
      />
    </Preview>
  ),
  labels: () => (
    <Preview>
      <Chart
        label="Share of visits"
        type="pie"
        height={240}
        dataLabels
        colors={["primary-dark", "warning", "info-dark"]}
        categories={["Desktop", "Mobile", "Tablet"]}
        series={[{ name: "Visits", data: [44, 55, 13] }]}
      />
    </Preview>
  ),
  stacked: () => (
    <Preview>
      <Chart
        label="Sales by channel"
        type="bar"
        stacked
        stackTotals
        legend="right"
        categories={MONTHS}
        series={SALES}
      />
      <Chart
        label="Share of sales by channel"
        type="bar"
        stacked
        stackType="100%"
        dataLabels
        height={240}
        categories={MONTHS}
        series={SALES}
      />
    </Preview>
  ),
  "legend-grid": () => (
    <Preview>
      <Chart
        label="Monthly visits"
        height={240}
        curve="straight"
        markerSize={4}
        grid="both"
        gridRowColors={["grey", "transparent"]}
        showForSingleSeries
        legendAlign="left"
        categories={MONTHS}
        series={[{ name: "Visits", data: [10, 41, 35, 51, 49, 62] }]}
      />
    </Preview>
  ),
  tooltip: () => (
    <Preview>
      <Chart
        label="Orders per weekday (one tooltip per column)"
        type="bar"
        height={240}
        tooltip="point"
        tooltipFixed="topRight"
        categories={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        series={[
          { name: "Online", data: [44, 55, 41, 67, 22] },
          { name: "In store", data: [13, 23, 20, 8, 13] },
        ]}
      />
    </Preview>
  ),
  cues: () => (
    <Preview>
      <Chart
        label="Weekly sessions by source"
        height={240}
        markerSize={5}
        curve="straight"
        discreteMarkers={[
          { seriesIndex: 0, dataPointIndex: 4, color: "error", size: 8, shape: "star" },
        ]}
        categories={["W1", "W2", "W3", "W4", "W5", "W6", "W7"]}
        series={[
          { name: "Search", markerShape: "circle", data: [45, 52, 38, 24, 33, 26, 21] },
          { name: "Social", markerShape: "square", data: [35, 41, 62, 42, 13, 18, 29] },
          { name: "Email", markerShape: "triangle", data: [87, 57, 74, 99, 75, 38, 62] },
        ]}
      />
      <Chart
        label="Revenue by plan per quarter"
        type="bar"
        height={240}
        colorBlindMode
        categories={["Q1", "Q2", "Q3", "Q4"]}
        series={[
          { name: "Free", data: [8, 12, 15, 19] },
          { name: "Pro", data: [21, 25, 30, 34] },
          { name: "Team", data: [14, 18, 17, 24] },
        ]}
      />
    </Preview>
  ),
  bars: () => (
    <Preview>
      <Chart
        label="Monthly balance: losses in red, profits in green"
        type="bar"
        height={240}
        colorRanges={[
          { from: -100, to: -1, color: "error", name: "Loss" },
          { from: 0, to: 100, color: "success", name: "Profit" },
        ]}
        categories={MONTHS}
        series={[{ name: "Balance", data: [12, 18, -7, -21, 9, 27] }]}
      />
      <Chart
        label="Monthly inflation"
        type="bar"
        height={240}
        dataLabels
        dataLabelPosition="top"
        backgroundBars
        valueSuffix="%"
        categories={MONTHS}
        series={[{ name: "Inflation", data: [2.3, 3.1, 4.0, 10.1, 4.0, 3.6] }]}
      />
    </Preview>
  ),
  zoom: () => (
    <Preview>
      <Chart label="Sales, zoomable" type="area" zoom toolbar categories={MONTHS} series={SALES} />
    </Preview>
  ),
  sync: () => (
    <Preview>
      <Chart
        label="Online sales"
        group="docs-sync"
        height={160}
        categories={MONTHS}
        series={[SALES[0] as (typeof SALES)[0]]}
      />
      <Chart
        label="In-store sales"
        group="docs-sync"
        type="bar"
        height={160}
        colors={["warning"]}
        categories={MONTHS}
        series={[SALES[1] as (typeof SALES)[0]]}
      />
    </Preview>
  ),
  annotations: () => (
    <Preview>
      <Chart
        label="Sales with notes"
        categories={MONTHS}
        series={SALES}
        annotations={[
          { axis: "x", x: "Mar", label: "Campaign", color: "warning" },
          { axis: "y", y: 60, label: "Goal", color: "success" },
        ]}
      />
    </Preview>
  ),
  stock: () => (
    <Preview>
      <Chart
        label="ACME share price"
        type="candlestick"
        xType="datetime"
        valuePrefix="$"
        height={220}
        paneHeight={90}
        navigator
        indicators={[{ type: "sma", period: 10 }, { type: "volume" }, { type: "rsi", period: 14 }]}
        categories={STOCK_DAYS}
        series={[{ name: "ACME", data: STOCK_BARS }]}
      />
    </Preview>
  ),
  sankey: () => (
    <Preview>
      <Chart
        label="Office energy use"
        type="sankey"
        height={240}
        valueSuffix=" MWh"
        nodes={[
          { id: "solar", title: "Solar panels", color: "warning" },
          { id: "grid", title: "Grid", color: "info-dark" },
          { id: "building", title: "Building", color: "primary" },
          { id: "heating", title: "Heating", color: "error" },
          { id: "computers", title: "Computers", color: "info" },
        ]}
        edges={[
          { source: "solar", target: "building", value: 42 },
          { source: "grid", target: "building", value: 64 },
          { source: "building", target: "heating", value: 48 },
          { source: "building", target: "computers", value: 58 },
        ]}
      />
    </Preview>
  ),
  finance: () => (
    <Preview>
      <Chart
        label="Release plan"
        type="timeline"
        height={200}
        series={[
          {
            name: "Release",
            data: [
              { x: "Design", y: ["2026-03-02", "2026-03-13"], color: "info" },
              { x: "Build", y: ["2026-03-09", "2026-04-03"] },
              { x: "Test", y: ["2026-03-30", "2026-04-17"], color: "warning" },
            ],
          },
        ]}
      />
    </Preview>
  ),
  waterfall: () => (
    <Preview>
      <Chart
        label="Cash flow in 2025 (thousands of dollars)"
        type="waterfall"
        height={260}
        dataLabels
        categories={[
          "Opening",
          "Sales",
          "Services",
          "Salaries",
          "Rent",
          "First half",
          "Taxes",
          "Closing",
        ]}
        series={[
          {
            name: "Cash",
            data: [120, 260, 85, -190, -45, { isSubtotal: true }, -60, { isTotal: true }],
          },
        ]}
      />
    </Preview>
  ),
  crossfilter: () => (
    <Preview>
      <Chart
        label="Orders by region (select columns to filter the revenue)"
        type="bar"
        group="docs-regions"
        crossfilter="highlight"
        allowMultipleDataPointsSelection
        height={200}
        colors={["info"]}
        categories={["North", "South", "East", "West", "Central"]}
        series={[{ name: "Orders", data: [420, 310, 280, 390, 150] }]}
      />
      <Chart
        label="Revenue by region (thousands of dollars)"
        type="bar"
        group="docs-regions"
        crossfilter="filter"
        height={200}
        colors={["warning"]}
        categories={["North", "South", "East", "West", "Central"]}
        series={[{ name: "Revenue", data: [96, 71, 64, 88, 35] }]}
      />
    </Preview>
  ),
  geo: () => (
    <Preview>
      <Chart
        label="Population by state, millions"
        type="geo"
        geoLayout="hex"
        dataLabels
        valueSuffix="M"
        height={280}
        regions={GEO_PREVIEW_REGIONS}
        hexCells={GEO_PREVIEW_CELLS}
      />
    </Preview>
  ),
  "hex-tiles": () => (
    <Preview>
      <Chart
        label="Population by state, millions"
        type="geo"
        geoLayout="hex"
        dataLabels
        valueSuffix="M"
        height={280}
        regions={GEO_PREVIEW_REGIONS}
        hexCells={GEO_PREVIEW_CELLS}
      />
    </Preview>
  ),
  streamgraph: () => (
    <Preview>
      <Chart
        label="Device share of visits by quarter"
        type="streamgraph"
        streamOffset="silhouette"
        height={240}
        categories={["Q1", "Q2", "Q3", "Q4", "Q5"]}
        series={[
          { name: "Phone", data: [40, 44, 52, 58, 66] },
          { name: "Desktop", data: [46, 42, 38, 34, 30] },
          { name: "Tablet", data: [14, 14, 10, 8, 4] },
        ]}
      />
    </Preview>
  ),
  violin: () => (
    <Preview>
      <Chart
        label="Test scores by class"
        type="violin"
        violinBox
        violinWhiskers="tukey"
        height={240}
        categories={["Class A", "Class B"]}
        series={[
          {
            name: "Score",
            data: [
              { y: [42, 55, 58, 61, 66, 68, 71, 73, 74, 78, 81, 86, 92] },
              { y: [31, 38, 44, 48, 52, 55, 60, 62, 64, 71, 75] },
            ],
          },
        ]}
      />
    </Preview>
  ),
  beeswarm: () => (
    <Preview>
      <Chart
        label="Build times by branch, in minutes"
        type="beeswarm"
        beeswarmSpread="jitter"
        height={220}
        series={[
          { name: "Main", data: [4, 5, 6, 6, 7, 8, 8, 9, 11] },
          { name: "Release", data: [9, 10, 12, 13, 15, 16, 18] },
        ]}
      />
    </Preview>
  ),
  waffle: () => (
    <Preview>
      <Chart
        label="Seats sold by section"
        type="waffle"
        total={100}
        columns={20}
        fillFrom="top"
        height={200}
        categories={["Stalls", "Circle", "Balcony"]}
        series={[{ name: "Seats", data: [52, 31, 17] }]}
      />
    </Preview>
  ),
  unit: () => (
    <Preview>
      <Chart
        label="Seats by party"
        type="unit"
        unitLayout="arc"
        height={220}
        categories={["Blue party", "Green party", "Red party"]}
        series={[{ name: "Seats", data: [42, 30, 18] }]}
      />
    </Preview>
  ),
  icicle: () => (
    <Preview>
      <Chart
        label="Online store visits by source and campaign this month"
        type="icicle"
        direction="left"
        leaf="extend"
        zoomType="both"
        dataLabels
        height={300}
        hierarchy={[
          {
            name: "Search",
            children: [
              { name: "Organic", value: 4200 },
              { name: "Ads", value: 1800 },
            ],
          },
          {
            name: "Social",
            children: [
              { name: "Video", value: 1500 },
              { name: "Photos", value: 900 },
            ],
          },
          { name: "Direct", value: 2600 },
          { name: "Email", value: 1100 },
        ]}
      />
    </Preview>
  ),
  sunburst: () => (
    <Preview>
      <Chart
        label="Support tickets by channel and topic this week"
        type="sunburst"
        startAngle={-90}
        endAngle={90}
        innerSize={40}
        leaf="stop"
        dataLabels
        disableZoomOnClick
        height={260}
        colors={["info", "warning", "success"]}
        hierarchy={[
          {
            name: "Email",
            children: [
              { name: "Billing", value: 34 },
              { name: "Login", value: 21 },
            ],
          },
          {
            name: "Chat",
            children: [
              { name: "Orders", value: 28 },
              { name: "Returns", value: 12 },
            ],
          },
          { name: "Phone", value: 18 },
        ]}
      />
    </Preview>
  ),
  tree: () => (
    <Preview>
      <Chart
        label="Plant families and their genera"
        type="tree"
        direction="radial"
        layoutType="cluster"
        edgeStyle="curved"
        height={400}
        hierarchy={{
          name: "Plants",
          children: [
            {
              name: "Rosaceae",
              children: [
                { name: "Rosa" },
                { name: "Malus" },
                { name: "Prunus" },
                { name: "Rubus" },
              ],
            },
            {
              name: "Fabaceae",
              children: [{ name: "Pisum" }, { name: "Lupinus" }, { name: "Acacia" }],
            },
            {
              name: "Asteraceae",
              children: [
                { name: "Aster" },
                { name: "Bellis" },
                { name: "Helianthus" },
                { name: "Lactuca" },
              ],
            },
            { name: "Poaceae", children: [{ name: "Oryza" }, { name: "Zea" }, { name: "Avena" }] },
          ],
        }}
      />
    </Preview>
  ),
  dumbbell: () => (
    <Preview>
      <Chart
        label="Pay gap by department (women and men, thousands of dollars)"
        type="dumbbell"
        horizontal
        height={260}
        markerSize={7}
        dumbbellColors={[["warning-dark", "info-dark"]]}
        localeText={{ start: "Women", end: "Men" }}
        categories={["Design", "Engineering", "Finance", "Marketing", "Sales", "Support"]}
        series={[
          {
            name: "Salary",
            data: [
              { y: [72, 78] },
              { y: [96, 104] },
              { y: [81, 92] },
              { y: [69, 71] },
              { y: [74, 86] },
              { y: [52, 55] },
            ],
          },
        ]}
      />
    </Preview>
  ),
  axes: () => (
    <Preview>
      <Chart
        label="Blog visits and social mentions"
        height={240}
        xTitle="Month"
        yaxis={[
          { title: "Blog visits" },
          { seriesName: "Social mentions", opposite: true, title: "Social mentions" },
        ]}
        categories={MONTHS}
        series={[
          { name: "Blog visits", type: "bar", data: [440, 505, 414, 671, 227, 413] },
          { name: "Social mentions", type: "line", data: [23, 42, 35, 27, 43, 22] },
        ]}
      />
    </Preview>
  ),
  select: () => (
    <Preview>
      <Chart
        label="Orders per weekday (select a column)"
        type="bar"
        height={240}
        colors={["info"]}
        defaultSelectedDataPoints={[{ seriesIndex: 0, dataPointIndex: 3 }]}
        categories={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        series={[{ name: "Orders", data: [44, 55, 41, 67, 22] }]}
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={chartOptions} />,
  props: () => (
    <PropsTable
      label="Chart content props"
      rows={[
        {
          react: "label",
          html: "table caption",
          type: "string",
          description: "Name of the chart and caption of its data table.",
        },
        {
          react: "series",
          html: "table columns",
          type: "{ name, data, type?, color? }[]",
          description:
            "The series. Values are numbers, `null` (a gap), `[x, y]` pairs, `[x, y, size]` (bubbles) or `{ x, y, color }`. Box plots take five values in `y`, range areas two. Pie, donut, radial bar and funnel charts draw the first series.",
        },
        {
          react: "nodes / edges",
          html: "table rows (source, target, value)",
          type: "{ id, title?, color? }[] / { source, target, value, color? }[]",
          description:
            "Sankey charts: the nodes (optional: names and colors) and the links between them, by node id.",
        },
        {
          react: "hierarchy",
          html: "table rows (name, parent, value)",
          type: "{ id?, name?, value?, color?, children? } (one or a list)",
          description:
            "Tree charts: the nodes, nested. A parent's value is the sum of its children.",
        },
        {
          react: "collapsedNodes / defaultCollapsedNodes / onCollapsedNodesChange",
          html: "data-ok-collapsed-nodes · ok:chart:expand",
          type: "string[]",
          description:
            "Tree charts with `enableExpandCollapse`: the ids of the nodes whose children are hidden.",
        },
        {
          react: "drillNode / defaultDrillNode / onDrillNodeChange",
          html: "data-ok-drill-node · ok:chart:drill",
          type: "string | null",
          description: "Sunburst and icicle charts: the id of the branch the chart is zoomed into.",
        },
        {
          react: "indicators",
          html: "data-ok-indicators",
          type: "{ type, period?, stdDev?, fastPeriod?, slowPeriod?, signalPeriod?, atrPeriod?, multiplier?, color? }[]",
          description:
            'Stock charts: indicators of the first series. HTML writes `"type numbers color; …"`, such as `"bollinger 20 2; rsi 14"`.',
        },
        {
          react: "axisTitles",
          html: "data-ok-axis-titles",
          type: "string[]",
          description:
            'Sankey charts: a title per column. HTML separates them with semicolons: `"2024; 2025"`.',
        },
        {
          react: "categories",
          html: "row headers",
          type: "(string | number | Date)[]",
          description: "Category labels, or dates with `xType` `datetime`.",
        },
        {
          react: "colors",
          html: "data-ok-color on column headers",
          type: "ChartColor[]",
          description:
            "Series colors in order, such as `info` or `primary-dark`. In pie, donut and radial bar charts, the colors of the slices or rings (`data-ok-color` on their cells).",
        },
        {
          react: "yTitle / valuePrefix / valueSuffix / locale",
          html: "data-ok-y-title / data-ok-value-prefix / data-ok-value-suffix / data-ok-locale",
          type: "string",
          description:
            "Value axis title, text around values, and the locale of numbers and months.",
        },
        {
          react: "yaxis",
          html: "data-ok-yaxis · data-ok-y-axis on column headers",
          type: "ChartYAxis | ChartYAxis[]",
          description:
            'Value axes: `{ seriesName, opposite, logarithmic, logBase, reversed, tickAmount, min, max, title, show }`. HTML writes `"title Sales; opposite logarithmic title Visits"` and the axis index on each series\' column header.',
        },
        {
          react: "xTitle",
          html: "data-ok-x-title",
          type: "string",
          description: "Title of the x axis, drawn under its labels.",
        },
        {
          react: "totalLabel",
          html: "data-ok-total-label",
          type: "string",
          description: "Label of the total in the center of a donut or a radial bar chart.",
        },
        {
          react: "valueFormatter / labelFormatter",
          html: "instance.setFormatters({ value, label })",
          type: "function",
          description: "Custom text of values and x labels.",
        },
        {
          react: "xLabel",
          html: "first column header",
          type: "string",
          description:
            'Header of the table\'s first column ("Category", "Date" or "X" by default).',
        },
        {
          react: "hiddenSeries / defaultHiddenSeries / onHiddenSeriesChange",
          html: "aria-pressed on legend buttons · ok:chart:toggle",
          type: "number[]",
          description:
            "Indexes of the series hidden through the legend (categories in pie, donut and radial bar charts).",
        },
        {
          react: "onActiveChange",
          html: "ok:chart:active",
          type: "function",
          description: "The category or point under the pointer or the keyboard.",
        },
        {
          react: "annotations",
          html: "ul[data-ok-chart-annotations] › li",
          type: "{ axis, x?, x2?, y?, y2?, label?, color? }[]",
          description: "Lines, bands and points with a label.",
        },
        {
          react: "colorRanges",
          html: "data-ok-color-ranges",
          type: "{ from, to, color, name? }[]",
          description:
            'Heatmaps and treemaps: values in a range take its color. HTML writes `"from to color name; …"`.',
        },
        {
          react: "group / brushTarget",
          html: "data-ok-group / data-ok-brush-target",
          type: "string",
          description: "Synchronized group name; the id of the chart a brush chart zooms.",
        },
        {
          react: "zoomRange / defaultZoomRange / onZoomRangeChange",
          html: "instance.zoomRange · setZoomRange · ok:chart:zoom",
          type: "{ min, max } | null",
          description: "The visible window of the x axis: category indexes, or x values.",
        },
        {
          react: "selectedDataPoints / defaultSelectedDataPoints / onDataPointSelection",
          html: "instance.selectedDataPoints · setSelectedDataPoints · toggleDataPointSelection · ok:chart:select",
          type: "{ seriesIndex, dataPointIndex }[]",
          description:
            "The selected values. A click selects the value under the pointer, Enter or Space the active one.",
        },
        {
          react: "dataLabelFormatter",
          html: "instance.setFormatters({ dataLabel })",
          type: "function",
          description: "Custom text of the values printed on the chart.",
        },
        {
          react: "localeText",
          html: "part headers · instance.setLocaleText",
          type: "object",
          description: "Value names, toolbar button names and the download error.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the plot and shows the first category."],
        ["Right arrow / Down arrow", "Shows the next category or point."],
        ["Left arrow / Up arrow", "Shows the previous category or point."],
        ["Arrow keys (heatmap, treemap)", "Shows the nearest cell in the arrow's direction."],
        ["Arrow keys (Sankey)", "Shows the next or previous node or link, column by column."],
        [
          "Arrow keys (tree)",
          "Toward the leaves: the first child. Toward the root: the parent. Across: the next or previous node of the level. Radial trees: Right arrow and Left arrow go out and in, Down arrow and Up arrow across.",
        ],
        [
          "Enter / Space (tree)",
          "Hides or shows the children of the node (`enableExpandCollapse`).",
        ],
        [
          "Arrow keys (sunburst)",
          "Right arrow: the first child. Left arrow: the parent. Down arrow and Up arrow: the next or previous arc of the ring.",
        ],
        [
          "Enter / Space (sunburst)",
          "Zooms into the arc's branch. On the center, zooms out one level.",
        ],
        [
          "Arrow keys (icicle)",
          "Away from the root: the first child. Toward the root: the parent. Along the level: the next or previous cell.",
        ],
        [
          "Enter / Space (icicle)",
          "Zooms into the cell's branch. On the branch's own cell or an ancestor, zooms out to it.",
        ],
        ["Escape (sunburst, icicle)", "Zooms out one level. At the top, hides the tooltip."],
        ["Home / End", "Shows the first or last category or point."],
        [
          "Enter / Space",
          "Selects the category, slice, cell or point the tooltip shows, or clears it.",
        ],
        ["Escape", "Hides the tooltip. Pressed again, resets the zoom."],
        ["+ / -", "Zooms in or out (charts with zoom, brush charts)."],
        ["Shift + Left arrow / Right arrow", "Pans the zoomed range (and the navigator's window)."],
        ["0", "Resets the zoom."],
      ]}
    />
  ),
};

/** Chart docs page (ADR-0019). */
export function ChartDocs() {
  return <GuideDocs sections={chartSections} previews={PREVIEWS} />;
}
