# ADR-0009: Build, distribution and publishing

**Status:** Accepted — the *Publishing* trigger is superseded by ADR-0012 (release tags)

## Decision

- **ESM only**, TypeScript declarations next to every module. `tsc` emits one file per source
  module (best tree-shaking, keeps `"use client"` per module, no bundler for npm output).
- The only bundled artifact is the HTML IIFE (`vite build`), targeting the ADR-0006 baseline.
- CSS is compiled by `@tailwindcss/cli` (ADR-0003). `@owlky/html` also ships the full
  stylesheet and the snippets, so CDN users need a single package path.
- `sideEffects`: `false` for core/react; CSS and `html/auto` are listed explicitly.
- React and React DOM are **peer** dependencies `^18.3.0 || ^19.0.0` (components use
  `forwardRef`, so 18.3 works).
- **Versioning:** Changesets in _fixed_ mode — all five packages share one version. SemVer;
  `0.x` until 1.0. `pnpm version-packages` also syncs the runtime `VERSION` constant.
- **Publishing:** GitHub Actions on `main` with npm trusted publishing (OIDC) and provenance.
  Nothing is published from a laptop.
- **Package validation (CI):** `publint --strict`, `@arethetypeswrong/cli --profile esm-only`,
  boundary checks, gzip size budgets (`scripts/check-size.mjs`).
- **Supply chain:** lockfile committed; pnpm blocks install scripts except an explicit allowlist
  (`allowBuilds` in `pnpm-workspace.yaml`); `pnpm audit` in CI; Renovate for updates; exact
  versions for dev tooling.

## Consequences

- Consumers on CommonJS-only toolchains must use `import()` (Node 22+ supports `require(esm)`).
- Repository URLs in package.json contain `OWNER` until the GitHub repo exists.
