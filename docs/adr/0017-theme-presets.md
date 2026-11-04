# ADR-0017: Theme presets through data attributes

**Status:** Accepted (2026-11-05) — extends ADR-0002's theming (light / dark / system / nested scopes)

## Context
The reference's Settings drawer lets users pick a primary color preset (6), a font family (4) and
the root font size (12–20px). The owner wants the same settings in Owlky, applied once for every
component. Mode already exists (`data-ok-theme`); contrast and right-to-left are backlog items; the
drawer's layout settings (compact, nav) need layout components the library doesn't have.

## Decision
1. **Data in `@owlky/tokens`:** `primaryPresets` (default, cyan, purple, blue, orange, red — values
   from the reference, contrast text as the reference: white, dark on orange), `fontFamilyPresets`
   (`public-sans`, `inter`, `dm-sans`, `nunito-sans` — stacks only, fonts are not bundled) and
   `fontSizeRange` (12–20, default 16).
2. **CSS scopes in the main bundle** (`tokens.css`, opt-out with `themeToCss(…, { presets: false })`):
   `[data-ok-preset="<name>"]` redeclares the primary shades, channels and shadow;
   `[data-ok-font="<name>"]` redeclares `--ok-font-family` and the variant families that use it.
   Any element can carry them and scopes nest, like `data-ok-theme`.
3. **Scheme-aware primary text:** the text tone depends on the preset *and* the scheme, and both
   nest. Private variables carry the preset's two tones (`--_ok-primary-text-light|dark`) and the
   scheme (`--_ok-dark: 0|1`); a scheme scope picks `var(--_ok-primary-text-<scheme>)`, a preset
   scope picks with `color-mix(… calc(var(--_ok-dark) * 100%) …)`. The nearest scope wins in both
   directions. Each tone is the first of `dark`/`darker` (light) or `light`/`lighter` (dark) that
   meets AA on the surfaces and the 16 % tint (`paletteTextFor`).
4. **Font size** is the root `font-size` (every size is in rem): page-wide only, not scoped.
5. **Helper in `@owlky/core`** (re-exported by react and html): `applyThemeSettings`,
   `readThemeSettings`, `resetThemeSettings`, `normalizeThemeSettings`. Values are validated
   (unknown → default); the font size is set through CSSOM; nothing is stored unless the app passes
   a storage (`{ storage: localStorage }`, errors swallowed). No new global: the CDN `Owlky` global
   is the shared runtime (ADR-0007), so CDN pages set the attributes or import the ESM helper.

## Consequences
- One attribute changes every component; components need no change (they only use tokens).
- `--ok-palette-primary-text` is no longer a literal in the scheme blocks (a `var()`), and two
  private variables join the theme plumbing (`--_ok-*`, allowed by the naming convention).
- Custom themes (`createTheme`) keep working: their own primary is the default scope; presets
  replace only the primary palette.
- Backlog: contrast setting, right-to-left (logical-property audit), a settings drawer component.
