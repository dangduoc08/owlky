# Implementation plan

Each phase ends with green CI (lint, types, unit ×3 browsers, e2e ×4 projects, package checks)
and a review before the next starts.

## ✅ Phase 0 — Foundation tooling
pnpm workspace, strict TypeScript 7, Biome (incl. boundary import rules), Vitest browser mode,
Playwright, Storybook 10, Changesets (fixed), CI and release workflows, ADRs, `AGENTS.md`.

## ✅ Phase 1 — Tokens and theming
Typed tokens → `tokens.css`/JSON, light/dark/system/nested scopes, `createTheme()`, AA contrast
tests, Tailwind v4 `theme.css`, prebuilt CSS pipeline with leak checks, HTML Core Runtime.

## ↩ Phase 2 — Pattern components (removed, ADR-0011)
Button, Switch and Dialog proved the architecture and were then removed so the library is built
foundations-first. Their code is the pattern reference at commit `bd5fb2d`.

## ✅ Phase 2' — Foundations (Storybook › Foundations)
Content from the reference's Foundation section, presented the Storybook way (one story per
section, autodocs page, Controls), generated from the tokens:

| Page | Content | Token changes |
|---|---|---|
| Colors | One story per palette: Hex / Rgb / Var, click to copy | `getContrastText`, `contrastRatio`, `hexToRgb` |
| Typography | One story per variant with its definition, text colors | Responsive sizes (600/900/1200px), display font Barlow for h1–h3, h5/h6 values, breakpoints |
| Shadows | System elevations 1–24, extended shadows, colored shadows | `--mt-elevation-1…24` |
| Grid | Spacing (0–40px) and column (1–12) stories driven by Controls | — |
| Icons | Icon sets, sizes, colors, usage | — (no icon set bundled; reference logo/illustrations not reproduced) |

## Next — components (awaiting the owner's go-ahead)
Order to be confirmed. Candidate sequence, each in React + HTML with parity tests:
1. Form controls: Input, Textarea, Checkbox, Radio/RadioGroup (+ restore empty export globs)
2. Display: Badge, Avatar, Card, Accordion
3. Overlays & navigation: Tooltip, Dropdown, Tabs, Select (popover controller + fallback)
4. Feedback & 1.0: Toast, accessibility audit, docs polish

**Before publishing 0.1.0 (needs the owner):** npm org `@minimal-tailwind`, GitHub repo (replace
`OWNER`), npm trusted publishing, visual baselines in Docker (`pnpm test:visual:update`).
