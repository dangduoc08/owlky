# Component completion roadmap

Tracks one goal: **every Owlky component is complete and fully documented** before the website
continues (owner's decision 2026-11-09). The project-wide plan is in [`roadmap.md`](roadmap.md)
("After the waves", step 5).

**Complete means:** every component matches its upstream (MUI, MUI X, Sonner, Tiptap,
react-joyride, Embla, MapLibre, ApexCharts) except what an ADR rules out (`sx`, `slots`, `classes`,
MUI transition components); every docs page carries the full API reference; nothing is left in
`roadmap.md` → "Pending integrations"; CI is green on `main`.

**How items ship:** `/component <name>` in Update mode (additive, never breaking without a listed
migration), three at a time in worktrees, React + HTML + parity + docs + `pnpm manifest`. Shadows and
every other value from tokens.

**Status:** ⬜ to do · 🔄 in progress · ✅ done · ⏸ deferred with a reason. Update the row in the same
review that changes it.

## Phase 1 — Stability

| # | Item | Detail | Status |
|---|---|---|---|
| 1.1 | CI unit job per browser | split "Lint, types, build, unit tests" into one unit job per browser (chromium, firefox, webkit), like the e2e shards: one runner ran about 15,000 tests in three browsers and crashed a page on 2026-11-09 | ⬜ |
| 1.2 | Flaky: editor image form | `packages/html/src/components/editor/editor.test.ts` "inserts an image; an invalid form stays open" (Chromium, CI 2026-11-09) | ⬜ |
| 1.3 | Flaky: button soft colors | `packages/html/src/components/button/button.test.ts` `soft-colors.html: no axe violations` (Firefox, CI 2026-11-09) | ⬜ |
| 1.4 | Flaky: carousel thumbs-y | e2e parity `carousel / thumbs-y` pixels, about 2 of 60 runs under load (already before Wave 8; image decode and scroll settle waits didn't fix it) | ⬜ |
| 1.5 | Carousel `loop` resize | with `loop`, a viewport resize jumps to another slide; the landing page turns `loop` off until fixed | ⬜ |

**Done when:** three green CI runs in a row on `main`.

## Phase 2 — ApexCharts parity

Commercial add-ons of ApexCharts: behavior and API only, our own code, data and images.

| # | Item | Detail | ADR | Status |
|---|---|---|---|---|
| 2.1 | Sankey | `sankey` chart type in the engine: column layout with relaxation, link widths by value, palette colors, labels, hover and keyboard on nodes and links, links as an HTML `<table>` | 0047 | ⬜ |
| 2.2 | Stock charts | indicators computed in core (SMA, EMA, Bollinger Bands, RSI, MACD, volume, others ApexStock lists), panes on one time axis, navigator / range selector (zoom window and brush, ADR-0031), crosshair readout, period buttons | 0047 | ⬜ |
| 2.3 | Gantt | new component: task tree + timeline, day → year scales, today line, weekends, milestones, summary tasks, dependencies, drag to move / resize / set progress with keyboard alternatives (WCAG 2.5.7), selection, tooltips, virtualization, HTML data as a `<table>` | 0048 | ⬜ |
| 2.4 | Parity audit | ApexTree ↔ Organization chart / Tree view, ApexGrid ↔ Data grid, ApexMaps ↔ Map (a choropleth map?), Chart Editor (a builder from the Chart option schema?) → new rows in Phase 4, batch E | — | ⬜ |

## Phase 3 — Upstream API audit and a complete API reference

| # | Item | Detail | Status |
|---|---|---|---|
| 3.1 | Upstream audit | all 62 components, prop by prop against the upstream API pages; a mapping table in each spec (kept · renamed · deferred · not applicable); every gap becomes a row in Phase 4, batch E | ⬜ |
| 3.2 | Structured API data | React prop types, option schemas (ADR-0015), the anatomy's part attributes, triggers, events (`ok:<component>:<event>` with `detail`), instance methods and the public `--ok-*` variables each component reads, per component and per part, exported as data and added to the MCP manifest (ADR-0046) | ⬜ |
| 3.3 | API reference on every docs page | generated tables (not hand-written) in each Storybook docs page: React props, HTML attributes (options and their values, parts, triggers), events, methods, CSS variables / tokens — for the component and each of its parts (Card → CardHeader, CardMedia…). The website (ADR-0040) reads the same data | ⬜ |
| 3.4 | Completeness check | a test fails when a schema option, a `data-ok-*` name used in the snippets, an event, a method or a React prop is missing from the docs page (extends `foundations.spec.ts` `OPTION_TABLES` and `check:docs`) | ⬜ |
| 3.5 | Controls unchanged | Storybook's Controls panel keeps following `/component`: only options that change every example at once, from the option schema. The full reference lives in the docs page | — |

## Phase 4 — Close every gap

Known *Deferred* items today; the audits of phases 2 and 3 add rows to batch E. Batch F spreads the
reference's Utilities page over the components it belongs to (order: 4.19, 4.20, 4.21, 4.26 first,
then 4.22–4.24, then 4.25 with its ADR).

| # | Batch | Component | Missing today | Status |
|---|---|---|---|---|
| 4.1 | A — inputs | Autocomplete | `groupBy`, `loading` / `loadingText`, virtualization, `autoSelect`, `blurOnSelect`, `clearOnEscape`, `selectOnFocus`, `includeInputInList`, `ListboxComponent` | ⬜ |
| 4.2 | A | Slider | `scale`, `shiftStep` | ⬜ |
| 4.3 | A | Switch | `icon` / `checkedIcon` | ⬜ |
| 4.4 | A | Upload | hook API (`getRootProps` / `getInputProps`, react-dropzone style) | ⬜ |
| 4.5 | B — overlays, navigation | Menu | nested menus, `variant="menu"` | ⬜ |
| 4.6 | B | Tooltip | `followCursor`, `enterNextDelay` | ⬜ |
| 4.7 | B | Popover | `anchorPosition` / `anchorReference`, `marginThreshold` | ⬜ |
| 4.8 | B | Dialog | `keepMounted` (exit transitions come with Phase 5) | ⬜ |
| 4.9 | B | Drawer, Backdrop | `elevation`, `transitionDuration` | ⬜ |
| 4.10 | B | Stepper | `nonLinear`, `StepButton`, Step `expanded` / `last` | ⬜ |
| 4.11 | C — data display | Tree view | drag and drop (`itemsReordering`), lazy loading, label editing, `selectionPropagation`, `apiRef`, `getItemId` / `getItemLabel` | ⬜ |
| 4.12 | C | Avatar group | any `spacing` (today `medium` / `small`) | ⬜ |
| 4.13 | C | Linear progress | right to left | ⬜ |
| 4.14 | C | Snackbar | swipe to dismiss, `expand` / stacked collapse, `richColors`, `hotkey`, `offset` / `gap`, per-toast `position` | ⬜ |
| 4.15 | D — heavy | Data grid | `rowGroupingColumnMode="multiple"`, `groupingValueGetter`, group footers, server-side aggregation, `getPivotDerivedColumns`, pivot panel drag and drop, one chart per grid | ⬜ |
| 4.16 | D | Editor | Tiptap `extensions` / `editorProps` pass-through, bubble menus, tables, mentions, a form `name` | ⬜ |
| 4.17 | D | Walktour | `before` / `after` hooks, `targetWaitTimeout`, `beaconTrigger: "hover"`, `closeButtonAction`, `scrollTarget`, `spotlightTarget`, `isFixed`, `disableFocusTrap`, `beaconPlacement`, `scrollDuration` | ⬜ |
| 4.18 | E — from the audits | any | rows added by 2.4 and 3.1 | ⬜ |
| 4.19 | F — Minimals Utilities, spread across components (owner's decision 2026-11-09: no Utilities group) | Typography (+ Link) | "Text max line": a `maxLines` option (CSS `line-clamp`, beside `noWrap`), a "Text max line" story with 1–4 lines and "As link" | ⬜ |
| 4.20 | F | Text field (+ Snackbar) | "Copy to clipboard": a copy IconButton in an end adornment and copy on double click, a core helper on a user gesture with the refused path handled, a "Copied" toast | ⬜ |
| 4.21 | F | Foundations › Colors (+ Paper / Card, Typography) | "Gradient": `--ok-gradient-*` tokens from the palette (follow presets and dark mode), gradient text, border, background and paper examples | ⬜ |
| 4.22 | F | Motion (beside CountUp) | "Countdown": a `Countdown` (to a date, or seconds) with days / hours / minutes / seconds, a polite live region, pausable (WCAG 2.2.2) | ⬜ |
| 4.23 | F | Radio, Checkbox (+ Avatar group) | "Color pickers": single (Radio) and multiple (Checkbox) color swatches on native inputs, a "+N" color preview in the Avatar group style | ⬜ |
| 4.24 | F | Text field | "Number input": increment / decrement buttons in the adornment, `min` / `max` / `step`, Arrow / PageUp / PageDown keys, helper text, disabled | ⬜ |
| 4.25 | F | Text field (+ Select / Autocomplete) | "Phone input": country select (auto, default, fixed, international, hidden select), national / international / raw values. Needs phone metadata (for example `libphonenumber-js`): **ADR**, behind an opt-in entry like Editor / Map | ⬜ |
| 4.26 | F | Foundations › Settings (or Introduction) | "Styled": no component — a guide "Style components" with CSS variables, `data-ok-*` state selectors (`[data-ok-open]`, `:focus-visible`, `:disabled`), keyframes with tokens, Tailwind (Owlky's answer to MUI's `sx` / `styled()` / `keyframes`) | ⬜ |

## Phase 5 — Motion full version (own ADR)

| # | Step | Scope | Status |
|---|---|---|---|
| 5.1 | Engine | `animate(element, keyframes, options)` on the Web Animations API, springs as `linear()` easing, interruption from the current value, exit before removal → Dialog exit transitions and the Motion "Logo" story (the last "Pending integrations" row) | ⬜ |
| 5.2 | Scroll | scroll-linked progress (`animation-timeline`, JavaScript fallback for Firefox): the reference's Scroll progress page (`minimals.cc/components/extra/scroll-progress`, built on Framer Motion's `useScroll`) — sections "Container scroll-y", "Container scroll-x" and "Scroll document", drawn with Linear / Circular progress | ⬜ |
| 5.3 | Gestures | drag with inertia and constraints, spring hover / tap | ⬜ |
| 5.4 | Layout | layout animations (FLIP), shared values | ⬜ |
| 5.5 | Later | shared-element transitions (evaluate View Transitions first) | ⏸ |

## Phase 6 — Final sweep (owner's decision 2026-11-09)

| # | Step | Scope | Status |
|---|---|---|---|
| 6.1 | `/integrate` with the Fable model | after phases 1–5, run `/integrate` (no argument) once more, as agents on the **Fable** model (`model: "fable"`), to find and close every wait left on a component that now exists — stand-ins, deferred stories, story demo CSS for surfaces or fonts — with a fresh pair of eyes | ⬜ |
| 6.2 | Re-check | rerun the discovery of `/integrate` step 3; "Pending integrations" must be empty and the docs API reference complete (3.4 green) | ⬜ |

## Done

When every row above (phase 6 included) is ✅ or ⏸ with a reason, update `roadmap.md` step 5 to ✅ and continue with
the website (step 6).
