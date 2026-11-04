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
| `paletteColorNames`, `greyShades`, `typographyVariants`, `shadowNames`, `radiusNames`, `breakpointNames` | Name lists (and their types) |

Default colors are verified for WCAG 2.2 AA contrast in light and dark mode.
