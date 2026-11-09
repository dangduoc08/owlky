// Runs before `next dev` / `next build` (ADR-0040):
//   - copies the built CDN bundle (packages/html/dist) to public/cdn/;
//   - writes one static sandbox page per HTML example (public/sandbox/…): **Open HTML demo**
//     shows it in an iframe, so the HTML runtime never shares a page with React;
//   - extracts what the pages read from the MCP manifest (option schemas, spec sections) into
//     src/generated/manifest.json, so the 6 MB manifest never reaches a bundle.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { app, loadContent, requireBuild, root } from "./content.mjs";

requireBuild();

// ── CDN bundle ─────────────────────────────────────────────────────────────────────────────────
const cdn = join(app, "public/cdn");
rmSync(cdn, { recursive: true, force: true });
mkdirSync(cdn, { recursive: true });
for (const [from, to] of [
  ["packages/html/dist/owlky.js", "owlky.js"],
  ["packages/html/dist/owlky.css", "owlky.css"],
  ["packages/styles/dist/base.css", "base.css"],
])
  copyFileSync(join(root, from), join(cdn, to));

// ── Sandbox pages ──────────────────────────────────────────────────────────────────────────────
const { PAGES } = await loadContent("site.ts");
const { sandboxPages } = await loadContent("sandbox.ts");
const sandbox = join(app, "public/sandbox");
rmSync(sandbox, { recursive: true, force: true });
let count = 0;
for (const { file, html } of sandboxPages(PAGES)) {
  const path = join(sandbox, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
  count++;
}

// ── Manifest subset ────────────────────────────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(join(root, "packages/mcp/manifest.json"), "utf8"));
const components = {};
for (const page of PAGES) {
  const name = page.guide?.component;
  if (!name) continue;
  const entry = manifest.components.find((component) => component.name === name);
  if (!entry) throw new Error(`website: the manifest has no component "${name}"`);
  components[name] = {
    title: entry.title,
    react: entry.react,
    schemas: entry.schemas,
    sections: entry.sections.filter((section) =>
      ["keyboard", "accessibility", "anatomy"].includes(section.id),
    ),
  };
}
// Facts the home page states (component and test file counts), counted here so they stay true.
const countFiles = (dir, pattern) =>
  readdirSync(join(root, dir), { recursive: true }).filter(
    (file) => pattern.test(String(file)) && !/(^|\/)(node_modules|dist)\//.test(String(file)),
  ).length;
const landing = {
  components: manifest.components.map(({ name, title, summary }) => ({ name, title, summary })),
  unitTestFiles: countFiles("packages", /\.test\.tsx?$/),
  e2eSpecFiles: countFiles("e2e/tests", /\.spec\.ts$/),
};
const generated = join(app, "src/generated");
mkdirSync(generated, { recursive: true });
writeFileSync(
  join(generated, "manifest.json"),
  `${JSON.stringify({ version: manifest.version, components, landing }, null, 1)}\n`,
);

console.log(`website: copied the CDN bundle, wrote ${count} sandbox pages and the manifest subset`);
