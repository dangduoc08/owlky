// Writes the Data grid HTML snippets of the phase 6 stories and the later ones (more-examples.tsx)
// (packages/html/src/components/data-grid/examples/<story>-<file>.html) from the React examples, so
// both implementations start from the same markup. HTML-only parts the React render doesn't have
// are added: `data-ok-popover-open` on the toolbar buttons that open a panel or a menu, and the
// filter panel's input templates (kept from the file being replaced, else copied from a sibling
// snippet). Charts keep their data table only (the Chart runtime draws the rest).
// Run after `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/data-grid-snippets.mjs [<story>-<file> …]
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const require = createRequire(resolve(root, "packages/html/package.json"));
const { build } = await import(
  require.resolve("esbuild", { paths: [resolve(root, "node_modules/.pnpm/node_modules")] })
);
const out = resolve(root, "packages/html/src/components/data-grid/examples");
const only = process.argv.slice(2);

const folder = resolve(here, "../src/components/data-grid");
const entry = `
import { cloneElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { phase6Stories, PHASE6_FILES } from "${folder}/phase6-examples.tsx";
import { moreStories, MORE_FILES } from "${folder}/more-examples.tsx";
const html = {};
const data = {};
const tables = {};
const stories = { ...phase6Stories, ...moreStories };
const files = { ...PHASE6_FILES, ...MORE_FILES };
// The grid's Chart loads on first use (ADR-0068 S5): a first render starts the import, so the
// second one renders the Chart (the snippet keeps its root and data table).
const render = () => {
for (const [story, groups] of Object.entries(stories))
  groups.forEach((group, index) => {
    const name = story + "-" + files[story][index][1];
    // Generated columns (autoGenerate): the HTML is the empty grid plus a data table of the rows.
    if (group.content.props.columns === undefined) {
      html[name] = renderToStaticMarkup(cloneElement(group.content, { rows: [] }));
      tables[name] = group.content.props.rows;
    } else html[name] = renderToStaticMarkup(group.content);
    // Pivoted grids: the HTML holds the data (the runtime pivots it), rendered unpivoted.
    const initial = group.content.props.initialState;
    if (initial?.pivoting?.active)
      data[name] = renderToStaticMarkup(
        cloneElement(group.content, {
          initialState: { ...initial, pivoting: { ...initial.pivoting, active: false } },
        }),
      );
  });
};
render();
await new Promise((resolve) => setTimeout(resolve, 0));
render();
export { html, data, tables };
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
const { html, data, tables } = await import(file);
rmSync(file);

const VOID = new Set(["input", "img", "br", "hr", "link", "meta", "col", "source"]);

/** A tree of the rendered markup (React's static markup is well formed). */
function parse(markup) {
  const top = { tag: "#root", open: "", children: [] };
  const stack = [top];
  for (const [, tag, text] of markup.matchAll(/(<[^>]+>)|([^<]+)/g)) {
    const parent = stack[stack.length - 1];
    if (text !== undefined) parent.children.push({ text });
    else if (tag.startsWith("</")) stack.pop();
    else {
      const name = /^<([a-zA-Z0-9-]+)/.exec(tag)[1];
      const node = { tag: name, open: tag, children: [] };
      parent.children.push(node);
      if (!VOID.has(name) && !tag.endsWith("/>")) stack.push(node);
    }
  }
  return top;
}

const serialize = (node) =>
  node.text ??
  (VOID.has(node.tag) || node.open.endsWith("/>")
    ? node.open
    : `${node.open}${node.children.map(serialize).join("")}</${node.tag}>`);
const contains = (node, tags) =>
  (node.children ?? []).some((c) => tags.includes(c.tag) || contains(c, tags));

/**
 * Whether an element prints on one line: SVGs, buttons, spans without controls, the pagination's
 * label (a sentence split into text runs measures apart), and elements holding only text and such
 * spans.
 */
function inline(node) {
  if (node.tag === "svg" || node.tag === "button") return true;
  if (node.open.includes("data-ok-table-pagination-rows")) return true;
  if (node.tag === "span") return !contains(node, ["button", "input", "select"]);
  return node.children.every((c) => c.text !== undefined || (c.tag === "span" && inline(c)));
}

/** Charts keep their data table only: the Chart runtime draws the rest. */
function chartless(node) {
  for (const child of node.children ?? []) {
    if (child.tag === "figure" && child.open.includes("data-ok-chart")) {
      child.open = child.open.replace(" data-ok-ready", "");
      child.children = child.children.filter((c) => c.tag === "table");
    } else chartless(child);
  }
  return node;
}

/**
 * A pivoted grid's snippet: the unpivoted render (the data) marked `data-ok-pivot-active`, with the
 * pivoted render's pivot panel, chart panel and chart (they show the pivot).
 */
function pivoted(pivot, unpivoted) {
  const shown = parse(pivot).children[0];
  const base = parse(unpivoted);
  const grid = base.children[0];
  grid.open = grid.open.replace(
    "<div data-ok-data-grid",
    "<div data-ok-data-grid data-ok-pivot-active",
  );
  const key = (node) =>
    /id="[^"]+-(pivot|charts)"/.exec(node.open ?? "")?.[0] ??
    ((node.open ?? "").startsWith("<div data-ok-data-grid-chart") ? "chart" : null);
  const find = (node, wanted) =>
    key(node) === wanted ? node : (node.children ?? []).map((c) => find(c, wanted)).find(Boolean);
  const swap = (node) => {
    node.children = (node.children ?? []).map((child) => {
      if (child.text === undefined && key(child)) return find(shown, key(child)) ?? child;
      swap(child);
      return child;
    });
  };
  swap(grid);
  return base;
}

/** One element per line, indented by nesting. */
function pretty(markup) {
  const lines = [];
  const pad = (depth) => "  ".repeat(depth);
  const walk = (node, depth) => {
    for (const child of node.children) {
      if (child.text !== undefined) {
        if (child.text.trim()) lines.push(pad(depth) + child.text);
      } else if (VOID.has(child.tag) || inline(child)) lines.push(pad(depth) + serialize(child));
      else {
        lines.push(pad(depth) + child.open);
        walk(child, depth + 1);
        lines.push(`${pad(depth)}</${child.tag}>`);
      }
    }
  };
  walk(chartless(typeof markup === "string" ? parse(markup) : markup), 0);
  return lines.join("\n");
}

/** The filter input `<template>` blocks of a snippet (with their indentation). */
function templates(text) {
  const found = [];
  const re =
    /^( *)<template data-ok-data-grid-(?:any-of|date|date-time)="[^"]+"[^>]*>[\s\S]*?^\1<\/template>\n/gm;
  for (let m = re.exec(text); m; m = re.exec(text)) found.push(m[0]);
  return found;
}

/** The custom editor `<template>` blocks of a snippet (with their indentation). */
function editTemplates(text) {
  const found = [];
  const re = /^( *)<template data-ok-data-grid-edit-cell="[^"]+"[^>]*>[\s\S]*?^\1<\/template>\n/gm;
  for (let m = re.exec(text); m; m = re.exec(text)) found.push(m[0]);
  return found;
}

const previous = (name) => {
  const path = resolve(out, `${name}.html`);
  return existsSync(path) ? readFileSync(path, "utf8") : null;
};
const gridId = (text) => /<div data-ok-data-grid [^>]*\bid="([^"]+)"/.exec(text)?.[1];

for (const [name, markup] of Object.entries(html)) {
  if (only.length && !only.includes(name)) continue;
  const clean = (text) =>
    text
      .replace(/<link rel="preload"[^>]*>/g, "")
      .replace(/ data-ok-runtime="off"/g, "")
      .replace(/ style="[^"]*"/g, "")
      .replace(/ data-ok-state="[^"]*"/g, "")
      .replace(/&#x27;/g, "'")
      .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
      .replace(/ (disabled|hidden|checked|selected)=""/g, " $1")
      .replace(/(<(?:img|br|input)\b[^>]*?)\/>/g, "$1>")
      .replace(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)><\/\1>/g, "<$1$2 />")
      .replace(
        / (contentEditable|inputMode|spellCheck|autoCapitalize|autoCorrect|enterKeyHint)=/g,
        (_, attr) => ` ${attr.toLowerCase()}=`,
      );
  let base = clean(markup);
  // Generated columns: the runtime builds the columns and rows from this table.
  if (tables[name]) {
    const escapeText = (text) =>
      String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;");
    const fields = [...new Set(tables[name].flatMap((row) => Object.keys(row)))];
    const cells = (tag, values) => values.map((v) => `<${tag}>${escapeText(v)}</${tag}>`).join("");
    const table = `<table data-ok-data-grid-data><thead><tr>${cells("th", fields)}</tr></thead><tbody>${tables[
      name
    ]
      .map(
        (row) =>
          `<tr>${cells(
            "td",
            fields.map((f) => row[f]),
          )}</tr>`,
      )
      .join("")}</tbody></table>`;
    const end = base.lastIndexOf("</div>");
    base = `${base.slice(0, end)}${table}${base.slice(end)}`;
  }
  let snippet = pretty(data[name] ? pivoted(base, clean(data[name])) : base);
  // HTML triggers: toolbar buttons that open a popover or a menu name it (the runtime opens the
  // column menu itself).
  snippet = snippet.replace(
    /<button\b[^>]*aria-haspopup="[^"]+"[^>]*aria-controls="([^"]+)"[^>]*>/g,
    (tag, target) =>
      tag.includes("data-ok-popover-open") || tag.includes("data-ok-data-grid-menu-button")
        ? tag
        : tag.replace(/>$/, ` data-ok-popover-open="${target}">`),
  );
  // Filter input templates open the filters popover.
  const id = gridId(snippet);
  const old = previous(name);
  const source =
    old && templates(old).length
      ? old
      : Object.keys(html)
          .map(previous)
          .find((text) => text && templates(text).length);
  const oldId = source && gridId(source);
  const at = id ? snippet.search(new RegExp(`<div popover="manual"[^>]*id="${id}-filters">`)) : -1;
  if (source && oldId && at >= 0) {
    const start = snippet.indexOf("\n", at) + 1;
    const blocks = templates(source).map((block) => block.replaceAll(oldId, id));
    snippet = snippet.slice(0, start) + blocks.join("") + snippet.slice(start);
  }
  // Custom editors (renderEditCell) are hand-written templates at the end of the grid: kept.
  const editors = old ? editTemplates(old) : [];
  if (editors.length) {
    const end = snippet.lastIndexOf("\n</div>");
    snippet = `${snippet.slice(0, end + 1)}${editors.join("")}${snippet.slice(end + 1)}`;
  }
  writeFileSync(resolve(out, `${name}.html`), `${snippet}\n`);
  console.log(`${name}.html`);
}
