# ADR-0011: Foundations first; sample components removed

**Status:** Accepted (2026-11-04)

## Context
Phase 2 shipped three pattern components (Button, Switch, Dialog) to prove the architecture.
The owner decided to build the library bottom-up instead: foundations first, mirroring the
Minimal reference's *Foundation* section (Colors, Typography, Shadows, Grid, Icons), then
components on top of them.

## Decision
- Button, Switch and Dialog are removed from every package, Storybook, specs and e2e.
- Everything they established stays: tokens, styles pipeline, `core` primitives (focus, layer
  stack, scroll lock, inert, support, ids, shared state), the HTML Core Runtime, the test and
  release tooling, and ADR-0001…0010.
- The removed code remains the **pattern reference** for future components, retrievable from
  commit `bd5fb2d`:
  - CSS-only: `git show bd5fb2d:packages/styles/src/components/button.css` (+ `react/src/button/`)
  - Native control: `git show bd5fb2d:packages/react/src/switch/switch.tsx`
  - Runtime behavior: `git show bd5fb2d:packages/core/src/dialog/dialog-controller.ts`,
    `…:packages/html/src/components/dialog/dialog.ts`, `…:packages/react/src/dialog/dialog.tsx`
  - Parity e2e: `git show bd5fb2d:e2e/tests/parity.spec.ts`
- Foundations are documented in Storybook under **Foundations/** using the reference only for
  *content*. Presentation follows Storybook defaults: one story per section (sidebar sub-items),
  an autodocs page per foundation, Controls for adjustable demos. Values come from the tokens,
  shown with our variable names (`--mt-*`).
- Where the reference conflicts with WCAG 2.2 AA, AA wins — superseded for brand colors by
  ADR-0014 (reference look); AA still applies to neutral text.
- Tokens follow the reference where it differs from the first version: responsive type sizes
  (min-width 600 / 900 / 1200px, emitted as media-query overrides of the same `--mt-typography-*`
  variables), a display font (Barlow) for h1–h3, h5 = 18→19px, h6 = 17→18px at weight 600,
  breakpoints, and 24 system elevations (`--mt-elevation-1…24`).
- The Icons page keeps the reference's structure but not its assets: no logo, icon packs, flags
  or illustrations are reproduced (they are the reference product's own assets). The library
  bundles no icon set; the page documents sizes, colors and accessible SVG usage.
- Empty export globs (`styles/components/*`, `html/snippets/*`) are removed until the first
  component exists, because publint rejects exports that match no files.

## Consequences
- ADRs 0004–0006 cite Dialog as their example; the decisions still hold, the example lives in
  git history.
- `@minimal-tailwind/react` currently exports only types.
