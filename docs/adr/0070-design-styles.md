# ADR-0070: Design styles

**Status:** Accepted (owner's decisions 2026-11-12, `docs/roadmap-styles.md`, step ST1). Supersedes
ADR-0017 (presets, fonts and root size as attributes) and ADR-0014. Supersedes the default values
of ADR-0069 (Indigo / Zinc, the preset list, Be Vietnam Pro) and keeps its rules: palettes from
Tailwind CSS v4's MIT palette, roles chosen by a generator, AA everywhere with no brand-text
exemption. Fits the CSS split and the loader of ADR-0068. Inventory and font check:
`docs/styles-inventory.md`.

## Context
A theme today is one look (the reference's) plus two partial switches: `data-ok-preset` (primary
color) and `data-ok-font` (text font). The owner wants full design presets ("styles") that change
palette, fonts, shape, borders, shadows, label case and heading weight together, with
independent axes for density, surface contrast and high contrast (dashboard lab review,
2026-11-12). Component CSS still holds about 390 hard-coded design values (inventory) that no
style could reach, and component icons are hand-drawn in four different manners (2px stroke,
1.5px stroke, Material-like fills, Lucide copies). Nothing is published, so names can change
freely.

## Decision

### 1. Nine styles, Soft by default
| Id | Name | Shape (control / surface radius) | Lines and shadows | Fonts (headings · text · labels) | Icon stroke |
|---|---|---|---|---|---|
| `soft` | Soft | 10 / 18px | no borders, two-layer soft shadows | Nunito 800 · Nunito · Nunito | 1.5 |
| `swiss` | Swiss | 0 / 0 | 1px ink lines, no shadows | Inter 800, tracking −0.03em · Inter · Inter | 1.5 |
| `bauhaus` | Bauhaus | 0 / 0, pill chips | 2px black borders, no shadows | Montserrat 800 uppercase · Montserrat · Montserrat uppercase | 2 |
| `brutalism` | Brutalism | 0 / 0 | 1px lines, no shadows | IBM Plex Mono · IBM Plex Mono · IBM Plex Mono | 1.25 |
| `neo-brutalism` | Neo-Brutalism | 8 / 12px | 2px borders, hard offset shadows | Space Grotesk · Space Grotesk · Space Grotesk | 2 |
| `editorial` | Editorial | 0 / 0 | rules instead of shadows | Noto Serif Display 900 · Source Serif 4 · Archivo uppercase, tracking 0.12em | 1.25 |
| `minimal-mono` | Minimal Mono | 8 / 14px | greys only, soft shadows | Inter · Inter · Inter | 1.5 |
| `corporate` | Corporate | 4 / 8px | subtle shadows | IBM Plex Sans · IBM Plex Sans · IBM Plex Sans | 1.5 |
| `nordic` | Nordic | 10 / 16px | soft shadows | Manrope 800 · Manrope · Manrope | 1.5 |

A page without `data-ok-style` looks Soft. The font check (inventory § Fonts) found three fonts
without tabular figures (Lexend, Playfair Display, Be Vietnam Pro); the owner replaced them
(2026-11-12): Bauhaus uses Montserrat, Editorial headings Noto Serif Display, Editorial labels
Archivo. The owner's other answers (dividers, selection controls, icons, compass, rounding, Minimal
Mono's hues) are in the inventory, § 7, and follow this ADR as written.
Minimal Mono's "greys only" applies to `primary` and `secondary` (from the neutral scale); status
colors keep their hues, because they carry meaning.

### 2. Attributes (axes)
| Attribute | Values (default first) | Changes |
|---|---|---|
| `data-ok-style` | `soft` · `swiss` · `bauhaus` · `brutalism` · `neo-brutalism` · `editorial` · `minimal-mono` · `corporate` · `nordic` | every style input (§ 4) |
| `data-ok-theme` (exists, ADR-0002) | `light` · `dark` · `system` (and `.dark`) | scheme colors, shadow color |
| `data-ok-density` | `comfortable` · `compact` | control heights and paddings (§ 4.6) |
| `data-ok-surface` | `default` · `contrast` | page background vs paper separation (§ 7) |
| `data-ok-contrast` | `default` · `high` · `system` | text 7:1, graphics 4.5:1, line widths (§ 7) |

- Any element may carry any of them; every axis nests like `data-ok-theme`, and the **nearest**
  scope of each axis wins independently of the others (a dark, compact island inside a light
  Nordic page stays Nordic). The default value is a real value, so a nested scope can reset an
  axis (`data-ok-density="comfortable"` inside a compact page).
- `data-ok-contrast="system"` follows `@media (prefers-contrast: more)`, like `system` for the
  theme. `forced-colors: active` stays the components' own fallbacks (ADR-0006); tokens don't
  emulate it.
- Unknown values behave as the default (no style rules match; the resolver keeps the inherited
  inputs).
- The root font size setting of ADR-0017 § 4 stays (it is not a preset): `applyThemeSettings`
  keeps `fontSize` (12–20px, root `font-size`).
- `applyThemeSettings` / `readThemeSettings` / `normalizeThemeSettings` take
  `{ mode, style, density, surface, contrast, fontSize }`; `preset` and `font` are removed.
  Storybook gets **Style**, **Density**, **Surface** and **Contrast** toolbar menus (ST5) instead
  of **Preset** and **Font**.
- Runtimes that watch theme attributes (Code editor theme, Map, Data grid column measuring)
  watch `data-ok-theme`, `data-ok-style`, `data-ok-contrast`, `data-ok-surface` and
  `data-ok-density` instead of `data-ok-preset` / `data-ok-font`.

### 3. How the axes combine in CSS
A custom property that references another one is resolved where it is declared (AGENTS.md
gotcha), so independent nesting needs one rule:
- **Inputs.** A style scope declares only literal private inputs: `--_ok-<role>` (light, default
  surface, default contrast) and, where a value differs, `--_ok-<role>--dark`, `--hc`,
  `--dark-hc`, `--contrast`… (the generator emits only inputs that differ from the next less
  specific one; the resolver falls back with `var(--_ok-x--dark-hc, var(--_ok-x--dark))`).
  Soft's inputs sit on `:where(:root), [data-ok-style="soft"]`.
- **Switches.** Axis scopes declare only numeric switches: `--_ok-dark` (exists), `--_ok-hc`,
  `--_ok-surface`, `--_ok-compact`, each `0 | 1`.
- **One resolver.** A single block in `tokens.css` declares every public token from the inputs
  and switches on every scope element:
  `:root, [data-ok-style], [data-ok-theme], .dark, [data-ok-density], [data-ok-surface], [data-ok-contrast]`.
  Colors pick a variant with `color-mix(in srgb, A calc(var(--_ok-dark) * 100%), B)` at exactly
  0 % / 100 % (ADR-0017's technique, exact in every baseline engine); RGB channels
  (`--…-channel`, ADR-0013) pick each component with `calc()` (three `calc()` terms are valid
  inside `rgb()`); lengths with `calc(a * (1 - s) + b * s)`; keywords (case, font families,
  border styles) are style inputs only and are never switched.
- Every token defined from another token (typography variant families, shadows, gradients,
  `--ok-c-*` bindings) is declared in the resolver, never only on `:root`.
- Everything stays in `@layer theme`, so unlayered author CSS still overrides any token.
  Component CSS never reads a private input (`--_ok-*` of the theme) directly.
- `tokens.css` is concatenated, not compiled by Tailwind, so `color-mix()` there keeps its alpha
  (ADR-0013 still forbids it in component CSS).

### 4. Token model
Rename freely (§ 5): no aliases. Names below are final; values are Soft's ST3 targets. ST2 first
gives every new token **today's value** at each site (inventory), so the default changes no pixel
before ST3.

1. **Radius.** The scale stays for authors and Tailwind (`--ok-radius-xs`…`-2xl`, `-full`, plus
   `--ok-radius-2xs` 2px). Components use roles only:
   `--ok-radius-control` (10px: buttons, fields, selects, toggles, pagination, tabs),
   `--ok-radius-control-sm` (6px: menu and list items, tree items, checkbox box, calendar cells),
   `--ok-radius-inner` (4px: date sections, table and editor details, focusable text),
   `--ok-radius-surface` (18px: cards, dialogs, transfer lists, walktour steps),
   `--ok-radius-surface-md` (14px: snackbars, sortable lists, carousels, map controls, picker papers),
   `--ok-radius-surface-sm` (10px: popovers, menus, tooltips, upload and lightbox thumbs),
   `--ok-radius-chip` (chips, labels; Bauhaus `9999px`),
   `--ok-radius-full` (circles by meaning: avatars, radios, switch thumbs, badges; a style may
   square them).
2. **Borders and lines.** `--ok-border-width` (1px: dividers, outlined variants, fields),
   `--ok-border-width-strong` (2px: focused fields, selected outlines, indicators),
   `--ok-border-width-heavy` (3px: stepper lines, map location ring);
   `--ok-surface-border-width` (Soft 0; Swiss, Brutalism 1px; Bauhaus, Neo-Brutalism 2px) and
   `--ok-surface-border-color` (Soft `transparent`, line styles the ink color) on every surface
   (Paper, Card, Dialog, Popover, Drawer, Snackbar); `--ok-border-style-rule` for Editorial's
   rules (`solid` top rule, no side borders).
   `--ok-line-width-hairline|2xs|xs|sm|md|lg|xl|2xl` = 0.5 / 0.75 / 1 / 1.5 / 2 / 2.5 / 3 / 4px
   for SVG strokes (Chart, Gantt, rings drawn with shadows).
3. **Focus.** `--ok-focus-ring-width` (2px; at least 3px in high contrast),
   `--ok-focus-ring-offset` (2px), `--ok-focus-ring-inset` (−2px), `--ok-focus-ring-offset-tight`
   (1px), `--ok-focus-ring-color` (text primary today) and `--ok-focus-ring-color-brand`
   (primary main today); both reach 3:1 against the adjacent surface (4.5:1 high contrast).
4. **Shadows.** Names stay (`--ok-shadow-z1`…`z24`, `-card`, `-dropdown`, `-dialog`,
   `-dialog-start`, `--ok-elevation-1…24`, `--ok-shadow-<color>`, `--ok-drop-shadow-*`); each
   style sets them by its treatment: **soft** (two layers, tinted by `--ok-shadow-color`),
   **subtle** (one short layer), **flat** (`none`; the surface border draws the edge),
   **hard** (offset, no blur, ink color: elevation n → `n`-step offsets of 2 / 4 / 6 / 8px).
   Flat styles keep Paper's elevation option working: it maps to the surface border.
5. **Typography.** Families: `--ok-font-family` (text), `--ok-font-family-heading` (replaces
   `--ok-font-family-secondary`, now used by h1–h6), `--ok-font-family-label`, `--ok-font-family-mono`.
   Variant tokens gain `--ok-typography-<variant>-letter-spacing`; heading weight, case and
   tracking are the h1–h6 variant tokens (`-font-weight`, `-text-transform`, `-letter-spacing`).
   The **label role** (Button, Fab, ToggleButton, Chip, Label, Badge, Tab, Pagination, table and
   data grid column headers, the `overline` / `button` variants, picker toolbar overlines) reads
   `--ok-font-family-label`, `--ok-label-text-transform` and `--ok-label-letter-spacing`; label
   weights stay per component through the weight scale (`--ok-font-weight-*`, set per style).
   New sizes from the inventory: `--ok-font-size-2xs` (11px), `--ok-font-size-2xl` (17px),
   `--ok-font-size-3xl` (20px), `--ok-font-size-quote` (24px), `--ok-font-size-code` (0.875em),
   `--ok-typography-quote-mark-size`. Tabular figures: components that align numbers
   (Table numeric cells, Data grid, Pagination, pickers, clocks, CountUp, Countdown, chart axes)
   set `font-variant-numeric: tabular-nums`, which is why every style font must have them (§ 1).
6. **Density.** `--ok-control-height-sm|md|lg|xl` (Button / IconButton / Fab / ToggleButton:
   30 / 36 / 48 / 56px comfortable → 28 / 32 / 40 / 48px compact), `--ok-control-padding-x-sm|md|lg`,
   `--ok-field-padding-y|x` (16 / 14px → 8 / 12px), `--ok-field-padding-y-sm`,
   `--ok-item-height` (menu, list, autocomplete options, tree items: 34 → 28px),
   `--ok-item-padding-y` (8 → 4px), `--ok-chip-height` (32 → 24px), `--ok-tab-height`
   (48 → 40px), `--ok-cell-padding-y|x` (Table 16 / 16 → 6 / 12px), `--ok-row-height`
   (Data grid 52 → 36px; the grid's own `density` option still wins on its root), and
   `--ok-accordion-summary-height` (56 → 48px). Spacing (`--ok-spacing`, 4px) never changes
   with density.
7. **Icons.** `--ok-icon-stroke` (Soft, Nordic, Swiss, Minimal Mono, Corporate 1.5; Editorial,
   Brutalism 1.25; Bauhaus, Neo-Brutalism 2; `max(1.75, style value)` in high contrast).
8. **Chart.** `--ok-chart-series-1`…`-8`: the default categorical colors (today
   `chartDefaultColors`, the reference's palette order), chosen per style by the generator;
   palette names stay valid as explicit series colors.
9. **Motion.** Timings are not part of a style. The literal cycle timings of spinners and
   progress bars become `--ok-duration-spin`, `--ok-duration-progress-*` and
   `--ok-easing-progress-*` tokens (inventory), with today's values.

### 5. Removals (no compatibility layer)
- `data-ok-preset`, `data-ok-font`, `primaryPresets`, `primaryPresetNames`, `PrimaryPreset`,
  `fontFamilyPresets`, `fontFamilyPresetNames`, `FontFamilyPreset`, `primaryPresetVariables`,
  `fontPresetVariables`, `themeToCss({ presets })`, `--_ok-primary-text-light|dark` and the preset
  scopes in `tokens.css`, the Preset and Font toolbar menus, the Settings guide's preset and font
  sections, the website's preset and font controls, their e2e tests and docs (inventory
  § Removals).
- `--ok-font-family-secondary` (renamed `--ok-font-family-heading`; the Tailwind key
  `--font-display` becomes `--font-heading`), ADR-0069's Indigo / Zinc / Be Vietnam Pro defaults (the L4 branch is not
  merged; ST3 cherry-picks only its generator and AA fixes).
- Every hard-coded design value of the inventory, once tokenized; the hand-drawn component icons;
  Lucide in docs examples and in `check-docs-code.mjs`; Iconify Eva, SVG Logos, VSCode Icons and
  the Material / Local icon stories in Storybook. No alias, deprecated name or dead CSS remains.

### 6. Delivery (ADR-0068)
- **Soft** is the default inputs block plus the resolver, in `tokens.css`, so it is in the core
  sheet `owlky.css` / `owlky.min.css` and in `owlky-all.css`. It is not a separate file.
- **The other eight** are opt-in sheets of inputs only (no component rules), in `@layer theme`:
  `@owlky/styles/styles/<id>.css` (listed one by one in the export map, ADR-0068 § 1) and CDN
  `owlky-style-<id>.css` / `.min.css` next to `owlky.css`. Target 2–4 kB gzip each; each gets its
  own budget in `check-size.mjs` from its ST4 measurement. The core sheet stays within ADR-0068's
  budget: ST3 measures the resolver and shrinks it (only differing inputs, short private names)
  rather than raising a budget.
- **Bundlers:** `import "@owlky/styles/owlky.css"` then `import "@owlky/styles/styles/nordic.css"`.
- **CDN:** link the style sheet statically after `owlky.css` (no flash). The loader also gets one
  CSS-only entry per style (`style:<id>`, selector `[data-ok-style="<id>"]`, no JavaScript): a
  style set later by markup or `applyThemeSettings({ style })` loads its sheet, resolved like the
  modules (next to the `owlky.css` link, else the `owlky.js` folder; `data-ok-modules`
  overrides), and a sheet already linked is not added twice.
- `createTheme({ style })` starts from that style's definition; `themeToCss(theme, { selector })`
  emits the inputs for any scope (default `:root`). The Tailwind theme maps the new token
  families to utilities (`rounded-control`, `rounded-surface`, `font-heading`, `font-label`…)
  in ST5.

### 7. Generator and contrast
The generator (`packages/tokens`, from the L4 branch) derives every color role for each style ×
light / dark × surface default / contrast × contrast default / high, from Tailwind v4 hue scales
(11 steps, 50–950) or from a brand color (§ 8). Rules:
- **Targets:** text (body, secondary, palette text tones, `contrastText` on `main` fills, soft
  text on soft fills, links, placeholders) **4.5:1**, **7:1** in high contrast. Non-text — control
  borders (fields, checkbox / radio / switch outlines, outlined buttons), focus rings, selected
  indicators, chart series, progress, slider and rating marks — **3:1**, **4.5:1** in high contrast,
  against every surface they sit on. Decorative dividers have no minimum in default contrast and
  reach 3:1 in high contrast. Disabled parts stay exempt (WCAG), as in ADR-0069 § 7.
- **Steps:** as ADR-0069 § 5 with target T: `main` = first step of 500 → 950 where white reaches T
  (`contrastText` white), otherwise the lightest step where pure black reaches T; text tone light
  = first of 600 → 950 at T on paper, background and the soft fill; dark = first of 400 → 50;
  `lighter` / `light` / `dark` / `darker` keep their relative steps.
- **Surfaces:** `data-ok-surface="contrast"` sets the page background one neutral step away from
  paper (light: neutral 100 behind white paper; dark: 950 behind 900); every role must pass on
  both background and paper.
- **High contrast keeps hues:** when no step reaches T, the generator moves the nearest step's
  OKLCH lightness in 0.01 steps, keeping hue and reducing chroma only to stay in sRGB. It never
  replaces a color with black or white (except `contrastText`, which is white or pure black by
  rule). Line widths rise (focus ring 3px, `--ok-icon-stroke` ≥ 1.75).
- **Per style:** the style's hue choices, neutral scale and shadow treatment are inputs; roles are
  never written by hand. Tests (ST6) assert every role pair of the full matrix (9 × 2 × 2 × 2).

### 8. Brand overrides
- **Build time:** `createTheme({ style, brand: { primary: "#hex", secondary?, neutral? }, fonts:
  { text?, heading?, label?, mono? } })` builds an 11-step scale from each brand color (OKLCH
  lightness ramp, hue and chroma kept) and runs the generator, so every axis stays AA;
  `themeToCss()` writes the inputs.
- **Run time:** `applyThemeSettings({ brand: { primary } })` runs the same generator and writes
  the inputs through CSSOM (strict CSP safe). The generator is a lazy module for the CDN
  (`Owlky.load("theme")`), so pages without brand colors don't download it.
- **Plain CSS:** fonts may be overridden through the public family tokens. Color tokens may be
  overridden too, but they are not re-derived for the other axes; AA is then the author's job
  (the docs say so).

### 9. Icons and flags
- **One set: Solar** (480 Design, CC BY 4.0; credit in `THIRD_PARTY_NOTICES` and the Icons guide).
  Component icons are **Solar Linear**; a filled state glyph uses that icon's **Bold** variant
  (checked checkbox, filled rating star, avatar placeholder, map pin), and an icon without a
  Linear drawing uses **Line Duotone** before an approximate Linear one (inventory § Icons).
- **Generated module:** `scripts/icons.mjs` reads `@iconify-json/solar` (dev dependency) and
  writes `packages/core/src/icons/solar.ts`: one export per icon (tree-shakable), each an SVG
  node tree like the illustrations (no `innerHTML`), with Solar's `stroke-width` removed. Core's
  build runs it; the file is committed and `check:icons` (in `pnpm check`) fails when it is stale.
  React maps the nodes to elements, HTML runtimes build them with `createElementNS`, snippets
  carry the inline SVG. `icons.test.ts` compares every path with the set's `icons.json`.
- **Markup:** `<svg data-ok-icon="<name>" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`;
  `icon.css` (core sheet) sets `stroke-width: var(--ok-icon-stroke)` (CSS beats the presentation
  attribute). `data-ok-icon` joins `parts.ts`.
- **Removed:** Lucide (docs examples, `check-docs-code.mjs`'s list and module declaration), Iconify
  Eva, SVG Logos, VSCode Icons, the Material and Local icon stories, the docs' and stories'
  hand-drawn icon sets (`docs-icons.tsx`, `demo-icons.json`), the hand-drawn component paths.
  Docs examples use Solar: React through `@iconify/react` offline, HTML as inline SVG. Social
  sign-in demos become text buttons; Upload file types use Solar file icons.
- **Flags are not icons:** emoji by default (no bytes). An opt-in image mode (Phone input option,
  spec first, ST3) uses **Circle Flags** (MIT): one SVG per country in a self-hostable folder
  (`@owlky/html/dist/flags/`, `flagsPath` / `data-ok-flags-path`), loaded lazily as decorative
  `<img alt="">` (the country name is text), because Windows shows flag emoji as two letters.

### 10. Out of scope
Nav color (integrate / apparent) and dashboard shells go to the Blocks backlog. No bundled fonts:
the docs give each style's font links. The removed style ideas (Terminal, Retro 70s, Luxury,
Earthy, Playful, Ocean) stay out.

### 11. Visual baselines
Generated by a CI `workflow_dispatch` job (ST6, `visual-baselines.yml`) in the same Playwright
container image as the visual spec, one matrix entry per style; it uploads the snapshots as an
artifact and pushes them to a review branch. Local Docker stays possible but is no longer the
owner's manual step.

## Consequences
- Components keep their markup and API; a style only sets tokens. ST2 changes no default pixel;
  ST3 (Soft's own values) changes every baseline once.
- The resolver makes nested scopes of five axes exact, at the cost of one larger rule in
  `tokens.css` and computed colors that serialize as `color(srgb …)` in some engines (tests match
  the stable part, as today).
- About 80 Solar icons replace about 135 hand-drawn path strings; Solar's longer paths cost
  bytes, which ST2 measures against ADR-0068's budgets.
- `chartDefaultColors` and the theme settings API change shape (minor changeset before 0.1.0).
- After 0.1.0, a new style or token is a minor change; a changed default, a removed token or a
  renamed style is a major one.
