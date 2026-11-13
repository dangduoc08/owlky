# @owlky/tokens

Design tokens for [Owlky](../../README.md) as typed TypeScript, CSS variables
(`tokens.css`, also inside `@owlky/styles`) and JSON (`tokens.json`), plus the role generator that
derives every color of a design style at WCAG AA.

```ts
import { createTheme, themeToCss } from "@owlky/tokens";

// Soft (the default style) with your brand color: every role of every axis is derived at AA.
const css = themeToCss(createTheme({ style: "soft", brand: { primary: "#0E7490" } }));
```

## Styles and axes

A page without attributes looks **Soft**: Tailwind's indigo primary and zinc neutrals, Nunito,
rounded shapes and soft two-layer shadows. Owlky doesn't bundle fonts: load Nunito (weights 400
to 800) from Google Fonts or Fontsource.

Five attributes change the tokens on any element, and each one nests on its own:

| Attribute | Values (default first) | Changes |
|---|---|---|
| `data-ok-style` | `soft` | every style token |
| `data-ok-theme` (or `.dark`) | `light` · `dark` · `system` | scheme colors |
| `data-ok-density` | `comfortable` · `compact` | control heights and paddings |
| `data-ok-surface` | `default` · `contrast` | the page background behind paper |
| `data-ok-contrast` | `default` · `high` · `system` | text 7:1, graphics 4.5:1, wider focus rings and icon strokes |

## CSS variables

| Group | Variables | Notes |
|---|---|---|
| Palette | `--ok-palette-<color>-lighter\|light\|main\|dark\|darker\|contrast-text\|text`, `--ok-palette-grey-50…950`, `--ok-palette-common-white\|black` | `-text` is the AA text tone of the scheme; colored text uses it |
| Scheme | `--ok-text-primary\|secondary\|disabled`, `--ok-bg-default\|paper\|neutral`, `--ok-divider`, `--ok-control-border-color`, `--ok-surface-border-color`, `--ok-action-*`, `--ok-backdrop`, `--ok-inherit-*` | Follow the nearest theme, surface and contrast scopes |
| Typography | `--ok-font-family(-heading\|-label\|-mono)`, `--ok-label-text-transform\|letter-spacing`, `--ok-heading-text-transform\|letter-spacing`, `--ok-font-weight-*`, `--ok-typography-<variant>-font-family\|font-size\|font-weight\|line-height`, `--ok-typography-overline\|button-text-transform\|letter-spacing`, `--ok-typography-quote-mark-size` | h1–h6 sizes grow at 600 / 900 / 1200px and use the heading family; buttons, chips, tabs and the `overline` / `button` variants use the label family |
| Channels | `--ok-palette-<color>-main-channel`, `--ok-palette-grey-500…900-channel`, `--ok-palette-common-white\|black-channel`, `--ok-bg-paper-channel` | For `rgb(var(…) / 0.16)` (ADR-0013) |
| Font sizes | `--ok-font-size-2xs\|xs\|sm\|md\|lg\|xl\|2xl\|3xl\|quote\|code` | 11 / 12 / 13 / 14 / 15 / 16 / 17 / 20 / 24px; `code` is 0.875em |
| Component color | `[data-ok-color="primary…error\|black\|white"]` → `--ok-c-main\|channel\|lighter\|light\|hover\|darker\|contrast\|text\|shadow` | Non-inheriting bindings; tints for palette colors only |
| Shadows | `--ok-elevation-1…24`, `--ok-shadow-z1\|z4\|…\|z24\|card\|dropdown\|dialog\|dialog-start`, `--ok-shadow-<color>`, `--ok-drop-shadow-z1\|z4\|z8` (`filter` values) | Tinted with the scope's `--ok-shadow-color` |
| Gradients | `--ok-gradient-<color>` (fill: `light` → `main`), `--ok-gradient-<color>-text` (text tone → `darker` / `lighter` per theme, AA at every stop), `--ok-gradient-paper` | `background-image` values |
| Radius | `--ok-radius-2xs\|xs\|sm\|md\|lg\|xl\|2xl\|full` (scale), `--ok-radius-control\|control-sm\|inner\|surface\|surface-md\|surface-sm\|chip` (roles) | Components read the roles |
| Lines and focus | `--ok-border-width(-strong\|-heavy)`, `--ok-surface-border-width\|style`, `--ok-line-width-*`, `--ok-focus-ring-width\|offset\|inset\|offset-tight\|color\|color-brand`, `--ok-icon-stroke` | Focus rings 3px and icon strokes at least 1.75 in high contrast |
| Density | `--ok-control-height-xs\|sm\|md\|lg\|xl`, `--ok-fab-height-sm`, `--ok-toggle-group-height-*`, `--ok-pagination-size-*`, `--ok-control-padding-x-*`, `--ok-field-padding-*`, `--ok-item-*`, `--ok-chip-height(-sm)`, `--ok-tab-height`, `--ok-cell-padding-*`, `--ok-row-height(-header)`, `--ok-accordion-summary-height`, `--ok-switch-padding-*` | Comfortable and compact values |
| Layout | `--ok-spacing` (4px, never changes with density), `--ok-breakpoint-*`, `--ok-z-*` | |
| Motion | `--ok-duration-*`, `--ok-easing-*` | |

Fonts: override the family tokens (`--ok-font-family`, `--ok-font-family-heading`,
`--ok-font-family-label`) or pass `fonts` to `createTheme()`. Colors: a color token overridden in
your CSS isn't derived again for the other axes, and a nested axis scope recomputes it; to brand
every axis at AA, use `createTheme({ brand })` at build time or `applyThemeBrand()` from
`@owlky/core/theme-brand` at run time. Font size: the root `font-size` (12–20px), every size is in
rem.

## API

| Export | Purpose |
|---|---|
| `defaultTheme`, `createTheme({ style, brand, fonts, …overrides })` | The default (Soft) theme; a style's theme with brand colors and fonts, then a deep merge of other keys (arrays replaced) |
| `styleTheme(style, { brand, fonts })`, `styles`, `styleNames`, `soft`, `StyleDefinition` | Styles as data |
| `colorRoles`, `neutralRoles`, `graphicTone`, `shiftToContrast`, `brandScale`, `CONTRAST_TARGETS`, `tailwindPalette` | The AA generator and its inputs |
| `themeToCss(theme, { selector, reset, colorBindings })`, `themeToCssVariables(theme)`, `themeColorVariables(theme)`, `responsiveTypographyVariables(theme)` | Serialize a theme (the core sheet, or a style scope) to CSS / variable maps |
| `fontSizeRange` | The root font size setting (12–20px) |
| `hexToRgb`, `hexToOklch`, `oklchToHex`, `relativeLuminance`, `contrastRatio`, `getContrastText(background, candidates?)` | Color math |
| `componentColorNames`, `paletteColorNames`, `greyShades`, `typographyVariants`, `shadowNames`, `dropShadowNames`, `radiusNames`, `radiusRoleNames`, `lineWidthNames`, `densityNames`, `fontSizeNames`, `breakpointNames` | Name lists (and their types) |

## Contrast

Every color role comes from the generator, never by hand. Text (body, secondary, the `-text`
tones, `contrast-text` on `main` fills, soft text on soft fills) reaches a contrast ratio of at
least 4.5:1, and 7:1 with `data-ok-contrast="high"`. Control borders, focus rings and chart
colors reach 3:1, and 4.5:1 in high contrast. High contrast keeps each hue and moves only its
OKLCH lightness. The tests check every pair in light and dark mode, on both surfaces and at both
contrast levels.
