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

/**
 * Motion snippets carry no `data-ok-state` (the runtime writes it) and keep their JSON in single
 * quotes, as an author writes it.
 */
const motionKeyframesSnippet = (markup) =>
  markup
    .replace(/ data-ok-state="[^"]*"/g, "")
    .replace(
      / (data-ok-keyframes|data-ok-transition)="([^"]*)"/g,
      (_, name, value) => ` ${name}='${value.replaceAll("&quot;", '"')}'`,
    );

/**
 * Motion gestures (roadmap 5.3): like the keyframes, the JSON values (`while…` states, a box of
 * constraints, the drag transition) are written in single quotes.
 */
const motionGestureSnippet = (markup) =>
  motionKeyframesSnippet(markup).replace(
    / (data-ok-while-[a-z]+|data-ok-drag-constraints|data-ok-drag-elastic|data-ok-drag-transition)="(\{[^"]*)"/g,
    (_, name, value) => ` ${name}='${value.replaceAll("&quot;", '"')}'`,
  );

/** Drawer triggers (`aria-haspopup="dialog"`) open the next drawer dialog (`data-ok-drawer-open`). */
const drawerTriggers = (markup) => {
  const ids = [...markup.matchAll(/<dialog\b[^>]*\bid="([^"]+)"/g)].map(([, id]) => id);
  let index = 0;
  return markup.replace(/<button\b[^>]*aria-haspopup="dialog"[^>]*>/g, (tag) =>
    tag.replace(/>$/, ` data-ok-drawer-open="${ids[index++]}">`),
  );
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

/** Toast icons (Solar, as React's `TOAST_ICONS` and `CLOSE_ICON` render them). */
const SOLAR =
  'viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round"';
const CLOSE_ICON = `<svg data-ok-icon="close-linear" ${SOLAR}><path d="M19.01 5L5.01 19" /><path d="M19 19L5 5" /></svg>`;
const SUCCESS_ICON = `<svg data-ok-icon="check-circle-linear" ${SOLAR}><circle cx="12" cy="12" r="10" /><path stroke-linejoin="round" d="M8.5 12.5L10.5 14.5L15.5 9.5" /></svg>`;
const ERROR_ICON = `<svg data-ok-icon="danger-circle-linear" ${SOLAR}><circle cx="12" cy="12" r="10" /><path d="M12 7V13" /><path stroke-linejoin="round" d="M12 16H12" /></svg>`;
/** The copy demos' toasts, as the React `toast.success` / `toast.error` calls render them. */
const COPY_TOASTS = `<template id="copy-done">
  <li data-ok-toast data-ok-type="success">
    <span data-ok-toast-icon aria-hidden="true">${SUCCESS_ICON}</span>
    <div data-ok-toast-content>
      <div data-ok-toast-title>Copied!</div>
    </div>
    <button type="button" data-ok-toast-close aria-label="Close">${CLOSE_ICON}</button>
  </li>
</template>
<template id="copy-failed">
  <li data-ok-toast data-ok-type="error">
    <span data-ok-toast-icon aria-hidden="true">${ERROR_ICON}</span>
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

/**
 * Countdown (roadmap 4.22): the React demos' handlers become the countdown triggers of the button
 * that names it in `aria-controls`.
 */
const countdownTrigger = (trigger) => (markup) =>
  markup.replace(/<button\b[^>]*\baria-controls="([^"]+)"[^>]*>/, (tag, id) =>
    tag.replace(/>$/, ` data-ok-countdown-${trigger}="${id}">`),
  );

/**
 * Phone input (ADR-0061): the runtime builds the country options from its metadata, so the
 * snippet keeps the listbox empty (React renders every country).
 */
const phoneSnippet = (markup) =>
  markup.replace(/(<ul data-ok-select-listbox=""[^>]*>)[\s\S]*?(<\/ul>)/g, "$1$2");

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
  // Number input (roadmap 4.24): the React render is the HTML markup (the runtime reads it).
  ["text-field", "number-demo.tsx", "NumberBasicDemo", "number-input-basic"],
  ["text-field", "number-demo.tsx", "NumberHelperDemo", "number-input-helper"],
  ["text-field", "number-demo.tsx", "NumberDisabledDemo", "number-input-disabled"],
  [
    "motion",
    "countdown-demo.tsx",
    "CountdownDateDemo",
    "countdown-date",
    countdownTrigger("toggle"),
  ],
  [
    "motion",
    "countdown-demo.tsx",
    "CountdownSecondsDemo",
    "countdown-seconds",
    countdownTrigger("restart"),
  ],
  // Motion "Logo" (ADR-0062): custom keyframes as JSON attributes; Motions carry no state.
  ["motion", "logo-demo.tsx", "MotionLogoDemo", "logo-group", motionKeyframesSnippet],
  // Scroll progress (5.2): the React render is the HTML markup (the runtime reads the ids).
  ["scroll-progress", "container-y-demo.tsx", "ContainerScrollYDemo", "container-scroll-y-group"],
  ["scroll-progress", "container-x-demo.tsx", "ContainerScrollXDemo", "container-scroll-x-group"],
  ["scroll-progress", "document-demo.tsx", "ScrollDocumentDemo", "scroll-document-group"],
  // Motion "Gestures" (roadmap 5.3): drag and `while…` states as attributes; no state.
  ...[
    ["GestureDragDemo", "gestures-drag"],
    ["GestureAxisDemo", "gestures-axis"],
    ["GestureSnapDemo", "gestures-snap"],
    ["GestureHoverTapDemo", "gestures-hover-tap"],
  ].map(([name, snippet]) => ["motion", "gestures-demo.tsx", name, snippet, motionGestureSnippet]),
  // Motion "Layout" (roadmap 5.4): layout attributes; the page scripts move the DOM.
  ...[
    ["LayoutReorderDemo", "layout-reorder"],
    ["LayoutExpandDemo", "layout-expand"],
    ["LayoutHighlightDemo", "layout-highlight"],
  ].map(([name, snippet]) => ["motion", "layout-demo.tsx", name, snippet, motionKeyframesSnippet]),
  // Swipeable drawers (roadmap 4.18.46): each trigger opens the dialog that follows it.
  ["drawer", "swipeable-demo.tsx", "SwipeableDrawerDemo", "swipeable-group", drawerTriggers],
  // Color pickers (roadmap 4.23): swatch colors are written by the runtimes (no `style`).
  ["radio", "color-picker-demo.tsx", "ColorPickerDemo", "color-picker-group"],
  ["checkbox", "color-picker-demo.tsx", "ColorPickerDemo", "color-picker-group"],
  ["avatar", "color-preview-demo.tsx", "ColorPreviewDemo", "color-preview-group"],
  // Phone input (roadmap 4.25): the React render with an empty country list.
  ...[
    ["PhoneAutoDemo", "phone-input-auto"],
    ["PhoneDefaultValueDemo", "phone-input-default-value"],
    ["PhoneDefaultCountryDemo", "phone-input-default-country"],
    ["PhoneFixedCountryDemo", "phone-input-fixed-country"],
    ["PhoneFixedInternationalDemo", "phone-input-fixed-international"],
    ["PhoneHideSelectDemo", "phone-input-hide-select"],
    ["PhoneValidationDemo", "validation-invalid"],
    ["PhoneCountriesDemo", "validation-countries"],
    ["PhoneImageFlagsDemo", "phone-input-image-flags"],
  ].map(([name, snippet]) => ["phone-input", "phone-input-demos.tsx", name, snippet, phoneSnippet]),
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
    // React's static markup keeps these two camelCase; HTML writes them in lower case.
    .replace(/ (autoComplete|inputMode)=/g, (_, name) => ` ${name.toLowerCase()}=`)
    .replace(/(<(?:img|input)\b[^>]*?)\/>/g, "$1>");
  const out = resolve(root, `packages/html/src/components/${component}/examples`);
  mkdirSync(out, { recursive: true });
  writeFileSync(
    resolve(out, `${name}.html`),
    `${pretty(snippet)}\n${appended ? `${appended}\n` : ""}`,
  );
  console.log(`${component}/examples/${name}.html`);
});
