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

## One component, end to end (Dialog)

| Piece    | Where                                   | What                                                                                 |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Spec     | `specs/components/dialog.md`            | Anatomy, options, keyboard, ARIA, events                                             |
| Anatomy  | `core/src/anatomy/anatomy.ts`           | `dialogAttributes({ size })`                                                         |
| Behavior | `core/src/dialog/dialog-controller.ts`  | showModal/fallback, focus in/out, Escape, backdrop, stacking, scroll lock            |
| Styles   | `styles/src/components/dialog.css`      | `:where([data-mt-dialog…])` in `@layer components`                                   |
| React    | `react/src/dialog/dialog.tsx`           | Compound components; state → controller                                              |
| HTML     | `html/src/components/dialog/`           | `dialog.ts` definition (controller + delegated triggers), `examples/*.html` snippets |
| Docs     | `apps/storybook/src/components/dialog/` | React + HTML stories, HTML docs page                                                 |
| E2E      | `e2e/tests/*.spec.ts`                   | Same tests for both implementations + parity                                         |

## Runtime lifecycle (HTML)

```
<script defer src="minimal-tailwind.js">
  └─ getRuntime()            page singleton (Symbol.for slot; version policy, ADR-0007)
      └─ register(dialog…)   first definition per name wins
      └─ start()             idempotent
          ├─ delegated listeners on document (one per event type & phase)
          ├─ MutationObserver: added → init(subtree) · removed → sweep (destroy + abort)
          └─ init(document): mount every [data-mt-dialog] (skips [data-mt-runtime="off"])
```

## Page-wide state

Exactly three `Symbol.for` slots: the runtime, the overlay layer stack and the scroll-lock
counter (ADR-0007). React and HTML overlays therefore stack and lock scroll correctly together.

## Distribution

| Audience                      | Install                                          | CSS                                                | JS                                                                                |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| HTML / CDN                    | none                                             | `@minimal-tailwind/html/dist/minimal-tailwind.css` | `@minimal-tailwind/html/dist/minimal-tailwind.js` (`defer`)                       |
| npm, no framework             | `@minimal-tailwind/html`                         | `@minimal-tailwind/styles/minimal-tailwind.css`    | `import "@minimal-tailwind/html/auto"` or `getRuntime().register(dialog).start()` |
| React                         | `@minimal-tailwind/react` + `styles`             | `@minimal-tailwind/styles/minimal-tailwind.css`    | components                                                                        |
| Tailwind v4 users             | + `@import "@minimal-tailwind/styles/theme.css"` | utilities mapped to tokens                         | —                                                                                 |
| Standalone CSS-only component | none                                             | `tokens.css` + `components/<name>.css`             | none                                                                              |
