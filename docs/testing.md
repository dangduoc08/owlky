# Testing

| Command                                             | What                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm test`                                         | Unit/component tests (Node + real Chromium). Needs `pnpm build` once (tests load the built CSS). |
| `VITEST_BROWSERS=chromium,firefox,webkit pnpm test` | Same in all three engines (CI runs them one engine per job, see below).                           |
| `pnpm test:node` / `pnpm test:browser`              | Only the Node projects (tokens, styles, mcp) / only the browser projects (core, react, html); `VITEST_BROWSERS` picks the engines. |
| `pnpm storybook:build && pnpm test:e2e`             | Playwright: parity, interactions, themes, a11y, plain HTML — Chromium, Firefox, WebKit, mobile.  |
| `pnpm test:visual`                                  | Visual regression in the Playwright Docker image (Docker required).                              |
| `pnpm test:visual:update`                           | Regenerate baselines (Docker). Never commit baselines made outside Docker: the **Visual baselines** workflow makes them (see below). |
| `pnpm check`                                        | Everything CI runs, in order.                                                                    |
| `pnpm check:manifest`                               | Regenerates the MCP manifest (ADR-0071) and fails when the committed one differs.               |
| `pnpm check:api`                                    | Regenerates the API reference (ADR-0049, `apps/docs-content/src/api/*.json`) and fails when a file differs or a prop, `data-ok-*` name, event or method is undocumented. `pnpm api` writes it. |
| `pnpm website:build` then `pnpm --filter @owlky/e2e test:website` | The website's production build served by `next start` with PGlite in memory and the mock OAuth providers (ADR-0040, ADR-0071): every page renders, axe light + dark, phone width, internal links and `.md` copies, the Copy button, search (Pagefind), **Open HTML demo**, theme menus; accounts (`accounts.spec.ts`, serial: guests, GitHub / Google sign-in, tokens, opt-in, sign-out, deletion, an MCP client's OAuth sign-in through the login and consent pages) — `e2e/website/`, config `e2e/website.config.ts` (port 4400; `PORT` for worktrees; one project at a time, since the projects share the server's test people). CI job `website`. |
| `pnpm vitest run --project website` | The website's server code (ADR-0071) in Node: sign-in through the mock providers, CSRF, cookies, tokens, deletion, OAuth 2.1 (registration, PKCE, consent, scopes), the MCP transport, rate limit and usage counts, discovery documents. In `pnpm test:node`. |
| `pnpm --filter @owlky/website smoke:mcp` | HTTP smoke test of `/mcp` against the website build (starts `next start` and the mock providers itself): discovery from a 401, sign-in, a token, OAuth with PKCE, tools. No secrets; CI job `website` (chromium). |
| `pnpm check:docs` | Checks the code of every guide section (Storybook, `apps/docs-content`, the website's `src/content`): placeholders, unknown `data-ok-*` names, React examples typecheck. In `pnpm check` and the CI `check` job; pass page names to check a few. |

First run: `pnpm exec playwright install chromium firefox webkit`.

CI (`.github/workflows/ci.yml`, also reused by `release.yml` through `workflow_call`) runs these
jobs in parallel:

- **Lint, types, build, checks** (`check`): lint, build, typecheck, `check:boundaries`,
  `check:size`, `check:packages`, `check:specs`, `check:api`, `check:docs`, `check:manifest`, then
  `pnpm test:node`. No browser is installed.
- **Unit (chromium | firefox | webkit)** (`unit`): one runner per engine builds, installs only that
  browser and runs `xvfb-run -a pnpm test:browser` with `VITEST_BROWSERS=<engine>` (Xvfb gives
  headless Firefox WebGL for the Map). One runner with all three engines (about 15,000 tests) ran
  out of memory. Each job builds itself rather than downloading the build: the build is short and
  the `dist` folders are about 45 MB.
- **E2E (project shard)**, **Website (project)** and **Dependency audit**.

`pnpm check` still runs everything locally in one go (`pnpm test`: every project, Chromium unless
`VITEST_BROWSERS` says otherwise).

Also: `pnpm test:coverage` (v8 coverage, thresholds per component file in `vitest.config.ts`);
`e2e/tests/<name>.responsive.spec.ts` runs the viewport matrix from `e2e/tests/viewports.ts`
(375, 430, 768, 1280, 1440); `e2e/tests/csp.spec.ts` loads `examples/csp/` under a strict
CSP + Trusted Types and fails on any violation; visual baselines cover every story × theme ×
viewport, plus a sample of stories per opt-in design style.

Design styles (ADR-0070 § 7, ST6):
- **AA matrix, data:** `packages/tokens/src/roles.test.ts` checks every role pair for every style
  × light / dark × surface default / contrast × contrast default / high: text, palette tones,
  soft tints and fills, contrast text, gradients, inherit, borders, focus rings, chart series,
  dividers and neutral text on the action overlays (hovered, selected, focused rows).
- **AA matrix, CSS:** `packages/core/src/theme/theme-settings.test.ts` (browser) loads the core
  sheet with every opt-in sheet and checks that each nested scope of those 72 combinations
  resolves every text, palette, surface and border token to exactly the tested value.
- **Axe per style:** `e2e/tests/styles.spec.ts` (`@styles`, Chromium only) scans a sample of
  stories (`e2e/tests/style-sample.ts`: Button, Text field, Chip, Alert, Card, Tabs, Data grid
  and an open Dialog) in every style, light and dark, through the `style` global
  (`&globals=style:<id>`). It runs in CI's chromium e2e shards like any other spec. Fix a failure
  in the generator or the style definition, never with an exemption.
- **Size:** `check:size` has a budget per style sheet (`STYLE_SHEET_BUDGETS`).

Writing tests:
- Behavior lives in `core` → test it there in both native and fallback mode (`forceFallback`).
- React/HTML tests assert user-visible behavior (roles, focus, keyboard), not implementation.
- New components get a parity entry in `e2e/tests/parity.spec.ts` (the same story rendered as React
  and as HTML, ids `components-<name>--<story>@react|@html`, ADR-0018) and an entry in
  `options-parity.spec.ts` (each Controls option set to a non-default value gives the same DOM in
  both, ADR-0015). Charts compare their SVG trees in `chart.spec.ts` (parity skips `<svg>`).
- Stories need no test registration: `a11y.spec.ts` and `visual.spec.ts` read every story id from
  the built Storybook `index.json` (`storyIds()` in `e2e/tests/helpers.ts`, once per framework for
  component stories); `foundations.spec.ts` runs the small-screen check on `foundations-*` stories.
  Docs pages are registered by hand (`GUIDES`, `OPTION_TABLES` in `foundations.spec.ts`);
  `API_PAGES` (derived from them) checks that each page's API reference renders one
  `data-docs-api-row` per generated prop, option, part, event, method, type and CSS variable.
- API reference (ADR-0049, Node): `packages/mcp/src/api-reference.test.ts` checks, from the
  manifest, that the reference lists every schema option, every `data-ok-*` name of every snippet,
  every literal event a runtime emits and every exported React component, all described.
- MCP server (`packages/mcp`, private `@owlky/mcp-server`, Node): `generator.test.ts` runs `scripts/manifest.mjs` twice (same
  bytes, sorted keys) and checks that every option schema, spec, snippet, guide, token and story
  (HTML and React code) is in it; `server.test.ts` drives every tool, resource and prompt through the
  SDK's in-memory transport (unknown names, invalid input, the markup size limit);
  `validate.test.ts` validates every story's HTML with zero issues, so a new part or attribute that
  the validator would reject fails there.
- Parallel worktrees: `PORT=4322 pnpm test:e2e` serves each build on its own port (default 4321).
  Never run two e2e runs in one working tree.

## Visual baselines

Baselines are made only in the pinned Playwright image (fonts and anti-aliasing must match CI),
so they come from a CI workflow, never from a local run:

1. On GitHub, open **Actions** › **Visual baselines** › **Run workflow** and pick the branch.
   Leave **grep** empty to regenerate every baseline (images of removed stories go away), or
   enter a title pattern (for example `nordic style`) to update only those tests.
2. The workflow (`.github/workflows/visual-baselines.yml`) builds the packages and Storybook in
   `mcr.microsoft.com/playwright:v<version>-noble` (it fails when the tag and `@playwright/test`
   differ), runs the `@visual` tests with `--update-snapshots` on Chromium in four shards, and
   opens a pull request `test(e2e): update visual baselines` from `visual-baselines/<run id>`.
   No pull request is opened when nothing changed.
3. Review the images in the pull request and merge it. A pull request opened with the
   workflow's token does not start CI on its own: close and reopen it to run the checks. From
   then on the `e2e` chromium job compares against the committed baselines.

The workflow has `contents: write` and `pull-requests: write` in its last job only. The
repository setting **Settings** › **Actions** › **General** › **Allow GitHub Actions to create
and approve pull requests** must be on. Update the image tag in `ci.yml` and this workflow
together with `@playwright/test`.

## Parallel agents and verification tiers (owner, 2026-11-13)

Goal: several agents in parallel without exhausting the machine, while every browser and the
mobile viewport stay green.

| Tier | Where | What runs |
|---|---|---|
| 1. Each agent | its own git worktree, locally | lint, typecheck, `pnpm build`, `pnpm check`, unit tests of the touched packages on Chromium, e2e of the affected specs on `chromium` and `mobile` (`--workers=2`, own `PORT`) |
| 2. Integration | branch `integration/<batch>` + a pull request to `main` | CI's full matrix (`ci.yml` runs on `pull_request`): `check`, unit × Chromium / Firefox / WebKit, e2e shards for chromium, firefox, webkit and mobile |
| 3. Main | `main` | merged only when the integration PR is green; CI runs again on the push |
| 4. End of a roadmap | locally, once, sequentially (overnight) | `pnpm check`, unit × 3 engines, `pnpm storybook:build`, the full e2e for all four projects, `pnpm website:build` + the website e2e; issues are fixed in follow-up commits through tiers 2–3 |

- Every heavy local command (`pnpm build`, `pnpm check`, vitest, `storybook:build`,
  `website:build`, Playwright) is wrapped in a shared lock so only one runs at a time across
  agents: `flock /tmp/owlky-heavy.lock <command>`. WSL crashed when several agents ran full
  suites at once.
- Agents in parallel: **3 by default, at most 4** (owner, 2026-11-13; WSL 20 GB, 12 CPUs). The
  limit is the `flock` queue, merge conflicts and token use, not RAM: use 4 only for truly
  independent work (separate components or styles), 1–2 near the end of the weekly token budget
  or when tasks depend on each other.
- Changes to shared code (tokens, icons, shared helpers, base CSS such as `paper.css`,
  `typography.css`, `icon.css`, generators) add a broad, cheap check to tier 1: the parity
  **anatomy** test for every story on chromium (`parity.spec.ts -g "identical anatomy"`, no
  screenshots). Batch 1 showed why: ST2 changed icons in 114 places, ran only some specs, and
  CI found Chip and Transfer list out of parity.
- A CI failure goes back to the agent that owns the area, not to whoever merged last.
- A failure that passes 3 out of 3 when rerun alone is a flake: record it and make the test robust.
- Visual baselines are generated in Docker by the `workflow_dispatch` workflow **Visual
  baselines** (see "Visual baselines" above), never locally.

## Known flaky tests

A test lands here when it fails and then passes 3 out of 3 when rerun alone. Each entry is
fixed by making the test robust (wait for the right event, never a fixed delay), then removed.

| Test | Engine | Seen | Notes |
|---|---|---|---|
| e2e `parity` › `carousel / thumbs-y` pixels | all, under load | before Wave 8 (c18065b) | raster history of the selected thumbnail ring; `repaintFromScratch` helped, not fully |
| e2e `data-grid.spec.ts` › range charts and cross-filtering | WebKit | 2026-11-13, PR #1 | passed on retry |
| e2e `foundations` › chart docs fits a phone | WebKit | 2026-11-13, PR #1 and PR #2 | passed on retry |
| e2e `carousel.spec.ts` › html › scrolling the viewport (a swipe) selects the nearest slide | WebKit | 2026-11-13, PR #2 | 3/3 alone |
| unit `carousel-controller.test.ts` › goTo takes a direction around a loop | Chromium | 2026-11-12 | under parallel builds |
| unit `carousel-controller.test.ts` › ignores keys from inside slides | Chromium | 2026-11-13 (ST4a `pnpm check`) | full suite under load; 3/3 alone |
| unit `data-grid-menu.test.tsx` | Chromium | 2026-11-12 | under load |
| unit toaster hover test (`snackbar.test.tsx` › auto-closes after the duration) | Chromium | 2026-11-13 (twice: also ST3 `pnpm check`) | under load; 3/3 alone |
| unit `drawer.test.tsx`, `walktour.test.ts`, `tooltip.test.ts` | Chromium / WebKit | 2026-11-12 (S2) | under load |

