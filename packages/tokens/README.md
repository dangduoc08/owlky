# @minimal-tailwind/tokens

Design tokens for [Minimal Tailwind](../../README.md) as typed TypeScript, CSS variables
(`tokens.css`, also inside `@minimal-tailwind/styles`) and JSON (`tokens.json`).

```ts
import { createTheme, themeToCss } from "@minimal-tailwind/tokens";

const css = themeToCss(
  createTheme({
    palette: { primary: { main: "#2065D1", dark: "#103996", contrastText: "#FFFFFF" } },
  }),
);
```

## CSS variables

| Group | Variables | Notes |
|---|---|---|
| Palette | `--mt-palette-<color>-lighter\|light\|main\|dark\|darker\|contrast-text\|text`, `--mt-palette-grey-50…900`, `--mt-palette-common-white\|black` | `-text` is the AA-safe text tone per theme |
| Scheme | `--mt-text-primary\|secondary\|disabled`, `--mt-bg-default\|paper\|neutral`, `--mt-divider`, `--mt-action-*`, `--mt-backdrop`, `--mt-inherit-*` | Re-declared for dark mode |
| Typography | `--mt-font-family(-secondary\|-mono)`, `--mt-font-weight-*`, `--mt-typography-<variant>-font-family\|font-size\|font-weight\|line-height\|text-transform` | h1–h6 sizes grow at 600 / 900 / 1200px; h1–h3 use the display font |
| Channels | `--mt-palette-<color>-<shade>-channel`, `--mt-palette-grey-<n>-channel`, `--mt-palette-common-white\|black-channel` | e.g. `0 167 111`, for `rgb(var(…) / 0.16)` (ADR-0013) |
| Font sizes | `--mt-font-size-xs\|sm\|md\|lg\|xl` | 12 / 13 / 14 / 15 / 16px |
| Component color | `[data-mt-color="primary…error\|black\|white"]` → `--mt-c-main\|channel\|hover\|contrast\|text\|shadow` | non-inheriting bindings |
| Shadows | `--mt-elevation-1…24`, `--mt-shadow-z1\|z4\|…\|z24\|card\|dropdown\|dialog`, `--mt-shadow-<color>` | Tinted with `--mt-shadow-color` per theme |
| Shape & layout | `--mt-radius-*`, `--mt-spacing` (4px), `--mt-breakpoint-*`, `--mt-z-*` | |
| Motion | `--mt-duration-*`, `--mt-easing-*` | |

Themes: `data-mt-theme="light|dark|system"` (or `.dark`) on any element.

## API

| Export | Purpose |
|---|---|
| `defaultTheme`, `createTheme(overrides)` | The default theme; deep-merge a partial theme (arrays replaced) |
| `themeToCss(theme, { colorBindings })`, `themeToCssVariables(theme)`, `responsiveTypographyVariables(theme)` | Serialize a theme to CSS / variable maps |
| `hexToRgb`, `relativeLuminance`, `contrastRatio`, `getContrastText(background, candidates?)` | WCAG 2.2 color math for theme authors |
| `componentColorNames`, `paletteColorNames`, `greyShades`, `typographyVariants`, `shadowNames`, `radiusNames`, `breakpointNames` | Name lists (and their types) |

Default colors are verified for WCAG 2.2 AA contrast in light and dark mode.

## Contrast

Brand colors follow the Minimal reference (ADR-0014): white text on `main` fills (dark on
warning) and `main`-colored text for outlined / text variants. Neutral text and soft-variant text
(`-text` tones) meet WCAG 2.2 AA, which the tests enforce.

For strict AA everywhere, override the brand values (plain CSS, no rebuild):

```css
:root {
  /* dark text on fills */
  --mt-palette-primary-contrast-text: #141a21;
  --mt-palette-info-contrast-text: #141a21;
  --mt-palette-success-contrast-text: #141a21;
  --mt-palette-error-contrast-text: #141a21;
}
```

and give outlined / text buttons the AA `-text` tone in your own CSS:
`[data-mt-button]:not([data-mt-variant="contained"]) { color: var(--mt-c-text, inherit); }`.
