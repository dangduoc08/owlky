// Writes Map HTML snippets (packages/html/src/components/map/examples/<story>-group.html) from the
// React demos (roadmap 4.18.94 on; older map snippets were written by hand). The demos render
// statically: controls and legends in place (the internal `InlineCorners` context), and `Source` /
// `Layer` as the HTML declarations they stand for. Run after `pnpm build`:
//   node apps/storybook/scripts/map-snippets.mjs [story …]
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

/** `[story file name, demo module, export]`. */
const DEMOS = [
  ["bubbles", "bubbles.tsx", "BubblesDemo"],
  ["hexbin", "hexbin.tsx", "HexbinDemo"],
  ["pixel-map", "pixel-map.tsx", "PixelMapDemo"],
  ["pattern-fills", "pattern-fills.tsx", "PatternFillsDemo"],
  ["region-selection", "region-selection.tsx", "RegionSelectionDemo"],
];

const only = process.argv.slice(2);
const demos = DEMOS.filter(([name]) => only.length === 0 || only.includes(name));
const react = resolve(root, "packages/react/src");
const folder = resolve(here, "../src/components/map/demos");

// `Source` and `Layer` render their HTML declarations; everything else is the React package.
const shim = `
import { createElement, useContext, createContext } from "react";
export * from "${react}/index.ts";
const Parent = createContext(null);
const json = (value) => (value === undefined ? undefined : JSON.stringify(value));
export function Source({ id, type, data, promoteId, children }) {
  return createElement(
    "div",
    {
      "data-ok-map-source": "",
      "data-ok-id": id,
      "data-ok-type": type,
      "data-ok-data": typeof data === "string" ? data : json(data),
      "data-ok-promote-id": promoteId,
      hidden: true,
    },
    createElement(Parent.Provider, { value: id }, children),
  );
}
export function Layer({ id, type, source, filter, layout, paint, minzoom, maxzoom }) {
  const parent = useContext(Parent);
  return createElement("div", {
    "data-ok-map-layer": "",
    "data-ok-id": id,
    "data-ok-type": type,
    "data-ok-source": parent ? undefined : source,
    "data-ok-min-zoom": minzoom,
    "data-ok-max-zoom": maxzoom,
    "data-ok-filter": json(filter),
    "data-ok-layout": json(layout),
    "data-ok-paint": json(paint),
    hidden: true,
  });
}
`;

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { InlineCorners } from "${react}/map/map-context.ts";
${demos.map(([, file, name], i) => `import { ${name} as D${i} } from "${folder}/${file}";`).join("\n")}
const corners = (position, children) => createElement("ok-corner", { "data-position": position }, children);
const render = (Demo) =>
  renderToStaticMarkup(createElement(InlineCorners.Provider, { value: corners }, createElement(Demo)));
export const html = [${demos.map((_, i) => `render(D${i})`).join(", ")}];
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
      name: "owlky-map-snippets",
      setup(builder) {
        builder.onResolve({ filter: /^@owlky\/react$/ }, () => ({
          path: "shim",
          namespace: "owlky-shim",
        }));
        builder.onLoad({ filter: /.*/, namespace: "owlky-shim" }, () => ({
          contents: shim,
          loader: "js",
          resolveDir: here,
        }));
        builder.onResolve({ filter: /^@owlky\/core(\/map)?$/ }, ({ path }) => ({
          path: resolve(root, `packages/core/dist/${path.endsWith("/map") ? "map/" : ""}index.js`),
        }));
      },
    },
  ],
  // Static markup never starts MapLibre or Monaco.
  external: ["monaco-editor", "monaco-editor/*", "maplibre-gl"],
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "error",
});
// Next to core, which resolves maplibre-gl.
const file = resolve(root, "packages/core/.map-render.mjs");
writeFileSync(file, result.outputFiles[0].text);
const { html } = await import(file);
rmSync(file);

const decode = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/**
 * Moves the corner contents into their map's corner elements, in render order: a map's parts
 * render before its four corners, so contents seen since the last corners belong to the next ones.
 */
function placeCorners(markup) {
  let found = {};
  let placed = 0;
  return markup.replace(
    /<ok-corner data-position="([a-z-]+)">([\s\S]*?)<\/ok-corner>|<div data-ok-map-corner="([a-z-]+)"><\/div>/g,
    (_, position, content, corner) => {
      if (position) {
        found[position] = `${found[position] ?? ""}${content}`;
        return "";
      }
      const out = `<div data-ok-map-corner="${corner}">${found[corner] ?? ""}</div>`;
      placed++;
      if (placed % 4 === 0) found = {};
      return out;
    },
  );
}

/** One element per line, indented by nesting; table rows, SVGs, buttons and spans stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    .replace(/<tr\b[^>]*>(?:(?!<\/?tr\b)[\s\S])*<\/tr>/g, protect)
    .replace(
      /<(button|span|p|svg|li|caption|summary)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g,
      protect,
    )
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
    .replace(/<([a-z]+)\b([^>]*)>\n\s*<\/\1>/g, "<$1$2></$1>")
    .replace(/@@kept:(\d+)@@/g, (_, index) => kept[Number(index)]);
}

const out = resolve(root, "packages/html/src/components/map/examples");
mkdirSync(out, { recursive: true });
demos.forEach(([name], i) => {
  const snippet = placeCorners(html[i])
    .replace(/<link rel="preload"[^>]*>/g, "")
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ style="[^"]*"/g, "")
    // JSON values read better in single quotes.
    .replace(
      / (data-ok-(?:data|paint|layout|filter))="([^"]*)"/g,
      (_, attr, value) =>
        ` ${attr}='${decode(value).replace(/&/g, "&amp;").replace(/'/g, "&#39;")}'`,
    )
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden|checked|inert)=""/g, " $1")
    .replace(/(<(?:img|input)\b[^>]*?)\/>/g, "$1>");
  writeFileSync(resolve(out, `${name}-group.html`), `${pretty(snippet)}\n`);
  console.log(`map/examples/${name}-group.html`);
});
