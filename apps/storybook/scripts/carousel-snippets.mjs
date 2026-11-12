// Writes the Carousel HTML snippets (packages/html/src/components/carousel/examples/<story>-example.html)
// from the React examples, so both implementations start from the same markup (slides compose
// Image: the runtimes write the load state and custom ratios). Run after `pnpm build` (bundles
// against packages/*/dist):
//   node apps/storybook/scripts/carousel-snippets.mjs
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
const out = resolve(root, "packages/html/src/components/carousel/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/components/carousel");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { carouselStories, CAROUSEL_FILES } from "${folder}/carousel-examples.tsx";
const html = {};
for (const [story, groups] of Object.entries(carouselStories))
  groups.forEach((group, index) => {
    html[story + "-" + CAROUSEL_FILES[story][index][1]] = renderToStaticMarkup(group.content);
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

/** One element per line, indented by nesting; buttons, icons, text and innermost spans stay whole. */
function pretty(markup) {
  const kept = [];
  const protect = (match) => {
    kept.push(match);
    return `\n@@kept:${kept.length - 1}@@\n`;
  };
  const lines = markup
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/g, protect)
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, protect)
    .replace(/<(h3|p)\b[^>]*>[^<]*<\/\1>/g, protect)
    .replace(/<span\b[^>]*>(?:(?!<\/?span\b)[\s\S])*<\/span>/g, protect)
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
    // Snippets never carry a load state: without JavaScript every picture shows.
    .replace(/ data-ok-state="[^"]*"/g, "")
    .replace(/ style="[^"]*"/g, "")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1")
    .replace(/ alt=""/g, " alt")
    .replace(/ srcSet=/g, " srcset=")
    .replace(/(<img\b[^>]*?)\/>/g, "$1>");
  writeFileSync(resolve(out, `${name}.html`), `${pretty(snippet)}\n`);
  console.log(`${name}.html`);
}
