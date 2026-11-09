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
| Typography | `--ok-font-family(-secondary\|-mono)`, `--ok-font-weight-*`, `--ok-typography-<variant>-font-family\|font-size\|font-weight\|line-height\|text-transform` | h1–h6 sizes grow at 600 / 900 / 1200px; h1–h3 use the display font |
| Channels | `--ok-palette-<color>-<shade>-channel`, `--ok-palette-grey-<n>-channel`, `--ok-palette-common-white\|black-channel` | e.g. `0 167 111`, for `rgb(var(…) / 0.16)` (ADR-0013) |
| Font sizes | `--ok-font-size-xs\|sm\|md\|lg\|xl` | 12 / 13 / 14 / 15 / 16px |
| Component color | `[data-ok-color="primary…error\|black\|white"]` → `--ok-c-main\|channel\|hover\|contrast\|text\|shadow` | non-inheriting bindings |
| Shadows | `--ok-elevation-1…24`, `--ok-shadow-z1\|z4\|…\|z24\|card\|dropdown\|dialog\|dialog-start`, `--ok-shadow-<color>`, `--ok-drop-shadow-z1\|z4\|z8` (`filter` values) | Tinted with `--ok-shadow-color` per theme |
| Shape & layout | `--ok-radius-*`, `--ok-spacing` (4px), `--ok-breakpoint-*`, `--ok-z-*` | |
| Motion | `--ok-duration-*`, `--ok-easing-*` | |

Themes: `data-ok-theme="light|dark|system"` (or `.dark`) on any element.

Presets (ADR-0017), on any element, nesting with themes: `data-ok-preset="cyan|purple|blue|orange|red"`
(primary palette; `default` resets) and `data-ok-font="inter|dm-sans|nunito-sans"` (`public-sans`
resets; load the fonts yourself). Font size: the root `font-size` (12–20px), every size is in rem.

## API

| Export | Purpose |
|---|---|
| `defaultTheme`, `createTheme(overrides)` | The default theme; deep-merge a partial theme (arrays replaced) |
| `primaryPresets`, `primaryPresetNames`, `fontFamilyPresets`, `fontFamilyPresetNames`, `fontSizeRange`, `paletteTextFor(color, scheme, dark)` | Theme settings data (ADR-0017) and the AA text-tone chooser |
| `themeToCss(theme, { colorBindings, presets })`, `primaryPresetVariables`, `fontPresetVariables`, `themeToCssVariables(theme)`, `responsiveTypographyVariables(theme)` | Serialize a theme to CSS / variable maps |
| `hexToRgb`, `relativeLuminance`, `contrastRatio`, `getContrastText(background, candidates?)` | WCAG 2.2 color math for theme authors |
| `componentColorNames`, `paletteColorNames`, `greyShades`, `typographyVariants`, `shadowNames`, `dropShadowNames`, `radiusNames`, `breakpointNames` | Name lists (and their types) |

Default colors are verified for WCAG 2.2 AA contrast in light and dark mode.

## Contrast

Brand colors follow the Minimal reference (ADR-0014): white text on `main` fills (dark on
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
