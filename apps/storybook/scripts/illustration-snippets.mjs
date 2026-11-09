// Writes the Illustration HTML snippets (packages/html/src/components/illustration/examples/
// <story>-<group>.html) from the React examples, and refreshes the Upload snippets' drop zone
// illustration, so both implementations start from the same markup (ADR-0041). Run after
// `pnpm build` (bundles against packages/*/dist):
//   node apps/storybook/scripts/illustration-snippets.mjs
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const require = createRequire(resolve(root, "packages/html/package.json"));
const { build } = await import(
  require.resolve("esbuild", { paths: [resolve(root, "node_modules/.pnpm/node_modules")] })
);
const out = resolve(root, "packages/html/src/components/illustration/examples");
mkdirSync(out, { recursive: true });

const folder = resolve(here, "../src/foundations/illustrations");
const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { upload } from "@owlky/core/illustrations";
import { Illustration } from "@owlky/react";
import { illustrationStories, ILLUSTRATION_FILES } from "${folder}/illustration-examples.tsx";
const html = {};
for (const [story, groups] of Object.entries(illustrationStories))
  groups.forEach((group, index) => {
    html[story + "-" + ILLUSTRATION_FILES[story][index][1]] = renderToStaticMarkup(group.content);
  });
const uploadIllustration = renderToStaticMarkup(
  <Illustration illustration={upload} data-ok-upload-illustration="" />,
);
export { html, uploadIllustration };
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
        builder.onResolve({ filter: /^@owlky\/core\/illustrations$/ }, () => ({
          path: resolve(root, "packages/core/dist/illustrations/index.js"),
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
const { html, uploadIllustration } = await import(file);
rmSync(file);

/** What React writes but snippets leave out (the runtime flag, inline styles), `attr=""` → `attr`. */
const clean = (markup) =>
  markup
    .replace(/ data-ok-runtime="off"/g, "")
    .replace(/ style="[^"]*"/g, "")
    .replace(/ (data-ok-[a-z-]+)=""/g, " $1");

/**
 * One element per line, indented by nesting. Empty SVG shapes become self-closing (`<path … />`,
 * valid inside `<svg>`); text-only elements (avatar letters, titles) stay on one line.
 */
function pretty(markup) {
  const lines = markup
    .replace(/<(path|circle|ellipse|rect|polygon|polyline|line)\b([^>]*)><\/\1>/g, "<$1$2 />")
    .replace(/></g, ">\n<")
    .split("\n");
  let depth = 0;
  return lines
    .map((line) => {
      if (/^<\//.test(line)) depth--;
      const indented = `${"  ".repeat(Math.max(depth, 0))}${line}`;
      const opens = /^<[a-z][^>]*[^/]>$/.test(line) && !/<\/[a-z]+>$/.test(line);
      if (opens) depth++;
      return indented;
    })
    .join("\n");
}

for (const name of readdirSync(out)) if (name.endsWith(".html")) rmSync(resolve(out, name));
for (const [name, markup] of Object.entries(html)) {
  writeFileSync(resolve(out, `${name}.html`), `${pretty(clean(markup))}\n`);
  console.log(`${name}.html`);
}

// Upload: the drop zone illustration stays on one line, as in the rest of its snippets.
const uploadOut = resolve(root, "packages/html/src/components/upload/examples");
const svg = clean(uploadIllustration);
for (const name of readdirSync(uploadOut)) {
  const path = resolve(uploadOut, name);
  const before = readFileSync(path, "utf8");
  const after = before.replace(/<svg[^>]*data-ok-upload-illustration[\s\S]*?<\/svg>/g, svg);
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`upload/${name}`);
  }
}
