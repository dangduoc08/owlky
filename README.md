# Minimal Tailwind

Accessible UI components inspired by the Minimal dashboard design language — shipped as **React
components** and as **framework-free HTML** with identical markup, styles and behavior.

- **Two implementations, one design system.** Same `data-mt-*` anatomy, same prebuilt CSS, same
  behavior core. React ↔ HTML parity is tested down to the pixel.
- **No Tailwind required to consume.** CSS is prebuilt; Tailwind v4 users get a matching theme.
- **Themeable** through `--mt-*` CSS variables; light, dark, system and nested themes.
- **Accessible:** WCAG 2.2 AA contrast is unit-tested; keyboard and focus management on every component.
- **Small:** the complete HTML runtime + components bundle is ~4 kB gzip.

> Status: `0.x`, pre-release. Components: Button, Switch, Dialog. See [the roadmap](docs/roadmap.md).

## Use it

### Plain HTML (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.css">
<script src="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.js" defer></script>

<button type="button" data-mt-button data-mt-variant="contained" data-mt-color="primary"
        aria-haspopup="dialog" data-mt-dialog-open="hello">Open</button>

<dialog id="hello" data-mt-dialog aria-labelledby="hello-title">
  <div data-mt-dialog-content>
    <h2 id="hello-title" data-mt-dialog-title>Hello</h2>
    <div data-mt-dialog-actions>
      <button type="button" data-mt-button data-mt-dialog-close>Close</button>
    </div>
  </div>
</dialog>
```

Snippets for every component and variant are in Storybook (HTML/*) and in
`@minimal-tailwind/html/dist/snippets/`. CSS-only components (Button, Switch) need no script.

### React

```sh
pnpm add @minimal-tailwind/react @minimal-tailwind/styles
```

```tsx
import "@minimal-tailwind/styles/minimal-tailwind.css";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@minimal-tailwind/react";
```

React 18.3+ and 19 are supported. Server-component friendly (`"use client"` only where needed).

### npm without a framework

```ts
import "@minimal-tailwind/styles/minimal-tailwind.css";
import "@minimal-tailwind/html/auto"; // or: getRuntime().register(dialog).start()
```

### With Tailwind CSS v4

```css
@import "tailwindcss";
@import "@minimal-tailwind/styles/minimal-tailwind.css";
@import "@minimal-tailwind/styles/theme.css"; /* bg-primary, text-text-secondary, shadow-z8, … */
```

### Theming

```css
:root {
  --mt-palette-primary-main: #2065d1;
  --mt-palette-primary-dark: #103996;
  --mt-palette-primary-contrast-text: #fff;
}
```

Dark mode: `<html data-mt-theme="dark">` (or `class="dark"`, or `"system"`). Any element can set
its own `data-mt-theme`. Generate a full theme in JS with `createTheme()` + `themeToCss()` from
`@minimal-tailwind/tokens`. Load the font yourself (e.g. Public Sans from Fontsource or Google
Fonts); the stack falls back to system fonts.

**Browser support:** Chrome/Edge 114+, Firefox 128+, Safari 17+ ([ADR-0006](docs/adr/0006-browser-baseline-and-fallbacks.md)).

## Packages

| Package                                       |                                                          |
| --------------------------------------------- | -------------------------------------------------------- |
| [`@minimal-tailwind/react`](packages/react)   | React components                                         |
| [`@minimal-tailwind/html`](packages/html)     | HTML Core Runtime, snippets, CDN bundle                  |
| [`@minimal-tailwind/styles`](packages/styles) | Prebuilt CSS, Tailwind v4 theme                          |
| [`@minimal-tailwind/tokens`](packages/tokens) | Design tokens, `createTheme()`                           |
| [`@minimal-tailwind/core`](packages/core)     | Shared framework-free behavior (internal building block) |

## Develop

Requirements: Node 22.12+, pnpm 12.

```sh
pnpm install
pnpm exec playwright install chromium firefox webkit
pnpm build            # all packages
pnpm storybook        # http://localhost:6006
pnpm test             # unit + component tests (real browser)
pnpm storybook:build && pnpm test:e2e
pnpm check            # everything CI runs
```

| Doc                                          |                                            |
| -------------------------------------------- | ------------------------------------------ |
| [docs/architecture.md](docs/architecture.md) | How the pieces fit                         |
| [docs/adr/](docs/adr/README.md)              | Decisions and their reasons                |
| [docs/roadmap.md](docs/roadmap.md)           | Implementation plan                        |
| [docs/testing.md](docs/testing.md)           | Test layers and commands                   |
| [specs/](specs/README.md)                    | Component contracts                        |
| [AGENTS.md](AGENTS.md)                       | Conventions for contributors and AI agents |

Releases use Changesets: `pnpm changeset` in your PR; the release workflow publishes from `main`.

## License

MIT. Visual language inspired by the Minimal dashboard; no code or assets from it are used.
