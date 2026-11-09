// Writes the Select HTML snippets
// (packages/html/src/components/select/examples/<story>-<file>.html) from the React examples, so
// both implementations start from the same markup. It adds what only HTML needs: the templates of
// `SELECT_TEMPLATES` (a chip per value, the placeholder of an empty value) and the triggers of the
// stateful demos (`data-ok-select-open`, `data-ok-dialog-open` / `-close`). Run after
// `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/select-snippets.mjs
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
const out = resolve(root, "packages/html/src/components/select/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/components/select");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { Chip } from "@owlky/react";
import { selectStories, SELECT_FILES, SELECT_TEMPLATES } from "${folder}/select-examples.tsx";
const html = {};
for (const [story, groups] of Object.entries(selectStories))
  groups.forEach((group, index) => {
    html[story + "-" + SELECT_FILES[story][index][1]] = renderToStaticMarkup(
      createElement(Fragment, null, group.content),
    );
  });
const chip = renderToStaticMarkup(createElement(Chip, { size: "small", label: "" }));
export { html, chip, SELECT_TEMPLATES };
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
const { html, chip, SELECT_TEMPLATES } = await import(file);
rmSync(file);

/** Adds a template as the first child of the select root that holds trigger `id`. */
function addTemplate(markup, id, template) {
  const at = markup.indexOf(` id="${id}"`);
  if (at < 0) return markup;
  const start = markup.lastIndexOf('<div data-ok-select=""', at);
  const end = markup.indexOf(">", start) + 1;
  return markup.slice(0, end) + template + markup.slice(end);
}

/** One element per line, indented by nesting; spans, options and the select's value stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    // Labels and helper texts stay on one line (a line break before the asterisk would be a space).
    .replace(
      /<(label|span|p)\b[^>]*data-ok-form-(?:label|helper-text)[^>]*>[\s\S]*?<\/\1>/g,
      protect,
    )
    // Templates and the value: no white space inside (they show as is).
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/g, protect)
    .replace(/<div\b[^>]*data-ok-select-display[^>]*>[\s\S]*?<\/div>/g, protect)
    .replace(/<option\b[^>]*>[^<]*<\/option>/g, protect)
    .replace(/<(span|em)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g, protect)
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, protect)
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

const clean = (markup) =>
  markup
    .replace(/<link rel="preload"[^>]*>/g, "")
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ style="[^"]*"/g, "")
    .replace(/ data-ok-state="[^"]*"/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden|checked|selected|multiple|required|readonly|inert)=""/g, " $1")
    .replace(/(<(?:img|br|input)\b[^>]*?)\/>/g, "$1>");

const chipTemplate = `<template data-ok-select-chip>${clean(chip)}</template>`;

for (const [name, raw] of Object.entries(html)) {
  let markup = raw;
  for (const [id, template] of Object.entries(SELECT_TEMPLATES)) {
    if (template.chip) markup = addTemplate(markup, id, chipTemplate);
    if (template.placeholder)
      markup = addTemplate(
        markup,
        id,
        `<template data-ok-select-placeholder>${template.placeholder}</template>`,
      );
  }
  markup = markup
    // Stateful demos: what React does with state, HTML does with triggers.
    .replace(
      /(<button\b[^>]*?) id="select-open-button"/,
      '$1 id="select-open-button" data-ok-select-open="select-open"',
    )
    .replace(
      /(<button\b[^>]*aria-controls="select-dialog")/,
      '$1 data-ok-dialog-open="select-dialog"',
    )
    .replace(/<div data-ok-dialog-actions="">([\s\S]*?)<\/div>/, (actions) =>
      actions.replace(/<button\b/g, "<button data-ok-dialog-close"),
    );
  writeFileSync(resolve(out, `${name}.html`), `${pretty(clean(markup))}\n`);
  console.log(`${name}.html`);
}
