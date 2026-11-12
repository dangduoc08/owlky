# ADR-0068: Bundle size — per-component entries, a lazy-loading `owlky.js`, schemas without docs, split CSS, budgets

**Status:** Accepted (owner's decision 2026-11-12, roadmap-size.md; the lazy list of section 2,
the S3 target of section 4 and the React entries of section 1 approved on 2026-11-12 as
roadmap-size.md decisions 9–11). Records decisions 2–8 of
`docs/roadmap-size.md` with the S1 measurements. Extends ADR-0005 (HTML runtime), ADR-0007
(globals and runtime protocol), ADR-0015 (option schemas) and ADR-0049 (API reference). Moves
the opt-in bundles of ADR-0023 (Editor), ADR-0025 (Map), ADR-0034 (Code editor), ADR-0035
(Markdown), ADR-0041 (Illustrations) and ADR-0061 (Phone) onto one loader. Supersedes the
"CDN bundle carries every component" sentence of ADR-0005 and the "load it after `owlky.js`"
instructions of those six ADRs. ADR-0006's browser baseline does not change.

## Context
Every page that uses the CDN downloads every component. S1 (`scripts/size-report.mjs`, `pnpm
size:report`, also run by `pnpm check:size`) attributes each built byte to its source through
the source maps and builds sample entries the way an app would. Figures are gzip, measured on
2026-11-12 (commit `9df7f200`). "Share" scales a family's own gzip size to the bundle's real gzip
size, so the shares add up to the bundle. "Alone" is the family gzipped on its own, which is about
what a lazy module of that family weighs.

**`owlky.js`: 306.6 kB** (950 kB raw).

| Family | Share | | Family | Share |
|---|---|---|---|---|
| Data grid | 53.8 | | Organization chart | 6.6 |
| Chart, core and runtime | 40.8 | | Upload | 6.0 |
| Chart types (polar, cells, shapes, beeswarm, violin, stream, unit) | 10.6 | | Walktour | 5.9 |
| Chart tree / sunburst / icicle | 7.9 | | Popover, Menu, Tooltip | 5.2 |
| Chart geo | 6.6 | | Sortable | 5.0 |
| Chart stock | 3.9 | | Tree view | 4.8 |
| Chart Sankey | 3.7 | | Autocomplete | 4.4 |
| Anatomy (option schemas) | 28.4 | | Runtime (registry, delegation, observer, `dom`, `overlay`, `options`) | 3.7 |
| Date pickers | 26.7 | | Dialog, Drawer, modal | 3.5 |
| Motion | 17.1 | | Toaster | 2.7 |
| Carousel and Lightbox | 15.5 | | Every other row (33 folders, tokens, bundle glue) | 29.5 |
| Gantt | 14.1 | | | |

The Chart family is 73.5 kB in all. The anatomy splits by schema section as follows: Chart 5.7,
Data grid 2.8, Date pickers 1.5, Carousel 1.4, Lightbox 1.4, Gantt 1.1, Organization chart 1.1,
and below 1 kB for each other section. Its 1,048 option descriptions (115 schemas) are 70.5 kB raw
and 23.3 kB gzip alone. Without them, the anatomy code in `owlky.js` drops from 30.3 kB to 12.4 kB
(alone).

**Opt-in bundles:** `owlky-editor.js` 156.0 kB, `owlky-map.js` 309.9 kB (+ worker 148.3 kB),
`owlky-markdown.js` 102.9 kB, `owlky-phone.js` 44.9 kB, `owlky-code-editor.js` 11.6 kB and
`owlky-illustrations.js` 11.0 kB. Each IIFE carries its own copy of the runtime (2.1–2.6 kB), of
part of the anatomy (2.0–2.9 kB) and of the tokens' color helpers (0.1 kB). That is about 5 kB of
duplicated code per opt-in script.

**`owlky.min.css`: 62.7 kB** (`owlky.css`, which the CDN examples link, is 67.4 kB). Tokens are 4.5
kB alone. The heavy families are Carousel and Lightbox 5.2, Date pickers 7.0, Data grid 4.4,
Chart 4.4, Map 4.0, Organization chart 3.7, Motion 3.6, Editor 2.7, Gantt 2.6, Upload 2.1 and
Markdown 1.5 (each file gzipped alone). Concatenating the per-file outputs in bundle order gives
62.7 kB too, so the estimates below are reliable.

**HTML ESM: the runtime plus the given definitions, minified and tree-shaken (`@owlky/html` dist).**
These are the weights of future lazy modules.

| Definitions | gzip | Over the runtime |
|---|---|---|
| Runtime only | 1.9 | 0 |
| Dialog | 8.2 | 6.3 |
| Dialog, Popover, Menu, Tooltip, Tabs, Accordion, TextField, Select, Checkbox | 19.1 | 17.2 |
| Data grid | 127.9 | 126.0 |
| Chart (+ trellis) | 87.0 | 85.0 |
| Date pickers (11 runtimes) | 34.4 | 32.4 |
| Gantt | 21.2 | 19.2 |
| Carousel + Lightbox | 26.2 | 24.2 |
| Motion (6 runtimes) | 22.5 | 20.6 |
| Every definition (`owlky.js` as ESM) | 307.7 | 305.7 |
| Light set A: everything except decision 3's heavy list (42 definitions) | 80.3 | 78.3 |
| Light set B: set A without Organization chart, Upload, Walktour, Tree view, Sortable, Transfer list and Autocomplete (35) | 44.9 | 42.9 |

The core stylesheet estimates follow the same split. Light set A's CSS is 36.8 kB (52 files) and
light set B's is 29.1 kB (45 files).

**React, built with Vite (production, minified, tree-shaken, React external).**

| Entry | `@owlky/react` barrel | Direct file | CSS by file today | `owlky.css` |
|---|---|---|---|---|
| Button | 10.2 | 10.2 | 7.3 (tokens + 5 files) | 62.7 |
| Button + Dialog + TextField | 23.1 | 23.1 | 14.6 (13 files) | 62.7 |
| DataGrid | 205.7 | 205.7 | 32.5 (35 files) | 62.7 |
| Chart | 83.2 | 83.2 | 11.5 (7 files) | 62.7 |
| DatePicker | 62.2 | (no file entry) | 20.3 (23 files) | 62.7 |

These are the findings:
1. **The barrel tree-shakes as well as a direct path** (`sideEffects: false`), so bytes are
   identical in every scenario. React's weight comes from what components compose statically:
   - Every `CircularProgress`, and so every `Button` through its loader, composes
     `ScrollProgress`, which brings the Motion engine (`animate`, `scroll`, `values`). That is
     about 4.9 kB of the Button's 10.2 kB.
   - `DataGrid` statically imports the Chart, about 70 kB of its 205.7 kB, which is why the
     React grid is much larger than the HTML grid's 126 kB. It also imports the date pickers
     (23.9 kB) for its filters and editors.
2. **Importing one React component pulls part of every option schema.** A Button-only bundle holds
   2.4 kB of anatomy, but `buttonOptions` itself is 0.3 kB. It keeps 77 descriptions from 5 schema
   roots. DataGrid keeps 44 roots and 508 of the 1,048 descriptions. The schemas are annotated
   `/* @__NO_SIDE_EFFECTS__ */` and work as intended, but `anatomy.js` is one module (289 kB of
   source) whose top level also has expressions that bundlers must keep:
   - array spreads and `.map` / `.flatMap` calls that build value lists (`[...a, ...b]`), plus
     constants such as `Math.sqrt(3) / 2`;
   - object spreads of shared option objects into schemas (`{ ...paperOptions.options }`,
     `...progressValueOptions`), which keep the spread object and every pure call inside it;
   - option factories that are not annotated (the FormControl state options), called at
     module level;
   - value lists imported from model modules (`chart-model`, `chart-geo`, `chart-hierarchy`,
     `carousel-model`), which bring those modules' top-level code. This is why every opt-in
     IIFE has a few hundred bytes of chart code.

## Decision

### 1. Per-component entries at every layer (decision 2)
- **Names:** an entry per spec, named after it (kebab case): `@owlky/core/<name>`,
  `@owlky/react/<name>`, `@owlky/html/<name>` and `@owlky/styles/components/<name>.css` (which
  exists). A family spec exports its family, for example `@owlky/react/date-picker` (every
  picker, field, calendar and clock with `LocalizationProvider`) and `@owlky/react/button`
  (Button, IconButton, Fab, ButtonGroup). Folders that `scripts/component-folders.mjs` maps to
  another spec reach users through that spec's entry.
- **Export maps** are explicit lists, never `"./*"`. A list hides internal folders such as `dom`,
  `overlay` and `utils`, keeps attw and publint meaningful, and lets a check compare the list
  with the specs. `scripts/check-packages.mjs` fails when a spec with a React or HTML folder has
  no entry, or when an entry names no spec. Each entry is `{ types, import }` pointing at
  `dist/<name>/index.js`, written by tsc from a `src/<name>/index.ts` that only re-exports.
- **Core:** the anatomy is split per component (`core/src/anatomy/<name>.ts`), and
  `anatomy.ts` re-exports them for the barrel. `@owlky/core/<name>` exports the component's
  schema, attribute helpers and behavior. The split removes the module-level coupling described
  in finding 2. Value lists are literal arrays or annotated pure IIFEs, shared option objects are
  functions marked `/* @__NO_SIDE_EFFECTS__ */`, and schemas import value lists only from small
  `*-values.ts` modules with no other top-level code. The existing opt-in entries (`./editor`,
  `./map`, `./markdown`, `./code-editor`, `./phone`, `./illustrations`, adapters) keep their names.
- **Barrels stay:** `@owlky/core`, `@owlky/react` and `@owlky/html` re-export every entry, and
  `sideEffects: false` is unchanged for core and react. The website's
  `optimizePackageImports` stays. Per-component React entries are for bundlers or dev servers
  that don't tree-shake and for documentation clarity. In Vite they save no bytes (finding 1).
- **HTML:** `@owlky/html/<name>` exports the component's definitions, side-effect free.
  `@owlky/html/auto` registers every component, as today. The CDN modules (section 2) are a
  separate, side-effectful output, `dist/modules/**`, listed in `sideEffects`.
- **Scripts:** `check-boundaries.mjs` already scans every `.js` under each package's `dist`, so it
  covers `dist/modules`. `scripts/api-reference.mjs` and `scripts/manifest.mjs` ignore the
  re-export `index.ts` files: they read component sources, not entries. The manifest and
  `get_component` gain an `imports` field (the React, HTML, core and CSS entry of the component),
  so agents and the docs show the per-component import. The API reference JSON gets the same
  field.

### 2. `owlky.js` loads heavy components on demand (decision 3)
- **What stays in `owlky.js`:** the runtime (registry, delegation, observer, `getRuntime`), theme
  settings, the loader, and light set B (35 definitions: overlays, form controls, navigation,
  data display and feedback). That is 44.9 kB today and about 39 kB once the descriptions leave
  (section 4). Light set A (80.3 kB) would miss the 25–35 kB aim of decision 7 by more than double.
- **Lazy modules**, each one ESM file in `dist/modules/`, named after its spec:
  `chart` (Chart and ChartTrellis), `data-grid`, `date-picker` (the 11 picker runtimes), `gantt`,
  `carousel` (Carousel and Lightbox: the Lightbox composes the Carousel), `motion` (Motion,
  MotionGroup, MotionText, MotionBorder, CountUp, ScrollProgress), `organization-chart`, `upload`,
  `walktour`, `tree-view`, `sortable`, `autocomplete`, `transfer-list`, and the six opt-in
  modules `editor`, `map`, `markdown`, `code-editor`, `phone-input` and `illustration`. Light
  components that compose a lazy one only reference it through the DOM, as today (ADR-0005), so
  no light definition imports a lazy module.
- **Finding a component:** the loader holds a table of `{ module, selector, css }` generated at
  build time from each definition's `selector`. For example, `data-grid` matches
  `[data-ok-data-grid]`, and `illustration` matches `svg[data-ok-illustration]` (its runtime's
  selector, which also sizes full inline SVGs). Splitting the 16 pictures' data from that sizing
  code is an S5 candidate, so a page with inline SVGs only loads about 1 kB. For each module, the loader registers a stub
  definition named `loader:<module>` with that selector. Its `setup` starts the import once. The
  runtime's existing first scan and MutationObserver therefore find heavy roots, including roots
  that htmx or Turbo add later. Roots under `[data-ok-runtime="off"]` are skipped, as everywhere.
- **Resolving the URL:** `owlky.js` reads `document.currentScript.src` while it runs (classic or
  `defer` script) and resolves `modules/<name>.js` and `modules/<name>.css` against it, so modules
  come from the folder that served `owlky.js`. The `owlky.mjs` entry (below) uses
  `import.meta.url`. A `data-ok-modules` attribute on the script overrides the folder, like the
  Code editor's `data-ok-monaco-path`. Monaco keeps its own folder (`monaco/`, ADR-0034), and the
  map module finds `owlky-map-worker.js` through `import.meta.url`, which removes the
  `import.meta.url` define of the IIFE build.
- **ESM, not IIFE chunks:** every ADR-0006 baseline browser supports `import()` and module
  scripts. One Vite or Rolldown build emits every lazy module with shared chunks
  (`dist/modules/chunks/*.js`), so the runtime, anatomy and core code that the opt-in IIFEs
  duplicate today (about 5 kB each) is downloaded once. `owlky.js` stays a classic IIFE, so the
  page keeps one `<script src defer>` that works without `type="module"`. The same build also
  emits `owlky.mjs`, light set B as an ES module that shares the chunks, for
  `<script type="module">` pages.
- **Duplication rule:** code in both `owlky.js` and a chunk has two module instances. Shared state
  must therefore live in the ADR-0007 slots or on elements, never in module scope. The layer
  stack, scroll lock and runtime are already slots. S2 audits the core modules that both sides
  use (popover, modal, collapse, focus, ids) and moves any shared module state into instances.
  A new `Symbol.for` slot needs a new ADR. The report measures the duplicated bytes, and the S2
  budget caps them.
- **Attaching CSS:** before importing a module, the loader inserts
  `<link rel="stylesheet" href="modules/<name>.css">` and waits for its `load` event, so
  behavior never runs on unstyled markup. Links are inserted after the `<link>` that loaded
  `owlky.css` or `owlky.min.css` (found by file name, otherwise at the end of `<head>`), in the
  canonical order of section 5, whatever order the modules load in. A stylesheet that is already
  present (`link[href$="/<name>.css"]`), from authors who link it statically, is not added twice.
- **Preloading:** `data-ok-preload="chart data-grid"` on the `owlky.js` script loads those modules
  (CSS first) at startup, before any root appears. The docs also show
  `<link rel="modulepreload">` and `<link rel="preload" as="style">` for above-the-fold heavy
  components. `Owlky.load(name)` returns a promise for a module, and `Owlky.loaded(name)` tells
  whether it has loaded. These are additive runtime members (section 3).
- **Before a module loads**, the markup is what it is without JavaScript (ADR-0005). Charts and
  grids show their data table, pickers show their fields, and nothing is hidden. Layout can
  shift only within the CSS fetch window of a heavy component that was not preloaded. The S6
  e2e measures CLS on a slow network for the data grid and chart stories, and the docs
  recommend `data-ok-preload` for components above the fold. Events on a root before its module
  loads are not replayed.
- **Errors and offline:** a failed import or stylesheet logs one `console.error` per module and
  dispatches `ok:runtime:error` on `document` with `{ module, url, error }`. The markup keeps its
  no-JavaScript state. The loader retries once on the next `online` event or the next
  `Owlky.load(name)`.
- **Strict CSP:** `script-src 'self'` allows same-origin `import()`. `import()` and `link.href`
  are not Trusted Types sinks, so `require-trusted-types-for 'script'` needs no policy. Modules
  use no inline scripts or styles. Cross-origin CDNs (jsDelivr, unpkg) send CORS headers, so
  `import()` works there too. Strict-CSP pages self-host the folder, as they already must for
  the opt-ins. `examples/csp/index.html` drops the five opt-in `<script>` tags and keeps one
  `owlky.css` link and one `owlky.js`. It adds a Chart, a Data grid, a Date picker, an Editor,
  Markdown, a Phone input and an illustration placeholder. The S6 e2e asserts that every module
  loads, that no `securitypolicyviolation` fires and that each component is ready, in Chromium,
  Firefox and WebKit. The Code editor keeps its own CSP page (ADR-0034).

### 3. Globals and runtime protocol (ADR-0007)
No new global and no new `Symbol.for` slot: the loader lives in the runtime that owns the page.
`load` and `loaded` are added to the runtime object. They are additive, so `PROTOCOL` doesn't
change, and a copy without them is a "different version" that ADR-0007 already handles. Lazy
modules call `getRuntime().register(…)`, as the opt-in scripts do today. Only the owning copy's
loader runs, so a second copy of `owlky.js` never loads modules twice. A module with a different
protocol gets the inactive runtime and does nothing, as today.

### 4. Option schemas without documentation at run time (decision 4)
- **Stays in the runtime schemas:** `name`, `root`, and per option `kind`, `attr`, `values`,
  `default`, `optional`, `pattern`, `when`, `children`, `min`, `units` and `event`. `parseNumber`,
  `readStyle`, `optionAttributes` and the parity tests need these.
- **Moves to the JSON file:** `description` and any later docs-only metadata, such as Controls
  hints or deprecations.
- **How:** descriptions stay in `anatomy/<name>.ts` next to each option, so authors write them in
  one place. Core's build runs `scripts/option-docs.mjs`, which:
  - parses each emitted `dist/anatomy/*.js` with Vite's `parseAst`;
  - writes `dist/option-docs.json` (`{ "<schema name>": { "<option>": { description } } }`, keys
    sorted), exported as `@owlky/core/option-docs.json`;
  - replaces each description literal in the emitted JS by `""`, splicing by AST position, never by
    regular expression, and re-emits the source map.
- **The `description` field becomes optional** in the types. `describeOptions(schema, docs)`
  returns the documented schema.
- **Readers of the JSON:** Storybook Controls (`controls.ts`), `scripts/spec-options.mjs`,
  `scripts/api-reference.mjs` and `scripts/manifest.mjs` read the JSON. The MCP server's
  `validate_markup` and `get_component` already read the manifest, which keeps the descriptions.
  The docs pages' Options tables read it through docs-content.
  `check:specs`, `check:api` and `check:manifest` must produce byte-identical output, which shows
  that nothing was lost.
- **Effect:** about 18 kB gzip leaves the CDN code (23.3 kB gzip alone across all 115 schemas),
  of which about 5 kB is in light set B. In React, removing the descriptions and splitting the
  anatomy (section 1) cut a Button's anatomy from 2.4 kB to about 0.3 kB.

### 5. CSS split (decision 5)
- **`owlky.css` / `owlky.min.css`** become the core stylesheet: tokens and the files of light
  set B, 29.1 kB gzip today. `owlky-all.css` keeps everything for authors who want one file. The
  lazy modules' files are copied to `dist/modules/<name>.css` (in `@owlky/html`, next to the
  modules) from `@owlky/styles/components/`. A module's sheet concatenates the files of its family
  in bundle order, for example `date-picker.css` = date-field, date-calendar, date-picker,
  time-clock, digital-clock, date-range-calendar and date-range-picker.
- **Cascade:** every component rule is zero specificity in `@layer components`, so source order
  decides. The core sheet keeps today's relative order, so Paper and Typography come first,
  Select comes after `table.css`, and Breadcrumbs comes after `link.css`. Each lazy sheet has a
  rank (its first file's index in `index.css`). The loader inserts sheets by rank after the core
  sheet, so lazy sheets always follow every core file. This matches the composition rule that
  the parent's CSS restyles its child: every lazy component that composes others (Data grid,
  Date picker, Phone input, Organization chart) is a parent of core components, and a lazy parent
  of a lazy child gets the higher rank (Data grid after Date picker and Chart, Lightbox with
  Carousel in one sheet). S4 adds a test that `index.css` lists every lazy file after every core
  file it restyles, then reorders `index.css` to "core files, then lazy families by rank". This
  makes `owlky-all.css`, the split sheets and the dev Storybook share one order. Parity and visual
  tests must show no change.
- **Bundlers:** apps import `@owlky/styles/owlky.css` and then the components they use
  (`@owlky/styles/components/data-grid.css`…). The docs list each component's files in order
  (the report's "CSS by file" column), and the manifest's `imports` field carries them. A
  `data-ok-*` scanner plugin is possible later and needs no ADR change.

### 6. Splits inside heavy components (decision 6, S5 candidates, by measured weight)
1. **React DataGrid → Chart** (about 70 kB of 205.7 kB): load the charts integration with a
   dynamic `import()` only when `charts` / `chartsPanel` is used. The HTML grid already finds
   the chart through the DOM.
2. **Chart types** (33 kB of 85 kB): geo (6.6), tree / sunburst / icicle (7.9), stock (3.9),
   Sankey (3.7) and the rarer types (10.6, polar excepted) behind `import()` in core
   `renderChart`. The first render of such a type waits for its chunk. Server rendering in React
   imports the type statically through an opt-in entry (`@owlky/core/chart/geo`).
3. **Data grid** (126 kB): pivot and its panel, Excel export (its ZIP writer), print, range charts,
   server-side data and the fill handle. S5 measures each with the report's per-file view
   (`files` in the JSON) before splitting.
4. **React CircularProgress → ScrollProgress → Motion** (4.9 kB in every Button): the scroll-linked
   mode becomes an opt-in hook or component, so a plain progress stays without the engine.
5. **Date pickers** (32 kB): range pickers and clocks, if the per-file view shows they are
   large.
Each split is measured before and after with `pnpm size:report` and recorded in its changeset.

### 7. Budgets (decisions 7 and 8)
- **Per bundle** (`scripts/check-size.mjs`): `owlky.js` ≤ 110 kB from S2 (decision 7's cap), then
  lowered to each step's measurement rounded up by at most 5%. The light set B aims at ≤ 48 kB
  after S2, ≤ 42 kB after S3 and 25–35 kB after S5. Core CSS ≤ 35 kB from S4 (29.1 kB measured).
  The duplicated bytes between `owlky.js` and the chunks have their own budget.
- **Per lazy module:** its measured gzip, rounded up by at most 5%. The first values come from the
  table above. Data grid 126 kB and Chart 85 kB are expected to fall in S5, and their budgets
  follow them down.
- **Per scenario:** check-size runs the report's scenario builds, which take about 10 s, with
  budgets for: "React, Button only" (10.2 kB, about 5 kB after S3 and S5), "React, Button + Dialog
  + TextField", "React, DataGrid", "HTML page with a Dialog" (`owlky.js` + core CSS), "HTML page
  with a Data grid" (+ the module and its sheet), and "HTML page with a Chart".
- **No more raises (decision 8):** a change that exceeds a budget optimizes or splits instead. The
  MCP manifest is the only exception (an npm tarball, not a browser download). Budgets only go
  down, each with the report's measurement in the PR.

### 8. Release notes and order
Nothing is published yet, so every change ships as a **minor** changeset with a migration note:
- the opt-in `<script>` tags become unnecessary;
- `owlky.css` holds the core only, and `owlky-all.css` holds everything;
- the new entries and `data-ok-preload` / `data-ok-modules`;
- `description` becomes optional in the schema types.

During S2–S5, `owlky-editor.js`, `owlky-map.js`, `owlky-markdown.js`, `owlky-phone.js`,
`owlky-illustrations.js` and `owlky-code-editor.js` stay as one-line shims (`Owlky.load(name)`),
so existing pages and tests keep working. S6 removes them before 0.1.0, once the docs and
examples have moved.

The steps run in this order:
1. **S2:** the entries and the loader.
2. **S3:** the schema docs.
3. **S4:** the CSS split.
4. **S5:** the internal splits.
5. **S6:** the docs, the loader e2e and scenario budgets in CI.

The core anatomy split of section 1 belongs in S2, because the per-component core entries need
it, and it fixes React's anatomy leak before S3 measures.

## Implementation notes (S2, 2026-11-12)
- **Measured:** `owlky.js` 45.2 kB gzip (from 307.6 kB); the 19 modules' own files 1.2–304 kB
  and their shared chunks 87.3 kB in all (the chart engine, about 71 kB, is one chunk that the
  Chart and the Data grid share). Code in both `owlky.js` and a chunk: 12.2 kB gzip, 23 files
  (the runtime, the anatomy of a few schemas, the overlay and popover helpers), none with module
  state that both sides use (`check:size` checks it).
- **Stylesheets:** the mechanism (attach before the code, rank order after the core sheet, skip a
  sheet the page links) is in place, but every module has `stylesheet: false` until S4: `owlky.css`
  still holds every component.
- **`owlky.mjs`** (light set B as an ES module) is deferred: no page needs it before S6's guides.
- **API reference JSON:** the `imports` field is in the MCP manifest and `get_component`; the docs
  pages show imports with S6's guides.

## Consequences
- A light HTML page downloads about 45 kB of JS today (about 39 kB after S3), down from 306.6 kB,
  and about 29 kB of CSS, down from 67.4 kB. A data grid page adds about 126 kB and its sheet. A
  page with every opt-in no longer downloads the runtime and anatomy six times.
- Lazy components cost one extra round trip, which `data-ok-preload` or `modulepreload` avoids.
  The first paint of a heavy component without preload may shift once.
- Two module instances (`owlky.js` and the chunks) share code without sharing state. The
  duplication rule and its budget keep that safe and visible.
- Export maps grow by about 65 entries per package (one per spec). `check:packages` (publint, attw) takes longer
  and gains the spec ↔ entry check.
- The report (`reports/size-report.json`, git-ignored) is the baseline that each step compares
  against. Its numbers, not estimates, set each new budget.
