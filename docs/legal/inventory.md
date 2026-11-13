# IP inventory (track 2, step L1)

Status: draft for the owner and a lawyer, 2026-11-12. Not legal advice. Classification of every
row is in [`assessment.md`](assessment.md) (step L2); row ids (`R1`, `T3`…) are shared.

Scope: the main checkout at commit `f44ad49e` (`main`), including the landing page that is already
merged (`772ee7ae`). Method: `pnpm licenses list --prod --json` for `@owlky/core`, `html`, `react`
and `mcp` (offline, from `node_modules`), each bundle's source map (which `node_modules` packages
end up inside), the LICENSE files in `node_modules`, a grep of sources, stories, snippets and the
MCP manifest, and a comparison of `packages/tokens/src` with the public MIT repository of the free
Minimal kit (`github.com/minimal-ui-kit/material-kit-react`, `src/theme/theme-config.ts`,
`core/palette.ts`, `core/custom-shadows.ts`, `core/typography.ts`, fetched 2026-11-12). The paid
kit's source was not available; "paid kit only" means "matches what the code, ADRs or specs say
came from minimals.cc, and is **not** in the free MIT repository".

Legend for **Use**: **bundle** = third-party code copied into a file we publish (`@owlky/html/dist`
IIFEs, `dist/monaco/`, the website's `public/cdn/` copy); **npm dep** = installed next to our
package by the user's package manager, not inside our files; **docs** = Storybook / website /
repository only; **dev** = build and test tooling only.

## 1. Runtime dependencies that ship

`pnpm licenses list --prod` over the four publishable packages that have dependencies: 234 MIT,
16 ISC, 4 BSD-2-Clause, 5 BSD-3-Clause, 1 `(MIT OR Apache-2.0)` (`@maplibre/mlt`), 1
`(MPL-2.0 OR Apache-2.0)` (`dompurify`). **No GPL, LGPL, AGPL, CC-BY-SA, MPL-only or unknown
license** in the production trees. `@owlky/tokens` and `@owlky/styles` have no third-party
runtime code.

Which bundles hold third-party code (from the source maps): `owlky.js`, `owlky-code-editor.js` and
`owlky-illustrations.js` hold **none**; `owlky-editor.js` 38 packages, `owlky-markdown.js` 77,
`owlky-map.js` / `owlky-map-worker.js` MapLibre's prebuilt dist, `owlky-phone.js`
libphonenumber-js, `dist/monaco/` Monaco and its own bundled dependencies. The npm ESM builds
(`tsc` output of core, react, html, mcp) import their dependencies and bundle none, with one
exception: `@owlky/core` copies MapLibre's worker into `dist/map/worker.js` (R10).

**Note (2026-11-13):** the opt-in IIFE scripts named here were replaced by the lazy ES modules of
`owlky.js` (`dist/modules/<name>.js` and `dist/modules/chunks/`, ADR-0068) and removed in S6. The
same packages ship in those modules; the generated `THIRD_PARTY_NOTICES.md` lists the current files.

| Id | Item | Where | Source | License | Use | Notice duty |
|---|---|---|---|---|---|---|
| R1 | Tiptap 3.32.0: `@tiptap/core`, `pm`, `starter-kit`, `extensions`, `suggestion` and 19 extension packages (blockquote, bold, code, code-block, document, hard-break, heading, horizontal-rule, image, italic, link, list, mention, paragraph, strike, table, text, text-align, underline…) | `packages/core/src/editor`, `owlky-editor.js` | tiptap.dev, © 2025 Tiptap GmbH | MIT | bundle (`owlky-editor.js`) + npm dep of core | keep the copyright and MIT text with the bundle |
| R2 | ProseMirror: `prosemirror-model`, `-state`, `-view`, `-transform`, `-commands`, `-keymap`, `-history`, `-schema-list`, `-tables`, `-dropcursor`, `-gapcursor` (+ `-inputrules`, `-changeset` in the tree), `orderedmap`, `rope-sequence`, `w3c-keyname` | through `@tiptap/pm` | © Marijn Haverbeke and others | MIT | bundle (`owlky-editor.js`) + npm dep | copyright + MIT text |
| R3 | `linkifyjs` | through `@tiptap/extension-link` | © 2024 Nick Frasser | MIT | bundle (`owlky-editor.js`) | copyright + MIT text |
| R4 | unified ecosystem: `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-raw`, `hast-util-*`, `mdast-util-*`, `micromark*` (about 70 packages), `property-information`, `html-url-attributes`, `vfile*`, `unist-util-*`, `trough`, `bail`, `devlop`, `zwitch`… | `packages/core/src/markdown`, `owlky-markdown.js` | © Titus Wormer and others | MIT | bundle (`owlky-markdown.js`) + npm dep | copyright + MIT text (one entry per copyright holder) |
| R5 | `parse5` 7.3.0 | through `hast-util-raw` | © 2013-2019 Ivan Nikulin | MIT | bundle (`owlky-markdown.js`) | copyright + MIT text |
| R6 | `entities` 6.0.1 | through `parse5` | © Felix Böhm | BSD-2-Clause | bundle (`owlky-markdown.js`) | BSD-2 requires the copyright, conditions and disclaimer in the documentation of a binary distribution |
| R7 | `@ungap/structured-clone` 1.4.0 | through `hast-util-raw` | © 2021 Andrea Giammarchi | ISC | bundle (`owlky-markdown.js`) | copyright + ISC text |
| R8 | `libphonenumber-js` 1.13.15 (code) | `packages/core/src/phone`, `owlky-phone.js` | © 2016 catamphetamine | MIT | bundle (`owlky-phone.js`) + npm dep | copyright + MIT text |
| R9 | libphonenumber **metadata** (`libphonenumber-js/min/metadata`, a compiled form of Google's phone metadata) | same | Google `libphonenumber`; the package ships `LICENSE.Apache` for it | Apache-2.0 | bundle (`owlky-phone.js`) | Apache-2.0: a copy of the license, attribution, and any NOTICE (none found in the package); state that it is modified (compiled) |
| R10 | `maplibre-gl` 6.16.0 prebuilt dist, which itself contains `@mapbox/*` (ISC / BSD-2 / BSD-3), `earcut`, `kdbush`, `potpack`, `quickselect`, `tinyqueue`, `@maplibre/geojson-vt` (ISC), `pbf` (BSD-3), `gl-matrix`, `murmurhash-js` (MIT), `@maplibre/mlt` `(MIT OR Apache-2.0)`… | `packages/core/src/map`, `owlky-map.js`, `owlky-map-worker.js`, `@owlky/core/dist/map/worker.js` (a verbatim copy of `maplibre-gl-worker.mjs`, exported as `@owlky/core/map-worker.js`) | © 2023 MapLibre contributors; © 2020 Mapbox (v1.13 and earlier); its `LICENSE.txt` adds notices for Evan Wallace, Mike Bostock and others | BSD-3-Clause (+ the listed) | bundle (both map files and the npm package `@owlky/core`) + npm dep | ship MapLibre's full `LICENSE.txt`. Today only the two worker copies keep one `@license` comment that points to a URL; `owlky-map.js` has none |
| R11 | `monaco-editor` 0.57.0 | `packages/core/src/code-editor`, `@owlky/html/dist/monaco/` (16 MB: `monaco.js`, `chunks/`, `*.worker.js`, `nls/`, `monaco.css`) | © Microsoft Corporation | MIT | bundle (self-hosted folder) + npm dep | MIT text **and** Monaco's `ThirdPartyNotices.txt` (Node.js `path` (MIT), marked, TypeScript (Apache-2.0), HTML 5.1 W3C Working Draft (W3C license), JS Beautifier (MIT), Ionic docs (Apache-2.0), vscode-swift (MIT)). `dist/monaco/` has no LICENSE or notice file today |
| R12 | `dompurify` 3.4.15 inside Monaco (found in `dist/monaco/chunks/editor.api-*.js`) | Monaco dependency | © Cure53 and Mario Heiderich | `(MPL-2.0 OR Apache-2.0)` | bundle (`dist/monaco/`) | pick Apache-2.0: license copy + attribution |
| R13 | `marked` 14.0.0 inside Monaco | Monaco dependency | © 2018+ MarkedJS (and © Christopher Jeffrey for older code) | MIT | bundle (`dist/monaco/`) | copyright + MIT text |
| R14 | Codicon icon font inlined in `dist/monaco/monaco.css` (`data:font/ttf`, `font-family: codicon`) | Monaco | Microsoft `vscode-codicons` | upstream repo: icons **CC-BY-4.0**, code MIT (not verified in `node_modules`; Monaco's notice file doesn't list it) | bundle | to confirm; if CC BY 4.0 applies: credit, license link, "modified" note |
| R15 | `@floating-ui/dom` 1.8.0 (+ `core`, `utils`) | npm dep of core for `@tiptap/suggestion`; aliased to `html/src/floating-ui-stub.ts` in `owlky-editor.js` | © 2021-present Floating UI contributors | MIT | npm dep only (not in a bundle) | none from us |
| R16 | Date adapters: `dayjs`, `luxon`, `moment`, `moment-timezone`, `date-fns`, `@date-fns/tz` | `packages/core/src/adapters` (peer deps) | their authors | MIT | npm peer dep, not bundled | none from us |
| R17 | `@modelcontextprotocol/sdk` 1.32.2, `zod` 4.6.7 and their trees (express, hono, ajv, `qs` and `fast-uri` (BSD-3), `json-schema-typed` (BSD-2), ISC helpers…) | `packages/mcp` | © 2024 Anthropic, PBC; © 2025 Colin McDonnell; others | MIT (+ ISC / BSD) | npm dep of `@owlky/mcp`, not bundled | none from us |
| R18 | `react`, `react-dom` | peer deps of `@owlky/react` | Meta | MIT | npm peer dep; bundled only in the website | website: see D7 |
| R19 | `owlky.js`, `owlky-code-editor.js` (Monaco is stubbed, `src/monaco-stub.ts`), `owlky-illustrations.js`, every npm `dist` of tokens, styles, core, react, html | `packages/*` | us | MIT (our `LICENSE`, "Copyright (c) 2026 Owlky contributors") | bundle / npm | our own `LICENSE` (present in every package) |
| R20 | `lowlight` / `highlight.js` | named in Editor and Markdown docs as "bring your own"; Storybook dev deps | wooorm; highlight.js authors | MIT; BSD-3-Clause | docs / dev only (not shipped) | none |

## 2. Dev and docs-only dependencies worth noting

| Id | Item | Where | Source | License | Use | Notice duty |
|---|---|---|---|---|---|---|
| D1 | Storybook 10.6.5 + addons (a11y, docs, mcp), `@storybook/react-vite` | `apps/storybook` | Storybook | MIT | docs (a built Storybook would ship its runtime if it is ever deployed) | none for the library |
| D2 | Iconify **Solar** (480 Design) — 24 icons | `apps/storybook/src/foundations/icons/icon-data.json` (committed subset, made by `scripts/icons.mjs`) | figma.com/community/file/1166831539721848736 | CC-BY-4.0 | docs (Foundations › Icons); the subset JSON is in the public repository | credit shown on the page (`Credit` in `icon-demos.tsx`: author + license); CC BY also asks for a license link and a "modified" note |
| D3 | Iconify **Eva Icons** (Akveo) — 12 icons | same | github.com/akveo/eva-icons | MIT | docs | credit shown; MIT text expected with the copy in the repository |
| D4 | Iconify **SVG Logos** (Gil Barbara) — Google, Facebook, Instagram, LinkedIn, X, GitHub | same | github.com/gilbarbara/logos | CC0-1.0 (the artwork) | docs | none for copyright; the marks are **trademarks** of their owners |
| D5 | Iconify **VSCode Icons** (Roberto Huertas) — file types incl. Word, Excel, PowerPoint, Illustrator, Photoshop, JS, TS | same | github.com/vscode-icons/vscode-icons | MIT (the set) | docs (Upload demos) | MIT text; Microsoft / Adobe file icons are **trademarks** |
| D6 | Iconify **Circle Flags** (HatScripts) — every two-letter code | same | github.com/HatScripts/circle-flags | MIT | docs | MIT text |
| D7 | Next.js 16.4.3, React 19.3.1, `@tailwindcss/postcss` | `apps/website` | Vercel; Meta; Tailwind Labs | MIT | ships on owlky.com (client JS bundles) | website: MIT notices for the bundled runtime (Next.js / webpack may or may not keep license comments: not checked in `out/`) |
| D8 | Shiki 4.5.0, theme `github-dark-default` | `apps/website/src/site/highlight.tsx` | shikijs; theme from the tm-themes collection | MIT | website build time (output is HTML spans) | none required for output; credit is courteous |
| D9 | Pagefind 1.5.2 | `apps/website` | CloudCannon | MIT | ships on owlky.com (search JS / WASM) | MIT text on the website |
| D10 | `lucide-react` | named in every React docs example (icons) and in `check-docs-code.mjs`'s list; **not installed** | lucide.dev | ISC | docs (example code users copy) | none for us (users install it) |
| D11 | `@iconify/react` 6.0.3 | Storybook | Iconify | MIT | docs | none |
| D12 | Tooling: TypeScript 7, Biome, Vitest, Playwright, axe-core (MPL-2.0, dev only), Changesets, publint, Vite 8, Tailwind CSS 4.3 compiler | root, packages | various | MIT / Apache-2.0 / MPL-2.0 (axe-core) | dev only; nothing from them in `dist` (checked: no Tailwind banner or preflight in `owlky.css`; `base.css` is ours) | none |

## 3. Fonts

| Id | Item | Where | Source | License | Use | Notice duty |
|---|---|---|---|---|---|---|
| F1 | Public Sans (default `--ok-font-family`) | `tokens/src/default-theme.ts` (name only); `@fontsource-variable/public-sans` 5.3.0 in Storybook and website | USWDS, © 2015 The Public Sans Project Authors | OFL-1.1 | library: **stack name only, no font file**; website and Storybook serve the files | website / Storybook: keep OFL text with the served fonts (Fontsource packages include it) |
| F2 | Barlow (`fontFamilySecondary`, h1–h3) | same, `@fontsource/barlow` 5.3.0 | © 2017 The Barlow Project Authors | OFL-1.1 | same as F1 | same |
| F3 | Inter, DM Sans, Nunito Sans (font presets) | `tokens/src/presets.ts`, Fontsource packages | © 2016 Inter Project Authors; © 2014 DM Sans Project Authors; © 2016 Nunito Sans Project Authors | OFL-1.1 | same as F1 | same |
| F4 | Monospace stack (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas…`) | `default-theme.ts` | system fonts | n/a (not distributed) | names only | none |
| F5 | Codicon font | see R14 | Microsoft | see R14 | bundle | see R14 |

## 4. Images, illustrations, icons in components, map and sample data

| Id | Item | Where | Source | License | Use | Notice duty |
|---|---|---|---|---|---|---|
| I1 | Illustration set (error pages, empty states, upload, sign-in, maintenance, coming soon…) | `packages/core/src/illustrations/data/*.ts`, `owlky-illustrations.js` | drawn for Owlky (ADR-0041: no Minimals Pro art, no unDraw, no Humaaans parts used) | MIT (ours) | bundle + npm | none |
| I2 | Avatar portraits `avatar-1…7.svg` | `apps/storybook/public/avatars` | written in-repo (commit `37e42bff`), simple shapes; fills use the palette hex values (T1) | ours (no other source stated) | docs; their markup is also in `@owlky/html/dist/snippets` (`src` paths) | none |
| I3 | Abstract pictures `images/*.svg`, `carousel/slide-*.svg`, `lightbox/photo-*.svg`, `video-poster.svg` | `apps/storybook/public` | gradient SVGs written in-repo (commits `7b3f0a27`, `b2a65844`, `f44e4c71`) | ours (no other source stated) | docs | none |
| I4 | `lightbox/video.webm` + `video.vtt` | `apps/storybook/public/lightbox` | added in `b2a65844`; caption: "Bands of color drift while a white circle moves across them"; **no generator script or source recorded** | unknown (probably generated) | docs | record provenance |
| I5 | Component icons: 326 unique SVG paths in React / core / HTML sources (close, chevrons, calendar, upload, map controls, editor toolbar…) | `packages/react/src/**`, `packages/html/src/**`, `core/src/map/icons.ts` | no source comment; 0 exact matches against Solar, Eva, Logos, VSCode Icons and Circle Flags (full sets compared). Several are identical to **Lucide** paths as far as can be told without Lucide installed: `M18 6 6 18M6 6l12 12` (x), `M20 6 9 17l-5-5` (check), `M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8` (rotate-ccw), `M21 17v2a2 2 0 0 1-2 2h-2` (scan corners) in `organization-chart.tsx`, `date-field.tsx`, `upload-icons.tsx`, `stepper.tsx`, `snackbar.tsx`, `autocomplete.tsx`, `html/.../toaster.ts` | ours, or Lucide (ISC) for the matching ones | bundle + npm | if Lucide: ISC copyright + permission notice |
| I6 | Website GitHub mark (`GitHubIcon` in `site/header.tsx`) | `apps/website` | GitHub's mark | GitHub logo terms (trademark) | website | follow GitHub's logo guidelines |
| M1 | US states GeoJSON | `apps/storybook/public/maps/us-states.geojson`; bundled as text in chart geo stories | Natural Earth 1:110m (comment in `map-data.ts`, `chart-geo-geometry.ts`) | public domain | docs | none required; credit customary |
| M2 | US Census regions GeoJSON | `public/maps/us-regions.geojson` | built from M1 by `scripts/us-regions.mjs` | public domain | docs | none |
| M3 | Earthquakes GeoJSON (Oct 2025, M1.5+, contiguous US) | `public/maps/earthquakes.geojson` | USGS (comment in `map-data.ts`) | public domain (US government work) | docs | none required; credit customary |
| M4 | State populations, top-20 metros (2020 Census), capitals and cities | `apps/storybook/src/components/map/map-data.ts`, chart data | U.S. Census Bureau; public facts | public domain | docs | none |
| M5 | Basemap styles and tiles `tiles.openfreemap.org` (positron, dark, liberty) | `map-data.ts`, map stories and docs examples (fetched at run time, not copied) | OpenFreeMap; © OpenMapTiles; data © OpenStreetMap contributors | ODbL-1.0 (data), OpenMapTiles style / schema terms (BSD-3 + CC-BY-4.0 for the design) | docs (live requests) | attribution on the map: kept by `AttributionControl` (on by default in React) |
| M6 | Offline e2e land layer | `e2e/fixtures/map/land.geojson` | Natural Earth (`attribution: "Natural Earth"` in `e2e/tests/helpers.ts`) | public domain | dev | none |
| M7 | Map test fixtures, `examples/csp/map-style.json` | `packages/html/src/components/map/fixtures`, `examples/csp` | written in-repo | ours | dev / example | none |
| M8 | Phone input country list and flags | `core/src/phone` (flags are emoji from regional indicators; names from `Intl`) | Unicode / the browser | n/a | bundle | none |

## 5. Design values taken from the reference kit

Reference = the Minimal dashboard (minimals.cc, a paid template sold on the MUI Store; the owner
has no license). Its **free edition** `minimal-ui-kit/material-kit-react` is public under the MIT
license ("Copyright (c) 2021 Minimal UI (https://minimals.cc/)"). The code and ADRs say the values
below follow the reference (`default-theme.ts` header, ADR-0014, ADR-0017 "values follow the
reference", `/component` step 3 records computed styles of the reference pages).

| Id | Item | Where | Matches | Source of the match | Use |
|---|---|---|---|---|---|
| T1 | Grey scale 50–900 (`#FCFDFD` … `#141A21`) | `tokens/src/default-theme.ts` | **exact**, all 10 | free kit `theme-config.ts` (MIT) and paid kit | every bundle and npm package (`tokens.css`, `owlky.css`, JS tokens) |
| T2 | Secondary, info, success, warning, error palettes (5 tones each + `contrastText`) | same | **exact**, all 30 values | free kit (MIT) and paid kit | same |
| T3 | Primary palette: green `#C8FAD6 / #5BE49B / #00A76F / #007867 / #004B50` | same | matches the paid kit's default primary (per ADRs); **not** in the free kit (its primary is blue `#1877F2`) | paid kit only | same |
| T4 | Primary presets cyan `#078DEE`, purple `#7635DC`, blue `#0C68E9`, orange `#FDA92D`, red `#FF3030` (5 tones each) | `tokens/src/presets.ts` | "from the reference Settings drawer" (file header) | paid kit only | same |
| T5 | Light scheme: text (grey 800 / 600 / 500), background, `neutral` grey 200, action alphas 8 / 16 / 24 / 80 / 24 % of grey 500, divider 20 % | `default-theme.ts` | **exact** (background `default` differs: we use white, free kit grey 100) | free kit (MIT) | same |
| T6 | Dark scheme: backgrounds grey 900 / grey 800 / `#28323D`, dark `paletteText` tones | same | follows the reference's dark mode | paid kit only (the free kit has no dark scheme) | same |
| T7 | Shadows `z1`–`z24`, `card`, `dropdown` (x −20 px), `dialog` (x −40 px), color shadow 0 8 16 / 24 % | `default-theme.ts` `shadows`, `colorShadow` | **exact**, every layer, offset, blur, spread and alpha | free kit `custom-shadows.ts` (MIT) and paid kit | same |
| T8 | Elevation 1–24 (umbra / penumbra / ambient geometry, 20 / 14 / 12 %) | `default-theme.ts` `ELEVATION` | MUI's default `shadows` table | MUI core (MIT, "Copyright (c) 2014 Call-Em-All") | same |
| T9 | Typography scale h1–button (sizes, responsive steps, weights, line heights), Barlow for h1–h3 | `default-theme.ts` `typography.variants` | **exact** for every variant | free kit `typography.ts` (MIT) and paid kit | same |
| T10 | Public Sans as the primary font; font presets Public Sans / Inter / DM Sans / Nunito Sans; root font size 12–20 | `default-theme.ts`, `presets.ts` | paid kit's default font and Settings drawer; the free kit uses DM Sans Variable + Barlow | paid kit only (the list) | same |
| T11 | Breakpoints 0 / 600 / 900 / 1200 / 1536, z-index 1000 / 1200 / 1300 / 1400 / 1500, durations 150 / 200 / 250 / 300 ms, easings standard / decelerate / accelerate | `default-theme.ts` | MUI defaults | MUI core (MIT) | same |
| T12 | `expressive` easing `cubic-bezier(0.43, 0.13, 0.23, 0.96)`, `enter` 640 ms, `exit` 480 ms | `default-theme.ts` `motion` | the reference's Animate transitions (per spec `motion.md`) | paid kit (not checked in the free kit) | same |
| T13 | Radius scale 4 / 6 / 8 / 12 / 16 / 24 px, spacing 4 px | `default-theme.ts` | generic (8 px is MUI / Minimals' base; 4 px spacing is Tailwind's) | common values | same |
| T14 | Contrast rule "white on fills, `main` text on outlined and text variants" (MUI `getContrastText` 3:1) | ADR-0014, tokens | the reference look | paid kit + MUI (MIT) | same |
| T15 | Component signature details recorded from reference pages: "soft" variants (16 % tint + dark text tone) on Button, Chip, Label, Alert, Badge…; Label metrics (24 px high, 6 px radius, 12 px bold); Paper outlined "grey 500 at 16 %"; Card header without bottom padding; contained "inherit" (black / white) buttons; dropdown / dialog shadow direction; picker, data grid, upload, editor, carousel, lightbox, walktour, organization chart skins | `packages/styles/src/components/*.css` (95 lines mention "reference" or "Minimals"), specs | recorded from `getComputedStyle` of minimals.cc demo pages (`/component` step 3); the free kit's overrides cover only part of them (not compared component by component) | paid kit (most), free kit (some) | `owlky.css`, `@owlky/styles` |
| T16 | Storybook manager brand color `colorSecondary: "#00A76F"` | `apps/storybook/.storybook/manager.ts` | = T3 | paid kit | docs |

## 6. Content copied or adapted from references

| Id | Item | Where | Source | License | Use |
|---|---|---|---|---|---|
| C1 | Minimals mock person names: Jayvion Simon, Lucian Obrien, Deja Brady, Harrison Stein, Reece Chung, Lainey Davidson, Cristopher Cardenas | avatar, badge, table, chip stories and docs; `packages/html/src/components/{avatar,chip}/examples/*.html`; `avatar.ts`; **`@owlky/html/dist/snippets`**, **`packages/mcp/manifest.json`** (13 hits) | Minimals demo data (`_mock`); **not** in the free kit's `_mock.ts` (checked) | paid kit, no license | npm (snippets, MCP manifest) + docs |
| C2 | Text field demo value `2Minimal` | `text-field-examples.tsx`, 6 `text-field/examples/*.html` snippets, MCP manifest | Minimals Text field page | paid kit | npm + docs |
| C3 | Desserts table data (Frozen yoghurt, Ice cream sandwich, Eclair, Cupcake, Gingerbread + numbers) | `table-data.json`, `sorting-demo.tsx`, `table-docs.tsx`, `table/examples/*.html`, dist snippets | MUI docs demos (also shown by Minimals) | MIT (MUI repository) | npm + docs |
| C4 | Movie list for Autocomplete (Inception…; MUI's "top 100 films" style) | `autocomplete-scripts.ts`, `async-demo.tsx` | MUI docs demos | MIT (MUI repository); titles are facts | docs |
| C5 | Chart demo data: ApexCharts sample series (`[10, 41, 35, 51, 49, 62, 69, 91, 148]`, `[44, 55, 41, 67, 22, 43]`, the 10-country horizontal bar with values a few units off ApexCharts' `[400, 430, …, 1380]`, "Desktops", "Team A"…) | `apps/storybook/src/components/chart/chart-data.ts` (133 examples) → generated `chart/examples/*.html` snippets → dist snippets, MCP manifest | ApexCharts demo pages (as embedded on minimals.cc) | ApexCharts samples: not stated (the library itself is dual / revenue-limited, ADR-0024) | npm + docs |
| C6 | Story list and section names ("one story per reference section", ADR-0018); 54 of 65 specs have a `Reference URL:` on minimals.cc, 9 on mui.com, 1 Monaco React, 1 ApexGantt | `apps/storybook/src/components/**`, `specs/components/*.md`, MCP manifest (`referenceUrl`) | minimals.cc and mui.com page structure | n/a (names and structure) | docs + npm (manifest) |
| C7 | Story descriptions that repeat MUI docs sentences: "Lists are continuous, vertical indexes of text or images." (verbatim), "Cards contain content and actions about a single subject." (verbatim), "Menus show a list of choices on a temporary surface." (close), "Chips are compact elements for…" (close) | `list`, `card`, `menu`, `chip` `.stories.tsx` | MUI docs (from Material Design guidelines) | MIT (MUI repository) | docs (+ manifest if stories' descriptions are read) |
| C8 | API surfaces of Minimals' **own** wrapper components: `Upload` / `UploadAvatar` / `UploadBox`, `Label`, the `Editor` wrapper props, the `Image` wrapper props, Animate (`MotionContainer`-style API), `Scrollbar`, Organization chart, Lightbox, Carousel hooks, `useChart` | specs, `anatomy.ts` option schemas, React components | minimals.cc component pages (the free kit is believed to have `Label`, `Scrollbar` and `Chart` wrappers under MIT, not verified file by file; the rest are paid only) | paid kit (names and props only; no code) | npm |
| C9 | API names mapped from MUI, MUI X, Sonner, Embla, react-joyride, react-dropzone, react-markdown, react-map-gl, Framer Motion, ApexCharts / ApexTree / ApexSankey / ApexStock / ApexMaps / ApexGantt, react-phone-number-input, Monaco React (ADR-0015) | option schemas, JSDoc, API reference JSON | upstream docs | MIT for most; ApexCharts family not MIT; ApexGantt commercial | npm (names only) |
| C10 | Docs prose, Foundations and component guides, website copy | `apps/docs-content`, `apps/storybook/src`, `apps/website/src/content` | written in-repo; spot checks against MUI docs phrasing found only C7 | ours | docs |
| C11 | Picker locale packs (`pickersEnUS`, `pickersViVN` and others) | `packages/core/src/pickers/locales.ts` | "MUI X `localeText`" keys; origin of the translated strings not stated | MIT if taken from MUI X; otherwise ours | npm + bundle |
| C12 | Landing page (`apps/website/src/site/landing`, merged) and `dashboard-preview.tsx` demo (Ava Lee, Noah Kim…) | `apps/website` | written in-repo | ours | website |
| C13 | Organization chart, Gantt, data grid, tree view sample data (Maya Lindqvist, "Café table", "Kickoff"…) | stories | written in-repo; Gantt: ADR-0048 says no ApexGantt data copied | ours | docs + snippets |

## 7. Names and marks

| Id | Item | Where | Notes |
|---|---|---|---|
| N1 | Name "Owlky", npm scope `@owlky`, domain owlky.com, GitHub `dangduoc08/owlky` and org `owlky` | everywhere | chosen by the owner (ADR-0016, renamed from "Minimal Tailwind"); no trademark search recorded. A web search on 2026-11-12 found no product named Owlky; nearby names: "Owlka" (a Google Play developer), Hootsuite's owl mascot "Owly" and `ow.ly` |
| N2 | Owl logo | — | **none in the repository**: Storybook uses `brandTitle: "Owlky"` (text), the website header a text wordmark, no favicon file found |
| N3 | "Minimal" / "Minimals" in public text | `README.md` ("inspired by the Minimal dashboard design; Owlky uses none of its code or assets"), `packages/tokens/README.md` ("Brand colors follow the Minimal reference"), Foundations › Illustrations ("in the flat style of the Minimal dashboard"), `@owlky/mcp` manifest (45 × "Minimals", 3 × "Minimal", `referenceUrl` to minimals.cc), `upload.tsx` JSDoc ("Minimals' UploadAvatar"), CSS comments in `paper.css`, `card.css`, the `default-theme.ts` header, `2Minimal` (C2) | nominative references to a third party's product |
| N4 | "MUI", "Material", "Apex…", "Sonner", "Framer", "react-joyride" in public text | MCP manifest (MUI 317, Apex 122, Framer 31, ApexCharts 28, Sonner 22, react-joyride 14, Material 2), API reference JSON (MUI 71, Apex 9…), website manifest subset (MUI 3), `packages/react/README.md` (upstream names) | nominative "API like X" references; MUI and Material UI are trademarks of MUI SAS, Material Design of Google, ApexCharts of its owner |
| N5 | Third-party marks in docs icons | D4, D5, I6 | trademarks of Google, Meta, LinkedIn, X, GitHub, Microsoft, Adobe |
| N6 | Package metadata | every `packages/*/package.json` | `license: "MIT"`, no `author` field; each package has the root's MIT `LICENSE` ("Copyright (c) 2026 Owlky contributors") |

## 8. Code adapted from elsewhere

Searches: "adapted from", "ported from", "based on", "copied", "derived from", "inspired by",
"taken from", "borrowed", and the upstream names (MUI, Minimals, Sonner, Embla, joyride,
dropzone, Framer, Apex, yet-another-react-lightbox, d3, Material) across `packages/*/src`,
`scripts`, `apps/*/src`. Every hit names an **API or behavior** being mapped ("MUI X
`localeText`", "react-joyride's `beforeTimeout` default", "Sonner's defaults", "ApexCharts
`markers.shape`"); none says code was copied. The bundles hold no upstream UI library code
(source maps). Git history has no reference captures, screenshots or binary assets other than
I4.

| Id | Item | Where | Origin | License |
|---|---|---|---|---|
| A1 | Collapse auto duration `4 + 15·r^0.25 + r/5` | `core/src/collapse/collapse.ts` `autoCollapseDuration` | MUI `getAutoHeightDuration` (comment: "Material Design's formula") — one-line formula | MIT (MUI) |
| A2 | Default spring settings (stiffness 500 / damping 25, 550 / 30), `visualDuration` / `bounce` → stiffness / damping, rest thresholds | `core/src/motion/gesture.ts`, `animate.ts`, `values.ts` | Framer Motion's documented defaults; the solver is the textbook damped oscillator | MIT (Framer Motion) for the constants; formula is public math |
| A3 | Jenks natural breaks (Fisher), Equal Earth projection (Šavrič, Patterson, Jenny 2018), Reingold–Tilford / Buchheim tree layout, quantile "like d3" | `core/src/map/choropleth.ts`, `core/src/chart/*` | published algorithms, written in-repo | own implementation |
| A4 | Toaster swipe / defaults (Sonner), Walktour state rules (react-joyride), Carousel options (Embla), Upload options (react-dropzone), Lightbox plugins (yet-another-react-lightbox) | `core/src/toast`, `walktour`, `carousel`, `upload`, `lightbox` | behavior and option names mapped (ADR-0015); no copied code found | upstream MIT; ours as written |
| A5 | Lucide-identical icon paths | see I5 | probable copy | ISC |
| A6 | Spec API tables mapping MUI / MUI X props | `specs/components/*.md` | docs-derived descriptions, rewritten | MIT (MUI docs) |
