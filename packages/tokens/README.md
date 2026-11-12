# @owlky/tokens

Design tokens for [Owlky](../../README.md) as typed TypeScript, CSS variables
(`tokens.css`, also inside `@owlky/styles`) and JSON (`tokens.json`).

```ts
import { createTheme, themeToCss } from "@owlky/tokens";

const css = themeToCss(
  createTheme({
    palette: { primary: { main: "#2065D1", dark: "#103996", contrastText: "#FFFFFF" } },
  }),
);
```

## CSS variables

| Group | Variables | Notes |
|---|---|---|
| Palette | `--ok-palette-<color>-lighter\|light\|main\|dark\|darker\|contrast-text\|text`, `--ok-palette-grey-50…900`, `--ok-palette-common-white\|black` | `-text` is the AA-safe text tone per theme |
| Scheme | `--ok-text-primary\|secondary\|disabled`, `--ok-bg-default\|paper\|neutral`, `--ok-divider`, `--ok-action-*`, `--ok-backdrop`, `--ok-inherit-*` | Re-declared for dark mode |
| Typography | `--ok-font-family(-heading\|-label\|-mono)`, `--ok-label-text-transform\|letter-spacing`, `--ok-font-weight-*`, `--ok-typography-<variant>-font-family\|font-size\|font-weight\|line-height\|text-transform\|letter-spacing`, `--ok-typography-quote-mark-size` | h1–h6 sizes grow at 600 / 900 / 1200px; h1–h3 use the heading family; buttons, chips, tabs and the `overline` / `button` variants use the label family |
| Channels | `--ok-palette-<color>-<shade>-channel`, `--ok-palette-grey-<n>-channel`, `--ok-palette-common-white\|black-channel` | e.g. `0 167 111`, for `rgb(var(…) / 0.16)` (ADR-0013) |
| Font sizes | `--ok-font-size-2xs\|xs\|sm\|md\|lg\|xl\|2xl\|3xl\|quote\|code` | 11 / 12 / 13 / 14 / 15 / 16 / 17 / 20 / 24px; `code` is 0.875em |
| Component color | `[data-ok-color="primary…error\|black\|white"]` → `--ok-c-main\|channel\|hover\|contrast\|text\|shadow` | non-inheriting bindings |
| Shadows | `--ok-elevation-1…24`, `--ok-shadow-z1\|z4\|…\|z24\|card\|dropdown\|dialog\|dialog-start`, `--ok-shadow-<color>`, `--ok-drop-shadow-z1\|z4\|z8` (`filter` values) | Tinted with `--ok-shadow-color` per theme |
| Gradients | `--ok-gradient-<color>` (fill: `light` → `main`), `--ok-gradient-<color>-text` (text tone → `darker` / `lighter` per theme, AA at every stop), `--ok-gradient-paper` (translucent paper with info / error glows) | `background-image` values; follow the palette and themes |
| Radius | `--ok-radius-2xs\|xs\|sm\|md\|lg\|xl\|2xl\|full` (scale), `--ok-radius-control\|control-sm\|inner\|surface\|surface-md\|surface-sm\|chip` (roles) | Components read the roles |
| Lines and focus | `--ok-border-width(-strong\|-heavy)`, `--ok-line-width-hairline\|2xs\|xs\|sm\|md\|lg\|xl\|2xl`, `--ok-focus-ring-width\|offset\|inset\|offset-tight\|color\|color-brand`, `--ok-icon-stroke` | 1 / 2 / 3px borders; SVG strokes 0.5–4px; icon stroke in user units |
| Density | `--ok-control-height-sm\|md\|lg\|xl`, `--ok-control-padding-x-*`, `--ok-field-padding-*`, `--ok-item-*`, `--ok-chip-height(-sm)`, `--ok-tab-height`, `--ok-cell-padding-*`, `--ok-row-height(-header)`, `--ok-accordion-summary-height`, `--ok-switch-padding-*` | Control sizes |
| Layout | `--ok-spacing` (4px), `--ok-breakpoint-*`, `--ok-z-*` | |
| Motion | `--ok-duration-*` (transitions, entrances, loader cycles such as `--ok-duration-spin`), `--ok-easing-*` | |

Themes: `data-ok-theme="light|dark|system"` (or `.dark`) on any element.

Brand color and fonts: override the public tokens (`--ok-palette-primary-*`, `--ok-font-family`,
`--ok-font-family-heading`) in your own CSS, or build a theme with `createTheme()`. Font size: the
root `font-size` (12–20px), every size is in rem.

## API

| Export | Purpose |
|---|---|
| `defaultTheme`, `createTheme(overrides)` | The default theme; deep-merge a partial theme (arrays replaced) |
| `fontSizeRange` | The root font size setting (12–20px) |
| `themeToCss(theme, { colorBindings })`, `themeToCssVariables(theme)`, `responsiveTypographyVariables(theme)` | Serialize a theme to CSS / variable maps |
| `hexToRgb`, `relativeLuminance`, `contrastRatio`, `getContrastText(background, candidates?)` | WCAG 2.2 color math for theme authors |
| `componentColorNames`, `paletteColorNames`, `greyShades`, `typographyVariants`, `shadowNames`, `dropShadowNames`, `radiusNames`, `radiusRoleNames`, `lineWidthNames`, `densityNames`, `fontSizeNames`, `breakpointNames` | Name lists (and their types) |

Default colors are verified for WCAG 2.2 AA contrast in light and dark mode.

## Contrast

Brand colors use white text on `main` fills (dark text on
warning) and `main`-colored text for outlined / text variants. Neutral text and soft-variant text
(`-text` tones) meet WCAG 2.2 AA, which the tests enforce.

For strict AA everywhere, override the brand values (plain CSS, no rebuild):

```css
:root {
  /* dark text on fills */
  --ok-palette-primary-contrast-text: #141a21;
  --ok-palette-info-contrast-text: #141a21;
  --ok-palette-success-contrast-text: #141a21;
  --ok-palette-error-contrast-text: #141a21;
}
```

and give outlined / text buttons the AA `-text` tone in your own CSS:
`[data-ok-button]:not([data-ok-variant="contained"]) { color: var(--ok-c-text, inherit); }`.
