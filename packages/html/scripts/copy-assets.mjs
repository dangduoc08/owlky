// Copies the shared stylesheet and the canonical snippets into dist, so CDN users need one package.
import { existsSync } from "node:fs";
import { cp, mkdir, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const stylesDist = dirname(require.resolve("@owlky/styles/owlky.css"));

for (const file of ["owlky.css", "owlky.min.css"]) {
  await cp(join(stylesDist, file), join(root, "dist", file));
}
// MapLibre's worker (ADR-0025): owlky-map.js finds it next to itself.
await cp(require.resolve("@owlky/core/map-worker.js"), join(root, "dist", "owlky-map-worker.js"));

const components = join(root, "src", "components");
for (const entry of await readdir(components, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const examples = join(components, entry.name, "examples");
  // Behavior-only folders (e.g. toggle-group, whose markup ships with toggle-button) have none.
  if (!existsSync(examples)) continue;
  await mkdir(join(root, "dist", "snippets", entry.name), { recursive: true });
  await cp(examples, join(root, "dist", "snippets", entry.name), { recursive: true });
}
console.log("html: copied CSS and snippets");
