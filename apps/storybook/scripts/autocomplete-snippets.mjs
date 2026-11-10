// Writes the Autocomplete HTML snippets of the stories built from the upstream demos (Grouped,
// Asynchronous requests, Single value rendering, Virtualization:
// packages/html/src/components/autocomplete/examples/<story>-<file>.html) from the React examples,
// so both implementations start from the same markup. The Playground and Country select snippets
// are written by hand. It adds what only HTML needs: the chip template of a value drawn as a chip.
// Run after `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/autocomplete-snippets.mjs
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
const out = resolve(root, "packages/html/src/components/autocomplete/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/components/autocomplete");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { autocompleteStories, AUTOCOMPLETE_FILES } from "${folder}/autocomplete-examples.tsx";
import { LoadOnOpenDemo } from "${folder}/async-demo.tsx";
const html = {};
for (const story of ["grouped", "single", "virtualization"])
  autocompleteStories[story].forEach((group, index) => {
    html[story + "-" + AUTOCOMPLETE_FILES[story][index][1]] = renderToStaticMarkup(
      createElement(Fragment, null, group.content),
    );
  });
html["async-load-on-open"] = renderToStaticMarkup(createElement(LoadOnOpenDemo));
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

/** One element per line, indented by nesting; spans, options and icons stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/g, protect)
    .replace(/<li\b[^>]*>[^<]*<\/li>/g, protect)
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/g, protect)
    .replace(/<(span|label|legend)\b[^>]*>(?:(?!<\/?\1\b|@@kept)[\s\S])*<\/\1>/g, protect)
    .replace(/<div\b[^>]*data-ok-autocomplete-(?:no-options|loading)[^>]*>[^<]*<\/div>/g, protect)
    .replace(/></g, ">\n<")
    .split("\n")
    .filter((line) => line.trim() !== "");
  // Kept parts may hold other kept parts (a button in an adornment).
  const restore = (text) =>
    text.replace(/\n?@@kept:(\d+)@@\n?/g, (_, index) => restore(kept[Number(index)]));
  let depth = 0;
  return lines
    .map((line) => {
      if (/^<\//.test(line)) depth--;
      const indented = `${"  ".repeat(Math.max(depth, 0))}${line}`;
      if (/^<[a-z][^>]*[^/]>$/.test(line) && !/^<(input|img|br|hr|link|meta)\b/.test(line)) depth++;
      return indented;
    })
    .join("\n")
    .replace(/@@kept:(\d+)@@/g, (_, index) => restore(kept[Number(index)]));
}

const clean = (markup) =>
  markup
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ autoComplete="off"/g, ' autocomplete="off"')
    .replace(/ style="[^"]*"/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden|checked|selected|readonly)=""/g, " $1")
    .replace(/(<(?:img|br|input)\b[^>]*?)\/>/g, "$1>");

/** A value drawn as a chip: its chip, emptied, becomes the template of new values. */
function addChipTemplate(markup) {
  const start = markup.indexOf("<span data-ok-chip");
  if (start < 0) return markup;
  let depth = 0;
  let end = start;
  const tag = /<(\/?)span\b[^>]*>/g;
  tag.lastIndex = start;
  for (let match = tag.exec(markup); match; match = tag.exec(markup)) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) {
      end = match.index + match[0].length;
      break;
    }
  }
  const chip = markup
    .slice(start, end)
    .replace(/ data-ok-value="[^"]*"/, "")
    .replace(/(<span data-ok-chip-label="">)[^<]*(<\/span>)/, "$1$2")
    .replace(/ aria-label="Remove [^"]*"/, ' aria-label="Remove"');
  const rootStart = markup.lastIndexOf("<div data-ok-autocomplete", start);
  const rootEnd = markup.indexOf(">", rootStart) + 1;
  return `${markup.slice(0, rootEnd)}<template data-ok-autocomplete-tag="">${chip}</template>${markup.slice(rootEnd)}`;
}

for (const [name, raw] of Object.entries(html)) {
  const markup = name.startsWith("single-") ? addChipTemplate(raw) : raw;
  writeFileSync(resolve(out, `${name}.html`), `${pretty(clean(markup))}\n`);
  console.log(`${name}.html`);
}
