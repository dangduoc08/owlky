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

for (const [story, { props }] of Object.entries(chartExamples)) {
  const rootAttributes = {
    ...chartAttributes({
      ...props,
      xType: props.xType ?? (props.type === "scatter" ? "numeric" : "category"),
    }),
    ...(props.yTitle ? { "data-ok-y-title": props.yTitle } : {}),
    ...(props.totalLabel ? { "data-ok-total-label": props.totalLabel } : {}),
    ...(props.valuePrefix ? { "data-ok-value-prefix": props.valuePrefix } : {}),
    ...(props.valueSuffix ? { "data-ok-value-suffix": props.valueSuffix } : {}),
    ...(props.locale ? { "data-ok-locale": props.locale } : {}),
  };
  const { table } = renderChart({ ...props, width: 640, height: 320, idPrefix: "snippet" });
  const lines = [
    `<figure${attributes(rootAttributes)}>`,
    "  <table data-ok-chart-data>",
    `    <caption>${escapeHtml(props.label)}</caption>`,
    "    <thead>",
    `      <tr>${table.head.map((cell) => `<th scope="col"${attributes(cell.attrs)}>${escapeHtml(cell.text)}</th>`).join("")}</tr>`,
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
    "",
  ];
  writeFileSync(resolve(out, `${story}-group.html`), lines.join("\n"));
}
console.log(`chart: wrote ${Object.keys(chartExamples).length} snippets`);
