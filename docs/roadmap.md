# Implementation plan

Each phase ends with green CI (lint, types, unit ×3 browsers, e2e ×4 projects, package checks)
and a review before the next starts.

## ✅ Phase 0 — Foundation

pnpm workspace, strict TypeScript 7, Biome (incl. boundary import rules), Vitest browser mode,
Playwright, Storybook 10, Changesets (fixed), CI and release workflows, ADRs, `AGENTS.md`.

## ✅ Phase 1 — Tokens and theming

Typed tokens → `tokens.css`/JSON, light/dark/system/nested scopes, `createTheme()`, AA contrast
tests, Tailwind v4 `theme.css`, prebuilt CSS pipeline with leak checks, Storybook token pages.

## ✅ Phase 2 — Pattern components (one per pattern)

| Pattern             | Component  | Establishes                                                                                     |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| CSS-only            | **Button** | anatomy maps, variant × color bindings, zero-specificity CSS, snippets                          |
| Native form control | **Switch** | input-based control, controlled/uncontrolled React, no JS in HTML                               |
| Runtime behavior    | **Dialog** | core controller, HTML runtime definition, delegation, fallbacks, React compound API, parity e2e |

Plus the HTML Core Runtime (ADR-0005), version policy (ADR-0007), plain-HTML example.

**Open before publishing 0.1.0 (needs you):** create the npm org `@minimal-tailwind`, the GitHub
repo (replace `OWNER` in package.json files), npm trusted publishing for the release workflow,
and generate visual baselines in Docker (`pnpm test:visual:update`).

## Phase 3 — Form controls

Input, Textarea, Checkbox, Radio + RadioGroup. Shared field anatomy (label, helper text, error,
`aria-describedby`/`aria-invalid` wiring), `checkContrast()` helper for custom themes.

## Phase 4 — Display

Badge, Avatar (+ group), Card, Accordion (CSS-only on `<details name>`).

## Phase 5 — Overlays and navigation

Tooltip, Dropdown (menu), Tabs, then Select. Introduces: popover controller in core with the
ADR-0006 popover fallback, `@floating-ui/dom` positioning, roving focus and typeahead utilities.
Select: combobox/listbox with native-form sync; Zag.js remains the fallback if cost explodes.

## Phase 6 — Feedback and 1.0

Toast (shared toast store in core, declarative `data-mt-toast` trigger + `MinimalTailwind.toast()`,
React provider), full accessibility audit, documentation polish, size budgets review, `1.0.0`.
