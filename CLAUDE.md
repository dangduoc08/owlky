# CLAUDE.md

Owlky: an accessible UI component library inspired by the Minimal dashboard design
language. Every component ships twice — **React** and **framework-free HTML** — with identical
`data-ok-*` markup, one prebuilt stylesheet and one shared behavior core.

Conventions, naming and the add-a-component checklist are in AGENTS.md (imported below). This
file covers project status, workflow and orientation.

## Status (updated 2026-11-07)

| Phase | Scope | State |
|---|---|---|
| 0 Foundation tooling | pnpm workspace, TS 7 strict, Biome, Vitest browser mode, Playwright, Storybook 10, Changesets, CI | ✅ done |
| 1 Tokens & theming | tokens → CSS vars, light/dark/system/nested, `createTheme()`, AA contrast tests, Tailwind v4 theme, HTML runtime | ✅ done |
| 2 Pattern components | Button, Switch, Dialog | ↩ removed (ADR-0011); reference at commit `bd5fb2d` |
| 2' Foundations | Tokens + Storybook › Foundations (Colors, Typography, Shadows, Grid, Icons, Settings): one story per section, default Storybook UI | ✅ done, awaiting review |
| Theme settings | Presets (`data-ok-preset`), fonts (`data-ok-font`), root font size, `applyThemeSettings` (ADR-0017) | ✅ done, awaiting review |
| Components | Button, Icon button, Fab, Button group, Toggle button, Drawer, Sortable, Accordion, Alert, Table, Pagination, Scrollbar, Circular / Linear progress, Checkbox, Switch, Form control label, Radio, Text field, Avatar, Badge, Chip, Label, Divider, List, Popover, Tooltip, Menu, Dialog, Snackbar, Backdrop ✅ (via `/component`) | awaiting review |

Full plan: `docs/roadmap.md`. Not published yet.

**Blocked on the user before publishing 0.1.0:** npm org `@owlky` (ADR-0016), GitHub repo
(replace `OWNER` in every `packages/*/package.json`), `NPM_TOKEN` secret or npm trusted
publishing, visual baselines via `pnpm test:visual:update` (Docker only).

**Releasing:** CI only on `main`; publish = push tag `release/v<version>` on a `main` commit
whose packages already carry that version (ADR-0012).

## Workflow with the user

- Work in **review gates**: propose (numbered decisions) → user approves → implement.
  Stop at each phase boundary for review.
- Don't redesign approved architecture. Changing a decision = a new ADR in `docs/adr/` that
  supersedes the old one.
- The user writes in Vietnamese; repository docs and code stay in English.
- Commit, push or publish only when asked.

## Stack

Node ≥ 22.12 · pnpm 12 · TypeScript 7 (native `tsc`) · React 19 (peer `^18.3 || ^19`) ·
Tailwind CSS 4.3 · Biome 2.6 · Vitest 5 (browser mode, Playwright provider) · Playwright 1.64 ·
Storybook 10.6 · Vite 8 · Changesets (fixed versioning).

## Repository map

```
packages/tokens   design tokens (TS source of truth → tokens.css / tokens.json)
packages/styles   prebuilt CSS (components in @layer components) + Tailwind v4 theme.css
packages/core     framework-free behavior + anatomy, shared by react and html
packages/react    React components
packages/html     HTML Core Runtime, snippets (src/components/*/examples), CDN IIFE bundle
apps/storybook    Foundations guides (src/foundations/*) + component stories (one per section, Framework toolbar, ADR-0018)
e2e               Playwright: parity, interactions, themes, a11y, plain-HTML, visual
examples          plain-html consumer example (uses dist)
specs/components  component contracts — update before code
docs              architecture.md, roadmap.md, testing.md, adr/
scripts           check-boundaries, check-size, check-packages, sync-versions
```

## Commands

```sh
pnpm install
pnpm build                                  # required before tests (they load built CSS)
pnpm test                                   # unit/component, Chromium
VITEST_BROWSERS=chromium,firefox,webkit pnpm test
pnpm storybook                              # http://localhost:6006
pnpm storybook:network                      # same, reachable from other devices (LAN, Tailscale; WSL: mirrored networking)
pnpm storybook:build && pnpm test:e2e       # Chromium, Firefox, WebKit, mobile
pnpm lint:fix
pnpm check                                  # everything CI runs
```

## Slash commands (`.claude/commands/`)

| Command | Use |
|---|---|
| `/component <url> [name]` | Create or update a component from a reference page: capture, propose (gap table + API impact on update), then build it the project's way (React + HTML) with viewport matrix, visual regression, coverage and security checklist |
| `/integrate [component]` | Backward-compatible updates: find every wait on a component that now exists, re-capture dependents from their spec's Reference URL, report (unlocked vs other gaps), then implement the approved items via `/component` Update |
| `/implement <component or file>` | Build/upgrade a feature in React + HTML with tests, parity, docs |
| `/refactor <file>` | Clarity only — no logic, API or DOM change |
| `/optimize <file>` | Bytes, main-thread work, leaks — measured before/after |
| `/doc <package or component>` | Package README or component spec + docs pages |
| `/check-staged` | Impact report of staged changes (read-only) |
| `/commit [message]` | Conventional commits from staged changes, after confirmation |
| `/update-ai-knowledge-base` | Bring CLAUDE.md, AGENTS.md, docs, ADRs, specs in sync with code |
| `/audit-ai-knowledge-base` | Read-only audit of the knowledge base |
| `/ai-readiness-review` | Simulate a new agent; score AI readiness (read-only) |

## Key decisions (details in docs/adr/)

- Styling via `data-ok-*` attributes; zero-specificity `:where()` selectors in `@layer components`;
  no `--tw-*` in dist (ADR-0003).
- Behavior implemented once in `core` controllers that report intent (`onDismiss`) (ADR-0004).
- HTML runtime: registry + document-level delegation + MutationObserver, idempotent (ADR-0005).
- Baseline Chrome/Edge 114, Firefox 128, Safari 17; feature detection + visible fallbacks (ADR-0006).
- Only three `Symbol.for` globals; runtime protocol/version policy (ADR-0007).
- React ⟷ HTML never import each other; enforced by lint + scripts (ADR-0008).
- Brand colors follow the reference (white on fills, `main` text; ADR-0014); neutral and soft
  text are AA-tested.
- Component API comes from the upstream component (MUI…), mapped prop by prop; one option schema
  per component in `core` drives React, HTML, Controls and parity (ADR-0015).
- Storybook: one story per component section; the toolbar's Framework menu picks HTML or React (ADR-0018).
- Every component has a Storybook usage guide page (Docs), built like the Foundations guides; `/doc <component>` refreshes spec + page (ADR-0019).
- Theme settings are data attributes: `data-ok-preset`, `data-ok-font` (nest like `data-ok-theme`);
  font size = root `font-size` (ADR-0017).

## Local environment notes

- pnpm 12 is a native binary corepack can't run: it is installed with `npm i -g pnpm` and
  `corepack disable pnpm` was applied.
- Docker daemon is usually off; visual baselines must only be generated inside Docker.
  Don't start Docker Desktop without asking.

@AGENTS.md
