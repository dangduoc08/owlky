# ADR-0014: Brand colors follow the reference look

**Status:** Accepted (2026-11-04) — supersedes the contrast rules for brand colors in ADR-0002 and
"AA wins" in ADR-0011

## Context
With AA-safe defaults, filled primary / info / success / error used dark text and outlined /
text variants used darker tones. The owner compared against the Minimal reference and chose its
look: white text on `main` fills and `main`-colored text, as in MUI (`getContrastText`, 3:1
threshold).

## Decision
- `contrastText` = white for primary, secondary, info, success, error; `grey-800` for warning.
- Outlined and text variants use the `main` color for text; soft keeps `paletteText`
  (dark tone in light mode, light tone in dark mode), which is still AA.
- Documentation swatches use MUI's rule: white text when it reaches 3:1, otherwise 87 % black.
- Still tested for WCAG 2.2 AA: neutral text (`text.primary` / `text.secondary` on surfaces) and
  `paletteText` (soft) on surfaces and tints.
- Tests exempt brand-colored elements from axe `color-contrast` **only** (every other rule still
  runs): colored contained / outlined / text buttons and `[data-swatch]`.
- Teams that need strict AA override `--mt-palette-*-contrast-text` and `--mt-palette-*-text`
  (packages/tokens/README.md).

## Consequences
- Brand-colored button text is 2.3–3.2:1 against its background (below AA 4.5:1 for 14px text).
- `/component` takes reference colors as given; AA still applies to everything else.
