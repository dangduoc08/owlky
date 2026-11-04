# Architecture

Minimal Tailwind ships every component twice — React and pure HTML — from one design system.
Decisions and their reasons are in [`adr/`](adr/README.md); this page is the map.

```
                 specs/components/*.md   (anatomy, API, keyboard, ARIA — the contract)
                              │
   ┌──────────────┐    ┌──────┴───────┐    ┌───────────────────────────────┐
   │   tokens     │───▶│    styles    │    │             core              │
   │ TS → --mt-*  │    │ prebuilt CSS │    │ anatomy maps · controllers ·  │
   └──────────────┘    └──────┬───────┘    │ focus · layer stack · scroll  │
                              │            └───────┬───────────────┬───────┘
                              │ same CSS           │               │
                    ┌─────────┴─────────┐  ┌───────┴──────┐  ┌─────┴───────────────┐
                    │  any HTML page    │  │    react     │  │        html         │
                    │  data-mt-* markup │◀─┤ components   │  │ Core Runtime +      │
                    └───────────────────┘  └──────────────┘  │ snippets + CDN IIFE │
                                                             └─────────────────────┘
            react ✕ html: never import each other (ADR-0008)
```

## One component, end to end

The removed Dialog (ADR-0011, `git show bd5fb2d:<path>`) is the reference for how a component
spans the packages:

| Piece | Where | What |
|---|---|---|
| Spec | `specs/components/<name>.md` | Anatomy, options, keyboard, ARIA, events |
| Anatomy | `core/src/anatomy/anatomy.ts` | `<name>Attributes(options)` |
| Behavior | `core/src/<name>/` | Controller shared by React and HTML (reports intent, owns no state) |
| Styles | `styles/src/components/<name>.css` | `:where([data-mt-<name>…])` in `@layer components` |
| React | `react/src/<name>/<name>.tsx` | Component(s); state → controller |
| HTML | `html/src/components/<name>/` | Definition (if it needs JS) + `examples/*.html` snippets |
| Docs | `apps/storybook/src/components/<name>/` | React + HTML stories, HTML docs page |
| E2E | `e2e/tests/*.spec.ts` | Same tests for both implementations + parity |

Foundations (colors, typography, shadows, grid, icons) are documented in
`apps/storybook/src/foundations/`, generated from `@minimal-tailwind/tokens`.

## Runtime lifecycle (HTML)

```
<script defer src="minimal-tailwind.js">
  └─ getRuntime()            page singleton (Symbol.for slot; version policy, ADR-0007)
      └─ register(...components)   first definition per name wins
      └─ start()             idempotent
          ├─ delegated listeners on document (one per event type & phase)
          ├─ MutationObserver: added → init(subtree) · removed → sweep (destroy + abort)
          └─ init(document): mount every registered root, e.g. [data-mt-<name>] (skips [data-mt-runtime="off"])
```

## Page-wide state

Exactly three `Symbol.for` slots: the runtime, the overlay layer stack and the scroll-lock
counter (ADR-0007). React and HTML overlays therefore stack and lock scroll correctly together.

## Distribution

| Audience                      | Install                                          | CSS                                                | JS                                                                                |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| HTML / CDN                    | none                                             | `@minimal-tailwind/html/dist/minimal-tailwind.css` | `@minimal-tailwind/html/dist/minimal-tailwind.js` (`defer`)                       |
| npm, no framework             | `@minimal-tailwind/html`                         | `@minimal-tailwind/styles/minimal-tailwind.css`    | `import "@minimal-tailwind/html/auto"` or `getRuntime().register(...components).start()` |
| React                         | `@minimal-tailwind/react` + `styles`             | `@minimal-tailwind/styles/minimal-tailwind.css`    | components                                                                        |
| Tailwind v4 users             | + `@import "@minimal-tailwind/styles/theme.css"` | utilities mapped to tokens                         | —                                                                                 |
| Standalone CSS-only component | none                                             | `tokens.css` + `components/<name>.css`             | none                                                                              |
