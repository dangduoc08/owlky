// Writes the Walktour HTML snippets (packages/html/src/components/walktour/examples/<story>-example.html)
// from the React examples, so both implementations start from the same markup. Run after
// `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/walktour-snippets.mjs
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
const out = resolve(root, "packages/html/src/components/walktour/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/components/walktour");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { WalktourDemo, BeaconsDemo } from "${folder}/walktour-examples.tsx";
export const html = {
  "walktour-example": renderToStaticMarkup(createElement(WalktourDemo)),
  "beacons-example": renderToStaticMarkup(createElement(BeaconsDemo)),
};
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

/** One element per line, indented by nesting; SVGs, buttons, headings and spans stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    .replace(/<(button|span|h2|h3|p|li|svg|label)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*<\/\1>/g, protect)
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
    // An Image's load state is written by its owner (React, the image runtime), never in markup.
    .replace(/ data-ok-state="[^"]*"/g, "")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ (disabled|hidden|checked)=""/g, " $1")
    .replace(/(<(?:img|input)\b[^>]*?)\/>/g, "$1>")
    // HTML triggers: the restart buttons start their tour through the walktour runtime.
    .replace(
      /(<button\b[^>]*aria-controls="(tour-[^"]+)")/g,
      (_, button, tour) => `${button} data-ok-walktour-start="${tour}"`,
    );
  writeFileSync(resolve(out, `${name}.html`), `${pretty(snippet)}\n`);
  console.log(`${name}.html`);
}
