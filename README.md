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
- **Easy to theme.** Every color, size and shadow is a CSS variable. Switch to dark mode, change
  the primary color or bring your own brand with a few lines of CSS.
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
from the `modules/` folder next to it when a page holds one. To load them ahead of use, list them
in `data-ok-preload`, for example `data-ok-preload="chart"`. To host Owlky yourself, copy the
whole `dist` folder of `@owlky/html`.

### With a framework

Install the framework package and the stylesheet. For example, with React:

```sh
npm install @owlky/react @owlky/styles
```

```tsx
// In your app's entry file
import "@owlky/styles/owlky.css";

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
add `@owlky/react` and `@owlky/core` to `experimental.optimizePackageImports`.

### With Tailwind CSS v4

Import the Owlky theme after Tailwind. Every Owlky token then becomes a utility class, such as
`bg-primary`, `text-text-secondary` or `shadow-card`:

```css
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";
```

## Make it yours

Every design value is a CSS variable that starts with `--ok-`. To change one, set it in your own
CSS, for the whole page or for one part of it. Your values always win, because Owlky's own rules
have zero specificity.

```css
:root {
  --ok-palette-primary-main: #2065d1;
  --ok-palette-primary-dark: #103996;
  --ok-palette-primary-contrast-text: #ffffff;
  --ok-radius-md: 10px;
}
```

For dark mode, set `data-ok-theme="dark"` on the `<html>` element or on any container. Use
`system` to follow the operating system. To let users choose the theme, primary color, font and
text size, use `applyThemeSettings()`.

Owlky doesn't bundle fonts. Load Public Sans for text and Barlow (weights 700 and 800) for display
headings, for example from Fontsource. Without them, the text falls back to system fonts.

## Documentation

The Storybook site is the main documentation:

- **Introduction** explains how Owlky works and how to install it.
- **Foundations** is a guide to the design tokens: colors, typography, shadows, spacing, icons and
  theme settings, with live examples.
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

The visual language is inspired by the Minimal dashboard design. Owlky copies none of its code.
Before version 0.1.0, Owlky's own style presets replace the design values and demo content that
came from it. Owlky isn't affiliated with Minimal UI or MUI.
