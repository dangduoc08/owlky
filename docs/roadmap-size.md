# Roadmap — bundle size before 0.1.0

Owner's decision 2026-11-12 (supersedes "size optimization later, not before 0.1.0" of 2026-11-10):
make Owlky load only what a page uses, for React and for HTML, before publishing 0.1.0. This
roadmap runs after component completion (`roadmap-components.md`, done 2026-11-12) and before the
website phase 2 and 0.1.0 (`roadmap.md` → "After the waves").

## Decisions (approved 2026-11-12)

1. Size work happens **before 0.1.0**.
2. **One entry per component at every layer**: `@owlky/core/<name>`, `@owlky/react/<name>`,
   `@owlky/html/<name>`, `@owlky/styles/components/<name>.css`; the barrels stay for convenience.
3. **The CDN `owlky.js` becomes a small loader** (registry, observer, theme settings and the light,
   common components). It loads a heavy component's ESM module and its CSS from the same folder
   when the page holds one (`[data-ok-chart]`, `[data-ok-data-grid]`…): users keep one `<link>` and
   one `<script>`. `data-ok-preload` loads named components ahead of use. It must work under a strict
   CSP (same-origin modules only).
4. **Option schemas lose their documentation at run time**: descriptions and docs metadata move to a
   JSON file that docs, Controls, the API reference and the MCP manifest read.
5. **CSS per component**: a core stylesheet plus one file per heavy component, attached by the loader
   on the CDN; a scanner of `data-ok-*` usage (Vite / PostCSS / Tailwind plugin) may follow.
6. **Heavy components split inside** (data grid pivot / range charts / Excel export / print; chart
   types such as geo, sankey, stock, tree) through dynamic imports in core.
7. **Targets**: `owlky.js` ≤ 110 kB gzip (aim lower: about 25–35 kB for a page of light components),
   core CSS ≤ 35 kB gzip, each lazy module with its own budget; scenario budgets in CI (for example
   "React, Button only", "HTML page with a Dialog", "HTML page with a Data grid").
8. **No more budget raises** in `scripts/check-size.mjs`, except the MCP manifest (not a browser
   download): a change that exceeds a budget optimizes or splits instead.

### Decisions from the S1 measurements (approved 2026-11-12)

9. **The lazy list** (refines 3): Chart, Data grid, Date pickers, Gantt, Carousel + Lightbox,
   Motion extras, Organization chart, Upload, Walktour, Tree view, Sortable, Autocomplete,
   Transfer list and the six old opt-ins (Map, Editor, Code editor, Markdown, Phone input,
   Illustrations). `owlky.js` keeps the runtime, theme settings and the rest ("light set B" of
   ADR-0068: 44.9 kB measured, about 39 kB after S3).
10. **The S3 target** (replaces "anatomy share of `owlky.js` reduced by at least 15 kB"): about
    18 kB gzip of schema descriptions removed across `owlky.js` and the lazy modules, and at most
    3 kB of anatomy left in `owlky.js`.
11. **React per-component entries** (refines 2) are kept for clarity and for bundlers that don't
    tree-shake; the barrel already tree-shakes as well as a direct path. React savings come from
    S5 (static composition: DataGrid → Chart, CircularProgress → ScrollProgress → Motion).

## Steps

| # | Step | Scope | Done when | Status |
|---|---|---|---|---|
| S1 | Measure and ADR | a script that attributes every bundle's gzip size to components (source maps), scenario measurements for React (Vite build of sample entries) and HTML (bytes a CDN page downloads); the ADR for decisions 2–8 (entries, loader protocol, CSP, preload, CSS split, budgets) | a per-component and per-scenario report in `check:size`; the ADR accepted | ✅ 2026-11-12: `pnpm size:report` (also in `check:size`, JSON in `reports/`), ADR-0068. `owlky.js` 306.6 kB gzip: data grid 53.8, chart 73.5 (geo 6.6, tree 7.9, stock 3.9, Sankey 3.7), anatomy 28.4 (descriptions 23.3 alone), date pickers 26.7, motion 17.1, carousel + lightbox 15.5, gantt 14.1, runtime 3.7; CSS 62.7 kB; React Button 10.2 kB (barrel = direct path), DataGrid 205.7 kB; HTML light set 44.9 kB (decision 3's list only: 80.3 kB) |
| S2 | Lazy heavy components | per-component entries in `html` and `react` (and `core` where missing); the loader in `owlky.js`; Chart, Data grid, Date pickers, Gantt, Carousel / Lightbox, Motion extras (and Map, Editor, Code editor, Markdown, Phone, Illustrations moved onto the same loader) | `owlky.js` within its new budget; every story and snippet works with the lazy path (parity, a11y, CSP pages) | ✅ 2026-11-12: anatomy split per component (React Button 10.2 → 8.3 kB), 169 per-component entries (`pnpm entries`); the loader in `owlky.js` (307.6 → 45.2 kB gzip) with 19 lazy ES modules and shared chunks, the six opt-in scripts as shims, budgets per module, chunks and scenario (light page 370 → 108 kB with CSS, data grid page 246.5 kB, chart page 199.1 kB), the module-state audit, `imports` in the MCP manifest; loader e2e (lazy, preload, failure and retry, slow network) and the CSP page with one script |
| S3 | Schema metadata out of the runtime | descriptions and docs metadata into a generated JSON; runtime schemas keep names, kinds, defaults and value lists | about 18 kB gzip of descriptions removed across `owlky.js` and the lazy modules, at most 3 kB of anatomy left in `owlky.js` (decision 10); `check:api`, `check:manifest`, Controls unchanged | ✅ 2026-11-12: `packages/core/scripts/option-docs.mjs` (core build) writes `@owlky/core/option-docs.json` (1,048 descriptions, 115 schemas) and blanks the literals in `dist` by AST position (source maps unchanged); build scripts read schemas through `scripts/option-schemas.mjs` (`describeOptions`), Storybook reads the sources; API reference, specs and manifest byte-identical. 23.2 kB gzip removed across `owlky.js`, the lazy modules and chunks; `owlky.js` 45.22 → 40.45 kB, its anatomy 6.59 → 2.95 kB (pure IIFEs for the Motion and FormControl schemas); chunks 87.35 → 80.72 kB; light page 107.9 → 103.15 kB, data grid page 246.5 → 233.69 kB, chart page 199.1 → 188.52 kB; React Button 8.32 → 7.86 kB, DataGrid 206.25 → 193.30 kB; budgets lowered to measurement + ≤ 5%, plus an anatomy (≤ 3 kB) and a no-description check |
| S4 | CSS split | core `owlky.css` and per-component files for the heavy components; the loader attaches them; documented per-component imports for bundlers | core CSS ≤ 35 kB; no visual or parity change | ⬜ |
| S5 | Split inside heavy components | dynamic imports for rarely used features of Data grid and Chart (and others the S1 report names); `/refactor optimize` on the largest files | each change measured before / after | ✅ 2026-11-13 (partly: chart types and the data grid's pivot / Excel / print move to S5b, reasons in ADR-0068 › S5 notes): React DataGrid loads its Chart on first use (193.30 → 119.75 kB, 75.8 kB lazy); the HTML data grid loads the chart helpers with its first chart (module with imports 130.5 → 69.0 kB, data grid page 233.69 → 173.23 kB); `useScrollProgress` imports the Motion engine only with `scroll` (React Button 7.86 → 3.02 kB, Button + Dialog + TextField 19.65 → 15.24 kB, DatePicker 57.7 → 53.2 kB); the CDN illustration module loads its pictures on demand (6.75 → 1.36 kB, with imports 12.9 → 6.2 kB); modules no longer bundle `createRuntime` (duplicated code 11.1 → 10.3 kB). Budgets lowered; the shared-chunks total became one budget per module with its imports |
| S5b | Chart types and data grid features | lazy layout families (tree / sunburst / icicle, stock, heatmap / treemap, funnel / slope first; geo and Sankey after moving their readers and value lists), pending render in core, React and HTML, opt-in static entry for SSR; data grid pivot / Excel / print where the API allows | each change measured before / after | ⬜ |
| S6 | Docs and verification | guides for CDN and bundler users (per-component imports, `optimizePackageImports`, preload), e2e for the loader (three engines, strict CSP, slow network), scenario budgets enforced in CI | docs and e2e green; budgets enforced | ⬜ |

Each step is one review: propose → implement → verify (unit in three browsers, affected e2e,
parity) → merge. Release notes record every markup or loading change (pre-0.1.0: minor changesets).

## Notes from S1 (2026-11-12)

Measured with `pnpm size:report` (ADR-0068 has the tables). The first three notes became
decisions 9–11 (approved 2026-11-12); the rest is context for S2 and S5:

- **S2, light set (decision 3, decision 7):** moving only Chart, Data grid, Date pickers, Gantt,
  Carousel / Lightbox and Motion out of `owlky.js` leaves 80.3 kB, over twice the 25–35 kB aim.
  Organization chart, Upload, Walktour, Tree view, Sortable, Autocomplete and Transfer list
  become lazy modules too (light set B: 44.9 kB, about 39 kB after S3). Decision 3's list said
  "…", so the decision holds; the S2 scope grows.
- **S2, core anatomy split:** importing one React component pulls part of every schema (a Button
  keeps 2.4 kB of anatomy for a 0.3 kB schema; DataGrid keeps 508 of 1,048 descriptions). The
  cause is module-level code in the one `anatomy.ts` (spreads, `.map` value lists, unannotated
  option factories, value lists imported from model modules). Splitting it per component belongs
  in S2 (the `@owlky/core/<name>` entries need it).
- **S3 target:** after S2, `owlky.js` holds only about 7 kB of anatomy, so "reduced by at least 15
  kB" can't be measured on `owlky.js` alone. Measure it across `owlky.js` and the lazy modules (about 18 kB of
  descriptions leave the CDN code); in `owlky.js`, the anatomy target is ≤ 3 kB.
- **S4 target (≤ 35 kB core CSS):** decision 3's list gives 36.8 kB, and light set B gives
  29.1 kB. The CSS split follows the JS split.
- **Decision 2 for React:** the barrel tree-shakes exactly like direct file imports (same bytes
  in every scenario). Per-component React entries help bundlers without tree shaking and docs
  clarity, not bundle size. React's bytes come from static composition, so S5 adds:
  - DataGrid → Chart (about 70 kB of its 205.7 kB): a dynamic import;
  - CircularProgress → ScrollProgress → the Motion engine (4.9 kB in every Button).
- **S2, the opt-in bundles:** each opt-in IIFE carries its own copy of the runtime and part of the
  anatomy (about 5 kB each). The shared ESM chunks of the loader remove that duplication.
