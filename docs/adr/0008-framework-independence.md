# ADR-0008: Framework independence, enforced

**Status:** Accepted

## Decision

- `tokens`, `styles`, `core`, `html` never depend on React; `react` never depends on `html`.
  What they share is tokens, CSS, specifications and `core` — never each other's runtime.
- React components work with no HTML runtime on the page; the HTML runtime works with no React.
- When both are present, React roots carry `data-mt-runtime="off"` and the runtime ignores them
  (e2e: "React and the HTML runtime coexist").

### Enforcement (CI fails on violation)

1. Biome `noRestrictedImports` per package (source imports).
2. `scripts/check-boundaries.mjs`: manifests (all dependency fields) and built `dist` output.
3. The CDN bundle and `dist` are checked for React imports; size budgets catch accidental inlining.

## Consequences

Storybook (dev-only, private) is the one place that renders both; it imports packages through
their public APIs only.
