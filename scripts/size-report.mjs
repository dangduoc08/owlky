// Size report (roadmap-size.md S1, ADR-0068): where the bytes users download come from.
//
//   node scripts/size-report.mjs [--json <file>] [--quiet]     (after `pnpm build`)
//
// 1. Per component: every byte of each CDN bundle (`owlky.js`, `owlky-*.js`) is attributed to a
//    source file through its source map (VLQ-decoded here: each mapped segment runs to the next
//    one), then grouped by component family. `owlky.min.css` is attributed per
//    `components/<name>.css` (each file minified with esbuild; concatenated in bundle order they
//    gzip to the bundle's size within 0.1 kB), plus core-stylesheet estimates.
//    "gzip alone" gzips a group's bytes on their own (what a lazy module of that group would
//    cost, roughly); "share" scales the bundle's real gzip size by those numbers, so the shares
//    add up to the bundle. Scenario builds also carry per-file and per-anatomy-section views.
// 2. Per scenario: React entries built with Vite (production, minified, tree-shaken; React
//    itself external) through the barrel `@owlky/react` and through a direct file, with the CSS
//    those components need today; HTML pages through the CDN (what the browser downloads) and
//    through the npm ESM build (one definition, as a lazy module would be).
// 3. Anatomy: how much of the option schemas a React entry pulls in, and their descriptions.
//
// Reports only: no budget here (budgets live in check-size.mjs). Writes `reports/size-report.json`
// (git-ignored) for later steps to compare against.
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const jsonIndex = args.indexOf("--json");
const jsonFile = join(root, jsonIndex >= 0 ? args[jsonIndex + 1] : "reports/size-report.json");
const at = (...parts) => join(root, ...parts);
const gz = (text) => gzipSync(typeof text === "string" ? Buffer.from(text) : text).length;
const kB = (bytes) => (bytes / 1000).toFixed(1);
const log = (...line) => {
  if (!quiet) console.log(...line);
};

// --- Source maps ---------------------------------------------------------------------------

const B64 = new Map(
  [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((c, i) => [c, i]),
);

/** Decodes a `mappings` string into per-line segments `[column, source, originalLine]` (the original column is not needed). */
function decodeMappings(mappings) {
  const lines = [];
  let source = 0;
  let line = 0;
  for (const text of mappings.split(";")) {
    const segments = [];
    let generated = 0;
    if (text) {
      for (const segment of text.split(",")) {
        const values = [];
        let shift = 0;
        let value = 0;
        for (const char of segment) {
          const digit = B64.get(char);
          value += (digit & 31) << shift;
          if (digit & 32) shift += 5;
          else {
            values.push(value & 1 ? -(value >>> 1) : value >>> 1);
            value = 0;
            shift = 0;
          }
        }
        generated += values[0];
        if (values.length >= 4) {
          source += values[1];
          line += values[2];
          segments.push([generated, source, line]);
        } else segments.push([generated, -1, -1]);
      }
    }
    lines.push(segments);
  }
  return lines;
}

/** Splits a bundle into slices per (source, original line) through its map. */
async function attribute(file) {
  const code = await readFile(file, "utf8");
  return attributeCode(code, JSON.parse(await readFile(`${file}.map`, "utf8")));
}

function attributeCode(code, map) {
  const decoded = decodeMappings(map.mappings);
  const lines = code.split("\n");
  /** @type {{ source: string, line: number, text: string }[]} */
  const slices = [];
  lines.forEach((text, index) => {
    // Segments may come unsorted (third-party maps): sort, so slices never overlap.
    const segments = [...(decoded[index] ?? [])].sort((a, b) => a[0] - b[0]);
    const first = segments[0]?.[0] ?? text.length;
    slices.push({ source: "(unmapped)", line: -1, text: text.slice(0, first) });
    segments.forEach(([column, source, line], i) => {
      const end = segments[i + 1]?.[0] ?? text.length;
      slices.push({
        source: source < 0 ? "(unmapped)" : normalize(map.sources[source]),
        line,
        text: text.slice(column, end),
        content: source < 0 ? undefined : map.sourcesContent?.[source],
      });
    });
    if (index < lines.length - 1) slices.push({ source: "(unmapped)", line: -1, text: "\n" });
  });
  return { code, slices };
}

// Bundles built here (scenarios) name absolute-ish paths: keep the package-relative part, and read
// React's dist folders like the HTML component folders (same names) so families match.
const normalize = (source) =>
  source
    .replace(/^(\.\.\/)+/, "")
    .replace(/^.*?packages\/(?!.*node_modules)/, "")
    .replace(/^html\/dist\/esm\//, "src/")
    .replace(/^html\//, "")
    .replace(/^react\/dist\/([\w-]+)\//, "src/components/$1/")
    .replace(/^.*node_modules\/\.pnpm\/[^/]+\/node_modules\//, "npm:")
    .replace(/^.*node_modules\//, "npm:");

// --- Families ------------------------------------------------------------------------------

const FAMILIES = [
  [
    "runtime",
    /^(src\/runtime\/|src\/(cdn[\w-]*|auto|index)\.ts$|src\/components\/index\.ts$|core\/dist\/(dom|overlay|shared-state|options)\b)/,
  ],
  ["tokens", /^tokens\//],
  ["chart: geo", /chart\/chart-geo|core\/dist\/map\/(choropleth|describe|lattice)/],
  ["chart: sankey", /chart\/chart-sankey/],
  ["chart: stock", /chart\/chart-(stock|indicators)/],
  ["chart: tree / sunburst / icicle", /chart\/chart-(hierarchy|tree|partition|icicle|drilldown)/],
  [
    "chart: other types",
    /chart\/chart-(polar|cells|shapes|beeswarm|violin|stream|unit|unit-layouts)/,
  ],
  ["chart: core + runtime", /(core\/dist\/chart\/|components\/chart(-trellis)?\/)/],
  ["data grid", /data-grid\//],
  [
    "date pickers",
    /(core\/dist\/pickers\/|components\/(date-|time-clock|digital-clock|month-calendar|year-calendar|multi-input-range-field|multi-section-digital-clock))/,
  ],
  ["gantt", /gantt\//],
  ["carousel + lightbox", /(carousel|lightbox)\//],
  ["other: countdown", /(core\/dist\/motion\/countdown|components\/countdown\/)/],
  [
    "motion",
    /(core\/dist\/motion\/|components\/(motion|motion-[\w-]+|count-up|scroll-progress)\/)/,
  ],
  ["organization chart", /organization-chart\//],
  ["upload", /upload\//],
  ["walktour", /walktour\//],
  ["tree view", /tree-view\//],
  [
    "popover / menu / tooltip",
    /(core\/dist\/(popover|menu)\/|components\/(popover|menu|tooltip)\/)/,
  ],
  [
    "dialog / drawer / modal",
    /(core\/dist\/(modal|drawer)\/|components\/(dialog|drawer|backdrop)\/)/,
  ],
];

// The option schemas: one module per component since S2 (`anatomy/<name>.js`), one `anatomy.js`
// with `// --- Section ---` headings before.
const ANATOMY = /core\/dist\/anatomy\/[\w-]+\.js$/;

const sectionsByContent = new Map();
/** The schema section of a slice: its module, or its heading in the single `anatomy.js`. */
function anatomySectionOf(slice) {
  const file = /([\w-]+)\.js$/.exec(slice.source)?.[1];
  if (file !== "anatomy") return file;
  const content = slice.content ?? "";
  if (!sectionsByContent.has(content)) sectionsByContent.set(content, anatomySections(content));
  return sectionsByContent.get(content)(slice.line);
}

/** `// --- Section ---` headings of anatomy.js, by line, to split the option schemas. */
function anatomySections(content) {
  const sections = [];
  content.split("\n").forEach((line, index) => {
    const match = /^\/\/ --- (.+?) -{3,}/.exec(line);
    if (match) sections.push([index, match[1].replace(/\s*\(.*$/, "")]);
  });
  return (line) => {
    let name = "imports and shared lists";
    for (const [start, section] of sections) if (start <= line) name = section;
    return name;
  };
}

function familyOf(source) {
  if (source === "(unmapped)") return "(unmapped: bundle glue)";
  if (ANATOMY.test(source)) return "anatomy (option schemas)";
  if (source.startsWith("npm:"))
    return `dependency: ${source
      .slice(4)
      .split("/")
      .slice(0, source.startsWith("npm:@") ? 2 : 1)
      .join("/")}`;
  for (const [name, pattern] of FAMILIES) if (pattern.test(source)) return name;
  const folder = /(?:core\/dist|src\/components)\/([\w-]+)\//.exec(source)?.[1];
  return folder ? `other: ${folder}` : `other: ${source}`;
}

/** Groups slices, gzips each group alone, and scales to the bundle's gzip size. */
function group(slices, keyOf, total) {
  const groups = new Map();
  for (const slice of slices) {
    const key = keyOf(slice);
    const entry = groups.get(key) ?? { raw: 0, parts: [] };
    entry.raw += Buffer.byteLength(slice.text);
    entry.parts.push(slice.text);
    groups.set(key, entry);
  }
  const rows = [...groups].map(([name, { raw, parts }]) => ({
    name,
    raw,
    gzipAlone: gz(parts.join("")),
  }));
  const sum = rows.reduce((n, row) => n + row.gzipAlone, 0);
  for (const row of rows) row.gzipShare = Math.round((row.gzipAlone / sum) * total);
  return rows.sort((a, b) => b.gzipShare - a.gzipShare);
}

// --- 1. Bundles ----------------------------------------------------------------------------

const dist = at("packages/html/dist");
// `owlky.js`, the opt-in shims, and since S2 the lazy modules and their shared chunks (ADR-0068).
const listJs = async (dir) =>
  (await readdir(join(dist, dir)).catch(() => []))
    .filter((f) => f.endsWith(".js"))
    .map((f) => (dir ? `${dir}/${f}` : f));
const bundleFiles = [
  ...(await listJs("")).filter(
    (f) => /^owlky(-[\w-]+)?\.js$/.test(f) && f !== "owlky-map-worker.js",
  ),
  ...(await listJs("modules")),
  ...(await listJs("modules/chunks")),
];
const bundles = {};
const anatomyRows = {};
const mainSources = new Set();
/** `source:line` of owlky.js's slices, for the data modules below. */
const mainLines = new Set();
/**
 * Pure data modules (one export per line, no state): a lazy file duplicates only the lines owlky.js
 * holds too, not the whole module (the Solar icons each bundle picks, ADR-0070 § 9).
 */
const DATA_MODULE = /icons\/solar\.js$/;
const duplicated = { parts: [], sources: new Set() };
for (const file of bundleFiles.sort((a, b) =>
  a === "owlky.js" ? -1 : b === "owlky.js" ? 1 : a.localeCompare(b),
)) {
  const { code, slices } = await attribute(join(dist, file));
  const total = gz(code);
  const families = group(slices, (s) => familyOf(s.source), total);
  bundles[file] = { raw: Buffer.byteLength(code), gzip: total, families };
  // Code in both owlky.js and a lazy file has two module instances (ADR-0068 §2).
  if (file === "owlky.js")
    for (const slice of slices) {
      mainSources.add(slice.source);
      mainLines.add(`${slice.source}:${slice.line}`);
    }
  else if (file.startsWith("modules/"))
    for (const slice of slices)
      if (
        slice.source !== "(unmapped)" &&
        mainSources.has(slice.source) &&
        (!DATA_MODULE.test(slice.source) || mainLines.has(`${slice.source}:${slice.line}`))
      ) {
        duplicated.parts.push(slice.text);
        duplicated.sources.add(slice.source);
      }
  const anatomy = slices.filter((s) => ANATOMY.test(s.source));
  if (anatomy.length) {
    const anatomyGzip = families.find((r) => r.name === "anatomy (option schemas)")?.gzipShare ?? 0;
    anatomyRows[file] = group(anatomy, anatomySectionOf, anatomyGzip);
  }
}
// The map's worker is MapLibre only.
{
  const worker = await readFile(join(dist, "owlky-map-worker.js"));
  bundles["owlky-map-worker.js"] = {
    raw: worker.length,
    gzip: gz(worker),
    families: [
      {
        name: "dependency: maplibre-gl (worker)",
        raw: worker.length,
        gzipAlone: gz(worker),
        gzipShare: gz(worker),
      },
    ],
  };
}

// --- CSS -----------------------------------------------------------------------------------

const require = createRequire(import.meta.url);
const esbuild = await import(
  pathToFileURL(require.resolve("esbuild", { paths: [at("node_modules/.pnpm/node_modules")] })).href
);
const minifyCss = async (css) =>
  (await esbuild.transform(css, { loader: "css", minify: true })).code;
const stylesDist = at("packages/styles/dist");
const cssOrder = [
  ...(await readFile(at("packages/styles/src/index.css"), "utf8")).matchAll(
    /@import "\.\/components\/([\w-]+)\.css"/g,
  ),
].map((m) => m[1]);
const cssMinByName = {};
const minCss = await readFile(join(stylesDist, "owlky.min.css"), "utf8");
const tokensMin = await minifyCss(await readFile(join(stylesDist, "tokens.css"), "utf8"));
cssMinByName.tokens = tokensMin;
for (const name of cssOrder) {
  const css = (await readFile(join(stylesDist, "components", `${name}.css`), "utf8")).replace(
    /^@layer theme, base, components, utilities;\n/,
    "",
  );
  cssMinByName[name] = await minifyCss(css);
}
const CSS_FAMILY = (name) => {
  if (name === "tokens") return "tokens";
  if (/^chart/.test(name)) return "chart";
  if (/^(date-|time-|digital-clock|multi-section|picker|month-|year-)/.test(name))
    return "date pickers";
  if (/^data-grid/.test(name)) return "data grid";
  if (/^(carousel|lightbox)$/.test(name)) return "carousel + lightbox";
  if (/^(motion|scroll-progress|count-up)/.test(name)) return "motion";
  return name;
};
const cssTotal = gz(minCss);
const cssRows = (() => {
  const rows = new Map();
  for (const [name, css] of Object.entries(cssMinByName)) {
    const key = CSS_FAMILY(name);
    const row = rows.get(key) ?? { name: key, files: [], raw: 0, parts: [] };
    row.files.push(name);
    row.raw += css.length;
    row.parts.push(css);
    rows.set(key, row);
  }
  return [...rows.values()]
    .map(({ name, files, raw, parts }) => ({
      name,
      files,
      raw,
      gzipAlone: gz(parts.join("")),
    }))
    .map((row, _, all) => ({
      ...row,
      gzipShare: Math.round((row.gzipAlone / all.reduce((n, r) => n + r.gzipAlone, 0)) * cssTotal),
    }))
    .sort((a, b) => b.gzipShare - a.gzipShare);
})();
// A core stylesheet (decision 5) once the heavy components' files move out: real gzip of the
// concatenated minified files, in the bundle's order.
const HEAVY_CSS =
  /^(chart[\w-]*|data-grid[\w-]*|date-[\w-]+|time-[\w-]+|digital-clock|multi-[\w-]+|picker[\w-]*|month-[\w-]+|year-[\w-]+|gantt|carousel|lightbox|motion[\w-]*|scroll-progress|count-up|map|editor|code-editor|markdown|illustration|phone-input)$/;
const HEAVIER_CSS =
  /^(organization-chart|upload|walktour|tree-view|sortable|transfer-list|autocomplete)$/;
const coreCss = (keep) => {
  const files = cssOrder.filter(keep);
  return {
    files: files.length,
    gzip: gz(tokensMin + files.map((name) => cssMinByName[name]).join("")),
  };
};
const css = {
  "owlky.min.css": { raw: Buffer.byteLength(minCss), gzip: cssTotal, families: cssRows },
  "owlky.css": { gzip: gz(await readFile(join(stylesDist, "owlky.css"))) },
  // The same method on every file, to compare with the real bundle.
  allFilesEstimate: coreCss(() => true),
  coreEstimate: coreCss((name) => !HEAVY_CSS.test(name)),
  coreEstimateLighter: coreCss((name) => !HEAVY_CSS.test(name) && !HEAVIER_CSS.test(name)),
  heavyFiles: Object.fromEntries(
    cssOrder
      .filter((name) => HEAVY_CSS.test(name) || HEAVIER_CSS.test(name))
      .map((name) => [name, gz(cssMinByName[name])]),
  ),
};

// --- 2. Scenarios --------------------------------------------------------------------------

const vite = await import(
  pathToFileURL(require.resolve("vite", { paths: [at("packages/html")] })).href
);
const TARGET = ["chrome114", "edge114", "firefox128", "safari17"];
const work = await mkdtemp(join(tmpdir(), "owlky-size-"));
const reactDist = at("packages/react/dist");
const htmlDist = at("packages/html/dist/esm");

/** Builds an ES entry like an app's bundler would (minified, tree-shaken) and measures it. */
async function bundle(name, source) {
  const entry = join(work, `${name}.js`);
  await writeFile(entry, source);
  const output = await vite.build({
    configFile: false,
    logLevel: "silent",
    root: work,
    resolve: { alias: [{ find: /^@owlky\/react$/, replacement: join(reactDist, "index.js") }] },
    build: {
      write: false,
      target: TARGET,
      minify: true,
      sourcemap: true,
      lib: { entry, formats: ["es"], fileName: () => `${name}.js` },
      rollupOptions: {
        external: [/^react(-dom)?(\/.*)?$/],
        output: { minify: true },
      },
    },
  });
  const chunks = (Array.isArray(output) ? output : [output]).flatMap((o) => o.output);
  const main = chunks.find((c) => c.type === "chunk" && c.isEntry);
  const lazy = chunks.filter((c) => c.type === "chunk" && !c.isEntry);
  return {
    gzip: gz(main.code),
    raw: Buffer.byteLength(main.code),
    lazyGzip: lazy.reduce((n, c) => n + gz(c.code), 0),
    code: main.code,
    ...(() => {
      const { slices } = attributeCode(main.code, main.map);
      const total = gz(main.code);
      const families = group(slices, (s) => familyOf(s.source), total);
      const files = group(slices, (s) => s.source, total).slice(0, 25);
      const anatomySlices = slices.filter((s) => ANATOMY.test(s.source));
      const share = families.find((r) => r.name === "anatomy (option schemas)")?.gzipShare ?? 0;
      const anatomy = anatomySlices.length ? group(anatomySlices, anatomySectionOf, share) : [];
      return { families, files, anatomy };
    })(),
  };
}

/** CSS files whose root attribute (`data-ok-<file>`) appears in the bundle: what to import today. */
function cssFor(code) {
  const files = cssOrder.filter((name) => code.includes(`data-ok-${name}`));
  const perComponent = gz(tokensMin + files.map((name) => cssMinByName[name]).join(""));
  return { files, perComponent, full: cssTotal };
}

// Each entry through the barrel and through its per-component entry (`@owlky/react/<spec>`).
const REACT = [
  ["Button", ["Button"], "button"],
  [
    "Button + Dialog + TextField",
    ["Button", "Dialog", "TextField"],
    ["button", "dialog", "text-field"],
  ],
  ["DataGrid", ["DataGrid"], "data-grid"],
  ["Chart", ["Chart"], "chart"],
  ["DatePicker", ["DatePicker"], "date-picker"],
];
const react = [];
for (const [label, names, direct] of REACT) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  const barrel = await bundle(
    `react-${id}-barrel`,
    `export { ${names.join(", ")} } from "@owlky/react";\n`,
  );
  let viaFile;
  const files = Array.isArray(direct) ? direct : [direct];
  // Per-component entries exist since S2; a build without them reports the barrel only.
  if (files.every((file) => existsSync(join(reactDist, "entries", `${file}.js`)))) {
    viaFile = await bundle(
      `react-${id}-direct`,
      names
        .map(
          (n, i) =>
            `export { ${n} } from ${JSON.stringify(join(reactDist, "entries", `${files[i]}.js`))};`,
        )
        .join("\n"),
    );
  }
  react.push({
    label,
    barrelGzip: barrel.gzip,
    directGzip: viaFile?.gzip,
    lazyGzip: barrel.lazyGzip,
    css: cssFor(barrel.code),
    families: barrel.families.slice(0, 12),
    files: barrel.files,
    anatomySections: barrel.anatomy,
    code: barrel.code,
  });
}

// HTML: the CDN page today (one `<link>`, `owlky.js` and the opt-in scripts it needs).
const cdn = (file) => bundles[file]?.gzip ?? 0;
/** A lazy module and every chunk it imports statically (what the loader downloads), relative. */
async function moduleFiles(name, seen = new Set()) {
  const file = name.endsWith(".js") ? name : `modules/${name}.js`;
  if (seen.has(file) || !existsSync(join(dist, file))) return [];
  seen.add(file);
  const code = await readFile(join(dist, file), "utf8");
  const imports = [...code.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)].map((m) =>
    relative(dist, join(dirname(join(dist, file)), m[1])),
  );
  return [file, ...(await Promise.all(imports.map((each) => moduleFiles(each, seen)))).flat()];
}
const lazy = existsSync(join(dist, "modules"));
const page = async (...modules) => [
  "owlky.js",
  ...new Set((await Promise.all(modules.map((m) => moduleFiles(m)))).flat()),
];
const HTML_CDN = lazy
  ? [
      ["Light page (Button, Dialog)", await page()],
      ["Data grid page", await page("data-grid")],
      ["Chart page", await page("chart")],
      ["Date picker page", await page("date-picker")],
      ["Editor page", await page("editor")],
      ["Markdown page", await page("markdown")],
      ["Phone input page", await page("phone-input")],
      ["Map page", [...(await page("map")), "owlky-map-worker.js"]],
      ["Code editor page (Monaco loads on mount)", await page("code-editor")],
    ]
  : [
      ["Light page (Button, Dialog)", ["owlky.js"]],
      ["Data grid page", ["owlky.js"]],
      ["Chart page", ["owlky.js"]],
      ["Editor page", ["owlky.js", "owlky-editor.js"]],
      ["Markdown page", ["owlky.js", "owlky-markdown.js"]],
      ["Phone input page", ["owlky.js", "owlky-phone.js"]],
      ["Map page", ["owlky.js", "owlky-map.js", "owlky-map-worker.js"]],
      ["Code editor page (Monaco loads on mount)", ["owlky.js", "owlky-code-editor.js"]],
    ];
// Each lazy module with the chunks it imports statically: what loading it downloads.
const lazyModules = {};
for (const file of await listJs("modules")) {
  const name = file.slice("modules/".length, -3);
  const files = await moduleFiles(name);
  lazyModules[name] = {
    own: bundles[file]?.gzip ?? 0,
    gzip: files.reduce((n, f) => n + (bundles[f]?.gzip ?? 0), 0),
    files,
  };
}
const htmlCdn = HTML_CDN.map(([label, files]) => ({
  label,
  files,
  jsGzip: files.reduce((n, f) => n + cdn(f), 0),
  cssGzip: css["owlky.css"].gzip,
  cssMinGzip: cssTotal,
}));

// HTML: one definition from the npm ESM build (`@owlky/html`), plus the runtime: what a lazy
// module of that component (with its core) would weigh, the runtime counted once.
// Every definition of `owlky.js`, and the light set a loader would keep in it (decision 3).
const allDefinitions = [
  ...(await readFile(join(htmlDist, "components/index.js"), "utf8")).matchAll(
    /import \{ (\w+) \} from "\.\/([\w-]+\/[\w-]+\.js)"/g,
  ),
].map((m) => `${m[2]}:${m[1]}`);
const HEAVY =
  /^(chart|chart-trellis|data-grid|date-[\w-]+|time-clock|digital-clock|multi-[\w-]+|month-calendar|year-calendar|gantt|carousel|lightbox|motion|motion-[\w-]+|count-up|scroll-progress)\//;
const HEAVIER =
  /^(organization-chart|upload|walktour|tree-view|sortable|transfer-list|autocomplete)\//;
const lightSet = allDefinitions.filter((d) => !HEAVY.test(d));
const HTML_ESM = [
  ["runtime only", []],
  ["dialog", ["dialog/dialog.js:dialog"]],
  [
    "button-free light set (dialog, popover, menu, tooltip, tabs, accordion, text-field, select, checkbox)",
    [
      "dialog/dialog.js:dialog",
      "popover/popover.js:popover",
      "menu/menu.js:menu",
      "tooltip/tooltip.js:tooltip",
      "tabs/tabs.js:tabs",
      "accordion/accordion.js:accordion",
      "text-field/text-field.js:textField",
      "select/select.js:select",
      "checkbox/checkbox.js:checkbox",
    ],
  ],
  ["data-grid", ["data-grid/data-grid.js:dataGrid"]],
  ["chart", ["chart/chart.js:chart", "chart-trellis/chart-trellis.js:chartTrellis"]],
  [
    "date-picker (every picker runtime)",
    [
      "date-field/date-field.js:dateField",
      "date-calendar/date-calendar.js:dateCalendar",
      "date-picker/date-picker.js:datePicker",
      "date-range-calendar/date-range-calendar.js:dateRangeCalendar",
      "date-range-picker/date-range-picker.js:dateRangePicker",
      "time-clock/time-clock.js:timeClock",
      "digital-clock/digital-clock.js:digitalClock",
      "multi-section-digital-clock/multi-section-digital-clock.js:multiSectionDigitalClock",
      "month-calendar/month-calendar.js:monthCalendar",
      "year-calendar/year-calendar.js:yearCalendar",
      "multi-input-range-field/multi-input-range-field.js:multiInputRangeField",
    ],
  ],
  ["gantt", ["gantt/gantt.js:gantt"]],
  ["carousel + lightbox", ["carousel/carousel.js:carousel", "lightbox/lightbox.js:lightbox"]],
  [
    "motion (all runtimes)",
    [
      "motion/motion.js:motion",
      "motion-group/motion-group.js:motionGroup",
      "motion-text/motion-text.js:motionText",
      "motion-border/motion-border.js:motionBorder",
      "count-up/count-up.js:countUp",
      "scroll-progress/scroll-progress.js:scrollProgress",
    ],
  ],
  ["every definition (= owlky.js as ESM)", ["index.js:components"]],
  [`light set: every definition but the S2 heavy ones (${lightSet.length})`, lightSet],
  [
    `light set without organization chart, upload, walktour, tree view, sortable, transfer list, autocomplete (${lightSet.filter((d) => !HEAVIER.test(d)).length})`,
    lightSet.filter((d) => !HEAVIER.test(d)),
  ],
];
const runtimeOnly = await bundle(
  "html-runtime",
  `import { getRuntime } from ${JSON.stringify(join(htmlDist, "runtime/global.js"))};\ngetRuntime().start();\n`,
);
const htmlEsm = [];
for (const [label, defs] of HTML_ESM) {
  if (defs.length === 0) {
    htmlEsm.push({ label, gzip: runtimeOnly.gzip, overRuntime: 0 });
    continue;
  }
  const imports = defs.map((d, i) => {
    const [path, name] = d.split(":");
    const file =
      path === "index.js"
        ? join(htmlDist, "components/index.js")
        : join(htmlDist, "components", path);
    return `import { ${name} as d${i} } from ${JSON.stringify(file)};`;
  });
  const list = defs.map((d, i) => (d.startsWith("index.js") ? `...d${i}` : `d${i}`)).join(", ");
  const built = await bundle(
    `html-${label.replace(/\W+/g, "-").slice(0, 60)}`,
    `${imports.join("\n")}\nimport { getRuntime } from ${JSON.stringify(join(htmlDist, "runtime/global.js"))};\ngetRuntime().register(${list}).start();\n`,
  );
  htmlEsm.push({
    label,
    gzip: built.gzip,
    overRuntime: built.gzip - runtimeOnly.gzip,
    families: built.families.slice(0, 15),
  });
}

// --- 3. Anatomy ----------------------------------------------------------------------------

const core = await import(pathToFileURL(at("packages/core/dist/index.js")).href);
const schemas = Object.entries(core).filter(
  ([key, value]) =>
    key.endsWith("Options") &&
    value &&
    typeof value === "object" &&
    "root" in value &&
    "options" in value,
);
// The built schemas carry no descriptions since S3 (ADR-0068 §4): they are in option-docs.json, so
// `descriptionsKept` and the "without descriptions" figure show that none reach a bundle.
const optionDocs = JSON.parse(await readFile(at("packages/core/dist/option-docs.json"), "utf8"));
const descriptions = Object.values(optionDocs).flatMap((options) =>
  Object.values(options).map((o) => o.description),
);
const descriptionBytes = descriptions.reduce((n, d) => n + Buffer.byteLength(d), 0);
const owlkyJs = bundles["owlky.js"];
const anatomyInOwlky = owlkyJs.families.find((r) => r.name === "anatomy (option schemas)");
// What remains of owlky.js's anatomy slices once description strings are removed (gzip alone).
const anatomyText = (await attribute(join(dist, "owlky.js"))).slices
  .filter((s) => ANATOMY.test(s.source))
  .map((s) => s.text)
  .join("");
let stripped = anatomyText;
for (const d of [...new Set(descriptions)].sort((a, b) => b.length - a.length)) {
  if (d.length < 8) continue;
  for (const quoted of [JSON.stringify(d), `\`${d.replaceAll("`", "\\`")}\``, `'${d}'`])
    stripped = stripped.split(quoted).join('""');
}
const roots = schemas.map(([, s]) => s.root);
const reactAnatomy = react.map((r) => ({
  label: r.label,
  schemaRoots: roots.filter((root) => new RegExp(`[\`"']${root}[\`"']`).test(r.code)).length,
  descriptionsKept: descriptions.filter((d) => d.length >= 24 && r.code.includes(d)).length,
}));
const anatomy = {
  schemas: schemas.length,
  options: descriptions.length,
  descriptionBytes,
  descriptionsGzipAlone: gz(descriptions.join("\n")),
  owlkyJsShare: anatomyInOwlky?.gzipShare,
  owlkyJsAloneGzip: anatomyInOwlky?.gzipAlone,
  owlkyJsWithoutDescriptionsGzip: gz(stripped),
  reactEntries: reactAnatomy,
  sections: anatomyRows["owlky.js"],
};

await rm(work, { recursive: true, force: true });

// --- Output --------------------------------------------------------------------------------

const table = (rows, columns) => {
  const widths = columns.map(([title, get]) =>
    Math.max(title.length, ...rows.map((r) => String(get(r)).length)),
  );
  const line = (cells) =>
    cells
      .map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i])))
      .join("  ");
  log(line(columns.map(([title]) => title)));
  for (const row of rows) log(line(columns.map(([, get]) => get(row))));
};
const FAMILY_COLUMNS = [
  ["family", (r) => r.name],
  ["raw kB", (r) => kB(r.raw)],
  ["gzip alone", (r) => kB(r.gzipAlone)],
  ["gzip share", (r) => kB(r.gzipShare)],
];

for (const [file, info] of Object.entries(bundles)) {
  // Shims and shared chunks are in the JSON only; modules print their top families.
  if (file.startsWith("modules/chunks/") || info.raw < 1000) continue;
  log(`\n${file}: ${kB(info.raw)} kB raw, ${kB(info.gzip)} kB gzip`);
  const rows = info.families;
  const top = file === "owlky.js" ? rows : rows.slice(0, 8);
  table(top, FAMILY_COLUMNS);
  if (top.length < rows.length) log(`… ${rows.length - top.length} more rows in the JSON`);
}
log(`\nowlky.js anatomy by section (share of its ${kB(anatomyInOwlky?.gzipShare ?? 0)} kB):`);
table(anatomy.sections.slice(0, 15), FAMILY_COLUMNS);
log(
  `\nowlky.min.css: ${kB(css["owlky.min.css"].raw)} kB raw, ${kB(cssTotal)} kB gzip (owlky.css ${kB(css["owlky.css"].gzip)} kB gzip)`,
);
table(cssRows.slice(0, 25), FAMILY_COLUMNS);
log(`… ${Math.max(0, cssRows.length - 25)} more rows in the JSON`);
log(
  `Core CSS estimate (tokens + every file but the heavy ones): ${kB(css.coreEstimate.gzip)} kB gzip (${css.coreEstimate.files} files); also without organization chart, upload, walktour, tree view, sortable, transfer list, autocomplete: ${kB(css.coreEstimateLighter.gzip)} kB (${css.coreEstimateLighter.files} files).`,
);

log("\nReact scenarios (Vite production build, React external):");
table(react, [
  ["entry", (r) => r.label],
  ["barrel gzip", (r) => kB(r.barrelGzip)],
  ["entry gzip", (r) => (r.directGzip === undefined ? "-" : kB(r.directGzip))],
  ["lazy chunks", (r) => kB(r.lazyGzip)],
  ["CSS per file", (r) => `${kB(r.css.perComponent)} (${r.css.files.length} files)`],
  ["CSS full", (r) => kB(r.css.full)],
]);
if (Object.keys(lazyModules).length) {
  log("\nLazy modules (each with the chunks it imports; shared chunks count in each):");
  table(
    Object.entries(lazyModules)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.gzip - a.gzip),
    [
      ["module", (r) => r.name],
      ["own gzip", (r) => kB(r.own)],
      ["with imports", (r) => kB(r.gzip)],
      ["files", (r) => r.files.length],
    ],
  );
}
if (duplicated.sources.size)
  log(
    `Code in both owlky.js and the lazy files: ${duplicated.sources.size} source files, ${kB(gz(duplicated.parts.join("")))} kB gzip (in the lazy files).`,
  );
log("\nHTML scenarios, CDN (owlky.css + the scripts the page downloads):");
table(htmlCdn, [
  ["page", (r) => r.label],
  ["JS gzip", (r) => kB(r.jsGzip)],
  ["owlky.css", (r) => kB(r.cssGzip)],
  ["(min.css)", (r) => kB(r.cssMinGzip)],
  ["total", (r) => kB(r.jsGzip + r.cssGzip)],
]);
log("\nHTML ESM, runtime + definitions (a lazy module's weight):");
table(htmlEsm, [
  ["definitions", (r) => r.label],
  ["gzip", (r) => kB(r.gzip)],
  ["over runtime", (r) => kB(r.overRuntime)],
]);
log(
  `\nAnatomy: ${anatomy.schemas} schemas, ${anatomy.options} options, descriptions ${kB(descriptionBytes)} kB raw / ${kB(anatomy.descriptionsGzipAlone)} kB gzip alone.`,
);
log(
  `owlky.js anatomy: ${kB(anatomy.owlkyJsShare ?? 0)} kB share, ${kB(anatomy.owlkyJsAloneGzip ?? 0)} kB alone, ${kB(anatomy.owlkyJsWithoutDescriptionsGzip)} kB alone without descriptions.`,
);
table(reactAnatomy, [
  ["React entry", (r) => r.label],
  [`schema roots (of ${anatomy.schemas})`, (r) => r.schemaRoots],
  ["descriptions kept", (r) => r.descriptionsKept],
]);

await mkdir(dirname(jsonFile), { recursive: true });
const json = {
  generated: new Date().toISOString(),
  bundles,
  css,
  modules: lazyModules,
  duplicated: {
    raw: Buffer.byteLength(duplicated.parts.join("")),
    gzip: duplicated.parts.length ? gz(duplicated.parts.join("")) : 0,
    sources: [...duplicated.sources].sort(),
  },
  scenarios: {
    react: react.map(({ code, ...rest }) => rest),
    htmlCdn,
    htmlEsm,
  },
  anatomy,
};
await writeFile(jsonFile, `${JSON.stringify(json, null, 2)}\n`);
console.log(
  `Size report: owlky.js ${kB(owlkyJs.gzip)} kB gzip (anatomy ${kB(anatomy.owlkyJsShare ?? 0)} kB), owlky.min.css ${kB(cssTotal)} kB, React Button ${kB(react[0].barrelGzip)} kB, HTML light sets A ${kB(htmlEsm.at(-2).gzip)} / B ${kB(htmlEsm.at(-1).gzip)} kB → ${relative(root, jsonFile)}${quiet ? " (pnpm size:report for the tables)" : ""}`,
);
