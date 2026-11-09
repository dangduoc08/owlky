# Testing

| Command                                             | What                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm test`                                         | Unit/component tests (Node + real Chromium). Needs `pnpm build` once (tests load the built CSS). |
| `VITEST_BROWSERS=chromium,firefox,webkit pnpm test` | Same in all three engines (CI runs them one engine per job, see below).                           |
| `pnpm test:node` / `pnpm test:browser`              | Only the Node projects (tokens, styles, mcp) / only the browser projects (core, react, html); `VITEST_BROWSERS` picks the engines. |
| `pnpm storybook:build && pnpm test:e2e`             | Playwright: parity, interactions, themes, a11y, plain HTML — Chromium, Firefox, WebKit, mobile.  |
| `pnpm test:visual`                                  | Visual regression in the Playwright Docker image (Docker required).                              |
| `pnpm test:visual:update`                           | Regenerate baselines (Docker). Never commit baselines made outside Docker.                       |
| `pnpm check`                                        | Everything CI runs, in order.                                                                    |
| `pnpm check:manifest`                               | Regenerates the MCP manifest (ADR-0046) and fails when the committed one differs.               |
| `pnpm website:build` then `pnpm --filter @owlky/e2e test:website` | The website's static build (ADR-0040): every page renders, axe light + dark, phone width, internal links and `.md` copies, the Copy button, search (Pagefind), **Open HTML demo**, theme menus — `e2e/website/`, config `e2e/website.config.ts` (port 4400; `PORT` for worktrees). CI job `website`. |
| `pnpm check:docs` | Checks the code of every guide section (Storybook, `apps/docs-content`, the website's `src/content`): placeholders, unknown `data-ok-*` names, React examples typecheck. Not in `pnpm check` (pre-existing placeholder findings in Storybook pages); pass page names to check a few. |
| `pnpm smoke:mcp`                                    | Packs `@owlky/mcp`, starts its bin from the tarball with `npx -y` (needs the registry), and runs `initialize`, `tools/list`, `tools/call` over stdio (CI only, not in `pnpm check`). |

First run: `pnpm exec playwright install chromium firefox webkit`.

CI (`.github/workflows/ci.yml`, also reused by `release.yml` through `workflow_call`) runs these
jobs in parallel:

- **Lint, types, build, checks** (`check`): lint, build, typecheck, `check:boundaries`,
  `check:size`, `check:packages`, `check:specs`, `check:manifest`, `smoke:mcp`, then
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
viewport.

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
  Docs pages are registered by hand (`GUIDES`, `OPTION_TABLES` in `foundations.spec.ts`).
- MCP server (`packages/mcp`, Node): `generator.test.ts` runs `scripts/manifest.mjs` twice (same
  bytes, sorted keys) and checks that every option schema, spec, snippet, guide, token and story
  (HTML and React code) is in it; `server.test.ts` drives every tool, resource and prompt through the
  SDK's in-memory transport (unknown names, invalid input, the markup size limit);
  `validate.test.ts` validates every story's HTML with zero issues, so a new part or attribute that
  the validator would reject fails there.
- Parallel worktrees: `PORT=4322 pnpm test:e2e` serves each build on its own port (default 4321).
  Never run two e2e runs in one working tree.
