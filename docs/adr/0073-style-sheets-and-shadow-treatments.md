# ADR-0073: Opt-in style sheets and shadow treatments

**Status:** Accepted (ST4a of `docs/roadmap-styles.md`, 2026-11-13). Decides the shadow hook that
ADR-0072 § 4 left to ST4, amends ADR-0070 § 4.4 (what `soft` / `subtle` share) and § 6 (the
export map lists style sheets with one pattern), and fixes the layout of style definitions.

## Context
ST4 ships the eight non-default styles as opt-in sheets of tokens. Most of a style is literals
and resolver inputs, which inherit from the style scope (ADR-0072). Shadows are not: they are
formulas over `--ok-shadow-color`, which the axis scopes change, so they are declared on every
scope element, and their geometry was Soft's. A flat style (Swiss, Bauhaus, Brutalism,
Editorial) needs `none`, a hard one (Neo-Brutalism) offsets without blur. A geometry input on
the style scope can't hold the color (a `var()` resolves where it is declared), and per-layer
geometry inputs in the resolver would cost the core sheet bytes it doesn't have (All CSS was at
63.45 of 63.5 kB gzip).

## Decision
1. **A treatment owns its geometry.** `soft` (Soft's two layers), `subtle` (one short layer),
   `flat` (`none`) and `hard` (2 / 4 / 6 / 8px offsets, no blur) are fixed tables in
   `packages/tokens/src/shadows.ts`. Styles of one treatment differ by their tint
   (`shadowTint`, the light scheme's `--ok-shadow-color`), never by geometry. `hard` shadows,
   colored ones included, use the ink color (the scheme's text primary) in both schemes.
   `StyleDefinition.shadowLayers` is removed; `Theme.shadowTreatment` is new.
2. **Elevations alias the named shadows.** `--ok-elevation-<n>` is `var(--ok-shadow-<z>)` with
   the nearest z (1 → z1, 2–4 → z4, 5–8 → z8 … 21–24 → z24) instead of 24 three-layer Material
   shadows. Paper's 25 levels follow every treatment for free, and both CSS bundles lose about
   0.3 kB gzip (core 29.41 kB, all 63.17 kB). Soft's elevated Papers change look once (ST6
   regenerates every baseline anyway). `Theme.elevation` is a list of shadow names.
3. **A shadow switch in the sheets that need it.** A sheet whose style's treatment isn't `soft`
   adds, in `@layer theme`:
   - on its style scope, four space toggles (`--_ok-ws`, `-wu`, `-wf`, `-wh`, ADR-0072's
     technique): `initial` for its treatment, a space for the others;
   - on `:where(:root)` and in its reset block (`:where([data-ok-style]:not(<own>))`), the soft
     toggle on and the others off;
   - on `SCOPE_SELECTOR` and its own selector, every shadow token (named, drop shadows, colored)
     as `var(--_ok-ws, <soft>) var(--_ok-wu, <subtle>) var(--_ok-wf, none) var(--_ok-wh, <hard>)`.
   The switch is generated from the four treatments, not from the sheet's style, so every sheet
   that carries it writes the same block: two such sheets never undo each other in either order.
   It wins over the core resolver by source order (same specificity), which is why a style sheet
   loads after `owlky.css`. The nearest style scope's toggles pick the branch; the axis scopes
   recompute the colors, so nesting stays exact for all five axes. The core sheet carries no
   toggle and no switch; `soft` styles' sheets (Minimal Mono, Nordic) carry none either.
4. **Delivery.** `@owlky/tokens` writes `dist/sheets/<id>.css` for every style but the default
   (`themeToCss(styleTheme(style), { selector, reset })`, both `[data-ok-style="<id>"]`).
   `@owlky/styles` copies each to `dist/styles/<id>.css` and minifies it to `<id>.min.css`, and
   fills `families.json`'s `styles` (`id → styles/<id>.css`) at build time; its source keeps the
   key empty. `@owlky/html` copies them as `owlky-style-<id>(.min).css` next to `owlky.css`. The
   export map has one pattern, `"./styles/*": "./dist/styles/*"`, like `./components/*`:
   ADR-0068 § 1's explicit lists are for JavaScript entries (types, internal folders), and the
   folder holds only style sheets. `check-size.mjs` has a budget per sheet (measured + 5 %) and
   fails on a built sheet without one.
5. **Definitions are one file per style** in `packages/tokens/src/styles/<id>.ts`, typed by
   `StyleDefinition` (`style-definition.ts`). `styles.ts` lists them: `styleNames` stays a
   literal tuple, so code that only needs the names (theme settings in `owlky.js`) doesn't
   bundle the definitions. New optional inputs: `fontWeight` (the weight scale, for fonts with
   another range) and `borderWidth` (`--ok-border-width`, `-strong`, `-heavy`).
6. **Storybook** gets a `style` global (URL `&globals=style:<id>`) and a `style` story parameter
   (which wins), applied with `applyThemeSettings({ style })`; `preview.tsx` imports every built
   sheet with one `import.meta.glob`. The toolbar menus stay ST5.
7. **Not in ST4a:** the CDN loader's `style:<id>` entries (ADR-0070 § 6: a style set later by
   markup loads its sheet) move to ST5 with the HTML runtime work; until then a page links the
   sheet. Editorial's top rules need Paper to draw per-side borders (`border-style` longhand),
   which is a component change for its own step.
8. **Ink colors** (ST4b, 2026-11-13). A monochrome style can't take its primary from the role
   generator: the first zinc step that carries white text is 500, a mid grey lighter than the
   Inherit fill. `StyleDefinition.ink` (Minimal Mono: `["primary"]`) lists palette colors drawn
   in the ink instead: `inkRoles` (`roles.ts`) gives `main` 900 / 950 with white text and hover
   700 in light, `main` 100 / 50 with 900 / 950 text and hover 300 in dark, each shifted until
   its text reaches the level's target; the text tone is the scheme's `main`. A brand color for
   that role replaces the ink. Fills are otherwise the same in both schemes (the core resolver
   reads them on the contrast axis only), so an ink color's `main`, `main-channel`, `dark` and
   `contrast-text` get `-d` / `-dh` inputs (`Theme.darkPalette`, `highContrast.darkPalette`) and
   the sheet adds an **ink switch** on `SCOPE_SELECTOR` and its own selector, like the shadow
   switch: each of those tokens as the light / dark × contrast formula, a dark input falling back
   to the light one and then to the core sheet's value (`themeToCss(…, { base: defaultTheme })`,
   required for such a theme). Other styles' scopes have no dark inputs (the reset block clears
   them), so they resolve exactly as the core resolver does. The core sheet and every other
   sheet are byte-identical; Minimal Mono's sheet grows by about 0.25 kB gzip (budget 2.43 kB).

## Consequences
- Adding a style is a definition file, its lines in `styles.ts`, a row in
  `packages/tokens/src/styles.test.ts` (`EXPECTED`), a size budget and, for Storybook, its
  Fontsource package and import. Color roles are tested for every listed style by
  `roles.test.ts`; nesting of treatments by `core/src/theme/theme-settings.test.ts`.
- Swiss and Neo-Brutalism sheets are about 2.6 kB gzip each (the shadow switch is about 0.25 kB).
- Shadows of a `soft` style other than Soft can only change through their tint. A style that
  needs other geometry adds a treatment to `shadows.ts`, which changes the switch in every sheet
  that carries it (they are rebuilt together).
- Authors who read `--ok-elevation-<n>` get a `var()` reference to a named shadow; computed
  values are the same layers.
