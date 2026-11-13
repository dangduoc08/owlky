// Writes packages/mcp/manifest.json (ADR-0046): everything the MCP server answers with, built from
// the sources of truth — option schemas (built @owlky/core), specs, the guide sections that docs
// pages export, every story's Code panel (HTML and React, as Storybook shows it), the HTML
// snippets, tokens and the Tailwind theme. Output is deterministic (sorted keys, stable order).
// Run after `pnpm build` (reads packages/*/dist):
//   node scripts/manifest.mjs           write the manifest
//   node scripts/manifest.mjs --check   fail when the committed manifest is out of date (CI)
//   node scripts/manifest.mjs --out <file>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { folderSpec as sharedFolderSpec } from "./component-folders.mjs";
import { componentImports } from "./component-imports.mjs";
import { optionSchemas } from "./option-schemas.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const app = join(root, "apps/storybook");
// Guides migrated out of Storybook (ADR-0040) keep the same `<group>/<folder>` layout there.
const docsContent = join(root, "apps/docs-content");
// `--out <file>` writes elsewhere (the generator's tests compare two runs).
const outFlag = process.argv.indexOf("--out");
const OUT =
  outFlag === -1
    ? join(root, "packages/mcp/manifest.json")
    : resolve(process.cwd(), process.argv[outFlag + 1] ?? "");
/** Bumped when the manifest's shape changes (the server checks it). */
const FORMAT = 1;

const read = (path) => readFileSync(join(root, path), "utf8");
const list = (dir) => readdirSync(join(root, dir), { withFileTypes: true });
const fail = (message) => {
  console.error(`manifest: ${message}`);
  process.exit(1);
};
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const ATTRIBUTE = /data-ok-[a-z0-9]+(?:-[a-z0-9]+)*/g;

const { scanMarkup } = await import(pathToFileURL(join(root, "packages/mcp/dist/markup.js")).href);

// ── Version (fixed group: every publishable package carries the same one) ──────────────────────
const PACKAGES = ["tokens", "styles", "core", "react", "html", "mcp"];
const versions = new Set(
  PACKAGES.map((name) => JSON.parse(read(`packages/${name}/package.json`)).version),
);
if (versions.size !== 1) fail(`packages disagree on the version: ${[...versions].join(", ")}`);
const [version] = versions;

// ── Option schemas ─────────────────────────────────────────────────────────────────────────────
function schemaEntry(schema) {
  return {
    name: schema.name,
    root: schema.root,
    options: Object.entries(schema.options).map(([name, spec]) => {
      const option = { name, kind: spec.kind, attr: spec.attr, description: spec.description };
      for (const key of [
        "values",
        "pattern",
        "default",
        "optional",
        "when",
        "children",
        "min",
        "units",
      ])
        if (spec[key] !== undefined) option[key] = spec[key];
      if (spec.event !== undefined) option.event = `ok:${schema.name}:${spec.event}`;
      return option;
    }),
  };
}
const ROOTS = new Map(); // root attribute → schema names
for (const [name, schema] of Object.entries(optionSchemas)) {
  if (!ROOTS.has(schema.root)) ROOTS.set(schema.root, []);
  ROOTS.get(schema.root).push(name);
}

// ── Specs ──────────────────────────────────────────────────────────────────────────────────────
const GENERATED = /<!-- options:([a-z-]+) [^>]*-->[\s\S]*?<!-- \/options:\1 -->/g;

/**
 * Specs are maintainer documents and name the design reference they were recorded from. The
 * manifest ships on npm, so its spec text drops `Reference URL:` lines and links to the
 * reference site, and names the reference generically.
 */
function publicText(text) {
  return text
    .split("\n")
    .filter((line) => !/^\s*Reference URL:/.test(line))
    .join("\n")
    .replace(/\s*\(https?:\/\/(?:www\.)?minimals\.cc[^)\s]*\)/g, "")
    .replace(/https?:\/\/(?:www\.)?minimals\.cc[^\s,;)]*(?:[,;]\s*)?/g, "")
    .replace(/\bMinimal UI kit\b/g, "the reference kit")
    .replace(/\bMinimal(?:s|'s)? (?=(?:dashboard|look|style|design|theme)\b)/g, "reference ")
    .replace(
      /\b(the |The )?Minimal(?:s'|'s)(?=\s)/g,
      (_, the) => `${the === "The " ? "The" : "the"} reference's`,
    )
    .replace(/\b(the |The )Minimals\b/g, (_, the) => `${the}reference`)
    .replace(/(^|[.!?|]\s+|\n)Minimals\b/g, (_, start) => `${start}The reference`)
    .replace(/\bMinimals\b/g, "the reference")
    .replace(/\bMinimal (?=`)/g, "the reference ");
}

function parseSpec(name, text) {
  const lines = text.split("\n");
  const title = lines[0]?.replace(/^#\s+/, "").trim() ?? name;
  const sections = [];
  let current = { title: "", lines: [] };
  let fence = false;
  for (const line of lines.slice(1)) {
    if (line.startsWith("```")) fence = !fence;
    const heading = !fence && /^## (.+)$/.exec(line);
    if (heading) {
      sections.push(current);
      current = { title: heading[1].trim(), lines: [] };
    } else current.lines.push(line);
  }
  sections.push(current);
  const [preamble, ...rest] = sections;
  const head = preamble.lines.join("\n");
  const schemas = [...text.matchAll(/<!-- options:([a-z-]+) /g)].map((match) => match[1]);
  for (const schema of schemas)
    if (!optionSchemas[schema]) fail(`${name}.md names an unknown schema "${schema}"`);
  const out = rest.map((section) => {
    const sectionTitle = publicText(section.title);
    return {
      id: slug(sectionTitle),
      title: sectionTitle,
      body: publicText(
        section.lines
          .join("\n")
          .replace(GENERATED, (_, schema) => `(Options of \`${schema}\`: listed under "options".)`),
      ).trim(),
    };
  });
  const purpose = out.find((section) => section.id === "purpose")?.body ?? "";
  const summary = (purpose.split(/\n\s*\n/)[0] ?? "").replace(/\s+/g, " ").trim();
  return {
    title,
    summary,
    // Links to the design reference stay in the specs (maintainer documents), not on npm.
    referenceUrl: [/^Reference URL:\s*(\S+)/m.exec(head)?.[1]].find(
      (url) => url && !/minimals\.cc/.test(url),
    ),
    schemas,
    sections: out,
  };
}

/** Anatomy lines that name a part of `rootAttr` without marking it optional. */
function anatomyParts(sections, rootAttr) {
  const anatomy = sections.find((section) => section.id === "anatomy")?.body ?? "";
  const parts = new Set();
  for (const block of anatomy.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    let rootIndent = -1;
    for (const raw of block[1].split("\n")) {
      if (!raw.trim()) continue;
      const indent = raw.length - raw.trimStart().length;
      const content = raw.trimStart().replace(/^[›+]\s*/, "");
      const [selector = "", ...comment] = content.split(/\s{2,}|\s(?=\()|\s›\s/);
      const attr = selector.match(ATTRIBUTE)?.[0];
      if (rootIndent >= 0 && indent <= rootIndent) rootIndent = -1;
      if (attr === rootAttr) {
        rootIndent = indent;
        continue;
      }
      if (rootIndent < 0 || !attr || !attr.startsWith(`${rootAttr}-`) || ROOTS.has(attr)) continue;
      const optional =
        selector.endsWith("?") ||
        new RegExp(`\\[${attr}(=[^\\]]*)?\\]\\?`).test(selector) ||
        /\b(omit|optional|only|when|if|unless|with|without)\b/i.test(comment.join(" "));
      if (!optional) parts.add(attr);
    }
  }
  return parts;
}

const specs = new Map();
for (const entry of list("specs/components").filter((e) => e.name.endsWith(".md"))) {
  const name = entry.name.replace(/\.md$/, "");
  specs.set(name, parseSpec(name, read(`specs/components/${entry.name}`)));
}
const covered = new Set([...specs.values()].flatMap((spec) => spec.schemas));
for (const name of Object.keys(optionSchemas))
  if (!covered.has(name)) fail(`schema "${name}" has no <!-- options:${name} --> spec markers`);

// ── React exports, by source folder ────────────────────────────────────────────────────────────
const folderSpec = (folder) => sharedFolderSpec(folder, specs);

// ── Imports (ADR-0068) ─────────────────────────────────────────────────────────────────────────
// Entries, stylesheets and the lazy CDN module of each component (scripts/component-imports.mjs).
const importsOf = componentImports(root, specs);
const reactExports = new Map([...specs.keys()].map((name) => [name, new Set()]));
const reactIndex = read("packages/react/src/index.ts");
for (const match of reactIndex.matchAll(
  /export\s+(type\s+)?\{([^}]*)\}\s+from\s+"\.\/([^/"]+)\//g,
)) {
  if (match[1]) continue;
  const spec = folderSpec(match[3]);
  if (!spec)
    fail(
      `React folder "${match[3]}" maps to no spec (extend FOLDER_SPEC in component-folders.mjs)`,
    );
  for (const item of match[2].split(",")) {
    const name = item.trim();
    if (name && !name.startsWith("type ")) reactExports.get(spec).add(name);
  }
}

// ── Stories and docs pages (Vite SSR, as the Storybook build sees them) ────────────────────────
const appRequire = createRequire(join(app, "package.json"));
const { createServer } = await import(pathToFileURL(appRequire.resolve("vite")).href);
const { storyNameFromExport, toId } = await import(
  pathToFileURL(appRequire.resolve("storybook/internal/csf")).href
);
const STUB = "\0manifest-stub";
const server = await createServer({
  configFile: false,
  root: app,
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  ssr: { noExternal: [/storybook/] },
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [
    {
      // Storybook's blocks, styles, images, workers and asset URLs are never called while the
      // story objects and section arrays are built.
      name: "manifest-stub",
      enforce: "pre",
      resolveId(id) {
        if (
          /^@?storybook(\/|$)/.test(id) ||
          /\.(css|svg|png)$/.test(id) ||
          /\?(worker|url)$/.test(id)
        )
          return STUB;
      },
      load(id) {
        if (id === STUB)
          return "const p = new Proxy(function () {}, { get: (_, key) => (key === Symbol.toPrimitive ? () => '' : p), apply: () => p, construct: () => p }); export default p; export const Description = p, Markdown = p, Source = p, Subtitle = p, Title = p, useArgs = p, useGlobals = p, addons = p, global = globalThis;";
      },
    },
  ],
});

const sourceFiles = (dir, base = app) =>
  readdirSync(join(base, dir), { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort(byName);

const stories = new Map([...specs.keys()].map((name) => [name, []]));
const titles = new Map();
const guides = [];
try {
  for (const file of sourceFiles("src").filter((path) => path.endsWith(".stories.tsx"))) {
    const [group, folder] = relative(join(app, "src"), file).split("/");
    const component =
      group === "components" ? folder : folder === "illustrations" ? "illustration" : undefined;
    const mod = await server.ssrLoadModule(file);
    const title = mod.default?.title;
    if (title) titles.set(`${group}/${folder}`, title);
    if (!component) continue;
    if (!specs.has(component)) fail(`stories folder "${folder}" has no spec`);
    const source = readFileSync(file, "utf8");
    for (const [, key] of source.matchAll(/^export const (\w+)\b/gm)) {
      const story = mod[key];
      const transform = story?.parameters?.docs?.source?.transform;
      if (typeof transform !== "function") continue;
      const exportName = storyNameFromExport(key);
      stories.get(component).push({
        id: toId(title, exportName),
        name: story.name ?? exportName,
        html: transform("", { globals: { framework: "html" } }),
        react: transform("", { globals: { framework: "react" } }),
      });
    }
  }
  for (const [base, file] of [
    ...sourceFiles("src").map((file) => [app, file]),
    ...sourceFiles("src", docsContent).map((file) => [docsContent, file]),
  ].sort(([, a], [, b]) => byName(a, b))) {
    const source = readFileSync(file, "utf8");
    const exported = /^export const (\w+Sections): GuideSection\[\]/m.exec(source)?.[1];
    if (!exported) continue;
    const [group, folder] = relative(join(base, "src"), file).split("/");
    const mod = await server.ssrLoadModule(file);
    const introduction = folder.includes(".");
    const id = introduction
      ? "introduction"
      : group === "components"
        ? folder
        : `foundations-${folder}`;
    const kind = introduction
      ? "introduction"
      : group === "components"
        ? "component"
        : "foundation";
    guides.push({ id, kind, folder: `${group}/${folder}`, sections: mod[exported] });
  }
} finally {
  await server.close();
}

const guideEntries = guides
  .map(({ id, kind, folder, sections }) => {
    const storyTitle = titles.get(folder)?.split("/").at(-1);
    return {
      id,
      kind,
      title:
        kind === "introduction"
          ? "Introduction"
          : kind === "component"
            ? (specs.get(id)?.title ?? storyTitle ?? id)
            : (storyTitle ?? id),
      ...(kind === "component" ? { component: id } : {}),
      sections: sections.map((section) => {
        const entry = { id: section.id, title: section.title, body: section.body.trim() };
        if (section.html !== undefined) entry.html = section.html;
        if (section.react !== undefined) entry.react = section.react;
        return entry;
      }),
    };
  })
  .sort((a, b) => byName(a.id, b.id));
for (const guide of guideEntries)
  if (guide.kind === "component" && !specs.has(guide.id)) fail(`guide "${guide.id}" has no spec`);

// ── Snippets ───────────────────────────────────────────────────────────────────────────────────
const snippetFiles = new Map(); // component folder → [file, markup][]
for (const entry of list("packages/html/src/components").filter((e) => e.isDirectory())) {
  const dir = `packages/html/src/components/${entry.name}/examples`;
  let files;
  try {
    files = readdirSync(join(root, dir)).filter((file) => file.endsWith(".html"));
  } catch {
    continue;
  }
  snippetFiles.set(
    entry.name,
    files.sort(byName).map((file) => [file, read(`${dir}/${file}`)]),
  );
}
for (const folder of snippetFiles.keys())
  if (!specs.has(folder)) fail(`snippet folder "${folder}" has no spec`);
const allSnippets = [...snippetFiles.values()].flat().map(([, markup]) => markup);

// ── Known attribute names ──────────────────────────────────────────────────────────────────────
const attributes = new Set(ROOTS.keys());
for (const schema of Object.values(optionSchemas))
  for (const spec of Object.values(schema.options))
    if (spec.attr.startsWith("data-ok-")) attributes.add(spec.attr);
const corpus = [
  ...allSnippets,
  ...[...specs.keys()].map((name) => read(`specs/components/${name}.md`)),
  ...guideEntries.flatMap((guide) => guide.sections.map((section) => section.html ?? "")),
];
for (const name of ["tokens", "styles", "core", "react", "html"]) {
  for (const entry of readdirSync(join(root, "packages", name, "src"), {
    withFileTypes: true,
    recursive: true,
  })) {
    if (!entry.isFile() || !/\.(ts|tsx|css)$/.test(entry.name) || /\.test\./.test(entry.name))
      continue;
    corpus.push(readFileSync(join(entry.parentPath, entry.name), "utf8"));
  }
}
for (const text of corpus) for (const [name] of text.matchAll(ATTRIBUTE)) attributes.add(name);

// ── Parts (checked against every snippet, so canonical markup always validates) ────────────────
const rootsByLength = [...ROOTS.keys()].sort((a, b) => b.length - a.length || byName(a, b));
const ownerOf = (attr) => rootsByLength.find((rootAttr) => attr.startsWith(`${rootAttr}-`));
const partSeen = new Map(); // part → { root, inside, outside }
const rootDescendants = new Map(); // root → Set<attr>[] (one per instance)
for (const markup of allSnippets) {
  const { elements } = scanMarkup(markup);
  const names = elements.map((element) => new Set(element.attributes.map(([name]) => name)));
  const ancestors = (index) => {
    const out = [];
    for (let i = elements[index].parent; i !== -1; i = elements[i].parent) out.push(i);
    return out;
  };
  const descendants = elements.map(() => new Set());
  for (let i = elements.length - 1; i >= 0; i--) {
    const parent = elements[i].parent;
    if (parent === -1) continue;
    for (const name of names[i]) descendants[parent].add(name);
    for (const name of descendants[i]) descendants[parent].add(name);
  }
  elements.forEach((_, index) => {
    for (const name of names[index]) {
      if (ROOTS.has(name)) {
        if (!rootDescendants.has(name)) rootDescendants.set(name, []);
        rootDescendants.get(name).push(descendants[index]);
        continue;
      }
      const owner = ownerOf(name);
      if (!owner) continue;
      const seen = partSeen.get(name) ?? { root: owner, inside: 0, outside: 0 };
      partSeen.set(name, seen);
      const inside = names[index].has(owner) || ancestors(index).some((i) => names[i].has(owner));
      if (inside) seen.inside++;
      else seen.outside++;
    }
  });
}
const parts = {};
for (const [part, seen] of [...partSeen].sort(([a], [b]) => byName(a, b)))
  if (seen.outside === 0 && seen.inside > 0) parts[part] = seen.root;

// ── API reference (ADR-0049) ───────────────────────────────────────────────────────────────────
const API = "apps/docs-content/src/api";
function apiReference(name) {
  try {
    return JSON.parse(read(`${API}/${name}.json`));
  } catch {
    fail(`${API}/${name}.json is missing. Run \`pnpm build && pnpm api\` first.`);
  }
}

// ── Components ─────────────────────────────────────────────────────────────────────────────────
const rootComponent = new Map(); // root attribute → component
for (const [name, spec] of specs)
  for (const schema of spec.schemas)
    if (!rootComponent.has(optionSchemas[schema].root))
      rootComponent.set(optionSchemas[schema].root, name);

const components = [...specs.keys()].sort(byName).map((name) => {
  const spec = specs.get(name);
  const schemas = spec.schemas.map((schema) => schemaEntry(optionSchemas[schema]));
  const main = schemas.find((schema) => schema.name === name) ?? schemas[0];
  const storyList = stories.get(name);
  const files = snippetFiles.get(name) ?? [];
  const unused = {};
  for (const story of storyList) story.snippets = [];
  for (const [file, markup] of files) {
    const users = storyList.filter((story) => story.html.includes(markup.trim()));
    for (const story of users) story.snippets.push(file);
    if (users.length === 0) unused[file] = markup;
  }
  const requiredParts = {};
  for (const schema of schemas) {
    const instances = rootDescendants.get(schema.root) ?? [];
    if (instances.length === 0 || requiredParts[schema.root]) continue;
    const required = [...anatomyParts(spec.sections, schema.root)]
      .filter((part) => instances.every((found) => found.has(part)))
      .sort(byName);
    if (required.length > 0) requiredParts[schema.root] = required;
  }
  const related = new Set();
  const specText = read(`specs/components/${name}.md`);
  for (const [, other] of specText.matchAll(/specs\/components\/([a-z-]+)\.md/g))
    related.add(other);
  for (const story of storyList)
    for (const [attr] of story.html.matchAll(ATTRIBUTE)) {
      const other = rootComponent.get(attr);
      if (other) related.add(other);
    }
  related.delete(name);
  const component = {
    name,
    title: spec.title,
    summary: spec.summary,
    react: [...reactExports.get(name)].sort(byName),
    schemas,
    sections: spec.sections,
    requiredParts,
    related: [...related].filter((other) => specs.has(other)).sort(byName),
    stories: storyList,
    snippets: unused,
  };
  if (main) component.root = main.root;
  if (spec.referenceUrl) component.referenceUrl = spec.referenceUrl;
  // The API reference (ADR-0049): every prop, attribute, part, event, method, type and CSS
  // variable, per React component and HTML part (scripts/api-reference.mjs writes it).
  const { entries, types, css } = apiReference(name);
  component.api = { entries, ...(types ? { types } : {}), ...(css ? { css } : {}) };
  component.imports = importsOf(name);
  if (guideEntries.some((guide) => guide.id === name)) component.guide = name;
  const storybookTitle = titles.get(`components/${name}`);
  if (storybookTitle) component.storybookTitle = storybookTitle;
  return component;
});

// ── Tokens ─────────────────────────────────────────────────────────────────────────────────────
const tokensJson = JSON.parse(read("packages/tokens/dist/tokens.json"));
const { root: rootVars, light, dark } = tokensJson.cssVariables;
const tokenNames = [...new Set([rootVars, light, dark].flatMap((vars) => Object.keys(vars)))]
  .filter((name) => name.startsWith("--ok-"))
  .sort(byName);
const variables = tokenNames.map((name) => {
  const token = { name, group: name.slice("--ok-".length).split("-")[0] };
  if (rootVars[name] !== undefined) token.value = rootVars[name];
  if (light[name] !== undefined) token.light = light[name];
  if (dark[name] !== undefined) token.dark = dark[name];
  return token;
});
const UTILITY_PREFIX = {
  color: ["bg", "text", "border", "fill", "stroke", "ring", "outline", "decoration"],
  text: ["text"],
  font: ["font"],
  radius: ["rounded"],
  shadow: ["shadow"],
  ease: ["ease"],
  tracking: ["tracking"],
};
const theme = read("packages/styles/src/theme.css");
const tailwind = [];
for (const [, name, value] of theme.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) {
  const token = /var\((--ok-[a-z0-9-]+)\)/.exec(value)?.[1];
  if (name === "--spacing") {
    tailwind.push({
      name,
      value: value.trim(),
      ...(token ? { token } : {}),
      utilities: ["p-<n>", "m-<n>", "gap-<n>", "w-<n>", "h-<n>"],
      note: "Spacing scale: <n> × --ok-spacing (4px), so p-4 is 16px.",
    });
    continue;
  }
  const match = /^--([a-z]+)-(.+)$/.exec(name);
  if (!match || match[2].includes("--")) continue;
  const prefixes = UTILITY_PREFIX[match[1]];
  if (!prefixes) continue;
  tailwind.push({
    name,
    value: value.trim(),
    ...(token ? { token } : {}),
    utilities: prefixes.map((prefix) => `${prefix}-${match[2]}`),
  });
}
tailwind.sort((a, b) => byName(a.name, b.name));

// ── Output ─────────────────────────────────────────────────────────────────────────────────────
const sortKeys = (value) =>
  Array.isArray(value)
    ? value.map(sortKeys)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort(byName)
            .map((key) => [key, sortKeys(value[key])]),
        )
      : value;
const manifest = sortKeys({
  format: FORMAT,
  version,
  components,
  guides: guideEntries,
  tokens: { variables, tailwind },
  attributes: [...attributes].sort(byName),
  parts,
  // Attributes every component may carry (`data-ok-runtime`, `data-ok-theme`…), as API rows.
  commonParts: apiReference("common").parts,
});
const text = `${JSON.stringify(manifest, null, 1)}\n`;
const relativeOut = relative(root, OUT);
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {}
  if (current !== text) fail(`${relativeOut} is out of date. Run \`pnpm build && pnpm manifest\`.`);
  console.log(`manifest: ${relativeOut} is up to date`);
} else {
  writeFileSync(OUT, text);
  const kb = Math.round(Buffer.byteLength(text) / 1024);
  console.log(
    `manifest: wrote ${relativeOut} (${kb} kB; ${components.length} components, ${components.reduce((n, c) => n + c.stories.length, 0)} stories, ${guideEntries.length} guides, ${variables.length} tokens)`,
  );
}
