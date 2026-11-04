# AGENTS.md — working in this repository

Read this first (humans and AI agents). Architecture: `docs/architecture.md`. Decisions: `docs/adr/`.

## Ground rules

1. **Two implementations, one contract.** Every component has a spec in `specs/components/`. React
   and HTML must render the same `data-mt-*` anatomy and behave the same. Change the spec first.
2. **Never cross the boundary.** `tokens`, `styles`, `core`, `html` must not import React;
   `react` must not import `html` (ADR-0008 — lint + `pnpm check:boundaries` enforce it).
3. **Behavior lives in `core` once.** If React and HTML both need it, it goes in a core controller
   that reports intent (`onDismiss`) instead of mutating state on its own.
4. **CSS:** only `:where(...)` selectors inside `@layer components`; `--mt-*` tokens for every
   value; `@apply` only for utilities that compile to plain declarations (no `--tw-*`).
5. **Native first.** `<dialog>`, `popover`, native inputs. Feature-detect via `supports` and
   implement the documented fallback (ADR-0006).
6. **Global state:** only the three `Symbol.for` slots in ADR-0007. Anything else is module- or
   instance-scoped. Changing a shared shape = bump its protocol.
7. **No `innerHTML` in library code** (tests and Storybook snippets only), no `stopPropagation`,
   no new runtime dependencies without an ADR.

## Naming

| Thing                 | Convention                            | Example                        |
| --------------------- | ------------------------------------- | ------------------------------ |
| Root / part attribute | `data-mt-<component>[-<part>]`        | `data-mt-dialog-title`         |
| Modifier              | `data-mt-variant/color/size/…`        | `data-mt-size="sm"`            |
| HTML trigger          | `data-mt-<component>-<action>="<id>"` | `data-mt-dialog-open="x"`      |
| HTML option           | `data-mt-<option>`                    | `data-mt-escape-close="false"` |
| Event                 | `mt:<component>:<event>`              | `mt:dialog:beforeclose`        |
| Public CSS variable   | `--mt-<group>-<name>`                 | `--mt-palette-primary-main`    |
| Private CSS variable  | `--_mt-<name>` (component-internal)   | `--_mt-main`                   |
| Files                 | kebab-case; one component per folder  | `dialog-controller.ts`         |

## Adding a component (checklist)

1. `specs/components/<name>.md` (template in `specs/README.md`).
2. `core/src/anatomy/anatomy.ts`: `<name>Attributes()`; behavior → `core/src/<name>/` + tests
   (native **and** fallback paths), exported from `core/src/index.ts`.
3. `styles/src/components/<name>.css` + `@import` in `styles/src/index.css`. (First component
   only: restore the `"./components/*": "./dist/components/*"` export in `styles/package.json`.)
4. `react/src/<name>/<name>.tsx` + `<name>.test.tsx` (behavior + axe), export from `react/src/index.ts`.
   Interactive roots render `data-mt-runtime="off"`; files with hooks start with `"use client"`.
5. `html/src/components/<name>/examples/*.html` (canonical snippets; first component only: restore
   the `"./snippets/*": "./dist/snippets/*"` export in `html/package.json`). If it needs JS:
   `<name>.ts` (`defineComponent`) + tests, one line in `html/src/components/index.ts`.
6. Storybook: `apps/storybook/src/components/<name>/` — `<name>.react.stories.tsx`,
   `<name>.html.stories.tsx` (**same story names**), `<name>.html.mdx` docs.
7. E2E: add pairs to `e2e/tests/parity.spec.ts` (first component: restore it with
   `git show bd5fb2d:e2e/tests/parity.spec.ts`); interaction spec for both implementations.
8. `pnpm changeset`, then `pnpm check`.

## Foundations in Storybook
`apps/storybook/src/foundations/<name>/` — presentational components (`<name>.tsx`) and
`<name>.stories.tsx` with **one story per section** (they become the sidebar sub-items) plus the
autodocs page. Use Storybook's default layout and Controls for anything adjustable; don't build
page chrome (headers, tables of contents, custom navigation). Read every value from
`@minimal-tailwind/tokens` or `--mt-*` variables — never hard-code a token value. The reference
site is for content only; brand colors follow it, neutral text must meet WCAG AA (ADR-0014). E2E a11y, visual
and small-screen tests pick up new stories automatically from Storybook's `index.json`.

## Commands

`pnpm build` · `pnpm test` · `pnpm storybook` · `pnpm storybook:build && pnpm test:e2e` ·
`pnpm lint:fix` · `pnpm check` (full CI locally).

## Gotchas

- Tests load the **built** CSS: run `pnpm build` after changing styles or tokens.
- Typecheck also needs a build: workspace packages resolve each other's types from `dist`
  (a clean checkout fails with TS2307). CI and `pnpm check` build before `pnpm typecheck`.
- WebKit on macOS doesn't Tab to buttons or focus buttons/checkboxes on click — use inputs for
  Tab tests and pass triggers explicitly for focus return.
- Native modal dialogs may move Tab focus to browser UI; assert "never reaches the page behind".
- Storybook aliases packages to `src`; `sideEffects` doesn't list sources, so start the runtime
  explicitly there (as `preview.tsx` does) rather than relying on side-effect imports.
- Story ids come from export names: `H1` → `…--h-1`, `Subtitle1` → `…--subtitle-1`. Set `name`
  for the sidebar label. Never export a story named after a global (`Error`): use
  `ErrorPalette` + `name: "Error"`.
- E2E opens stories with `a11y.manual:!true` (see `openStory`): Storybook's a11y addon would
  otherwise run axe in the same frame and collide with `@axe-core/playwright`.
- Engines serialize computed values differently: `color-mix()` shadows are `rgba(…)` or
  `color(srgb …)`; WebKit drops quotes around font names. Assert with regexes on the stable part.
- Horizontally scrollable areas must be keyboard-focusable (axe `scrollable-region-focusable`):
  use `CodeBlock` (`section[aria-label][tabindex=0]`) in Storybook.
- Text on arbitrary colors: pick from white/**pure black** (`getContrastText(hex, ["#FFFFFF",
  "#000000"])`) — the better of the two always reaches ≥ 4.58:1; near-black does not.
- publint rejects `exports` globs that match no files; `styles/components/*` and
  `html/snippets/*` are restored with the first component (checklist steps 3 and 5).
- Biome is configured to skip Markdown (`!**/*.md`): its formatter breaks command frontmatter.
- `pnpm-workspace.yaml` → `overrides` pins `glob` 14.0.3 for Storybook's docgen plugin (security
  fix for glob/minimatch advisories; upstream still pins glob 13). Remove it once
  `@storybook/react-vite` resolves a fixed version — check with `pnpm audit` after upgrades.
  Security fixes may use releases younger than 14 days (Renovate `vulnerabilityAlerts`).
- Tailwind's compiler rewrites `color-mix()` into an `@supports` pair whose fallback **drops the
  alpha** (opaque colors). `tokens.css` is concatenated, not compiled; component CSS must use
  `rgb(var(--…-channel) / α)` instead of `color-mix()` (ADR-0013, enforced by `styles.test.ts`).
- Brand-colored text is exempt from axe `color-contrast` only, via `CONTRAST_EXEMPT`
  (react `test-utils.tsx`, e2e `helpers.ts`, html button test) — ADR-0014. Extend that list for
  new brand-colored parts instead of disabling the rule.
- Infinite CSS animations (spinners) never fire `animation.finished`: test helpers that wait for
  animations must skip them (`expectNoAxeViolations` filters `endTime === Infinity`).
- Biome 2 lints the HTML snippets too: decorative `<svg>` needs `aria-hidden="true"` itself (not
  only on its wrapper), and demo links need a real `href` and descriptive text.
- Add each new component's files to `coverage.thresholds` in `vitest.config.ts`.
- Foundations › Icons uses Iconify **offline** (`@iconify/react/offline`, Storybook dev deps only)
  with a generated subset, `icon-data.json`: edit `SETS` in `apps/storybook/scripts/icons.mjs`
  and run `pnpm --filter @minimal-tailwind/storybook icons`. Never import a full
  `@iconify-json/*/icons.json` (megabytes). Credit each set's author and license (Solar is CC BY 4.0).
