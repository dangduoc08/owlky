// Builds distributable, framework-free CSS. Consumers never run Tailwind over library sources.
//
//   dist/minimal-tailwind.css(.min.css)  tokens + all components
//   dist/components/<name>.css           one component (needs tokens.css)
//   dist/tokens.css                      design tokens only
//   dist/base.css                        optional document base styles
//   dist/theme.css                       Tailwind v4 theme for consumers who use Tailwind
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "src");
const dist = join(root, "dist");
const require = createRequire(import.meta.url);
const tailwind = join(dirname(require.resolve("@tailwindcss/cli/package.json")), "dist/index.mjs");
const tokensCss = require.resolve("@minimal-tailwind/tokens/tokens.css");

const LAYER_ORDER = "@layer theme, base, components, utilities;";
const FORBIDDEN = [
  [/--tw-/, "Tailwind-internal --tw-* variables (use plain CSS instead of that @apply utility)"],
  [/@(apply|reference|theme|custom-variant|utility)\b/, "uncompiled Tailwind directives"],
];

function compile(input, output, minify = false) {
  const args = [tailwind, "-i", input, "-o", output];
  if (minify) args.push("--minify");
  execFileSync(process.execPath, args, { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
}

async function finalize(file) {
  let css = await readFile(file, "utf8");
  for (const [pattern, label] of FORBIDDEN) {
    if (pattern.test(css)) throw new Error(`${basename(file)} contains ${label}.`);
  }
  // Declare Tailwind's layer order first, so library layers never jump ahead of `base`
  // when this file loads before the consumer's Tailwind build (ADR-0003).
  if (!css.includes(LAYER_ORDER))
    css = css.replace(/^(\/\*![\s\S]*?\*\/\s*)?/, `$1${LAYER_ORDER}\n`);
  await writeFile(file, css);
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "components"), { recursive: true });

const outputs = [];
const bundle = join(dist, "minimal-tailwind.css");
compile(join(src, "index.css"), bundle);
compile(join(src, "index.css"), join(dist, "minimal-tailwind.min.css"), true);
compile(join(src, "base.css"), join(dist, "base.css"));
outputs.push(bundle, join(dist, "minimal-tailwind.min.css"), join(dist, "base.css"));

for (const file of (await readdir(join(src, "components"))).filter((f) => f.endsWith(".css"))) {
  const out = join(dist, "components", file);
  compile(join(src, "components", file), out);
  outputs.push(out);
}

for (const file of outputs) await finalize(file);
await copyFile(tokensCss, join(dist, "tokens.css"));
await copyFile(join(src, "theme.css"), join(dist, "theme.css"));
console.log(`styles: built ${outputs.length} CSS files`);
