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

## Steps

| # | Step | Scope | Done when | Status |
|---|---|---|---|---|
| S1 | Measure and ADR | a script that attributes every bundle's gzip size to components (source maps), scenario measurements for React (Vite build of sample entries) and HTML (bytes a CDN page downloads); the ADR for decisions 2–8 (entries, loader protocol, CSP, preload, CSS split, budgets) | a per-component and per-scenario report in `check:size`; the ADR accepted | ⬜ |
| S2 | Lazy heavy components | per-component entries in `html` and `react` (and `core` where missing); the loader in `owlky.js`; Chart, Data grid, Date pickers, Gantt, Carousel / Lightbox, Motion extras (and Map, Editor, Code editor, Markdown, Phone, Illustrations moved onto the same loader) | `owlky.js` within its new budget; every story and snippet works with the lazy path (parity, a11y, CSP pages) | ⬜ |
| S3 | Schema metadata out of the runtime | descriptions and docs metadata into a generated JSON; runtime schemas keep names, kinds, defaults and value lists | `anatomy` share of `owlky.js` reduced by at least 15 kB; `check:api`, `check:manifest`, Controls unchanged | ⬜ |
| S4 | CSS split | core `owlky.css` and per-component files for the heavy components; the loader attaches them; documented per-component imports for bundlers | core CSS ≤ 35 kB; no visual or parity change | ⬜ |
| S5 | Split inside heavy components | dynamic imports for rarely used features of Data grid and Chart (and others the S1 report names); `/refactor optimize` on the largest files | each change measured before / after | ⬜ |
| S6 | Docs and verification | guides for CDN and bundler users (per-component imports, `optimizePackageImports`, preload), e2e for the loader (three engines, strict CSP, slow network), scenario budgets enforced in CI | docs and e2e green; budgets enforced | ⬜ |

Each step is one review: propose → implement → verify (unit in three browsers, affected e2e,
parity) → merge. Release notes record every markup or loading change (pre-0.1.0: minor changesets).
