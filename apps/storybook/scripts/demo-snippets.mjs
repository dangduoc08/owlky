// Writes HTML snippets of stateful React demos (one `?raw` demo per story) from their first,
// closed render, so both implementations start from the same markup, then adds what only HTML
// needs (triggers). Run after `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/demo-snippets.mjs [component …]
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

/**
 * Buttons that name a popover in `aria-controls` open it (`data-ok-popover-open`), the HTML
 * trigger of the React demos' click handlers.
 */
const popoverTriggers = (markup) => {
  const popovers = new Set(
    [...markup.matchAll(/<div\b[^>]*\bdata-ok-popover=""[^>]*>/g)].map(
      ([tag]) => /\bid="([^"]+)"/.exec(tag)?.[1],
    ),
  );
  return markup.replace(/<(button|li)\b[^>]*>/g, (tag) => {
    const id = /\baria-controls="([^"]+)"/.exec(tag)?.[1];
    if (!id || !popovers.has(id) || tag.includes("data-ok-popover-open")) return tag;
    return tag.replace(/>$/, ` data-ok-popover-open="${id}">`);
  });
};

/** [component, demo file, export, snippet name, HTML transform?] */
const DEMOS = [
  [
    "popover",
    "anchor-playground-demo.tsx",
    "AnchorPlaygroundDemo",
    "anchor-playground-group",
    popoverTriggers,
  ],
  ["popover", "virtual-element-demo.tsx", "VirtualElementDemo", "virtual-element-group"],
  ["menu", "nested-demo.tsx", "NestedMenuDemo", "nested-group", popoverTriggers],
  ["menu", "menu-list-demo.tsx", "MenuListDemo", "menu-list-group"],
];

const only = process.argv.slice(2);
const demos = DEMOS.filter(([component]) => only.length === 0 || only.includes(component));
const components = resolve(here, "../src/components");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
${demos.map(([c, file, name], i) => `import { ${name} as D${i} } from "${components}/${c}/${file}";`).join("\n")}
export const html = [${demos.map((_, i) => `renderToStaticMarkup(createElement(D${i}))`).join(", ")}];
`;
const result = await build({
  stdin: { contents: entry, resolveDir: resolve(here, ".."), loader: "tsx" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  jsx: "automatic",
  loader: { ".json": "json", ".svg": "text" },
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
const file = resolve(here, ".demo-render.mjs");
writeFileSync(file, result.outputFiles[0].text);
const { html } = await import(file);
rmSync(file);

/** One element per line, indented by nesting; SVGs, buttons, headings and spans stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    // Submenu triggers hold their label and chevron on one line.
    .replace(/<div\b[^>]*role="menuitem"[^>]*>(?:(?!<\/?div\b)[\s\S])*<\/div>/g, protect)
    .replace(/<(button|span|h2|h3|h6|p|svg|label|a)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g, protect)
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

demos.forEach(([component, , , name, transform], i) => {
  let snippet = html[i]
    .replace(/<link rel="preload"[^>]*>/g, "")
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ style="[^"]*"/g, "");
  if (transform) snippet = transform(snippet);
  snippet = snippet
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden|checked|inert)=""/g, " $1")
    .replace(/(<(?:img|input)\b[^>]*?)\/>/g, "$1>");
  const out = resolve(root, `packages/html/src/components/${component}/examples`);
  mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, `${name}.html`), `${pretty(snippet)}\n`);
  console.log(`${component}/examples/${name}.html`);
});
