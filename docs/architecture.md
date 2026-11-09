# Architecture

Owlky ships every component twice — React and pure HTML — from one design system.
Decisions and their reasons are in [`adr/`](adr/README.md); this page is the map.

```
                 specs/components/*.md   (anatomy, API, keyboard, ARIA — the contract)
                              │
   ┌──────────────┐    ┌──────┴───────┐    ┌───────────────────────────────┐
   │   tokens     │───▶│    styles    │    │             core              │
   │ TS → --ok-*  │    │ prebuilt CSS │    │ anatomy maps · controllers ·  │
   └──────────────┘    └──────┬───────┘    │ focus · layer stack · scroll  │
                              │            └───────┬───────────────┬───────┘
                              │ same CSS           │               │
                    ┌─────────┴─────────┐  ┌───────┴──────┐  ┌─────┴───────────────┐
                    │  any HTML page    │  │    react     │  │        html         │
                    │  data-ok-* markup │◀─┤ components   │  │ Core Runtime +      │
                    └───────────────────┘  └──────────────┘  │ snippets + CDN IIFE │
                                                             └─────────────────────┘
            react ✕ html: never import each other (ADR-0008)
```

## One component, end to end

Button is the model for how a component spans the packages:

| Piece | Where | What |
|---|---|---|
| Spec | `specs/components/<name>.md` | Anatomy, options, keyboard, ARIA, events |
| Anatomy | `core/src/anatomy/anatomy.ts` | Option schema `<name>Options` (drives React props, HTML attributes, Controls, parity; ADR-0015) + `<name>Attributes(options)` |
| Behavior | `core/src/<name>/` | Controller shared by React and HTML (reports intent, owns no state) |
| Styles | `styles/src/components/<name>.css` | `:where([data-ok-<name>…])` in `@layer components` |
| React | `react/src/<name>/<name>.tsx` | Component(s); state → controller |
| HTML | `html/src/components/<name>/` | Definition (if it needs JS) + `examples/*.html` snippets |
| Docs | `apps/storybook/src/components/<name>/` | One story per reference section, framework picked in the toolbar (ADR-0018); usage guide page `<name>-docs.tsx` (ADR-0019) |
| E2E | `e2e/tests/*.spec.ts` | Same tests for both implementations + parity |

Foundations (colors, typography, shadows, grid, icons, settings) are documented in
`apps/storybook/src/foundations/`, generated from `@owlky/tokens`.

Third-party runtime code stays behind its own entry point so the default bundles never carry it:
Tiptap is a `core` dependency reached only through `@owlky/core/editor` (ADR-0023). The Chart's
SVG engine is our own code in `core/src/chart/` and ships in the default bundles (ADR-0024).

## Runtime lifecycle (HTML)

```
<script defer src="owlky.js">
  └─ getRuntime()            page singleton (Symbol.for slot; version policy, ADR-0007)
      └─ register(...components)   first definition per name wins
      └─ start()             idempotent
          ├─ delegated listeners on document (one per event type & phase)
          ├─ MutationObserver: added → init(subtree) · removed → sweep (destroy + abort)
          └─ init(document): mount every registered root, e.g. [data-ok-<name>] (skips [data-ok-runtime="off"])
```

## Page-wide state

Exactly three `Symbol.for` slots: the runtime, the overlay layer stack and the scroll-lock
counter (ADR-0007). React and HTML overlays therefore stack and lock scroll correctly together.

## Distribution

| Audience                      | Install                                          | CSS                                                | JS                                                                                |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| HTML / CDN                    | none                                             | `@owlky/html/dist/owlky.css` | `@owlky/html/dist/owlky.js` (`defer`)                       |
| npm, no framework             | `@owlky/html`                         | `@owlky/styles/owlky.css`    | `import "@owlky/html/auto"` or `getRuntime().register(...components).start()` |
| React                         | `@owlky/react` + `styles`             | `@owlky/styles/owlky.css`    | components                                                                        |
| Tailwind v4 users             | + `@import "@owlky/styles/theme.css"` | utilities mapped to tokens                         | —                                                                                 |
| Standalone CSS-only component | none                                             | `tokens.css` + `components/<name>.css`             | none                                                                              |
| Illustrations (opt-in, ADR-0040) | as above                                    | included in `owlky.css`                            | snippets need none; CDN: `owlky-illustrations.js` after `owlky.js`; npm: `import "@owlky/html/illustrations"` or `createIllustration([…])`; React: `Illustration` + `@owlky/core/illustrations` (tree-shaken) |
| Editor (opt-in, ADR-0023)     | as above                                         | included in `owlky.css`                            | CDN: `owlky-editor.js` after `owlky.js`; npm: `import "@owlky/html/editor"` or `createEditor()`; React: `Editor` (tree-shaken) |
