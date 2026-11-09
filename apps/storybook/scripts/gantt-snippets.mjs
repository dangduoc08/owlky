// Writes the Gantt HTML snippets (packages/html/src/components/gantt/examples/<story>-<group>.html)
// from the shared examples (apps/storybook/src/components/gantt/gantt-data.ts): the React root's
// attributes and its data table, which the HTML runtime turns into the same treegrid. Run after
// `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/gantt-snippets.mjs
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const require = createRequire(resolve(root, "packages/html/package.json"));
const { build } = await import(
  require.resolve("esbuild", { paths: [resolve(root, "node_modules/.pnpm/node_modules")] })
);
const out = resolve(root, "packages/html/src/components/gantt/examples");
mkdirSync(out, { recursive: true });
for (const file of readdirSync(out)) if (file.endsWith(".html")) rmSync(resolve(out, file));

const folder = resolve(here, "../src/components/gantt");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Gantt } from "@owlky/react";
import { ganttExamples } from "${folder}/gantt-data.ts";
import { EditingGanttDemo } from "${folder}/gantt-editing-demo.tsx";
const html = {};
for (const [story, { groups }] of Object.entries(ganttExamples))
  for (const group of groups)
    html[story + "-" + group.file] = renderToStaticMarkup(createElement(Gantt, group.props));
html["editing-group"] = renderToStaticMarkup(createElement(EditingGanttDemo));
export { html };
`;
const result = await build({
  stdin: { contents: entry, resolveDir: resolve(here, ".."), loader: "tsx" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  jsx: "automatic",
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
  external: ["monaco-editor", "monaco-editor/*", "maplibre-gl", "@tiptap/*"],
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "error",
});
const file = resolve(out, ".render.mjs");
writeFileSync(file, result.outputFiles[0].text);
const { html } = await import(file);
rmSync(file);

/** The root's opening tag (without React-only attributes) and its data table, one row per line. */
function snippet(markup) {
  const open = (markup.match(/^<div\b[^>]*>/) ?? [""])[0]
    .replace(/ data-ok-runtime="off"/, "")
    .replace(/ data-ok-ready=""/, "")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1");
  const table = (markup.match(/<table data-ok-gantt-data[\s\S]*?<\/table>/) ?? [""])[0].replace(
    / (data-ok-[a-z-]+)=""/g,
    " $1",
  );
  const lines = table
    .replace(/<(caption|thead|tbody)>/g, "\n<$1>")
    .replace(/<\/(thead|tbody)>/g, "\n</$1>")
    .replace(/<tr\b/g, "\n<tr")
    .replace(/<\/table>/, "\n</table>")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const depth = /^<(caption|thead|tbody|\/thead|\/tbody)/.test(line)
        ? 2
        : /^<tr/.test(line)
          ? 3
          : /^<\/table/.test(line)
            ? 1
            : 1;
      return `${"  ".repeat(depth)}${line}`;
    });
  // What follows the Gantt (the editing demo's dialog) is kept as rendered.
  const end = '<div data-ok-gantt-status="" role="status"></div></div>';
  const rest = markup.includes(end)
    ? markup
        .slice(markup.indexOf(end) + end.length)
        .replace(/ data-ok-runtime="off"/g, "")
        .replace(/ style="[^"]*"/g, "")
        .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
        .replace(/></g, ">\n<")
    : "";
  return `${open}\n${lines.join("\n")}\n</div>\n${rest ? `${rest}\n` : ""}`;
}

for (const [name, markup] of Object.entries(html)) {
  writeFileSync(resolve(out, `${name}.html`), snippet(markup));
  console.log(`${name}.html`);
}
