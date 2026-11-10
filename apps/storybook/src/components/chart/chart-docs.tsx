import { chartOptions } from "@owlky/core";
import chartApi from "@owlky/docs-content/api/chart.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Chart } from "@owlky/react";
import animationsGroup from "../../../../../packages/html/src/components/chart/examples/animations-group.html?raw";
import annotationsGroup from "../../../../../packages/html/src/components/chart/examples/annotations-group.html?raw";
import axisScalesGroup from "../../../../../packages/html/src/components/chart/examples/axis-scales-group.html?raw";
import brushGroup from "../../../../../packages/html/src/components/chart/examples/brush-group.html?raw";
import colorBlindGroup from "../../../../../packages/html/src/components/chart/examples/color-blind-group.html?raw";
import columnDataLabelsGroup from "../../../../../packages/html/src/components/chart/examples/column-data-labels-group.html?raw";
import columnRangesGroup from "../../../../../packages/html/src/components/chart/examples/column-ranges-group.html?raw";
import columnSingle from "../../../../../packages/html/src/components/chart/examples/column-single-group.html?raw";
import dataLabelsGroup from "../../../../../packages/html/src/components/chart/examples/data-labels-group.html?raw";
import funnelGroup from "../../../../../packages/html/src/components/chart/examples/funnel-group.html?raw";
import localizedGroup from "../../../../../packages/html/src/components/chart/examples/localized-group.html?raw";
import markerShapesGroup from "../../../../../packages/html/src/components/chart/examples/marker-shapes-group.html?raw";
import mixedGroup from "../../../../../packages/html/src/components/chart/examples/mixed-group.html?raw";
import multipleYAxesGroup from "../../../../../packages/html/src/components/chart/examples/multiple-y-axes-group.html?raw";
import selectionGroup from "../../../../../packages/html/src/components/chart/examples/selection-group.html?raw";
import sparklinesGroup from "../../../../../packages/html/src/components/chart/examples/sparklines-group.html?raw";
import stackTotalsGroup from "../../../../../packages/html/src/components/chart/examples/stack-totals-group.html?raw";
import synchronizedGroup from "../../../../../packages/html/src/components/chart/examples/synchronized-group.html?raw";
import timelineGroup from "../../../../../packages/html/src/components/chart/examples/timeline-group.html?raw";
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
    body: "The legend shows one button per series, or one per category in pie, donut and radial bar charts. Selecting a button hides its series and fits the axis to the series that are left. Select it again to show the series. `legend` places the legend at the `top` (the default), `right` or `bottom`, or hides it with `none`. Charts with one series have no legend. On screens narrower than 600px, a right legend moves below the chart. Set `legendValues` to show each item's value next to its name: the slice or ring value, or the last value of a series. `donutSize` sets the size of a donut's hole in percent of its radius (72 by default).",
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
- **\`ok:chart:zoom\`** fires when the zoom changes, with \`detail.range\` (\`{ min, max }\` or \`null\`) and \`detail.reason\`: \`user\` for the chart's own gestures, keys and buttons (cancelable), \`group\` or \`brush\` when a linked chart zoomed it.
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
