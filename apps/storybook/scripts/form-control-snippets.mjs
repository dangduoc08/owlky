// Writes the Form control HTML snippets
// (packages/html/src/components/form-control/examples/<story>-<file>.html) from the React
// examples, so both implementations start from the same markup. Run after `pnpm build` (bundles
// against packages/*/dist):
//   node apps/storybook/scripts/form-control-snippets.mjs
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
const out = resolve(root, "packages/html/src/components/form-control/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/components/form-control");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { formControlStories, FORM_CONTROL_FILES } from "${folder}/form-control-examples.tsx";
const html = {};
for (const [story, groups] of Object.entries(formControlStories))
  groups.forEach((group, index) => {
    html[story + "-" + FORM_CONTROL_FILES[story][index][1]] = renderToStaticMarkup(
      createElement(Fragment, null, group.content),
    );
  });
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

/** One element per line, indented by nesting; spans stay whole (control icons, label text). */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    // Labels and helper texts stay on one line (a line break before the asterisk would be a space).
    .replace(
      /<(legend|label|span|p)\b[^>]*data-ok-form-(?:label|helper-text)[^>]*>[\s\S]*?<\/\1>/g,
      protect,
    )
    .replace(/<(span)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g, protect)
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

for (const [name, markup] of Object.entries(html)) {
  const snippet = markup
    .replace(/<link rel="preload"[^>]*>/g, "")
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ style="[^"]*"/g, "")
    .replace(/ data-ok-state="[^"]*"/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden|checked)=""/g, " $1")
    .replace(/(<(?:img|br|input)\b[^>]*?)\/>/g, "$1>");
  writeFileSync(resolve(out, `${name}.html`), `${pretty(snippet)}\n`);
  console.log(`${name}.html`);
}
