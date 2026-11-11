// Writes the Chart HTML snippets (packages/html/src/components/chart/examples/<story>-group.html)
// from the same example data as the React stories (src/components/chart/chart-data.ts), so both
// implementations render the same charts. Run after `pnpm build` (reads packages/core/dist):
//   node apps/storybook/scripts/chart-snippets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const {
  chartAnnotationItems,
  chartAttributes,
  chartTextAttributes,
  chartTrellisAttributes,
  chartTrellisPanels,
  renderChart,
} = await import(resolve(root, "packages/core/dist/index.js"));
// Plain data with type-only imports: Node strips the types.
const { chartExamples } = await import(resolve(here, "../src/components/chart/chart-data.ts"));
const out = resolve(root, "packages/html/src/components/chart/examples");
mkdirSync(out, { recursive: true });

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const attributes = (map) =>
  Object.entries(map)
    .map(([name, value]) => (value === "" ? ` ${name}` : ` ${name}="${escapeHtml(value)}"`))
    .join("");

/** A header cell: spans and scope as React renders them. */
const headerCell = (cell) =>
  `<th scope="${cell.colSpan ? "colgroup" : "col"}"${cell.colSpan ? ` colspan="${cell.colSpan}"` : ""}${cell.rowSpan ? ` rowspan="${cell.rowSpan}"` : ""}${attributes(cell.attrs)}>${escapeHtml(cell.text)}</th>`;

/** A data table's rows (the chart's own, or a drilldown level's), as React renders them. */
const tableLines = (table) => [
  "    <thead>",
  `      <tr>${table.head.map(headerCell).join("")}</tr>`,
  ...(table.parts.length
    ? [
        `      <tr>${table.parts.map((cell) => `<th scope="col"${attributes(cell.attrs)}>${escapeHtml(cell.text)}</th>`).join("")}</tr>`,
      ]
    : []),
  "    </thead>",
  "    <tbody>",
  ...table.rows.map(
    (row) =>
      `      <tr><th scope="row"${attributes(row.header.attrs)}>${escapeHtml(row.header.text)}</th>${row.cells
        .map((cell) => `<td${attributes(cell.attrs)}>${escapeHtml(cell.text)}</td>`)
        .join("")}</tr>`,
  ),
  "    </tbody>",
];

/** One chart: the root's attributes, its data table and any HTML-only markup (`html`). */
function figure(props, html = []) {
  const rootAttributes = {
    ...(props.id ? { id: props.id } : {}),
    ...chartAttributes({
      ...props,
      xType:
        props.xType ??
        (props.type === "scatter" || props.type === "bubble" ? "numeric" : "category"),
    }),
    // Tree charts write their collapsed nodes, sunbursts their drilled node (React: the state,
    // at first the default).
    ...chartTextAttributes({
      ...props,
      collapsedNodes: props.collapsedNodes ?? props.defaultCollapsedNodes,
      drillNode: props.drillNode ?? props.defaultDrillNode,
    }),
  };
  const { table, drilldown } = renderChart({
    ...props,
    partLabels: props.localeText,
    width: 640,
    height: 320,
    idPrefix: "snippet",
  });
  // Annotations (phase 4): one list item each, after the table.
  const notes = chartAnnotationItems(props.annotations ?? []);
  return [
    `<figure${attributes(rootAttributes)}>`,
    "  <table data-ok-chart-data>",
    `    <caption>${escapeHtml(props.label)}</caption>`,
    ...tableLines(table),
    "  </table>",
    // Drilldown levels (ADR-0060): one table each after the chart's own.
    ...(drilldown?.tables ?? []).flatMap((level) => [
      `  <table data-ok-chart-drilldown="${escapeHtml(level.id)}"${level.type ? ` data-ok-type="${level.type}"` : ""}>`,
      `    <caption>${escapeHtml(level.name)}</caption>`,
      ...tableLines(level.table),
      "  </table>",
    ]),
    ...(notes.length
      ? [
          "  <ul data-ok-chart-annotations>",
          ...notes.map((item) => `    <li${attributes(item.attrs)}>${escapeHtml(item.text)}</li>`),
          "  </ul>",
        ]
      : []),
    ...html,
    "</figure>",
  ];
}

/** Stories with controls besides the chart (the live data buttons; markup as React renders it). */
const EXTRA = {
  "live-data": [
    '<div class="sb-chart-actions">',
    '  <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md">',
    "    <span data-ok-button-label>Add a point</span>",
    "  </button>",
    '  <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md">',
    "    <span data-ok-button-label>Reset</span>",
    "  </button>",
    "</div>",
  ],
};

/** A trellis (ADR-0060): the panels React renders, one chart each. */
function trellisLines(props, trellis) {
  const panels = chartTrellisPanels({ ...props, ...trellis });
  return [
    `<div${attributes(chartTrellisAttributes(trellis))} role="group" aria-label="${escapeHtml(props.label)}">`,
    ...(trellis.promote
      ? ['  <button type="button" data-ok-chart-trellis-back hidden>All panels</button>']
      : []),
    ...panels.flatMap((panel) => [
      "  <div data-ok-chart-trellis-panel>",
      trellis.promote
        ? `    <button type="button" data-ok-chart-trellis-header aria-expanded="false">${escapeHtml(panel.title)}</button>`
        : `    <div data-ok-chart-trellis-header>${escapeHtml(panel.title)}</div>`,
      ...figure({
        ...props,
        height: props.height ?? 200,
        label: `${props.label}: ${panel.title}`,
        series: panel.series,
        categories: panel.categories,
        yMin: panel.yMin,
        yMax: panel.yMax,
      }).map((line) => `    ${line}`),
      "  </div>",
    ]),
    "</div>",
  ];
}

for (const [story, { props, more = [], html, trellis }] of Object.entries(chartExamples)) {
  if (trellis) {
    writeFileSync(
      resolve(out, `${story}-group.html`),
      [...trellisLines(props, trellis), ""].join("\n"),
    );
    continue;
  }
  const lines = [
    ...figure(props, html),
    ...more.flatMap((chart) => figure(chart)),
    ...(EXTRA[story] ?? []),
    "",
  ];
  writeFileSync(resolve(out, `${story}-group.html`), lines.join("\n"));
}
console.log(`chart: wrote ${Object.keys(chartExamples).length} snippets`);
