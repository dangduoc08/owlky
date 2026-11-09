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
console.log("html: copied CSS, snippets and Monaco's messages");
