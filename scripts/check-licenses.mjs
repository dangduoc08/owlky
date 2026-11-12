// Third-party notices of the published packages (legal track, step L5).
//
// Finds the third-party code each published package ships in `dist`: npm packages named in the
// source maps of its bundles (`*.map` `sources` under `node_modules`), plus the files copied
// verbatim (MapLibre's worker, the self-hosted Monaco folder) listed in `COPIES`. Every one needs an
// entry in that package's `THIRD_PARTY_NOTICES.md` with its license text, and a license from
// `ALLOWED`.
//
//   node scripts/check-licenses.mjs           check (pnpm check:licenses, CI); needs pnpm build
//   node scripts/check-licenses.mjs --write   regenerate the notices files (pnpm notices)
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const write = process.argv.includes("--write");
const NOTICES = "THIRD_PARTY_NOTICES.md";

/** Licenses a bundled dependency may have (SPDX ids). */
const ALLOWED = [
  "MIT",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Apache-2.0",
  "0BSD",
  "CC0-1.0",
  "CC-BY-4.0",
  "OFL-1.1",
];

/**
 * Third-party files copied into `dist` without a source map: the path (a file or a folder, from
 * the package root) and the npm package it comes from, resolved from `from` (a workspace package).
 * `dependencies: true` adds the copied package's own production dependencies (bundled into it).
 */
const COPIES = {
  core: [{ path: "dist/map/worker.js", name: "maplibre-gl", from: "packages/core" }],
  html: [
    { path: "dist/owlky-map-worker.js", name: "maplibre-gl", from: "packages/core" },
    { path: "dist/monaco", name: "monaco-editor", from: "packages/html", dependencies: true },
  ],
};

/** Third-party works inside a copied package that have no npm package of their own. */
const EXTRAS = {
  html: [
    {
      when: "dist/monaco/monaco.css",
      name: "Codicons",
      version: "1.15 (the font version embedded in Monaco 0.57)",
      license: "CC-BY-4.0",
      files: ["dist/monaco/monaco.css"],
      source: "https://github.com/microsoft/vscode-codicons",
      text: `The Codicon icon font is inlined in \`monaco.css\` by Monaco Editor.

Codicons by Microsoft Corporation (https://github.com/microsoft/vscode-codicons). The icons are
licensed under the Creative Commons Attribution 4.0 International license (CC BY 4.0,
https://creativecommons.org/licenses/by/4.0/), as stated by the upstream repository; its code is
under the MIT license. The font is redistributed unmodified, as embedded by Monaco Editor (a data
URL in \`monaco.css\`).`,
    },
  ],
};

/**
 * Third-party artwork generated into Owlky's own sources, so no source map names its npm package:
 * the files that ship it are the bundles whose maps list one of `sources` and the snippets (`.html`) that
 * contain `markup`.
 */
const ARTWORK = [
  {
    name: "@iconify-json/solar",
    from: "packages/core",
    sources: ["packages/core/src/icons/solar.ts", "packages/core/dist/icons/solar.js"],
    markup: 'data-ok-icon="',
    license: "CC-BY-4.0",
    url: "https://github.com/480-Design/Solar-Icon-Set",
    text: `Component icons are drawings of the Solar icon set by 480 Design
(https://www.figma.com/community/file/1166831539721848736), read from the \`@iconify-json/solar\`
package and written into \`src/icons/solar.ts\` by \`scripts/icons.mjs\` (the HTML snippets carry
the same paths). Licensed under the Creative Commons Attribution 4.0 International license (CC BY
4.0, https://creativecommons.org/licenses/by/4.0/). Changes: the \`stroke-width\` attribute is
removed (a stylesheet sets it) and a group's presentation attributes move to the \`<svg>\`.`,
  },
];

/** Notes added to an entry (by npm package name). */
const NOTES = {
  "libphonenumber-js":
    "The bundle includes the package's metadata, a compiled (modified) form of the phone number metadata of Google's libphonenumber (https://github.com/google/libphonenumber), licensed under the Apache License 2.0 (`LICENSE.Apache` below). No NOTICE file is distributed with it.",
  dompurify:
    "Monaco Editor vendors DOMPurify in its build. DOMPurify is dual licensed `(MPL-2.0 OR Apache-2.0)`. Owlky redistributes it under the Apache License 2.0.",
  marked: "Monaco Editor vendors marked in its build.",
  "maplibre-gl":
    "MapLibre GL JS's prebuilt bundle includes other packages (such as `@mapbox/*`, `earcut`, `kdbush`, `pbf`, `potpack`, `quickselect`, `tinyqueue`, `gl-matrix` and `murmurhash-js`), whose notices are part of its `LICENSE.txt` below.",
  "monaco-editor":
    "Monaco Editor's `ThirdPartyNotices.txt` is reproduced verbatim below. Both files are also copied into `dist/monaco/`.",
};

/** Files Monaco needs next to itself (also copied by `packages/html/scripts/copy-assets.mjs`). */
const MONACO_FILES = ["LICENSE", "ThirdPartyNotices.txt"];

const LICENSE_FILE = /^(licen[cs]e|copying|notice|thirdpartynotices)([.\-_].*)?$/i;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

/** The package folder that holds `file` (the last `node_modules/<name>` segment). */
function packageDirOf(file) {
  const parts = file.split(sep);
  const index = parts.lastIndexOf("node_modules");
  if (index < 0) return null;
  const length = parts[index + 1]?.startsWith("@") ? 3 : 2;
  return parts.slice(0, index + length).join(sep);
}

/** `name`'s folder as Node would find it from `fromDir` (walking up through node_modules). */
function resolvePackage(name, fromDir) {
  for (let dir = realpathSync(fromDir); ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return realpathSync(candidate);
    if (dirname(dir) === dir) throw new Error(`cannot resolve ${name} from ${fromDir}`);
  }
}

/** The license of a package, with `OR` expressions resolved to the first allowed choice. */
function licenseOf(manifest) {
  const raw =
    typeof manifest.license === "string"
      ? manifest.license
      : (manifest.license?.type ??
        manifest.licenses?.map((entry) => entry.type ?? entry).join(" OR ") ??
        "UNKNOWN");
  const expression = raw.replace(/^\((.*)\)$/, "$1").trim();
  const choices = expression.split(/\s+OR\s+/);
  const chosen = choices.find((choice) => ALLOWED.includes(choice));
  return { declared: raw, license: chosen ?? expression, chosen: choices.length > 1 && !!chosen };
}

function repositoryOf(manifest) {
  const repo =
    typeof manifest.repository === "string" ? manifest.repository : manifest.repository?.url;
  if (!repo) return manifest.homepage;
  return repo
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/\.git$/, "")
    .replace(/^github:/, "https://github.com/")
    .replace(/^([\w-]+\/[\w.-]+)$/, "https://github.com/$1");
}

function licenseTexts(dir, name) {
  const names = readdirSync(dir).filter(
    (file) => LICENSE_FILE.test(file) && statSync(join(dir, file)).isFile(),
  );
  names.sort((a, b) => a.localeCompare(b));
  return names
    .map((file) => ({
      file,
      text: readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n").trimEnd(),
    }))
    .filter((entry) => entry.text || console.warn(`${name}: ${entry.file} is empty`));
}

/** Every third-party package a published package ships, with the files it ships in. */
function shipped(pkg) {
  const pkgDir = join(root, "packages", pkg);
  const dist = join(pkgDir, "dist");
  const found = new Map(); // package folder → Set of dist files
  const versions = new Map(); // package folder → the version that ships, when not the resolved one
  const add = (dir, file) => {
    if (!found.has(dir)) found.set(dir, new Set());
    found.get(dir).add(file);
  };
  if (!existsSync(dist)) throw new Error(`packages/${pkg}/dist is missing: run pnpm build first`);
  for (const file of walk(dist).filter((f) => f.endsWith(".map"))) {
    const map = readJson(file);
    const base = resolve(dirname(file), map.sourceRoot ?? "");
    for (const source of map.sources ?? []) {
      if (!source.includes("node_modules")) continue;
      const dir = packageDirOf(resolve(base, source.replace(/^webpack:\/\/\/?/, "")));
      if (dir && existsSync(join(dir, "package.json")))
        add(realpathSync(dir), relative(pkgDir, file.replace(/\.map$/, "")));
    }
  }
  for (const copy of COPIES[pkg] ?? []) {
    if (!existsSync(join(pkgDir, copy.path))) continue;
    const dir = resolvePackage(copy.name, join(root, copy.from));
    add(dir, copy.path);
    if (copy.dependencies)
      for (const [dep, range] of Object.entries(
        readJson(join(dir, "package.json")).dependencies ?? {},
      )) {
        // Monaco vendors its dependencies at the versions it pins; an override may resolve a
        // newer copy for npm, which only provides the license text here.
        const depDir = resolvePackage(dep, dir);
        add(depDir, copy.path);
        if (/^\d+\.\d+\.\d+$/.test(range)) versions.set(depDir, range);
      }
  }
  const entries = [...found].map(([dir, files]) => {
    const manifest = readJson(join(dir, "package.json"));
    const { declared, license, chosen } = licenseOf(manifest);
    return {
      name: manifest.name,
      version: versions.get(dir) ?? manifest.version,
      declared,
      license,
      chosen,
      source: repositoryOf(manifest),
      files: [...files].sort(),
      texts: licenseTexts(dir, manifest.name),
      note: NOTES[manifest.name],
    };
  });
  for (const art of ARTWORK) {
    const sources = new Set(art.sources.map((path) => join(root, path)));
    const files = new Set();
    for (const file of walk(dist)) {
      if (file.endsWith(".map")) {
        const map = readJson(file);
        const base = resolve(dirname(file), map.sourceRoot ?? "");
        if ((map.sources ?? []).some((entry) => sources.has(resolve(base, entry))))
          files.add(relative(pkgDir, file.replace(/\.map$/, "")));
      } else if (file.endsWith(".html") && readFileSync(file, "utf8").includes(art.markup))
        files.add(relative(pkgDir, dirname(file)));
    }
    if (!files.size) continue;
    const dir = resolvePackage(art.name, join(root, art.from));
    entries.push({
      name: art.name,
      version: readJson(join(dir, "package.json")).version,
      declared: art.license,
      license: art.license,
      source: art.url,
      files: [...files].sort(),
      texts: [{ file: "Attribution", text: art.text }],
    });
  }
  for (const extra of EXTRAS[pkg] ?? [])
    if (existsSync(join(pkgDir, extra.when)))
      entries.push({
        ...extra,
        declared: extra.license,
        texts: [{ file: "Attribution", text: extra.text }],
      });
  // One entry per package name and version (bundles may resolve the same package twice).
  const unique = new Map();
  for (const entry of entries) {
    const key = `${entry.name}@${entry.version}`;
    const known = unique.get(key);
    if (known) known.files = [...new Set([...known.files, ...entry.files])].sort();
    else unique.set(key, entry);
  }
  return [...unique.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );
}

const fence = (text) => {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((match) => match[0].length));
  const ticks = "`".repeat(longest + 1);
  return `${ticks}text\n${text}\n${ticks}`;
};

function render(packageName, entries) {
  const lines = [
    "# Third-party notices",
    "",
    `\`${packageName}\` is MIT licensed (see \`LICENSE\`). Its \`dist\` folder also contains the`,
    "third-party software listed below. Each entry names the files it ships in and reproduces its",
    "license and copyright notices.",
    "",
    "This file is generated by `scripts/check-licenses.mjs --write` (`pnpm notices`).",
    "",
    "| Package | Version | License | Ships in |",
    "|---|---|---|---|",
    ...entries.map(
      (entry) =>
        `| ${entry.name} | ${entry.version} | ${entry.license} | ${entry.files.map((file) => `\`${file}\``).join(", ")} |`,
    ),
  ];
  for (const entry of entries) {
    lines.push("", `## ${entry.name} ${entry.version}`, "");
    lines.push(
      `- **License:** ${entry.license}${entry.chosen ? ` (chosen from \`${entry.declared}\`)` : ""}`,
    );
    if (entry.source) lines.push(`- **Source:** ${entry.source}`);
    lines.push(`- **Ships in:** ${entry.files.map((file) => `\`${file}\``).join(", ")}`);
    if (entry.note) lines.push("", entry.note);
    for (const text of entry.texts) lines.push("", `### ${text.file}`, "", fence(text.text));
  }
  return `${lines.join("\n")}\n`;
}

const problems = [];
const published = readdirSync(join(root, "packages")).filter((pkg) => {
  const file = join(root, "packages", pkg, "package.json");
  return existsSync(file) && !readJson(file).private;
});
const report = [];
for (const pkg of published) {
  const pkgDir = join(root, "packages", pkg);
  const manifest = readJson(join(pkgDir, "package.json"));
  const entries = shipped(pkg);
  const file = join(pkgDir, NOTICES);
  for (const entry of entries) {
    if (!ALLOWED.includes(entry.license))
      problems.push(
        `${manifest.name}: ${entry.name}@${entry.version} has license "${entry.declared}", not in the allowlist`,
      );
    if (!entry.texts.length)
      problems.push(
        `${manifest.name}: ${entry.name}@${entry.version} ships no license file to reproduce`,
      );
  }
  if (pkg === "html" && existsSync(join(pkgDir, "dist/monaco"))) {
    const monaco = resolvePackage("monaco-editor", pkgDir);
    for (const name of MONACO_FILES) {
      const copy = join(pkgDir, "dist/monaco", name);
      if (
        !existsSync(copy) ||
        readFileSync(copy, "utf8") !== readFileSync(join(monaco, name), "utf8")
      )
        problems.push(
          `${manifest.name}: dist/monaco/${name} must be Monaco's ${name}, copied verbatim`,
        );
    }
  }
  report.push(`${manifest.name}: ${entries.length} third-party package(s)`);
  if (!entries.length) {
    if (existsSync(file))
      problems.push(`${manifest.name}: ${NOTICES} exists but dist ships no third-party code`);
    continue;
  }
  if (!(manifest.files ?? []).includes(NOTICES))
    problems.push(`${manifest.name}: add "${NOTICES}" to "files" in package.json`);
  const expected = render(manifest.name, entries);
  if (write) {
    writeFileSync(file, expected);
    continue;
  }
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  const listed = new Set([...current.matchAll(/^## (.+)$/gm)].map((match) => match[1]));
  const missing = entries.filter((entry) => !listed.has(`${entry.name} ${entry.version}`));
  for (const entry of missing)
    problems.push(
      `${manifest.name}: ${entry.name}@${entry.version} (in ${entry.files.join(", ")}) has no entry in ${NOTICES}`,
    );
  if (!missing.length && current !== expected)
    problems.push(`${manifest.name}: ${NOTICES} is out of date`);
}

console.log(`licenses: ${report.join("; ")}`);
if (problems.length) {
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error(
    write
      ? "licenses: notices written, but fix the problems above"
      : "licenses: run `pnpm notices` after `pnpm build`, or fix the problems above",
  );
  process.exit(1);
}
if (write) console.log("licenses: notices written");
