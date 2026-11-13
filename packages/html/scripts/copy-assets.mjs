// Copies the shared stylesheet and the canonical snippets into dist, so CDN users need one package.
import { existsSync } from "node:fs";
import { cp, mkdir, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const stylesDist = dirname(require.resolve("@owlky/styles/owlky.css"));

// The core sheet, the one-file sheet and the lazy modules' sheets (modules/<name>.css, which the
// loader attaches before each module, ADR-0068 section 5).
for (const file of ["owlky.css", "owlky.min.css", "owlky-all.css", "owlky-all.min.css"]) {
  await cp(join(stylesDist, file), join(root, "dist", file));
}
await mkdir(join(root, "dist", "modules"), { recursive: true });
await cp(join(stylesDist, "modules"), join(root, "dist", "modules"), { recursive: true });
// MapLibre's worker (ADR-0025): modules/map.js finds it in the folder above itself.
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
// Monaco's UI messages (ADR-0034, `loader.config({ "vs/nls": … })` with `paths.vs`): self-contained
// modules that set Monaco's message globals before monaco.js loads.
const nls = join(root, "node_modules", "monaco-editor", "esm", "vs", "nls", "lang");
await mkdir(join(root, "dist", "monaco", "nls"), { recursive: true });
for (const file of await readdir(nls))
  if (file.endsWith(".js")) await cp(join(nls, file), join(root, "dist", "monaco", "nls", file));
// Monaco's license and third-party notices travel with the self-hosted folder (legal step L5).
for (const file of ["LICENSE", "ThirdPartyNotices.txt"])
  await cp(join(root, "node_modules", "monaco-editor", file), join(root, "dist", "monaco", file));
// Flag images for the phone input (ADR-0070 section 9): one Circle Flags SVG per two-letter code
// (plus `xx.svg`, the set's unknown-country flag), with the set's license. Separate files, never a
// bundle: `data-ok-flags="image"` loads them lazily from `flags/` next to `owlky.js`.
const flags = join(root, "node_modules", "circle-flags");
await mkdir(join(root, "dist", "flags"), { recursive: true });
for (const file of await readdir(join(flags, "flags")))
  if (/^(?:[a-z]{2})\.svg$/.test(file))
    await cp(join(flags, "flags", file), join(root, "dist", "flags", file));
await cp(join(flags, "LICENSE.md"), join(root, "dist", "flags", "LICENSE.md"));
console.log("html: copied CSS, snippets, Monaco's messages, flags and notices");
