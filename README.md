# Owlky

Accessible UI components inspired by the Minimal dashboard design language — shipped as **React
components** and as **framework-free HTML** with identical markup, styles and behavior.

- **Two implementations, one design system.** Same `data-ok-*` anatomy, same prebuilt CSS, same
  behavior core. React ↔ HTML parity is tested down to the pixel.
- **No Tailwind required to consume.** CSS is prebuilt; Tailwind v4 users get a matching theme.
- **Themeable** through `--ok-*` CSS variables; light, dark, system and nested themes.
- **Accessible:** keyboard and focus management on every component; neutral text is AA-tested;
  brand colors follow the reference look (opt-in strict AA, see `packages/tokens/README.md`).
- **Small:** the HTML runtime bundle is ~2 kB gzip; all CSS (tokens) ~4.6 kB gzip.

> Status: `0.x`, pre-release — **foundations first**. Available now: design tokens (colors,
> typography, radius, shadows, motion) as CSS variables, light/dark theming, the Tailwind v4 theme
> and the HTML Core Runtime. Components follow on top of the foundations. See
> [the roadmap](docs/roadmap.md).

## Use it

### Plain HTML (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.css">
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.js" defer></script>

<div style="background: var(--ok-palette-primary-main); color: var(--ok-palette-primary-contrast-text)">
  Primary
</div>
```

### React / npm

```sh
pnpm add @owlky/styles
```

```ts
import "@owlky/styles/owlky.css";
```

### With Tailwind CSS v4

```css
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css"; /* bg-primary, text-text-secondary, shadow-z8, … */
```

### Theming

```css
:root {
  --ok-palette-primary-main: #2065d1;
  --ok-palette-primary-dark: #103996;
  --ok-palette-primary-contrast-text: #fff;
}
```

Dark mode: `<html data-ok-theme="dark">` (or `class="dark"`, or `"system"`). Any element can set
its own `data-ok-theme`. Generate a full theme in JS with `createTheme()` + `themeToCss()` from
`@owlky/tokens`. Load the fonts yourself — Public Sans (text) and Barlow 700/800 (h1–h3), e.g. from
Fontsource or Google Fonts; the stacks fall back to system fonts.

**Browser support:** Chrome/Edge 114+, Firefox 128+, Safari 17+ ([ADR-0006](docs/adr/0006-browser-baseline-and-fallbacks.md)).

## Packages

| Package                                       |                                                          |
| --------------------------------------------- | -------------------------------------------------------- |
| [`@owlky/react`](packages/react)   | React components                                         |
| [`@owlky/html`](packages/html)     | HTML Core Runtime, snippets, CDN bundle                  |
| [`@owlky/styles`](packages/styles) | Prebuilt CSS, Tailwind v4 theme                          |
| [`@owlky/tokens`](packages/tokens) | Design tokens, `createTheme()`                           |
| [`@owlky/core`](packages/core)     | Shared framework-free behavior (internal building block) |

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

Releases use Changesets: `pnpm changeset` in your PR. Pushing to `main` only runs CI; publishing
happens when a `release/v<version>` tag is pushed on a `main` commit — see
[ADR-0012](docs/adr/0012-release-by-tag.md) for the procedure.

## License

MIT. Visual language inspired by the Minimal dashboard; no code or assets from it are used.
