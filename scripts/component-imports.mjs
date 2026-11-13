// Where a component comes from (ADR-0068): the per-component entries of each package
// (package.json `exports`), its stylesheets in bundle order (`@owlky/styles/components/<file>.css`,
// the component's folders mapped to the spec) and the lazy CDN module owlky.js loads for it.
// Shared by scripts/manifest.mjs (`imports` of each component, `get_component`) and
// scripts/api-reference.mjs (the "Import" table of each docs page's API reference).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { folderSpec } from "./component-folders.mjs";

/**
 * Returns `importsOf(spec)` for the repository at `root`; `specs` holds the spec names.
 * `importsOf` gives `{ react?, html?, core?, css?, cdnModule? }`: only the keys that exist.
 */
export function componentImports(root, specs) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const exportKeys = (pkg) =>
    new Set(Object.keys(JSON.parse(read(`packages/${pkg}/package.json`)).exports));
  const entryKeys = {
    core: exportKeys("core"),
    react: exportKeys("react"),
    html: exportKeys("html"),
  };
  const stylesheetOrder = [
    ...read("packages/styles/src/index.css").matchAll(/@import "\.\/components\/([\w-]+)\.css"/g),
  ].map((match) => match[1]);
  const lazyModules = new Map();
  const table = read("packages/html/src/loader/modules.ts");
  for (const [, key, body] of table.matchAll(
    /^ {2}"?([\w-]+)"?: \{([\s\S]*?definitions: \[[^\]]*\])/gm,
  ))
    for (const [, definition] of body.matchAll(/"([\w-]+)"/g))
      if (!definition.startsWith("data-ok")) lazyModules.set(definition, key);

  return function importsOf(name) {
    const imports = {};
    for (const pkg of ["react", "html", "core"])
      if (entryKeys[pkg].has(`./${name}`)) imports[pkg] = `@owlky/${pkg}/${name}`;
    const css = stylesheetOrder
      .filter((file) => folderSpec(file, specs) === name)
      .map((file) => `@owlky/styles/components/${file}.css`);
    if (css.length) imports.css = css;
    const module = lazyModules.get(name);
    if (module) imports.cdnModule = module;
    return imports;
  };
}
