# ADR-0002: TypeScript tokens → CSS variables, AA-checked

**Status:** Accepted

## Context

Both implementations must share palette, typography, spacing, radius, shadows and motion, and
consumers must be able to theme without touching library source.

## Decision

- Tokens are typed TypeScript objects (`packages/tokens/src/default-theme.ts`). A build step emits
  `tokens.css` (every value as a `--mt-*` variable) and `tokens.json`.
- Light/dark: scheme-dependent values are re-declared for `[data-mt-theme="dark"]`, `.dark`,
  `[data-mt-theme="light"]` (nested light) and `[data-mt-theme="system"]` + `prefers-color-scheme`.
  Derived values (shadows) are re-declared per scheme because a custom property that references
  another is resolved where it is declared.
- Variables live in `@layer theme`; any unlayered consumer CSS overrides them.
- `createTheme(overrides)` deep-merges a partial theme; `themeToCss(theme)` serializes it.
- **Contrast is tested, not assumed.** `tokens.test.ts` checks WCAG 2.2 AA (4.5:1) for: filled
  text on `main`, palette text on paper/default/16 % tint, primary/secondary text, in both schemes.
  As a result some `contrastText` values are dark (#141A21) where the Minimal reference uses white
  (white on `#00A76F` is 3.1:1). Brands that accept the trade-off can override
  `--mt-palette-primary-contrast-text`.
- `paletteText` (per scheme) is the AA-safe tone used for outlined/soft/text variants.

## Consequences

- Adding a token = TS change + (if scheme-dependent) both schemes; the tests enforce key parity.
- Custom palettes should be re-checked with the same contrast helpers (planned `checkContrast()`
  export, roadmap Phase 3).
