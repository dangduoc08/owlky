# Owlky

Accessible, themeable UI components built on one design system, ready for any way you build for
the web.

Owlky is a UI component library for dashboards and web apps. It gives your product a polished,
consistent interface without locking you into one way of building it.

- **One design system everywhere.** Every component has a single markup structure, a single
  stylesheet and a single set of design tokens. Use it in plain HTML or through a framework
  package, and it looks and behaves the same.
- **Accessible by default.** Components follow the WAI-ARIA patterns, work with the keyboard and
  meet WCAG 2.2 level AA.
- **Nine design styles.** Switch the whole look with one attribute: Soft (the default), Swiss,
  Bauhaus, Brutalism, Neo-Brutalism, Editorial, Minimal Mono, Corporate or Nordic. Each style
  sets the palette, fonts, shapes, lines and shadows, and stays accessible in light and dark mode.
- **Easy to theme.** Every color, size and shadow is a CSS variable. Add density, surface and
  high contrast settings, or build a style with your brand colors and keep every pair
  accessible.
- **Built on the platform.** Components use native elements, such as `<button>` and `<dialog>`,
  so browser features like form submission, find-in-page and focus handling keep working.
- **Small.** Pages load only what they use. On a CDN page, the script is about 40 kB, gzipped,
  and larger components, such as the data grid, load only on the pages that show them. With a
  bundler, your app includes only the components it imports. The complete stylesheet is about
  63 kB.

> **Status:** Owlky is in pre-release (`0.x`) and not published to npm yet. The design tokens,
> theming and about 40 components are ready, from buttons and form controls to overlays,
> navigation and a data grid. The data grid and date pickers are being completed in
> phases; see [the roadmap](docs/roadmap.md).

## How it works

Owlky is built in layers, so the same component can be used in many environments:

- **Markup and styles.** Each component is HTML with `data-ok-*` attributes, styled by one prebuilt
  stylesheet. This layer works on any page.
- **Behavior.** Interactive components, such as dialogs and tables, share one behavior core. On a
  plain HTML page, a small script connects it to your markup.
- **Framework packages.** A framework package renders the same markup and uses the same behavior
  core, with the API you expect from your framework.

Because every layer is shared, you can move between environments, or mix them on one page, without
visual differences.

## Get started

### On a plain HTML page

Add the stylesheet and the script to the `<head>` of every page, then copy a component's markup:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.css">
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.js" defer></script>

<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md">
  <span data-ok-button-label>Get started</span>
</button>
```

The script holds the common components. Larger ones, such as the chart or the data grid, load
from the `modules/` folder next to it when a page holds one, each with its own stylesheet. To load them ahead of use, list them
in `data-ok-preload`, for example `data-ok-preload="chart"`. To host Owlky yourself, copy the
whole `dist` folder of `@owlky/html`.

### With a framework

Install the framework package and the stylesheet. For example, with React:

```sh
npm install @owlky/react @owlky/styles
```

```tsx
// In your app's entry file
import "@owlky/styles/owlky-all.css";

// In a component
import { Button } from "@owlky/react";

export function GetStarted() {
  return (
    <Button variant="contained" color="primary">
      Get started
    </Button>
  );
}
```

Bundlers keep only the components you import. Each component also has its own entry, such as
`@owlky/react/data-grid`, which you can load on demand with a dynamic `import()`. With Next.js,
add `@owlky/react` and `@owlky/core` to `experimental.optimizePackageImports`. `owlky-all.css`
holds every component (about 63 kB gzip). For less, import `owlky.css` (the tokens and the light
components, about 29 kB) and the files of the large components you use, such as
`@owlky/styles/components/data-grid.css`.

### With Tailwind CSS v4

Import the Owlky theme after Tailwind. Every Owlky token then becomes a utility class, such as
`bg-primary`, `text-text-secondary` or `shadow-card`:

```css
@import "tailwindcss";
@import "@owlky/styles/owlky-all.css";
@import "@owlky/styles/theme.css";
```

## Make it yours

### Choose a style

A style is a complete look: palette, fonts, corner radius, border widths, shadows, label case and
heading weight. A page without one looks **Soft**. The other eight styles are opt-in stylesheets
of about 2 to 3 kB each (gzip). Load one after `owlky.css` and set `data-ok-style` on the
`<html>` element or on any container:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky-style-nordic.css">

<html lang="en" data-ok-style="nordic">
```

With a bundler, import `@owlky/styles/styles/nordic.css` after `@owlky/styles/owlky.css`. On a
CDN page, `owlky.js` also loads the stylesheet of any style it finds in the page.

| Style | Id | Look |
| --- | --- | --- |
| Soft (default) | `soft` | Rounded, soft two-layer shadows, Nunito |
| Swiss | `swiss` | Square, 1px ink lines, Inter |
| Bauhaus | `bauhaus` | Square, 2px black borders, pill chips, capital Montserrat headings |
| Brutalism | `brutalism` | Square, 1px lines, IBM Plex Mono |
| Neo-Brutalism | `neo-brutalism` | Rounded, 2px borders, hard offset shadows, Space Grotesk |
| Editorial | `editorial` | Square, rules, Noto Serif Display headings, Source Serif 4 text |
| Minimal Mono | `minimal-mono` | Greys only, soft shadows, Inter |
| Corporate | `corporate` | Small radii, subtle shadows, IBM Plex Sans |
| Nordic | `nordic` | Rounded, warm grey shadows, Manrope |

Four more attributes nest on any element, each on its own: `data-ok-theme` (`light`, `dark`,
`system`), `data-ok-density` (`comfortable`, `compact`), `data-ok-surface` (`default`,
`contrast`) and `data-ok-contrast` (`default`, `high`, `system`). To let users choose them, and
the text size, use `applyThemeSettings()`.

### Use your brand colors

`createTheme({ style, brand })` from `@owlky/tokens` derives every color role from your colors,
in light and dark mode, on both surfaces and at both contrast levels, and keeps each pair
accessible. Write it as CSS at build time with `styleSheetCss()` (an opt-in style) or
`themeToCss()` (Soft), or apply it at run time with `applyThemeBrand()` from
`@owlky/core/theme-brand`:

```ts
import { createTheme, styleSheetCss } from "@owlky/tokens";

// A Nordic stylesheet with your primary color: load it instead of nordic.css.
const css = styleSheetCss(createTheme({ style: "nordic", brand: { primary: "#0E7490" } }));
```

Every design value is a CSS variable that starts with `--ok-`, and you can still set one in your
own CSS. Your values always win, because Owlky's own rules have zero specificity. A color you set
this way isn't derived again for dark mode or high contrast, so check its contrast yourself.

### Load the fonts

Owlky doesn't bundle fonts. The default style, Soft, uses Nunito (weights 400 to 800) for text,
headings and labels. Load it before `owlky.css`, for example from Google Fonts or Fontsource. The
Styles guide gives the font link of every style.


```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400..800&display=swap">
```

Without it, the text falls back to system fonts. Text tones, borders and focus rings meet WCAG AA
in light and dark mode; `data-ok-contrast="high"` raises text to 7:1 and graphics to 4.5:1.

## Documentation

The Storybook site is the main documentation:

- **Introduction** explains how Owlky works and how to install it.
- **Foundations** is a guide to the design tokens: colors, typography, shadows, spacing, icons,
  styles and theme settings, with live examples.
- **Components** shows every component. Choose plain HTML or a framework with the **Framework**
  menu in the toolbar, then open a story's **Code** panel to copy its source, with the imports you
  need.

Run it locally with `pnpm storybook`.

## Packages

| Package | Contents |
| --- | --- |
| [`@owlky/styles`](packages/styles) | The prebuilt stylesheet and the Tailwind CSS v4 theme |
| [`@owlky/tokens`](packages/tokens) | Design tokens as CSS variables and JavaScript values, `createTheme()` |
| [`@owlky/html`](packages/html) | HTML snippets and the behavior script, also from a CDN |
| [`@owlky/react`](packages/react) | React components (the first framework package) |
| [`@owlky/core`](packages/core) | The shared behavior core, included by the other packages |
| [`@owlky/mcp`](packages/mcp) | A Model Context Protocol server that gives coding agents the exact API, offline |

## Browser support

Owlky supports Chrome and Edge 114 and later, Firefox 128 and later, and Safari 17 and later. When
a browser lacks a newer feature, Owlky detects it and uses a fallback that still works.

## Contribute

You need Node.js 22.12 or later and pnpm 12.

```sh
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm build                              # build every package
pnpm storybook                          # open http://localhost:6006
pnpm test                               # unit and component tests, in a real browser
pnpm storybook:build && pnpm test:e2e   # end-to-end tests
pnpm check                              # everything CI runs
```

| Document | What it covers |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Conventions for contributors and AI agents |
| [docs/architecture.md](docs/architecture.md) | How the packages fit together |
| [docs/adr/](docs/adr/README.md) | Architecture decisions and their reasons |
| [docs/roadmap.md](docs/roadmap.md) | What is built and what comes next |
| [docs/testing.md](docs/testing.md) | Test layers and commands |
| [specs/](specs/README.md) | Component contracts |

Releases use Changesets: run `pnpm changeset` in your pull request. Pushing to `main` only runs CI.
To publish, push a `release/v<version>` tag on a `main` commit; see
[ADR-0012](docs/adr/0012-release-by-tag.md).

## License

MIT. Some packages bundle third-party code under their own licenses. Each of those packages lists
it in a `THIRD_PARTY_NOTICES.md` file.

Owlky's first visual language was inspired by the Minimal dashboard design. Owlky copies none of
its code, and its own nine styles replace the design values that came from it. Owlky isn't
affiliated with Minimal UI or MUI.
