# Testing

| Command                                             | What                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm test`                                         | Unit/component tests (Node + real Chromium). Needs `pnpm build` once (tests load the built CSS). |
| `VITEST_BROWSERS=chromium,firefox,webkit pnpm test` | Same in all three engines (CI does this).                                                        |
| `pnpm storybook:build && pnpm test:e2e`             | Playwright: parity, interactions, themes, a11y, plain HTML — Chromium, Firefox, WebKit, mobile.  |
| `pnpm test:visual`                                  | Visual regression in the Playwright Docker image (Docker required).                              |
| `pnpm test:visual:update`                           | Regenerate baselines (Docker). Never commit baselines made outside Docker.                       |
| `pnpm check`                                        | Everything CI runs, in order.                                                                    |

First run: `pnpm exec playwright install chromium firefox webkit`.

Writing tests:
- Behavior lives in `core` → test it there in both native and fallback mode (`forceFallback`).
- React/HTML tests assert user-visible behavior (roles, focus, keyboard), not implementation.
- New components get a parity entry in `e2e/tests/parity.spec.ts` with identically named React and
  HTML stories. The file was removed with the sample components (ADR-0011): restore it with the
  first component from `git show bd5fb2d:e2e/tests/parity.spec.ts`.
- Foundations stories need no test registration: `a11y.spec.ts`, `visual.spec.ts` and the
  small-screen check in `foundations.spec.ts` read every `foundations-*` story id from the built
  Storybook `index.json` (`storyIds()` in `e2e/tests/helpers.ts`).
