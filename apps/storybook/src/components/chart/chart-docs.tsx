import { chartOptions } from "@owlky/core";
import { Chart } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SALES = [
  { name: "Online", data: [31, 40, 28, 51, 42, 69] },
  { name: "In store", data: [11, 32, 45, 32, 34, 52] },
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

To mix types in line, area, bar, scatter, box plot, bubble and range area charts, give a series its own \`type\`. In HTML, set \`data-ok-type\` on the column header of the series.`,
    html: `<figure data-ok-chart data-ok-type="bar" data-ok-x-type="category" data-ok-curve="smooth"
  data-ok-legend="top" data-ok-fill="gradient" data-ok-y-title="Points">
  <table data-ok-chart-data>
    <caption>Points per month</caption>
    <thead>
      <tr>
        <th scope="col">Month</th>
        <th scope="col" data-ok-type="bar" data-ok-color="primary-dark">Team A</th>
        <th scope="col" data-ok-type="line" data-ok-color="info">Team B</th>
      </tr>
    </thead>
    <tbody>…</tbody>
  </table>
</figure>`,
    react: `<Chart
  label="Points per month"
  type="bar"
  yTitle="Points"
  categories={["Jan", "Feb", "Mar"]}
  series={[
    { name: "Team A", type: "bar", data: [22, 12, 21] },
    { name: "Team B", type: "line", data: [31, 26, 35] },
  ]}
/>`,
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
    react: `<Chart
  label="Cash flow"
  type="bar"
  xType="datetime"
  valueSuffix="%"
  categories={["2012-01-01", "2012-02-01", "2012-03-01"]}
  series={[{ name: "Cash flow", data: [-12.5, 3.2, 7.1] }]}
/>`,
  },
  {
    id: "colors",
    title: "Set colors",
    body: "Series use the theme palette in order: primary dark, warning, info, error, success and then darker shades. To pick colors, use `colors` in React or `data-ok-color` on each column header in HTML. A color is a palette name, such as `info`, or a palette name and a shade, such as `primary-dark`. To color a single value, such as negative columns, give the point a `color` (React) or the cell a `data-ok-color` (HTML). Colors follow the theme and the preset, in light and dark mode.",
    html: `<td data-ok-color="error">-41.2</td>`,
    react: `series={[{ name: "Cash flow", data: [{ y: 19.8, color: "success" }, { y: -41.2, color: "error" }] }]}`,
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
    react: `<Chart
  label="Visits by page and device"
  type="treemap"
  series={[
    { name: "Desktops", data: [{ x: "Home", y: 60 }, { x: "Pricing", y: 41 }] },
    { name: "Mobile", data: [{ x: "Docs", y: 51 }, { x: "Blog", y: 30 }] },
  ]}
/>`,
  },
  {
    id: "stages",
    title: "Show stages and changes",
    body: `- **Funnels:** \`funnel\` draws the first series as bars centered on one axis, each as long as its share of the largest value, such as the stages of a sign-up flow. For a pyramid, order the values from the smallest to the largest. \`barHeight\` sets the thickness (80% by default).
- **Slopes:** \`slope\` joins each series' values across a few categories, usually two, such as before and after. The values print beside the first and last points, and the scale fits the data.`,
    html: `<figure data-ok-chart data-ok-type="funnel" … data-ok-data-labels>`,
    react: `<Chart label="Sign-ups" type="funnel" dataLabels categories={steps} series={[{ name: "People", data: [1380, 990, 548, 200] }]} />`,
  },
  {
    id: "sparklines",
    title: "Fit charts in cards and table cells",
    body: "Set `sparkline` (`data-ok-sparkline` in HTML) to draw a chart without axes, grid or legend, such as a trend in a dashboard card or a table cell. A sparkline fills its container: give the container a height, or set `height` for the least height (40px by default). The tooltip, the keyboard and the data table still work.",
    html: `<div class="card-trend">
  <figure data-ok-chart data-ok-type="area" data-ok-x-type="category" data-ok-curve="smooth"
    data-ok-legend="top" data-ok-fill="gradient" data-ok-sparkline data-ok-height="48">
    <table data-ok-chart-data>…</table>
  </figure>
</div>`,
    react: `<Chart label="Visits this week" type="area" sparkline height={48} categories={days} series={visits} />`,
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

export function Requests({ source }) {
  const [points, setPoints] = useState([]);
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
    id: "labels",
    title: "Print values on the chart",
    body: "Set `dataLabels` (`data-ok-data-labels` in HTML) to print values on the chart: percentages on pie and donut slices, values inside columns and bars, and values above the points of lines, areas and radars. A label is left out where it doesn't fit, such as on a short column. The tooltip and the data table still show every value.",
    html: `<figure data-ok-chart data-ok-type="pie" … data-ok-data-labels>`,
    react: `<Chart label="Share of visits" type="pie" dataLabels categories={devices} series={visits} />`,
  },
  {
    id: "stacked",
    title: "Stack and compare series",
    body: "Set `stacked` to put the series of a category on top of each other, so the column shows their total. Without it, columns of several series stand side by side. Only the end of each column is rounded.",
  },
  {
    id: "values",
    title: "Format values and axes",
    body: "`valuePrefix` and `valueSuffix` add text around every value, such as a currency or a percent sign. `locale` sets the number format and the month names. `yMin` and `yMax` fix the value axis, and `yTitle` names it. For anything else, pass `valueFormatter(value, series)` and `labelFormatter(x)` in React, or call `setFormatters({ value, label })` on the HTML instance. The axis gets `series` -1.",
    html: `<figure data-ok-chart … data-ok-value-prefix="$" data-ok-locale="de-DE" data-ok-y-min="0" data-ok-y-max="100">`,
    react: `<Chart label="Revenue" valuePrefix="$" locale="de-DE" yMin={0} yMax={100} series={series} />`,
  },
  {
    id: "legend",
    title: "Use the legend",
    body: "The legend shows one button per series, or one per category in pie, donut and radial bar charts. Selecting a button hides its series and fits the axis to the series that are left. Select it again to show the series. `legend` places the legend at the `top` (the default), `right` or `bottom`, or hides it with `none`. Charts with one series have no legend. On screens narrower than 600px, a right legend moves below the chart.",
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
- **React:** \`onHiddenSeriesChange(hidden)\` and \`onActiveChange(active)\`; controlled with \`hiddenSeries\`, uncontrolled with \`defaultHiddenSeries\`.`,
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
- The tooltip is a status region, so screen readers announce the values the keyboard moves to.
- Legend buttons report their state with \`aria-pressed\`. A hidden series keeps a hollow marker and crossed-out text, so the state doesn't rely on color.
- Axis labels use the secondary text color, which meets a contrast ratio of at least 4.5:1 in light and dark mode.`,
  },
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
        legend="right"
        categories={MONTHS}
        series={SALES}
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
        ["Home / End", "Shows the first or last category or point."],
        ["Escape", "Hides the tooltip."],
      ]}
    />
  ),
};

/** Chart docs page (ADR-0019). */
export function ChartDocs() {
  return <GuideDocs sections={chartSections} previews={PREVIEWS} />;
}
