# ADR-0013: Translucent colors via RGB channel tokens

**Status:** Accepted (2026-11-04)

## Context
Components need translucent tints of their color (8 / 16 / 32 / 48 %). Written as
`color-mix(in srgb, var(--x) 16%, transparent)` in component CSS, Tailwind's compiler emits an
`@supports` pair whose fallback is `var(--x)` — **fully opaque** — and duplicates every rule
(verified while building Button; ADR-0003 compiles component CSS with Tailwind).

## Decision
- Tokens expose an RGB channel for every color: `--ok-palette-<color>-<shade>-channel`,
  `--ok-palette-grey-<n>-channel`, `--ok-palette-common-white|black-channel` (e.g. `0 167 111`).
- Color bindings add `--ok-c-channel` (non-inheriting, like the other `--ok-c-*`), including the
  new `black` / `white` component colors.
- Component CSS writes translucent colors as `rgb(var(--…-channel) / α)`, which the compiler
  leaves untouched. `color-mix()` stays allowed in `tokens.css` (concatenated, not compiled) and is
  forbidden in `packages/styles/src/components/*` (enforced by `styles.test.ts`).
- A font-size scale (`--ok-font-size-xs…xl`) covers component text that isn't a typography
  variant (button sizes).

## Consequences
- Overriding a palette color in a theme must also override its `-channel` variable; `createTheme()`
  + `themeToCss()` do this automatically.
