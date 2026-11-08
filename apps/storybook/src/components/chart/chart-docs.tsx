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
    body: "A chart shows values as lines, areas, columns, bars or points. In HTML, you write the data as a table. The runtime reads the table and draws the chart as SVG next to it, with a legend and a tooltip. The table stays in the page, visually hidden, so screen readers can read every value. Without JavaScript, the table stays visible. In React, you pass the data as props, and the component renders the same chart and table.",
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

To mix types, give a series its own \`type\`. In HTML, set \`data-ok-type\` on the column header of the series.`,
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
    body: "The legend shows one button per series. Selecting a button hides its series and fits the axis to the series that are left. Select it again to show the series. `legend` places the legend at the `top` (the default), `right` or `bottom`, or hides it with `none`. Charts with one series have no legend. On screens narrower than 600px, a right legend moves below the chart.",
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
- **Instance:** \`runtime.get(element, "chart")\` returns \`{ hiddenSeries, setHiddenSeries(list), active, setActive(active), setFormatters(formatters), refresh() }\`. The methods don't fire events. The chart redraws by itself when the table or an option changes.
- **React:** \`onHiddenSeriesChange(hidden)\` and \`onActiveChange(active)\`; controlled with \`hiddenSeries\`, uncontrolled with \`defaultHiddenSeries\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The plot is one tab stop. When it gets focus from the keyboard, the tooltip shows the first category. The arrow keys move through the categories, or through the points of a scatter chart.",
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
            "The series. Values are numbers, `null` (a gap), `[x, y]` pairs or `{ x, y, color }`.",
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
          description: "Series colors in order, such as `info` or `primary-dark`.",
        },
        {
          react: "yTitle / valuePrefix / valueSuffix / locale",
          html: "data-ok-y-title / data-ok-value-prefix / data-ok-value-suffix / data-ok-locale",
          type: "string",
          description:
            "Value axis title, text around values, and the locale of numbers and months.",
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
          description: "Indexes of the series hidden through the legend.",
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
