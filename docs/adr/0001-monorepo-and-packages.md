# ADR-0001: Monorepo with five packages and strict boundaries

**Status:** Accepted

## Context

Two complete implementations (React, pure HTML) must look and behave identically without either
depending on the other's runtime, and consumers must install only what they use.

## Decision

A pnpm workspace with five published packages and three private workspaces:

```
@owlky/tokens   design tokens (TS source of truth → CSS vars, JSON)
@owlky/styles   prebuilt CSS for all components + Tailwind v4 theme      ← tokens
@owlky/core     framework-free behavior + anatomy, shared by both        ← tokens (types)
@owlky/react    React components                                         ← core
@owlky/html     HTML Core Runtime + snippets + CDN bundle                ← core
apps/storybook (private)   docs for both implementations side by side
e2e (private)              Playwright: parity, a11y, themes, plain HTML, visual
examples/* (private)       consumer examples built from dist
```

`react` and `html` never import each other (ADR-0008). Shared _specifications_ live in
`specs/components/*.md`; shared _code_ lives in `core` and `styles`.

## Consequences

- Every component change touches up to five places (spec, core, styles, react, html). The
  checklist in `AGENTS.md` keeps this predictable.
- Versions are fixed across packages (ADR-0009), so consumers never mix incompatible versions.
