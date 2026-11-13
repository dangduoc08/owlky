// Gzip size budgets for what users download. Raise a budget only with a reason in the PR.
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";

/** An ES module and every file it imports statically (what the browser loads before it runs). */
async function withImports(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const code = await readFile(file, "utf8");
  const imports = [...code.matchAll(/(?:from|import)\s*"(\.{1,2}\/[^"]+\.js)"/g)].map((m) =>
    join(dirname(file), m[1]),
  );
  return [file, ...(await Promise.all(imports.map((each) => withImports(each, seen)))).flat()];
}

const budgets = [
  // owlky.js loads heavy components on demand since S2 of the size roadmap (ADR-0068; it was
  // 310 kB with every component, 307.6 kB measured): the runtime, the loader and the 35 light
  // components, 45.2 kB measured. Budgets only go down from here (roadmap-size.md decision 8).
  // 40.45 kB since S3 (option descriptions in option-docs.json, ADR-0068 §4): 47 kB before.
  ["packages/html/dist/owlky.js", 42_000, "HTML runtime + light components + loader (IIFE)"],
  ["packages/html/dist/esm/runtime/runtime.js", 3_000, "HTML core runtime"],
  // The old opt-in scripts are shims (ADR-0068 §8): they ask owlky.js's loader for their module.
  // Before: Editor 163 kB, Map 310 kB, Markdown 110 kB, Phone 47.5 kB, Code editor 12 kB and
  // Illustrations 12 kB budgets; those engines are lazy modules now (below).
  ...["editor", "map", "markdown", "phone", "illustrations", "code-editor"].map((name) => [
    `packages/html/dist/owlky-${name}.js`,
    500,
    `owlky-${name}.js shim`,
  ]),
  // MapLibre's tile worker, loaded by the map itself.
  ["packages/html/dist/owlky-map-worker.js", 155_000, "MapLibre tile worker (loaded by the map)"],
  // Monaco itself (0.57): the editor, its 80+ language tokenizers' registrations and its CSS are
  // about 1.15 MB gzip when the first editor mounts (tokenizers and language features load later,
  // per language). Budgets track Monaco upgrades; they are not Owlky code.
  [
    [
      ...(await withImports("packages/html/dist/monaco/monaco.js")),
      "packages/html/dist/monaco/monaco.css",
    ],
    1_250_000,
    "Monaco engine, first editor (monaco.js + static imports + monaco.css)",
  ],
  // TypeScript / JavaScript language service (the TypeScript compiler), only for those languages.
  [
    await withImports("packages/html/dist/monaco/typescript.worker.js"),
    1_600_000,
    "Monaco TypeScript worker (+ shared worker chunk)",
  ],
  // 42 kB once the Map, the Carousel and the Code editor merged together (about 2.1 + 2 + 0.3 kB
  // on 38 kB): 40.4 kB.
  // 36.1 kB with the Code editor (ADR-0034: frame, loading state and fallback textareas; about
  // 0.3 kB). Monaco's own CSS ships in dist/monaco/monaco.css, budgeted above.
  // 40 kB since the Carousel (ADR-0033: viewport, slides, effects, arrows, dots, progress,
  // thumbnails, overlay placements; about 2 kB): 37.8 kB.
  // 40 kB since the Map (ADR-0025: controls, markers, popups, panels, scale, credits and MapLibre's
  // canvas essentials, so maplibre-gl.css isn't needed; about 2.1 kB): 37.97 kB.
  // 36 kB since the chart's phase 4 (ADR-0031: toolbar, candles, annotations, brush selection,
  // opt-in animations; about 0.5 kB): 35.0 kB.
  // 38 kB since the date pickers' phase 3 (range calendar and range picker styles; about 0.7 kB)
  // merged after the chart's phase 3 (35.2 kB).
  // 35 kB since the date pickers' phase 2 (ADR-0026: time clock, digital clocks, time toolbar,
  // tabs layout; about 1.5 kB in the bundle). The JS runtimes of phase 2 (about 5 kB) fit the
  // CDN budget above.
  // 33 kB since the date pickers' phase 1 (field sections, calendar, month / year views, layout;
  // about 2.5 kB).
  // 30 kB since the Editor (content typography, code blocks, toolbar; about 1.7 kB).
  // 28 kB since the data grid (phase 1); 27 kB after Motion (entrance, loop, draw and border
  // keyframes); 25 kB after the composite
  // inputs, 22 kB after the navigation components, 20 kB after the form, display and list
  // components. Per-component files (`@owlky/styles/components/*`) let apps
  // load only what they use.
  // 48 kB since the Illustrations (ADR-0041: tones mapped to tokens for six palettes, sizing; about
  // 0.5 kB once the Upload's own tone rules moved there): 46.7 kB.
  // 47 kB since the Upload (zone, previews, list rows and tiles, file icons; about 2.3 kB): 44.7 kB.
  // 45 kB since the Image (ratios, fits, positions, overlays, placeholder; about 0.95 kB): 44.2 kB.
  // 44 kB since the Lightbox (toolbar, captions, thumbnails, zoom frame; about 1.4 kB): 42.1 kB;
  // 43.25 kB once merged with Markdown and the Organization chart.
  // 50 kB since the Card (on Paper: header, media, content, actions, action area; about 0.5 kB
  // in the bundle): 47.8 kB, after Paper and Typography; the rest of wave 8 adds small files.
  // 52 kB since the Select (field box mirroring TextField's three variants, InputLabel, the
  // TablePagination and TextField compositions; about 1.3 kB): 49.6 kB.
  // 56 kB since Phase 4 batch C's Snackbar (stacked toasts, swipe, rich colors, invert, a list
  // per position, offsets; about 0.6 kB): 52.27 kB, before the Tree view's drag and drop,
  // editing and loading states.
  // 60 kB since Phase 4 batch E (organization chart directions and highlight, data grid layout,
  // footer, set filter and selection options, chart stacks and cues; about 2 kB): 56.2 kB.
  // 63.5 kB after Phase 4 batch F: the Countdown (4.22), the Radio / Checkbox / Avatar color
  // swatches (4.23; sizes, shapes, checked states, forced colors; about 0.6 kB) and the phone input
  // (4.25, ADR-0061: the bare country select, flags, the visually hidden name; about 0.25 kB):
  // 60.49 kB before the phone input. Optimization is deferred to 1.0 prep.
  ["packages/styles/dist/owlky.min.css", 63_500, "All CSS (tokens + components)"],
  // The MCP server's data (ADR-0046, downloaded by `npx -y @owlky/mcp`): 0.69 MB gzip (6 MB raw)
  // at first, most of it the HTML of the date picker and data grid stories. 1 MB since the API
  // reference (ADR-0049: every prop, attribute, part, event, method, type and CSS variable per
  // component; about 145 kB gzip, 0.77 → 0.92 MB): gzip's 32 kB window can't share the props
  // that the date picker family repeats per component, and agents need each one whole. 1.15 MB
  // since the docs examples became complete (roadmap 3.4, `check:docs`): the guides' HTML repeats
  // whole snippets (data grids, date pickers, the editor, the lightbox) instead of shortened
  // copies, about 0.1 MB gzip.
  // 1.35 MB since the range charts and the ApexTree rows (stories, docs sections, API entries): 1298.7 kB.
  // 1.35 MB since the data grid's cell menu and filter groups (4.18.13, ADR-0057: two stories with
  // their snippets, two docs sections, API entries): 1300.4 kB.
  // 1.3 MB since the data grid and sortable shoulds (stories, docs sections, API entries): 1249.6 kB.
  // 1.25 MB since Phase 4 batch E shoulds (chart stacks, cues, tooltips, legends; button, text field,
  // select and picker field options: their stories, docs sections and API entries): 1202.0 kB.
  // 1.2 MB since Phase 4 batch E (new chart and data grid stories, sections and API entries): 1154.6 kB.
  // 1.4 MB since the geo charts and the ApexCharts v8 types (stories, docs sections, API entries): 1364.4 kB.
  // 1.45 MB with the data grid coulds (roadmap 4.18.55–4.18.58: docs sections, API entries): 1389.5 kB.
  // 1.45 MB after the chart coulds 4.18.65 to .68 and .20 (21 stories, their docs sections and
  // API entries): 1399.5 kB.
  // 1.5 MB after batch F (Text max line, gradients, Style components guide, copy to clipboard,
  // number input: stories, guides, docs sections and API entries): 1450.8 kB.
  // 1.55 MB after Phase 5.2 and 5.3 (scroll progress: a new spec, guide and three stories;
  // gestures and the swipeable Drawer: stories, docs sections and API entries): 1505.3 kB.
  // 1.63 MB after all 6.0 Apex gaps (ApexTree, ApexGrid and ApexMaps rows: stories, docs
  // sections, API entries, three ADRs): 1578.67 kB.
  // 1.69 MB after design styles ST2 (Solar component icons, whose paths are longer than the old
  // drawings, in 2,655 snippet icons that every story's HTML carries; the style tokens in every API
  // entry's CSS variables): 1643.5 kB. The npm tarball only; no page downloads it.
  ["packages/mcp/manifest.json", 1_690_000, "MCP manifest (npm tarball, not a browser download)"],
];

// The lazy modules of owlky.js (ADR-0068, roadmap-size.md decision 9), each file on its own, as
// measured in S2 plus at most 5%; the shared chunks they import are budgeted together below (a
// page downloads each chunk once). The old opt-in budgets cap their engines: the Editor 163 kB,
// the Map 310 kB, Markdown 110 kB, the phone input 47.5 kB.
const MODULE_BUDGETS = {
  autocomplete: 5_450, // 5.20 kB measured (5.89 kB in S2)
  carousel: 20_000, // 19.07 kB (Carousel + Lightbox)
  chart: 12_900, // 12.35 kB (the engine is in shared chunks: the data grid's charts use it too)
  "code-editor": 7_400, // 7.08 kB (Monaco loads from dist/monaco/, budgeted above)
  "data-grid": 61_900, // 59.00 kB
  "date-picker": 30_900, // 29.49 kB (11 runtimes)
  editor: 156_500, // 149.38 kB (Tiptap and ProseMirror, about 125 kB of it)
  gantt: 16_300, // 15.59 kB
  illustration: 7_000, // 6.75 kB
  map: 310_000, // 303.98 kB (MapLibre, about 295 kB of it)
  markdown: 104_500, // 99.61 kB (unified, micromark, parse5)
  motion: 19_000, // 18.11 kB (6 runtimes)
  "organization-chart": 8_000, // 7.65 kB
  "phone-input": 42_600, // 40.64 kB (libphonenumber-js and its metadata, about 35.5 kB)
  sortable: 5_600, // 5.40 kB
  "transfer-list": 1_200, // 1.16 kB
  "tree-view": 5_800, // 5.55 kB
  upload: 7_150, // 6.85 kB
  walktour: 5_700, // 5.43 kB
};
for (const [name, limit] of Object.entries(MODULE_BUDGETS))
  budgets.push([`packages/html/dist/modules/${name}.js`, limit, `Lazy module ${name}`]);
{
  const chunks = (await readdir("packages/html/dist/modules/chunks"))
    .filter((file) => file.endsWith(".js"))
    .map((file) => `packages/html/dist/modules/chunks/${file}`);
  // 80.72 kB measured since S3 (87.35 kB in S2): the chart engine (shared by the chart and the
  // data grid), the runtime and the overlay helpers the modules share.
  budgets.push([chunks, 84_700, "Shared chunks of the lazy modules (all of them)"]);
}

// Scenarios (decision 7): what a page or an app downloads. HTML: `owlky.js`, the modules and
// chunks the loader fetches for the page, and `owlky.min.css`. React: Vite production builds
// from `scripts/size-report.mjs` (run first by `pnpm check:size`), React itself excluded.
const page = async (...modules) => [
  "packages/html/dist/owlky.js",
  ...new Set(
    (
      await Promise.all(modules.map((name) => withImports(`packages/html/dist/modules/${name}.js`)))
    ).flat(),
  ),
  "packages/styles/dist/owlky.min.css",
];
budgets.push(
  // 103.15 kB measured since S3 (40.45 kB of JavaScript); 107.9 kB in S2, 370 kB before S2.
  [await page(), 108_000, "Scenario: HTML page with a Dialog (light components only)"],
  // 233.69 kB measured since S3; 246.5 kB in S2, 370 kB before S2.
  [await page("data-grid"), 245_000, "Scenario: HTML page with a Data grid"],
  // 188.52 kB measured since S3; 199.1 kB in S2, 370 kB before S2.
  [await page("chart"), 197_500, "Scenario: HTML page with a Chart"],
);

let failed = false;

// React scenarios, from the size report's JSON.
{
  const REACT = {
    // S3 measurements (descriptions out of the schemas); S2: 8.32, 22.19, 206.25 and 81.14 kB.
    Button: [8_200, "React, Button only"], // 7.86 kB measured (10.2 kB before S2)
    "Button + Dialog + TextField": [20_600, "React, Button + Dialog + TextField"], // 19.65 kB
    DataGrid: [202_000, "React, DataGrid"], // 193.30 kB
    Chart: [78_500, "React, Chart"], // 75.27 kB
  };
  let report;
  try {
    report = JSON.parse(await readFile("reports/size-report.json", "utf8"));
  } catch {
    console.log("FAIL reports/size-report.json is missing: run `pnpm size:report` first");
    process.exit(1);
  }
  for (const [label, [limit, name]] of Object.entries(REACT)) {
    const size = report.scenarios.react.find((entry) => entry.label === label)?.barrelGzip;
    const ok = typeof size === "number" && size <= limit;
    failed ||= !ok;
    console.log(
      `${ok ? "ok  " : "FAIL"} Scenario: ${name}: ${((size ?? 0) / 1000).toFixed(2)} kB / ${limit / 1000} kB gzip`,
    );
  }

  // Code in both owlky.js and a lazy file has two module instances (ADR-0068 §2): its bytes are
  // budgeted (12.2 kB measured), and it must hold no module-level state, or the two copies would
  // disagree. Files listed here hold state that only one side ever uses.
  const STATE_ALLOWED = {
    // `createDrag`'s nested-draggable set: only the motion module creates drags; owlky.js uses
    // the file's pan helper (the swipeable Drawer).
    "core/src/motion/drag.ts": true,
    // Per-copy "reported once" warning flags (ADR-0007: each copy reports once).
    "html/src/runtime/global.ts": true,
    // The loader of a runtime: only owlky.js installs one.
    "html/src/runtime/runtime.ts": true,
  };
  const duplicated = report.duplicated ?? { gzip: 0, sources: [] };
  const okBytes = duplicated.gzip <= 11_600;
  failed ||= !okBytes;
  console.log(
    `${okBytes ? "ok  " : "FAIL"} Code in both owlky.js and the lazy files: ${(duplicated.gzip / 1000).toFixed(2)} kB / 11.6 kB gzip (${duplicated.sources.length} files)`,
  );
  // Module state: a top-level `let`, or a top-level Map / Set / WeakMap / WeakSet.
  const STATE =
    /^(?:export\s+)?(?:let\s|const\s+\w+\s*(?::[^=\n]+)?=\s*new\s+(?:Map|Set|WeakMap|WeakSet)\b)/m;
  for (const source of duplicated.sources) {
    const path = source
      .replace(/^core\/dist\/(.+)\.js$/, "core/src/$1.ts")
      .replace(/^src\//, "html/src/")
      .replace(/^tokens\/dist\/(.+)\.js$/, "tokens/src/$1.ts");
    const code = await readFile(`packages/${path}`, "utf8").catch(() => "");
    if (STATE.test(code) && !STATE_ALLOWED[path]) {
      failed = true;
      console.log(
        `FAIL packages/${path} is in owlky.js and in a lazy file and holds module state: move the state onto elements or instances (ADR-0068 §2)`,
      );
    }
  }
}

// Option descriptions stay out of the runtime (ADR-0068 §4, roadmap-size.md S3): they live in
// @owlky/core/option-docs.json, the anatomy left in owlky.js is at most 3 kB (2.95 kB measured,
// 6.6 kB in S2), and no CDN file holds a description (short ones could match other text).
{
  const report = JSON.parse(await readFile("reports/size-report.json", "utf8"));
  const share = report.anatomy?.owlkyJsShare ?? Number.POSITIVE_INFINITY;
  const okShare = share <= 3_000;
  failed ||= !okShare;
  console.log(
    `${okShare ? "ok  " : "FAIL"} Anatomy (option schemas) in owlky.js: ${(share / 1000).toFixed(2)} kB / 3 kB gzip share`,
  );
  const docs = JSON.parse(await readFile("packages/core/dist/option-docs.json", "utf8"));
  const descriptions = [
    ...new Set(
      Object.values(docs).flatMap((options) => Object.values(options).map((o) => o.description)),
    ),
  ].filter((text) => text.length >= 24);
  const files = [
    "packages/html/dist/owlky.js",
    ...(await readdir("packages/html/dist/modules", { recursive: true }))
      .filter((file) => file.endsWith(".js"))
      .map((file) => `packages/html/dist/modules/${file}`),
  ];
  const leaks = [];
  for (const file of files) {
    const code = await readFile(file, "utf8");
    if (descriptions.some((text) => code.includes(text))) leaks.push(file);
  }
  failed ||= leaks.length > 0;
  console.log(
    `${leaks.length ? "FAIL" : "ok  "} No option description in owlky.js or the lazy modules${leaks.length ? `: ${leaks.join(", ")}` : ""}`,
  );
}

// Opt-in engines stay out of owlky.js: the phone metadata (ADR-0061) is in the phone module only.
{
  const marker = "country_calling_codes";
  const main = await readFile("packages/html/dist/owlky.js", "utf8");
  const phone = (
    await Promise.all(
      (
        await withImports("packages/html/dist/modules/phone-input.js")
      ).map((file) => readFile(file, "utf8")),
    )
  ).join("");
  const ok = !main.includes(marker) && phone.includes(marker);
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} Phone metadata only in the phone module, never in owlky.js`);
}

for (const [file, limit, label] of budgets) {
  // A list of files is downloaded together: each is gzipped on its own, as servers send them.
  const files = Array.isArray(file) ? file : [file];
  let size = 0;
  for (const each of files) size += gzipSync(await readFile(each)).length;
  const ok = size <= limit;
  failed ||= !ok;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${label}: ${(size / 1000).toFixed(2)} kB / ${limit / 1000} kB gzip`,
  );
}

// Tree shaking (ADR-0041): `@owlky/core/illustrations` has one export per picture, so an app that
// imports one picture bundles that one only, plus the parts it composes (parts.ts, about 0.1 to
// 0.5 kB: sparkles, the backdrop, people). Each must stay under 3 kB gzip once minified, and its
// bundle must hold no other picture.
{
  const require = createRequire(import.meta.url);
  const { build } = await import(
    require.resolve("esbuild", { paths: [join(process.cwd(), "node_modules/.pnpm/node_modules")] })
  );
  const entry = join(process.cwd(), "packages/core/dist/illustrations/index.js");
  const bundled = async (names) => {
    const result = await build({
      stdin: {
        contents: `export { ${names} } from ${JSON.stringify(entry)};`,
        loader: "js",
        resolveDir: process.cwd(),
      },
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      logLevel: "error",
    });
    const file = result.outputFiles[0];
    return { size: gzipSync(file.contents).length, text: file.text };
  };
  const { illustrations } = await import(entry);
  const exportName = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const all = (await bundled("illustrations")).size;
  for (const { name } of illustrations) {
    const { size, text } = await bundled(exportName(name));
    const others = illustrations.filter(
      (item) => item.name !== name && text.includes(`"${item.name}"`),
    );
    const ok = size <= 3_000 && others.length === 0;
    failed ||= !ok;
    console.log(
      `${ok ? "ok  " : "FAIL"} Illustration ${name} alone: ${(size / 1000).toFixed(2)} kB / 3 kB gzip (all ${(all / 1000).toFixed(2)} kB)${others.length ? `, also bundles ${others.map((item) => item.name).join(", ")}` : ""}`,
    );
  }
}
if (failed) process.exit(1);
