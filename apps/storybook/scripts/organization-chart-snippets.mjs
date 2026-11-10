// Writes the Organization chart HTML snippets (packages/html/src/components/organization-chart/
// examples/<story>-<group>.html) from the React examples, so both implementations start from the
// same markup. Run after `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/organization-chart-snippets.mjs
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const require = createRequire(resolve(root, "packages/html/package.json"));
const { build } = await import(
  require.resolve("esbuild", { paths: [resolve(root, "node_modules/.pnpm/node_modules")] })
);
const out = resolve(root, "packages/html/src/components/organization-chart/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/components/organization-chart");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { organizationChartStories, ORGANIZATION_CHART_FILES } from "${folder}/organization-chart-examples.tsx";
import { StandardChartDemo } from "${folder}/standard-demo.tsx";
import { GroupChartDemo } from "${folder}/group-demo.tsx";
import { CollapsibleChartDemo } from "${folder}/collapsible-demo.tsx";
import { LazyChartDemo, reportsOf } from "${folder}/lazy-demo.tsx";
import { SearchChartDemo } from "${folder}/search-demo.tsx";
import { ZoomChartDemo } from "${folder}/zoom-demo.tsx";
import { OrganizationChart } from "@owlky/react";
import { PEOPLE } from "${folder}/organization-chart-data.ts";
const html = {};
for (const [story, groups] of Object.entries(organizationChartStories))
  groups.forEach((group, index) => {
    html[story + "-" + ORGANIZATION_CHART_FILES[story][index][1]] = renderToStaticMarkup(group.content);
  });
html["standard-group"] = renderToStaticMarkup(createElement(StandardChartDemo));
html["group-group"] = renderToStaticMarkup(createElement(GroupChartDemo));
html["collapsible-group"] = renderToStaticMarkup(createElement(CollapsibleChartDemo));
html["search-group"] = renderToStaticMarkup(createElement(SearchChartDemo));
html["zoom-group"] = renderToStaticMarkup(createElement(ZoomChartDemo));
// Lazy children: the chart as first rendered, then one template per lead with the nodes its
// load answers (rendered inside a collapsible chart, so they carry their own toggles). Each
// render numbers its ids from 1: the template's get the lead's id as a prefix.
const OPEN = /<ul data-ok-collapse=""[^>]*data-ok-organization-chart-children=""[^>]*>/;
const templates = PEOPLE.map((lead) => {
  const chart = renderToStaticMarkup(
    createElement(
      OrganizationChart,
      { enableExpandCollapse: true, label: "", "aria-label": "" },
      reportsOf(lead.id),
    ),
  );
  const start = chart.search(OPEN) + chart.match(OPEN)[0].length;
  const nodes = chart
    .slice(start, chart.length - "</ul></li></ul>".length)
    .replaceAll("_R_", "_R" + lead.id + "_");
  return '<template id="org-lazy-' + lead.id + '">' + nodes + "</template>";
});
html["lazy-group"] = renderToStaticMarkup(createElement(LazyChartDemo)) + templates.join("");
export { html };
`;
const result = await build({
  stdin: { contents: entry, resolveDir: resolve(here, ".."), loader: "tsx" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  jsx: "automatic",
  loader: { ".json": "json" },
  plugins: [
    {
      name: "owlky-dist",
      setup(builder) {
        builder.onResolve({ filter: /^@owlky\/(core|react)$/ }, ({ path }) => ({
          path: resolve(root, `packages/${path.slice("@owlky/".length)}/dist/index.js`),
        }));
      },
    },
  ],
  // The React package's dist imports other opt-in engines lazily; never needed for static markup.
  external: ["monaco-editor", "monaco-editor/*", "maplibre-gl", "@tiptap/*"],
  // react-dom/server reaches Node built-ins through require().
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "error",
});
const file = resolve(out, ".render.mjs");
writeFileSync(file, result.outputFiles[0].text);
const { html } = await import(file);
rmSync(file);

/** One element per line, indented by nesting; SVGs, buttons, list items and spans stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    .replace(/<(button|span)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g, protect)
    .replace(/<li role="menuitem"[\s\S]*?<\/li>/g, protect)
    .replace(/></g, ">\n<")
    .split("\n")
    .filter((line) => line.trim() !== "");
  let depth = 0;
  return lines
    .map((line) => {
      if (/^<\//.test(line)) depth--;
      const indented = `${"  ".repeat(Math.max(depth, 0))}${line}`;
      if (/^<[a-z][^>]*[^/]>$/.test(line) && !/^<(input|img|br|hr|link|meta)\b/.test(line)) depth++;
      return indented;
    })
    .join("\n")
    .replace(/@@kept:(\d+)@@/g, (_, index) => kept[Number(index)]);
}

/** React's generated ids (`useId`) as readable ones, unique in the snippet: `org-<story>-<n>`. */
function renameIds(markup, name) {
  const ids = new Map();
  return markup.replace(/_R[a-z]*_[0-9a-zA-Z]+_/g, (id) => {
    if (!ids.has(id)) ids.set(id, `org-${name.replace(/-group$/, "")}-${ids.size + 1}`);
    return ids.get(id);
  });
}

for (const [name, markup] of Object.entries(html)) {
  const snippet = renameIds(markup, name)
    .replace(/<link rel="preload"[^>]*>/g, "")
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ style="[^"]*"/g, "")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden)=""/g, " $1")
    .replace(/(<(?:img|input)\b[^>]*?)\/>/g, "$1>")
    // React's camelCase attribute names (the search field's input) as HTML writes them.
    .replace(/ autoComplete="/g, ' autocomplete="')
    // HTML triggers: the menu buttons open their menu through the popover runtime.
    .replace(
      /(<button\b[^>]*aria-haspopup="menu"[^>]*aria-controls="([^"]+)")/g,
      (_, button, menu) => `${button} data-ok-popover-open="${menu}"`,
    );
  // An empty children list (lazy nodes), status line or zoom value stays on one line: no whitespace inside it.
  const lines = pretty(snippet).replace(/(<(ul|p|output)\b[^>]*>)\n\s*(<\/\2>)/g, "$1$3");
  writeFileSync(resolve(out, `${name}.html`), `${lines}\n`);
  console.log(`${name}.html`);
}
