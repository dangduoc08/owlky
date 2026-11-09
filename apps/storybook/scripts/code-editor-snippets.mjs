// Writes the Code editor HTML snippets (packages/html/src/components/code-editor/examples/
// code-editor-<story>.html) from the React examples (src/components/code-editor/
// code-editor-snippets.tsx), so both implementations start from the same markup. Run after
// `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/code-editor-snippets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const require = createRequire(resolve(root, "packages/html/package.json"));
const { build } = await import(
  require.resolve("esbuild", { paths: [resolve(root, "node_modules/.pnpm/node_modules")] })
);
const out = resolve(root, "packages/html/src/components/code-editor/examples");
mkdirSync(out, { recursive: true });

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { SNIPPETS } from "${resolve(here, "../src/components/code-editor/code-editor-snippets.tsx")}";
import { FILES } from "${resolve(here, "../src/components/code-editor/code-editor-content.ts")}";
export const html = Object.fromEntries(
  Object.entries(SNIPPETS).map(([name, component]) => [name, renderToStaticMarkup(createElement(component))]),
);
export { FILES };
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
        // `@owlky/<package>[/<entry>]` → that package's dist entry.
        builder.onResolve({ filter: /^@owlky\/(core|react)(\/[a-z-]+)?$/ }, ({ path }) => {
          const [, name, entry] = /^@owlky\/([a-z]+)(?:\/([a-z-]+))?$/.exec(path) ?? [];
          return {
            path: resolve(root, `packages/${name}/dist`, entry ? `${entry}/index.js` : "index.js"),
          };
        });
      },
    },
  ],
  // Monaco is loaded in effects only: never during static rendering.
  external: ["monaco-editor", "monaco-editor/*"],
  // react-dom/server reaches Node built-ins through require().
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "error",
});
const file = resolve(out, ".render.mjs");
writeFileSync(file, result.outputFiles[0].text);
const { html, FILES } = await import(file);
(await import("node:fs")).rmSync(file);

const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * One element per line, indented by nesting. Elements whose text matters (textareas, templates,
 * selects, buttons, headings, list items, labels) and SVGs stay on one line as rendered.
 */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    .replace(/<(textarea|template|select|button|h4|p|li|label|fieldset)\b[\s\S]*?<\/\1>/g, protect)
    .replace(/<svg\b[\s\S]*?<\/svg>/g, protect)
    .replace(/<div([^>]*)><\/div>/g, protect)
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

/** Text of textareas and templates needs only `&` and `<` escaped. */
const plainText = (markup) =>
  markup.replace(
    /(<(textarea|template)\b[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (_, open, _tag, text, close) =>
      `${open}${text
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&gt;/g, ">")}${close}`,
  );

for (const [name, markup] of Object.entries(html)) {
  let snippet = markup
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ data-ok-status="loading"/g, "")
    .replace(/ style="[^"]*"/g, "")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (selected|disabled|hidden)=""/g, " $1")
    .replace(/ spellCheck=/g, " spellcheck=")
    .replace(/ autoComplete=/g, " autocomplete=")
    .replace(/ autoCapitalize=/g, " autocapitalize=")
    // JSON reads better in single quotes.
    .replace(
      / data-ok-options="([^"]*)"/g,
      (_, json) => ` data-ok-options='${json.replace(/&quot;/g, '"')}'`,
    );
  if (name === "multi-model") {
    // Every file's first text, for paths the editor switches to (React keeps them in state).
    const templates = Object.entries(FILES)
      .map(
        ([file, { language, value }]) =>
          `<template data-ok-code-editor-model data-ok-path="file:///${file}" data-ok-language="${language}">${escapeHtml(value)}</template>`,
      )
      .join("");
    snippet = snippet.replace(/(<div data-ok-code-editor-content><\/div>)/, `$1${templates}`);
  }
  writeFileSync(resolve(out, `code-editor-${name}.html`), `${pretty(plainText(snippet))}\n`);
  console.log(`code-editor-${name}.html`);
}
