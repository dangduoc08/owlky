# Minimal Tailwind

Accessible UI components inspired by the Minimal dashboard design language — shipped as **React
components** and as **framework-free HTML** with identical markup, styles and behavior.

- **Two implementations, one design system.** Same `data-mt-*` anatomy, same prebuilt CSS, same
  behavior core. React ↔ HTML parity is tested down to the pixel.
- **No Tailwind required to consume.** CSS is prebuilt; Tailwind v4 users get a matching theme.
- **Themeable** through `--mt-*` CSS variables; light, dark, system and nested themes.
- **Accessible:** WCAG 2.2 AA contrast is unit-tested; keyboard and focus management on every component.
- **Small:** the HTML runtime bundle is ~2 kB gzip; all CSS (tokens) ~4.6 kB gzip.

> Status: `0.x`, pre-release — **foundations first**. Available now: design tokens (colors,
> typography, radius, shadows, motion) as CSS variables, light/dark theming, the Tailwind v4 theme
> and the HTML Core Runtime. Components follow on top of the foundations. See
> [the roadmap](docs/roadmap.md).

## Use it

### Plain HTML (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.css">
<script src="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.js" defer></script>

<div style="background: var(--mt-palette-primary-main); color: var(--mt-palette-primary-contrast-text)">
  Primary
</div>
```

### React / npm

```sh
pnpm add @minimal-tailwind/styles
```

```ts
import "@minimal-tailwind/styles/minimal-tailwind.css";
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
`@minimal-tailwind/tokens`. Load the fonts yourself — Public Sans (text) and Barlow 700/800 (h1–h3), e.g. from
Fontsource or Google Fonts; the stacks fall back to system fonts.

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
