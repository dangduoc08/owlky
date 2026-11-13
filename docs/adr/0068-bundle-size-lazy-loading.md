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
- **How** (amended in S3, 2026-11-12): descriptions stay in `anatomy/<name>.ts` next to each
  option, so authors write them in one place, as the factory's string or template literal (a
  variable fails the build). Core's build runs `packages/core/scripts/option-docs.mjs` after
  `tsc`, which:
  - imports the emitted `dist/anatomy/anatomy.js` and writes `dist/option-docs.json`
    (`{ "<schema name>": { "<option>": { description } } }`, keys sorted, 1,048 descriptions of
    115 schemas), exported as `@owlky/core/option-docs.json`; an option without a description,
    or two schemas with one name, fails the build;
  - parses each emitted `dist/anatomy/*.js` with acorn (a core dev dependency: core builds with
    `tsc` and has no Vite) and blanks the description argument of every `style`, `flag`,
    `native`, `behavior`, `state` and `number` call, by AST position, never by regular
    expression. The literal becomes `""` padded with spaces to its old length, so every line and
    column stay where they were and tsc's source maps stay exact: nothing is re-emitted, and
    minifiers drop the spaces;
  - checks in a fresh Node process that no built schema keeps a description.
- **The `description` field becomes optional** in the types. `describeOptions(schema, docs)`
  returns the documented schema; the factories still require the argument.
- **Readers** (amended in S3): `scripts/spec-options.mjs`, `scripts/api-reference.mjs`,
  `scripts/manifest.mjs` and `scripts/size-report.mjs` read the built schemas through
  `scripts/option-schemas.mjs`, which applies `describeOptions` with the JSON. `check:api` reports
  an option without a description (`<schema>.<option> (option) has no description`). The MCP
  server's `validate_markup` and `get_component` read the manifest, which keeps the descriptions.
  Storybook Controls and the docs pages' Options tables need no JSON: Storybook aliases
  `@owlky/core` to its sources (which keep the descriptions, so `pnpm storybook` still needs no
  build), and the website passes the manifest's schemas. `OptionsTable` documents that it needs a
  described schema. `check:specs`, `check:api` and `check:manifest` produce byte-identical output,
  which shows that nothing was lost. `check:size` fails when a description of 24 characters or
  more appears in `owlky.js` or a lazy module.
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
examples have moved (done 2026-11-13, see the S6 notes).

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

## Implementation notes (S3, 2026-11-12)
- **Measured** (`pnpm size:report`, against S2): `owlky.js` 45.22 → 40.45 kB gzip, its anatomy
  6.59 → 2.95 kB (decision 10: at most 3 kB). Across `owlky.js`, the 19 lazy modules and their
  chunks, 23.2 kB gzip left the CDN code (decision 10: about 18 kB); the anatomy share of those
  files went from 37.3 to 16.2 kB. The shared chunks 87.35 → 80.72 kB, the data grid module 61.25
  → 59.00 kB, the carousel 20.86 → 19.07 kB. Scenarios: HTML page with a Dialog 107.9 → 103.15
  kB, with a Data grid 246.5 → 233.69 kB, with a Chart 199.1 → 188.52 kB; React Button 8.32 →
  7.86 kB, Button + Dialog + TextField 22.19 → 19.65 kB, DataGrid 206.25 → 193.30 kB, Chart
  81.14 → 75.27 kB. No React bundle keeps a description.
- **Tree shaking:** removing the descriptions showed two module-level leftovers in `owlky.js`
  (about 0.3 kB): object spreads of the Motion and FormControl schemas, which minifiers keep from
  the arguments of a dropped pure call, and Motion's joined value list. The schemas are now pure
  IIFEs and `motionVariants` a pure `concat` (an IIFE around a spread is inlined first and its
  spread kept). `motionVariants` is typed `readonly MotionVariant[]` instead of a tuple.
- **Budgets** (`check-size.mjs`): every changed bundle lowered to its measurement plus at most 5%
  (`owlky.js` 42 kB), plus two checks: the anatomy share of `owlky.js` (3 kB) and no description
  in a CDN file.

## Implementation notes (S5, 2026-11-13)
Measured with `pnpm size:report` against S3 (gzip). Done:
- **React DataGrid → Chart (§6.1):** `data-grid/grid-chart.tsx` loads `../chart/chart.js` on first
  use. Until it is in, `GridChart` renders the chart's no-JavaScript state: the root
  (`data-ok-chart`, `data-ok-runtime="off"`, `aria-busy="true"`) and a plain data table (caption,
  series columns, one row per category). Server renders start the import, so a second render
  (the snippet generator renders twice) and every later client render get the Chart: snippets and
  story markup do not change. Parity waits until no `figure[data-ok-chart][aria-busy]` is left.
  DataGrid 193.30 → **119.75 kB** (75.8 kB in lazy chunks).
- **HTML data grid (§6.1):** the chart helpers (`chartAttributes`, `chartOptions`,
  `chartTextAttributes`, `renderChart`) come from `import("@owlky/core/chart")`
  (`components/data-grid/chart-kit.ts`). The first draw starts the import and draws again when it
  is in; later draws are synchronous. The grid keeps only `chart-model` statically (its
  sanitizers use the value lists). Data grid module with its imports 130.5 → **69.0 kB**; the HTML
  data grid page 233.69 → **173.23 kB** with `owlky.min.css` (238.4 → 177.9 kB with `owlky.css`). Rolldown merges the core chart
  code that the Chart module and the dynamic entry share into the Chart module's chunk (and makes
  `modules/chart.js` a facade of it), so loading the helpers also registers the Chart. That is
  harmless, because the grid's chart region holds a `[data-ok-chart]` root that the loader loads
  the Chart for anyway. `chunkOptimization: { mergeCommonChunks: false }` did not change the
  output in Vite 8.3 lib mode. Since S4 attaches stylesheets before modules run, S4 must make the
  grid wait for the chart sheet too, or keep the Chart's CSS in the data grid sheet.
- **CircularProgress → ScrollProgress → Motion (§6.4):** `useScrollProgress` imports
  `@owlky/core/motion` in its effect, only when `scroll` is set. `useScroll()` stays static
  (calling it is the opt-in). React Button 7.86 → **3.02 kB**; Button + Dialog + TextField 19.65 →
  **15.24 kB**; DatePicker 57.7 → **53.2 kB**. Storybook aliases every `@owlky/core/<entry>` to
  `core/src/entries/<entry>.ts`, so lazy and static imports share one module instance.
- **Illustrations (§2):** the CDN module builds its definition with `createIllustration(() =>
  import("@owlky/core/illustrations"))` (the factory moved to `create-illustration.ts`, so the
  module doesn't import the set statically). Sizing and ARIA run at once; the set loads only when
  an SVG without artwork needs it. Module 6.75 → **1.36 kB** (6.2 kB with its imports, from 12.9
  kB); the pictures are a 5.5 kB chunk. `@owlky/html/illustrations` and the npm `illustration`
  definition keep the static set.
- **Duplicated code (§2):** the modules build aliases `runtime/global.js` to `global-module.ts`,
  which joins the slot's runtime and never creates one (no second `createRuntime`): a module
  imported without `owlky.js` logs an error and gets the inactive runtime. 11.1 → **10.3 kB** in
  both `owlky.js` and the lazy files. The rest is code both sides run (overlays, popover, modal,
  focus, anatomy of shared parts); sharing it would need `owlky.js` to expose modules to the
  chunks, which ADR-0007 forbids without a new slot.
- **Budgets:** lowered to measurement + ≤ 5% (React Button 3.15, Button + Dialog + TextField 15.8,
  DataGrid 124 kB; HTML data grid page 179 kB; duplicated 10.4 kB; illustration module 1.45 kB;
  Chart module file 0.2 kB, a facade). The S3 "shared chunks, all" total (84.7 kB) can't hold:
  code moved from modules into chunks (98.77 kB of chunks before the ST2 rebase; all lazy files together 878.5 → 879.2 kB), so it is replaced by one budget per module **with its static imports**, which is what a
  page downloads (the data grid's 70.9 kB, for example; measured after the ST2 icons, which grew the tree view, upload and date picker modules).

Deferred, with the reason:
- **Chart types (§6.2):** a lazy layout family needs a pending render in core, in the React Chart
  and in the HTML runtime (draw again when the family loads), preloads in every test of those
  types, the static opt-in entry for SSR and snippets, and an e2e wait. It also needs the type
  modules to stop being reached statically: the anatomy imports value lists from `chart-geo`,
  `chart-hierarchy`, `chart-sankey`, `chart-unit`, `chart-beeswarm`, `chart-violin` and
  `chart-stream`; `chart-active` uses `chartGeoContains`, `onSankeyLink`, the tree mark helpers and
  `chartUnitAt`; `chart-text` writes indicator and tree label text; the HTML runtime reads geo,
  Sankey and hierarchy tables. The families with no other static importer are the tree, sunburst
  and icicle layouts, `chart-stock`, `chart-cells`, `chart-shapes` (about 12 kB); geo and Sankey
  first need their readers and value lists moved into small modules. This is its own step (S5b).
- **Data grid pivot, Excel export, print (§6.3):** `getDataAsExcel()` returns the bytes
  synchronously (an async split changes its API), the pivot is computed while rendering, and print
  renders every row through the grid's own render path. The ZIP writer (`grid-excel`) is 1.9 kB
  of the React grid; the HTML runtime keeps pivot and print inside one 7,000-line closure that
  would have to be cut first.

## Implementation notes (S6, 2026-11-13)
- **Shims removed:** the six opt-in scripts, their `vite build --mode` steps, sources, budgets
  and package exports are gone. `data-ok-monaco-path` moves to the `owlky.js` script (the code
  editor module reads it from any script). Docs, stories, specs, examples and the CSP pages load
  one `owlky.css` and one `owlky.js`; earlier ADRs that name a shim carry a note.
- **`owlky.mjs`** (amends section 2): light set B as one ES module, built on its own
  (`vite build --mode esm`), **not** with the lazy modules. Built with them, it shared their
  chunks, but rollup then moved the light code it shares with each module into the chunks: the
  chunks grew from 80.7 to 91.8 kB gzip and the code duplicated with `owlky.js` from 12.2 to
  12.6 kB, which every `owlky.js` page downloads, for a gain on module-script pages only. A
  module-script page with a heavy module therefore has two runtime copies, like an `owlky.js`
  page; the ADR-0007 slots keep them consistent. `owlky.mjs` finds its script by `src` (for
  `data-ok-preload` / `data-ok-modules`) and resolves `modules/` against `import.meta.url`.
- **Docs:** website pages "Load from a CDN" and "Use with a bundler" (`apps/website/src/content/
  cdn.ts`, `bundlers.ts`), the Get started page, the Storybook Introduction ("Load only what you
  use") and the package READMEs. Every component docs page shows an **Import** table at the top of
  its API reference, from the `imports` field that `scripts/component-imports.mjs` computes for
  both the API reference JSON and the MCP manifest.
- **E2E:** the loader spec adds `owlky.mjs`, every module of the strict-CSP page (which now holds
  a Data grid) without a violation, and the layout shift of a late chart (Chromium only: the
  Layout Instability API). It runs in every Playwright project (Chromium, Firefox, WebKit,
  mobile). The scenario budgets run in CI through `pnpm check:size` in the `check` job.

## Implementation notes (S4, 2026-11-13)
- **Families:** `packages/styles/src/families.json` is the one list of lazy families (module name →
  component files, in rank order). It drives the styles build, the loader's module table (same
  keys, same order, all with `stylesheet: true`; `styles.test.ts` checks it), the size report and
  `check:size`. `index.css` is "core files, then the families in that order" (a test), so
  `owlky-all.css`, the split sheets and Storybook share one cascade. The order changed from the
  S2 table: Illustration comes before Upload (a lazy parent comes after its lazy child). The data
  grid is the exception to "parent after child": it stays before the date pickers it shows in
  cells, as in the old order, because its rules for buttons and inputs in cells are broader than
  the pickers' own (a day button in a grid cell got a 52 px line height and 10 px padding when
  the grid came after the picker). A computed-style diff of the 712 canonical snippets, old order
  against new, found only that one difference and so settles the order. The same diff exposed
  the Collapse rule that `organization-chart.css` now repeats for its children list (the lazy
  file follows `collapse.css`).
- **Outputs:** `owlky(.min).css` = tokens + 46 core files; `owlky-all(.min).css` = everything;
  `modules/<name>.css` (minified, one layer-order statement first so a sheet that arrives before
  the core one can't reorder `base`) in `@owlky/styles` and copied to `@owlky/html/dist/modules/`.
  `@owlky/styles` also exports `owlky-all*.css` and `families.json`; `@owlky/html` exports
  `owlky-all*.css` (the modules' sheets fall under `./modules/*`).
- **A test keeps core free of lazy roots:** no core file may name a lazy module's root attribute
  (`data-ok-chart`…), so a lazy sheet restyles core children, never the other way round. The one
  exception is Dialog's `:not([data-ok-motion])`, a marker test.
- **Data grid → Chart sheet (S5's open question):** the grid *waits* for the Chart's sheet instead
  of carrying the Chart CSS (4.4 kB gzip, which pages with both would download twice). The chart
  kit calls `runtime.load("chart")` (its stylesheet, then the module) and sets `gridChartKit()`
  only once that has finished, so the grid never draws a chart without its CSS. Without a loader
  (npm, tests) the call rejects or resolves at once and the grid goes on. The load runs beside the
  `import()` of the chart helpers, not before it: awaiting it inside the import chain made the
  bundler stop treating `modules/chart.js` as a facade (9.98 kB instead of 0.06 kB).
- **Measured** (gzip, `check:size`): core `owlky.min.css` 29.43 kB (was 63.50 kB; target ≤ 35 kB),
  `owlky-all.min.css` 63.50 kB. Module sheets: Chart 4.44, Data grid 4.55, Date picker 4.53,
  Carousel 4.57, Map 4.06, Organization chart 3.76, Motion 2.87, Editor 2.77, Gantt 2.64, Upload
  2.09, Markdown 1.60, Tree view 1.34, Sortable 1.11, Autocomplete 1.06, Walktour 1.20, Transfer
  list 0.76, Illustration 0.73, Code editor 0.76, Phone input 0.69 kB. Scenarios: HTML page with a
  Dialog 103.15 → 70.28 kB, with a Data grid (and its chart sheet) 173.23 → 148.32 kB, with a
  Chart 188.52 → 161.86 kB. Budgets lowered to measurement + at most 5% (the all-in-one file keeps
  its 63.5 kB).
- **Layout shift:** with the Chart's styles out of the core sheet, a chart that shows on first paint
  shifts the content below it once when its sheet arrives (0.107 on the loader page, Chromium; the
  Chart's module held back for 500 ms; 0.008 before S4, when `owlky.css` had everything). Linking
  the sheet in the head (the loader skips a sheet that is already linked) brings it back to 0.008,
  and `rel=preload` alone only sometimes avoids the shift. The guide says so; the e2e loader spec
  measures both pages (linked: under 0.1, the "good" threshold; unlinked: under 0.15).
- **Docs:** the CDN and bundler guides, Get started, the READMEs and the Import table of every
  component say which sheet holds what (`owlky.css` = core, `owlky-all.css` = everything, the
  module's file after the core one), and the CDN guide shows `<link rel="preload" as="style">`
  next to `modulepreload`. `get_component`'s CSS line says the same.
- **Hook for the design styles (ADR-0070):** the opt-in style sheets can follow the same pattern:
  a file in `packages/styles/src/` built to `dist/styles/<name>.css`, listed next to
  `families.json` (a `styles` key would be the place) and copied by `copy-assets.mjs`. Nothing
  reads such a list yet; ST3 / ST4 fill it.

## Consequences
- A light HTML page downloads about 40 kB of JS since S3 (45 kB after S2), down from 306.6 kB,
  and about 29 kB of CSS since S4, down from 67.4 kB. A data grid page adds about 126 kB and its sheet. A
  page with every opt-in no longer downloads the runtime and anatomy six times.
- Lazy components cost one extra round trip, which `data-ok-preload` or `modulepreload` avoids.
  The first paint of a heavy component without preload may shift once.
- Two module instances (`owlky.js` and the chunks) share code without sharing state. The
  duplication rule and its budget keep that safe and visible.
- Export maps grow by about 65 entries per package (one per spec). `check:packages` (publint, attw) takes longer
  and gains the spec ↔ entry check.
- The report (`reports/size-report.json`, git-ignored) is the baseline that each step compares
  against. Its numbers, not estimates, set each new budget.
