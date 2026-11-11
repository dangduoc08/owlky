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

const editorContent = await import("../src/components/editor/editor-feature-content.ts");

/**
 * Editor demos (ADR-0050): React fills the content after mount, HTML carries it in the markup;
 * the bubble menu and the mention list are the editor runtime's own (`data-ok-runtime="off"`
 * keeps the popover runtime away), and the mention items come from a template.
 */
const editorSnippet =
  (content, { people = false } = {}) =>
  (markup) => {
    const editor = /data-ok-editor="" id="([^"]+)"/.exec(markup)?.[1] ?? "editor";
    let field = 0;
    let html = popoverTriggers(markup)
      // The forms' text fields get readable ids instead of React's generated ones.
      .replace(/ id="_R_[^"]*_"/g, () => ` id="${editor}-field-${++field}"`)
      .replaceAll(' noValidate=""', " novalidate")
      .replace(/(<div data-ok-editor-content=""[^>]*>)(<\/div>)/, `$1${content}$2`)
      .replace(
        / data-ok-editor-(bubble-menu|mentions)=""/g,
        ' data-ok-editor-$1="" data-ok-runtime="off"',
      )
      .replace(
        /(<div[^>]*data-ok-editor-bubble-menu[^>]*>)([\s\S]*?)(<\/div>)/,
        (_, open, body, close) =>
          `${open}${body.replace(/ data-ok-popover-open="[^"]*"/g, "")}${close}`,
      );
    if (people) {
      const items = editorContent.PEOPLE.map(
        (person) => `<li data-ok-value="${person.id}">${person.label}</li>`,
      ).join("");
      html = html.replace(
        /(<div[^>]*data-ok-editor-mentions[^>]*>[\s\S]*?<\/ul><\/div>)/,
        `$1<template data-ok-editor-mention-items>${items}</template>`,
      );
    }
    return html;
  };

const CLOSE_ICON =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" /></svg>';
/** The copy demos' toasts, as the React `toast.success` / `toast.error` calls render them. */
const COPY_TOASTS = `<template id="copy-done">
  <li data-ok-toast data-ok-type="success">
    <span data-ok-toast-icon aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.4 14.2-4.3-4.3 1.4-1.4 2.9 2.9 6-6 1.4 1.4z" fill="currentColor" /></svg></span>
    <div data-ok-toast-content>
      <div data-ok-toast-title>Copied!</div>
    </div>
    <button type="button" data-ok-toast-close aria-label="Close">${CLOSE_ICON}</button>
  </li>
</template>
<template id="copy-failed">
  <li data-ok-toast data-ok-type="error">
    <span data-ok-toast-icon aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15.7 2H8.3L3 7.3v7.4L8.3 20h7.4l5.3-5.3V7.3zM13 16h-2v-2h2zm0-4h-2V7h2z" fill="currentColor" /></svg></span>
    <div data-ok-toast-content>
      <div data-ok-toast-title>Couldn't copy. Select the text and copy it yourself.</div>
    </div>
    <button type="button" data-ok-toast-close aria-label="Close">${CLOSE_ICON}</button>
  </li>
</template>`;
const COPY_TOAST_ATTRS =
  ' data-ok-clipboard-toast="copy-done" data-ok-clipboard-error-toast="copy-failed"';

/**
 * Copy to clipboard (roadmap 4.20): the React demos' handlers become `data-ok-clipboard-*`
 * triggers; the toasts they show become templates after the toaster.
 */
const copyButtonSnippet = (markup) =>
  markup.replace(
    /(<button\b[^>]*aria-label="Copy")/,
    `$1 data-ok-clipboard-copy${COPY_TOAST_ATTRS}`,
  );
const copyDoubleClickSnippet = (markup) =>
  markup
    .replace(
      /(<p\b[^>]*id="copy-text")/,
      `$1 data-ok-clipboard-copy data-ok-clipboard-trigger="dblclick"${COPY_TOAST_ATTRS}`,
    )
    .replace(
      /(<button\b[^>]*aria-label="Copy text")/,
      `$1 data-ok-clipboard-copy="copy-text"${COPY_TOAST_ATTRS}`,
    );

/** [component, demo file, export, snippet name, HTML transform?, markup appended as written?] */
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
  ["tabs", "nav-demo.tsx", "NavTabsDemo", "nav-group"],
  ["sortable", "kanban-demo.tsx", "KanbanDemo", "kanban-group", popoverTriggers],
  ["sortable", "disabled-demo.tsx", "DisabledItemsDemo", "disabled-items-group"],
  [
    "editor",
    "bubble-menu-demo.tsx",
    "BubbleMenuDemo",
    "bubble-menu-group",
    editorSnippet(editorContent.BUBBLE_CONTENT),
  ],
  [
    "editor",
    "table-demo.tsx",
    "TableDemo",
    "table-group",
    editorSnippet(editorContent.TABLE_CONTENT),
  ],
  [
    "editor",
    "mentions-demo.tsx",
    "MentionsDemo",
    "mentions-group",
    editorSnippet(editorContent.MENTION_CONTENT, { people: true }),
  ],
  [
    "text-field",
    "copy-demo.tsx",
    "CopyButtonDemo",
    "copy-to-clipboard-button",
    copyButtonSnippet,
    COPY_TOASTS,
  ],
  [
    "text-field",
    "copy-demo.tsx",
    "CopyDoubleClickDemo",
    "copy-to-clipboard-double-click",
    copyDoubleClickSnippet,
  ],
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
  // The React package's dist imports other opt-in engines lazily; never needed for static
  // markup. Tiptap is bundled: the Editor demos import it (nothing runs before mount).
  external: ["monaco-editor", "monaco-editor/*", "maplibre-gl"],
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

demos.forEach(([component, , , name, transform, appended], i) => {
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
  writeFileSync(
    resolve(out, `${name}.html`),
    `${pretty(snippet)}\n${appended ? `${appended}\n` : ""}`,
  );
  console.log(`${component}/examples/${name}.html`);
});
