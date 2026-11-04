# ADR-0003: `data-mt-*` anatomy, zero-specificity CSS in cascade layers, prebuilt CSS

**Status:** Accepted (supersedes the `mtw-` class-prefix idea from the first proposal)

## Context

One stylesheet must style React output and hand-written HTML identically, coexist with consumer
Tailwind (and its preflight), and stay easy to override. Consumers must not run Tailwind over
library sources.

## Decision

1. **Anatomy by attributes.** Components and parts are `data-mt-<component>[-<part>]`; modifiers
   are `data-mt-variant|color|size|…`; state comes from native/ARIA attributes. No component
   classes — so no collision with Tailwind's `mt-*` utilities, and `class` stays the consumer's.
2. **Zero specificity.** Every selector is a single `:where(…)` (only `::backdrop` may follow).
   Rules apply in source order: base → sizes → variants → hover → focus → disabled.
   `styles.test.ts` enforces this.
3. **Cascade layers.** Component CSS is in `@layer components`. Every shipped file starts with
   `@layer theme, base, components, utilities;` so library layers keep Tailwind's order even when
   loaded first (otherwise preflight in `base` would override components).
4. **Color bindings.** `[data-mt-color]` sets `--mt-c-main|hover|contrast|text|shadow`, registered
   with `@property … { inherits: false }` so a colored parent never leaks into children. Each
   component maps them to private `--_mt-*` variables with its own default color.
5. **Tailwind as build tool, plain CSS as output.** Sources may `@apply` utilities that compile to
   plain declarations (layout, spacing, radius, colors). Utilities that emit Tailwind internals
   (`--tw-*`: shadows, rings, transitions, font-weight) are written as plain CSS instead. The
   build fails if any `--tw-*` or uncompiled directive reaches `dist`.
6. **Outputs:** `minimal-tailwind.css` (+ `.min.css`), `components/<name>.css`, `tokens.css`,
   `base.css` (optional page styles), `theme.css` (Tailwind v4 mapping for consumers).

## Consequences

- Overriding is trivial: any class, utility or unlayered rule wins.
- Data-attribute selectors are slightly more verbose to author; the spec + snippet per component
  documents the exact attributes.
- Tailwind's `@property` fallback emits a small `@layer properties` block resetting `--mt-c-*`
  for engines without `@property`; it contains no `--tw-*` and is accepted.
