// Writes the Chart HTML snippets (packages/html/src/components/chart/examples/<story>-group.html)
// from the same example data as the React stories (src/components/chart/chart-data.ts), so both
// implementations render the same charts. Run after `pnpm build` (reads packages/core/dist):
//   node apps/storybook/scripts/chart-snippets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const { chartAttributes, renderChart } = await import(resolve(root, "packages/core/dist/index.js"));
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

/** One chart: the root's attributes and its data table. */
function figure(props) {
  const rootAttributes = {
    ...chartAttributes({
      ...props,
      xType:
        props.xType ??
        (props.type === "scatter" || props.type === "bubble" ? "numeric" : "category"),
    }),
    ...(props.yTitle ? { "data-ok-y-title": props.yTitle } : {}),
    ...(props.totalLabel ? { "data-ok-total-label": props.totalLabel } : {}),
    ...(props.valuePrefix ? { "data-ok-value-prefix": props.valuePrefix } : {}),
    ...(props.valueSuffix ? { "data-ok-value-suffix": props.valueSuffix } : {}),
    ...(props.locale ? { "data-ok-locale": props.locale } : {}),
  };
  const { table } = renderChart({ ...props, width: 640, height: 320, idPrefix: "snippet" });
  return [
    `<figure${attributes(rootAttributes)}>`,
    "  <table data-ok-chart-data>",
    `    <caption>${escapeHtml(props.label)}</caption>`,
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
    "  </table>",
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

for (const [story, { props, more = [] }] of Object.entries(chartExamples)) {
  const lines = [...[props, ...more].flatMap(figure), ...(EXTRA[story] ?? []), ""];
  writeFileSync(resolve(out, `${story}-group.html`), lines.join("\n"));
}
console.log(`chart: wrote ${Object.keys(chartExamples).length} snippets`);
