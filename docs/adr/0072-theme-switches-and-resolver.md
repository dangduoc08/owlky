# ADR-0072: Theme switches, the resolver and the token trims of ST3

**Status:** Accepted (ST3 of `docs/roadmap-styles.md`, 2026-11-13). Supersedes ADR-0070 § 3 (how
the axes combine in CSS) where it says `color-mix()` and numeric switches, and amends ADR-0070
§ 4 (token model) and § 6 (delivery) as listed below. Everything else in ADR-0070 stands.

## Context
ADR-0070 § 3 picks a color variant with `color-mix(in srgb, A calc(var(--_ok-dark) * 100%), B)`
and lengths with `calc()`. Two problems showed up while building ST3:
- **Serialization.** A `color-mix()` result computes as `color(srgb …)`. Every computed color of
  every component would change form, so about 50 test files that compare `rgb(…)` strings, axe
  and Monaco's theme reader would all read a different format, for no visual reason.
- **Size.** The core sheet and `owlky-all.min.css` were at their budgets (S4: 29.6 of 30.9 kB and
  63.5 of 63.5 kB gzip). The first ST3 build added 2.75 kB gzip to both. Budgets are never raised
  (roadmap-size.md), so the design had to fit.

## Decision
1. **Space toggles, not color math.** Each axis value is a pair of private toggles, one
   `initial` (active), the other a single space (inactive): `--_ok-d1` / `--_ok-d0` (dark /
   light), `--_ok-h1` / `--_ok-h0` (high / default contrast), `--_ok-s1` / `--_ok-s0` (contrast /
   default surface). `var(--_ok-d1, A) var(--_ok-d0, B)` substitutes exactly A or B, so computed
   colors keep their `rgb()` form in every engine (tested in Chromium, Firefox and WebKit).
   `--_ok-dark: 0 | 1` stays for code that reads the scheme (Code editor theme). A scope of any
   contrast, surface or density value starts from the default (`[data-ok-contrast]`), so unknown
   values behave as the default; `high`, `contrast`, `compact` and the `system` preference
   switch on.
2. **One resolver with literal fallbacks.** The resolver (on `SCOPE_SELECTOR`) declares each
   axis token as toggles over its variants; each variant is `var(<input>, <literal>)`, where the
   literal is the core theme's (Soft's) value. The core sheet therefore declares **no inputs**:
   Soft is the fallbacks. Inputs are `--_ok-t<key>-<variant>` (`l`, `d`, `h`, `dh`, `s`, `ds`;
   `key` = the token's index in `variantTokens()`, base 36), short because each name appears
   once in the core sheet. `themeToCss(theme, { selector, reset })` writes an opt-in style sheet:
   the style's literal tokens and every input, plus `:where([data-ok-style]:not(<reset>))`
   resetting its inputs to `initial`, so another style nested inside it (Soft included) falls back
   to its own values. `themeColorVariables(theme)` returns the same inputs for CSSOM
   (`applyThemeBrand()`).
3. **Which axis changes which token.** Palette `main`, `dark`, `contrast-text` and `main-channel`:
   high contrast. Text tones, text primary / secondary, divider, control border: dark × high
   contrast. Paper, `neutral`, `inherit-*`, text disabled, backdrop, shadow color, surface border
   color: dark. Page background: dark × surface. Focus ring width, icon stroke: high contrast.
   Palette `lighter` / `light` / `darker`, greys, action states (translucent neutral 500 in both
   schemes), radius, fonts, weights, label and heading case: style literals. Density: literal
   sizes on `[data-ok-density]` scopes (no other axis changes them).
4. **Shadows are formulas.** Shadow tokens are declared in the resolver over
   `var(--ok-shadow-color)` (one private `--_ok-sc<alpha>` per alpha) and colored shadows over
   the scope's `main`; their geometry is the core style's. **ST4 hook:** a style with another
   geometry (flat, hard) needs per-layer geometry inputs in the resolver or its own shadow block;
   ST4 decides, measured against the budgets. Decided in ADR-0073: geometry per treatment, a
   shared shadow switch in the opt-in sheets that need it, elevations as aliases.
5. **Token trims (pre-release, no aliases).**
   - Channels exist only for colors components tint: each palette color's `main`, greys 500–900,
     black, white and paper. `-lighter-channel`, `-light-channel`, `-dark-channel`,
     `-darker-channel`, `-contrast-text-channel` and the other grey channels are removed.
     Button group separators use the button's `main` channel.
   - Heading case and tracking are two tokens, `--ok-heading-text-transform` and
     `--ok-heading-letter-spacing` (all of h1–h6); subtitle, body and caption have none (always
     `none` / `normal`); overline and button keep theirs (label role).
   - `--ok-chart-series-1…8` stay generator data (`ColorScheme.chart`, AA-tested) but are not in
     the sheet until the Chart reads them (ST4 / ST5 with the chart defaults).
   - Color bindings gain `--ok-c-lighter`, `--ok-c-light` and `--ok-c-darker` (palette colors
     only), so Illustration, Label, Alert, Chart, Gantt, Rating, Slider, Timeline and Pagination
     read their color from the `[data-ok-color]` binding instead of one rule per color.
6. **New tokens.** `--ok-control-border-color` (field boundaries, 3:1 / 4.5:1, WCAG 1.4.11),
   `--ok-surface-border-color` and `--ok-surface-border-width` (Paper: transparent and 0 in Soft),
   `--ok-palette-grey-950`, density tokens for the six sizes ST2 left on spacing
   (`--ok-control-height-xs`, `--ok-fab-height-sm`, `--ok-toggle-group-height-sm|md|lg`,
   `--ok-pagination-size-sm|md|lg`, `--ok-item-height-dense`).
7. **Minified tokens.** `owlky.min.css` drops the space after commas in token values (outside
   strings) and shortens hex colors; an empty toggle keeps its single space.

## Consequences
- Nested scopes of all five axes are exact and keep `rgb()` serialization; `theme-settings.test.ts`
  checks every nesting order and a nested opt-in style with its reset.
- Core CSS 29.70 kB and All CSS 63.45 kB gzip after ST3 (budgets 30.9 / 63.5 kB).
- Authors who override a color token on `:root` override it for the root only: nested axis
  scopes recompute it from the style. To brand every axis, use `createTheme({ brand })` or
  `applyThemeBrand()` (`@owlky/core/theme-brand`), which derive all variants at AA.
- Input names are generated and private: never write them by hand.
