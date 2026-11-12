// Per-component entries (ADR-0068 §1, roadmap-size.md S2): one module per spec in core, react
// and html (`@owlky/<package>/<spec>`), generated from each package's barrel so they export
// exactly the public API the barrel already exports, routed by source folder.
//
//   node scripts/entries.mjs            write packages/{core,react,html}/src/entries/<spec>.ts and
//                                       the matching `exports` keys in each package.json
//   node scripts/entries.mjs --check    fail when a file or an export key is out of date
//
// Styles already ship `@owlky/styles/components/<file>.css`. Opt-in entries that exist already
// (`@owlky/core/editor`, `@owlky/html/map`…) keep their names and their contents.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { folderSpec } from "./component-folders.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const check = process.argv.includes("--check");
const at = (...parts) => join(root, ...parts);
const specs = new Set(
  (await readdir(at("specs/components")))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3)),
);

// Core folders whose name is neither a spec nor in FOLDER_SPEC. Folders that map to nothing
// (dom, options, overlay, theme, adapters, shared state) stay in the barrel only.
const CORE_FOLDER_SPEC = {
  modal: ["dialog"],
  pickers: ["date-picker"],
  toast: ["snackbar"],
  toggle: ["toggle-button"],
  progress: ["circular-progress", "linear-progress"],
  swatch: ["radio", "checkbox"],
  illustrations: ["illustration"],
  motion: ["motion"],
  "number-field": ["text-field"],
  clipboard: ["text-field"],
  phone: ["phone-input"],
};
// Anatomy modules (`core/src/anatomy/<file>.ts`) that hold the schemas of several specs.
const ANATOMY_SPEC = {
  "icon-button": ["icon-button", "fab"],
  progress: ["circular-progress", "linear-progress"],
  checkbox: ["checkbox", "switch", "form-control-label"],
  popover: ["popover", "tooltip", "menu"],
  "motion-other": ["motion"],
  "number-field": ["text-field"],
};

/** `export {…} from "x"`, `export type {…} from "x"` and `export * from "x"` blocks of a barrel. */
function exportBlocks(code) {
  const blocks = [];
  for (const m of code.matchAll(/export\s+(type\s+)?\{([^}]*)\}\s*from\s*"([^"]+)";/g)) {
    const names = m[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (m[1] && !s.startsWith("type ") ? `type ${s}` : s));
    blocks.push({ from: m[3], names });
  }
  for (const m of code.matchAll(/export \* from "([^"]+)";/g))
    blocks.push({ from: m[1], star: true });
  return blocks;
}

const nameOf = (specifier) =>
  specifier
    .replace(/^type\s+/, "")
    .split(/\s+as\s+/)
    .pop();
const add = (map, spec, from, names, star = false) => {
  if (!specs.has(spec)) throw new Error(`entries: "${spec}" is not a spec`);
  const entry = map.get(spec) ?? new Map();
  const list = entry.get(from) ?? { names: [], star: false };
  list.names.push(...(names ?? []));
  list.star ||= star;
  entry.set(from, list);
  map.set(spec, entry);
};

// --- core ------------------------------------------------------------------------------------

async function coreEntries() {
  const dir = at("packages/core/src");
  const anatomyFiles = (await readdir(join(dir, "anatomy"))).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "anatomy.ts" && f !== "parts.ts",
  );
  /** Exported name → anatomy module. */
  const anatomyOwner = new Map();
  for (const file of anatomyFiles) {
    const code = await readFile(join(dir, "anatomy", file), "utf8");
    for (const m of code.matchAll(
      /^export\s+(?:declare\s+)?(?:const|let|function|type|interface|enum|class)\s+(\w+)/gm,
    ))
      anatomyOwner.set(m[1], file.slice(0, -3));
  }
  const map = new Map();
  for (const block of exportBlocks(await readFile(join(dir, "index.ts"), "utf8"))) {
    if (!block.from.startsWith("./")) continue;
    if (block.from === "./anatomy/anatomy.js") {
      for (const specifier of block.names) {
        const file = anatomyOwner.get(nameOf(specifier));
        if (!file) continue; // re-exported from elsewhere (DataAttributes)
        for (const spec of ANATOMY_SPEC[file] ?? [file === "button-group" ? "button-group" : file])
          add(map, spec, `./anatomy/${file}.js`, [specifier]);
      }
      continue;
    }
    const folder = block.from.split("/")[1];
    const targets = CORE_FOLDER_SPEC[folder] ?? [folderSpec(folder, specs)].filter(Boolean);
    for (const spec of targets) add(map, spec, block.from, block.names, block.star);
  }
  return map;
}

// --- react -----------------------------------------------------------------------------------

async function reactEntries() {
  const map = new Map();
  const code = await readFile(at("packages/react/src/index.ts"), "utf8");
  for (const block of exportBlocks(code)) {
    if (!block.from.startsWith("./")) continue;
    const spec = folderSpec(block.from.split("/")[1], specs);
    if (spec) add(map, spec, block.from, block.names, block.star);
  }
  return map;
}

// --- html ------------------------------------------------------------------------------------

async function htmlEntries() {
  const map = new Map();
  const dir = at("packages/html/src/components");
  const index = await readFile(join(dir, "index.ts"), "utf8");
  for (const m of index.matchAll(/import \{ (\w+) \} from "\.\/([\w-]+)\/([\w-]+)\.js";/g)) {
    const [, definition, folder, file] = m;
    const spec = folderSpec(folder, specs);
    if (!spec) continue;
    const code = await readFile(join(dir, folder, `${file}.ts`), "utf8");
    const types = [...code.matchAll(/^export\s+(?:type|interface)\s+(\w+)/gm)]
      .map((t) => t[1])
      .filter((name) => /(Instance|Events|CloseReason)$/.test(name));
    add(map, spec, `./components/${folder}/${file}.js`, [
      definition,
      ...types.map((t) => `type ${t}`),
    ]);
  }
  return map;
}

// --- output ----------------------------------------------------------------------------------

const HEADER = (pkg, spec) =>
  `// Generated by scripts/entries.mjs (ADR-0068): \`@owlky/${pkg}/${spec}\`. Don't edit; run \`pnpm entries\`.\n`;

function render(pkg, spec, sources) {
  const lines = [HEADER(pkg, spec)];
  for (const [from, { names, star }] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
    const target = from.replace(/^\.\//, "../");
    if (star) lines.push(`export * from "${target}";`);
    const unique = [...new Set(names)].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    if (unique.length) lines.push(`export { ${unique.join(", ")} } from "${target}";`);
  }
  return `${lines.join("\n")}\n`;
}

const PACKAGES = [
  ["core", coreEntries, "dist/entries", "packages/core/src/entries"],
  ["react", reactEntries, "dist/entries", "packages/react/src/entries"],
  ["html", htmlEntries, "dist/esm/entries", "packages/html/src/entries"],
];

const problems = [];
for (const [pkg, collect, distDir, srcDir] of PACKAGES) {
  const manifestFile = at(`packages/${pkg}/package.json`);
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  const map = await collect();
  // An entry that exists already (an opt-in engine, `./auto`) keeps its name and contents.
  const generated = new Map();
  const ours = (key) => (manifest.exports[key]?.import ?? "").startsWith(`./${distDir}/`);
  for (const [spec, sources] of map) {
    const key = `./${spec}`;
    if (key in manifest.exports && !ours(key)) continue;
    generated.set(spec, render(pkg, spec, sources));
  }
  const files = new Map(
    [...generated].map(([spec, text]) => [join(at(srcDir), `${spec}.ts`), text]),
  );
  const onDisk = new Set(
    (await readdir(at(srcDir)).catch(() => [])).map((f) => join(at(srcDir), f)),
  );
  for (const [file, text] of files) {
    const current = await readFile(file, "utf8").catch(() => undefined);
    if (current === text) continue;
    if (check) problems.push(`${relative(root, file)} is out of date`);
    else {
      await mkdir(at(srcDir), { recursive: true });
      await writeFile(file, text);
    }
  }
  for (const file of onDisk) {
    if (files.has(file)) continue;
    if (check) problems.push(`${relative(root, file)} is not generated any more`);
    else await rm(file);
  }
  // Export keys: the package's own keys first ("." and the opt-ins), then one per spec, sorted.
  const exportsNext = {};
  const ownKeys = Object.keys(manifest.exports).filter((key) => !ours(key));
  const specKeys = [...generated.keys()].sort().map((spec) => `./${spec}`);
  const tail = ownKeys.filter((key) => key === "./package.json");
  for (const key of ownKeys) if (!tail.includes(key)) exportsNext[key] = manifest.exports[key];
  for (const key of specKeys)
    exportsNext[key] = {
      types: `./${distDir}/${key.slice(2)}.d.ts`,
      import: `./${distDir}/${key.slice(2)}.js`,
    };
  for (const key of tail) exportsNext[key] = manifest.exports[key];
  if (JSON.stringify(exportsNext) !== JSON.stringify(manifest.exports)) {
    if (check) problems.push(`packages/${pkg}/package.json exports are out of date`);
    else {
      manifest.exports = exportsNext;
      await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  }
  console.log(`entries: ${pkg} ${generated.size} per-component entries`);
}

if (problems.length) {
  for (const problem of problems) console.error(`FAIL ${problem}`);
  console.error("Run `pnpm entries`.");
  process.exit(1);
}
