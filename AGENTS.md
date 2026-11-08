# AGENTS.md — working in this repository

Read this first (humans and AI agents). Architecture: `docs/architecture.md`. Decisions: `docs/adr/`.

## Ground rules

1. **Two implementations, one contract.** Every component has a spec in `specs/components/`. React
   and HTML must render the same `data-ok-*` anatomy and behave the same. Change the spec first.
2. **Never cross the boundary.** `tokens`, `styles`, `core`, `html` must not import React;
   `react` must not import `html` (ADR-0008 — lint + `pnpm check:boundaries` enforce it).
3. **Behavior lives in `core` once.** If React and HTML both need it, it goes in a core controller
   that reports intent (`onDismiss`) instead of mutating state on its own.
4. **CSS:** only `:where(...)` selectors inside `@layer components`; `--ok-*` tokens for every
   value; `@apply` only for utilities that compile to plain declarations (no `--tw-*`).
5. **Native first.** `<dialog>`, `popover`, native inputs. Feature-detect via `supports` and
   implement the documented fallback (ADR-0006).
6. **Global state:** only the three `Symbol.for` slots in ADR-0007. Anything else is module- or
   instance-scoped. Changing a shared shape = bump its protocol.
7. **No `innerHTML` in library code** (tests and Storybook snippets only), no `stopPropagation`,
   no new runtime dependencies without an ADR.

## Naming

| Thing                 | Convention                            | Example                        |
| --------------------- | ------------------------------------- | ------------------------------ |
| Root / part attribute | `data-ok-<component>[-<part>]`        | `data-ok-dialog-title`         |
| Modifier              | `data-ok-variant/color/size/…`        | `data-ok-size="sm"`            |
| HTML trigger          | `data-ok-<component>-<action>="<id>"` | `data-ok-dialog-open="x"`      |
| HTML option           | `data-ok-<option>`                    | `data-ok-disable-escape-key-down` |
| Event                 | `ok:<component>:<event>`              | `ok:dialog:beforeclose`        |
| Public CSS variable   | `--ok-<group>-<name>`                 | `--ok-palette-primary-main`    |
| Private CSS variable  | `--_ok-<name>` (component-internal)   | `--_ok-main`                   |
| Files                 | kebab-case; one component per folder  | `dialog-controller.ts`         |

## Adding a component (checklist)

1. `specs/components/<name>.md` (template in `specs/README.md`). Its Options table is generated:
   add `<!-- options:<schema> -->` / `<!-- /options:<schema> -->` markers and the schema to
   `scripts/spec-options.mjs`, then `pnpm build && pnpm specs:options` (`check:specs` in CI).
2. `core/src/anatomy/anatomy.ts`: the option schema `<name>Options` (`defineOptions`, ADR-0015) and
   `<name>Attributes()` built from it (`optionAttributes`); behavior → `core/src/<name>/` + tests
   (native **and** fallback paths), exported from `core/src/index.ts`.
3. `styles/src/components/<name>.css` + `@import` in `styles/src/index.css`. (First component
   only: restore the `"./components/*": "./dist/components/*"` export in `styles/package.json`.)
4. `react/src/<name>/<name>.tsx` + `<name>.test.tsx` (behavior + axe), export from `react/src/index.ts`.
   Interactive roots render `data-ok-runtime="off"`; files with hooks start with `"use client"`.
5. `html/src/components/<name>/examples/*.html` (canonical snippets; first component only: restore
   the `"./snippets/*": "./dist/snippets/*"` export in `html/package.json`). If it needs JS:
   `<name>.ts` (`defineComponent`) + tests, one line in `html/src/components/index.ts`.
6. Storybook: `apps/storybook/src/components/<name>/<name>.stories.tsx`, title
   `Components/<Name>` — **one story per reference section, every framework in it** (ADR-0018):
   `frameworkStory({ html: snippetStory(…, htmlSetup(css, runtime)), react: reactGroupsStory(…) })`.
   The toolbar's Framework menu picks the rendering; the **Code** panel shows that framework's
   source with what to import, plus a copy button. No Playground.
   **Docs page** (ADR-0019): `components/<name>/<name>-docs.tsx` with `GuideDocs`
   (`helpers/guide.tsx`) and `OptionsTable` / `PropsTable` / `KeyboardTable`
   (`helpers/guide-tables.tsx`), attached with `tags: ["autodocs"]` +
   `parameters.docs.page`; sections Overview → usage → Options → Content and behavior → Events and
   methods → Keyboard → Accessibility. Add it to `GUIDES` and `OPTION_TABLES` in
   `e2e/tests/foundations.spec.ts`. Model: Button.
   Controls come from the option schema (ADR-0015): export `<NAME>_CONTROLS = { schema, keys }`
   from the examples file and pass it to both — React `reactGroupsStory(groups,
   { ...CONTROLS, target })`, HTML `snippetStory(…, setup, CONTROLS)`. Only options that change
   every example at once; defaults keep the examples identical. Add the component to
   `e2e/tests/options-parity.spec.ts`.
7. E2E: add pairs to `e2e/tests/parity.spec.ts` (first component: restore it with
   `git show bd5fb2d:e2e/tests/parity.spec.ts`); interaction spec for both implementations.
8. `pnpm changeset`, then `pnpm check`.

## Foundations in Storybook
`apps/storybook/src/foundations/<name>/` — presentational components (`<name>.tsx`) and
`<name>.stories.tsx` with **one story per section** (they become the sidebar sub-items) plus the
autodocs page — a **usage guide** that never renders the stories again: what the tokens are,
their names, and how to use them in **HTML and React** (CSS variables, component options,
Tailwind, JavaScript, themes, accessibility). Each page: `<name>-docs.tsx` with its sections and
live previews, built with `foundations/shared/guide.tsx` (`GuideDocs`: prose in `Markdown`, a
preview, one code block with HTML | React tabs). The Introduction (MDX) uses `GuideSections`.
`e2e/tests/foundations.spec.ts` (`GUIDES`) checks that every `--ok-*` variable and token utility in
the examples exists, axe in light and dark, and phone width — add new guide pages there. Components have no docs pages (see checklist step 6). MDX has no GFM: use lists, not tables. Use Storybook's default layout and Controls for anything adjustable; don't build
page chrome (headers, tables of contents, custom navigation). Read every value from
`@owlky/tokens` or `--ok-*` variables — never hard-code a token value. The reference
site is for content only; brand colors follow it, neutral text must meet WCAG AA (ADR-0014). E2E a11y, visual
and small-screen tests pick up new stories automatically from Storybook's `index.json`.

## Writing documentation

User-facing docs (Storybook docs pages, package READMEs) follow standard technical English, in
the style of the Google and Microsoft developer documentation guides. Model: Foundations › Colors.

- **Reader:** a developer new to Owlky. Address them as "you"; use present tense and active voice.
- **Headings:** sentence case. Task sections start with a verb ("Use colors in CSS", "Switch
  themes and presets"); reference sections are nouns ("Palette", "Token reference").
- **Sentences:** short, complete, one idea each. No fragments ("Values: …"), no em dashes or
  semicolons to chain ideas, no "simply", "just" or "easy".
- **Words:** "for example" / "such as", not "e.g." / "i.e."; no internal terms (the reference
  site, ADR numbers, `--_ok-*` private variables, test details).
- **UI names:** bold and exact, with where to find them ("the **Preset** menu in the toolbar").
- **Advice:** say why ("…unlike some `color-mix()` fallbacks that drop the transparency").
- **Lists:** parallel items; definitions as "**Label:** sentence".
- **Code:** HTML and React tabs show the same idea, as complete snippets (React: a component);
  comments explain where or why, in sentence case.
- **Numbers:** exact and with units ("a contrast ratio of at least 4.5:1"). Figures that change
  (bundle sizes) are rounded ("about 10 kB") and checked with `pnpm check:size` first.
- **Framework-agnostic:** describe Owlky as one design system, used in plain HTML or through
  framework packages. Name a framework only in examples, install steps and package lists ("such
  as `@owlky/react`"), never in the product description: more frameworks will follow.
- **Overviews** (Introduction, README): benefits first, as bold lead-in sentences ("**Accessible
  by default.** …"), then how it works, get started, customization, where to find things, browser
  support and accessibility. The README mirrors the Introduction; GitHub Markdown allows tables,
  Storybook MDX doesn't.
- **Code in guides:** Storybook's `Source` block (highlighting and a Copy button) inside the
  HTML | React tabs of `foundations/shared/guide.tsx`; previews that are columns must not wrap.

Specs (`specs/**`), ADRs and code comments are for maintainers: terse is fine there.

## Commands

`pnpm build` · `pnpm test` · `pnpm storybook` · `pnpm storybook:build && pnpm test:e2e` ·
`pnpm lint:fix` · `pnpm check` (full CI locally).

## Gotchas

- Tests load the **built** CSS: run `pnpm build` after changing styles or tokens.
- Typecheck also needs a build: workspace packages resolve each other's types from `dist`
  (a clean checkout fails with TS2307). CI and `pnpm check` build before `pnpm typecheck`.
- WebKit on macOS doesn't Tab to buttons or focus buttons/checkboxes on click — use inputs for
  Tab tests and pass triggers explicitly for focus return.
- Native modal dialogs may move Tab focus to browser UI; assert "never reaches the page behind".
- Storybook aliases packages to `src`; `sideEffects` doesn't list sources, so start the runtime
  explicitly there (as `preview.tsx` does) rather than relying on side-effect imports.
- Story ids come from export names: `H1` → `…--h-1`, `Subtitle1` → `…--subtitle-1`. Set `name`
  for the sidebar label. Never export a story named after a global (`Error`): use
  `ErrorPalette` + `name: "Error"`.
- E2E opens stories with `a11y.manual:!true` (see `openStory`): Storybook's a11y addon would
  otherwise run axe in the same frame and collide with `@axe-core/playwright`.
- Engines serialize computed values differently: `color-mix()` shadows are `rgba(…)` or
  `color(srgb …)`; WebKit drops quotes around font names. Assert with regexes on the stable part.
- Horizontally scrollable areas must be keyboard-focusable (axe `scrollable-region-focusable`):
  use `CodeBlock` (`section[aria-label][tabindex=0]`) in Storybook.
- Text on arbitrary colors: pick from white/**pure black** (`getContrastText(hex, ["#FFFFFF",
  "#000000"])`) — the better of the two always reaches ≥ 4.58:1; near-black does not.
- publint rejects `exports` globs that match no files; `styles/components/*` and
  `html/snippets/*` are restored with the first component (checklist steps 3 and 5).
- Biome is configured to skip Markdown (`!**/*.md`): its formatter breaks command frontmatter.
- `pnpm-workspace.yaml` → `overrides` pins `glob` 14.0.3 for Storybook's docgen plugin (security
  fix for glob/minimatch advisories; upstream still pins glob 13). Remove it once
  `@storybook/react-vite` resolves a fixed version — check with `pnpm audit` after upgrades.
  Security fixes may use releases younger than 14 days (Renovate `vulnerabilityAlerts`).
- Tailwind's compiler rewrites `color-mix()` into an `@supports` pair whose fallback **drops the
  alpha** (opaque colors). `tokens.css` is concatenated, not compiled; component CSS must use
  `rgb(var(--…-channel) / α)` instead of `color-mix()` (ADR-0013, enforced by `styles.test.ts`).
- Brand-colored text is exempt from axe `color-contrast` only, via `CONTRAST_EXEMPT`
  (react `test-utils.tsx`, e2e `helpers.ts`, html `test-utils.ts`) — ADR-0014. Extend that list for
  new brand-colored parts instead of disabling the rule.
- Computed styles after an interaction (hover colors, shadows, transforms) are read **after**
  `await settled(element)` (react `test-utils.tsx`): it waits for the element's transitions to
  finish. Never poll with `vi.waitFor` — its 1s timeout is too short on CI runners (WebKit), which
  made CI fail intermittently. Animations a test only needs at their end state can be `finish()`ed.
- Infinite CSS animations (spinners) never fire `animation.finished`: test helpers that wait for
  animations must skip them (`expectNoAxeViolations` filters `endTime === Infinity`).
- Biome 2 lints the HTML snippets too: decorative `<svg>` needs `aria-hidden="true"` itself (not
  only on its wrapper), and demo links need a real `href` and descriptive text.
- Add each new component's files to `coverage.thresholds` in `vitest.config.ts`.
- Components from one reference page share a Storybook folder: title `Components/Button/<Name>`
  (id `components-button-<name>--…`). Register the folder in `FOLDERS` (`e2e/tests/helpers.ts`) so
  `storyId()` keeps working; source folders stay one per component.
- E2E ids of component stories carry the framework (ADR-0018): `storyId("react", "table",
  "basic")` → `components-table--basic@react`; `openStory()` sets `globals=framework:react`.
  `storyIds()` returns every component story once per framework. Snippet setups list every CSS
  file the markup needs (e.g. `scrollbar.css` for tables, drawers and sortable lists).
- Modal components use core `createModalController(element, { contentSelector })` (native
  `<dialog>` + fallback). Test React modal behavior through the built core: core's own tests must
  cover the controller (React tests don't count toward `core/src` coverage).
- Interactive DOM behavior that moves nodes must expect focus loss: moving the focused element
  blurs it (Firefox fires `focusout` during the move; Safari doesn't focus buttons on click).
  `createSortableController` holds focus across owner updates and ignores press-related focusouts.
- `<details>` components (Accordion): React prevents the summary's native toggle and sets `open`
  from state; toggles the browser makes itself (find-in-page, `<details name>`) are reported via
  `onToggle` and reverted after render when refused. `toggle` events fire on a later task — tests
  wait (`settle()` / a `toggle` listener) before asserting.
- A custom property that references another one is resolved where it is declared: anything derived
  from the primary palette (`--ok-shadow-primary`, the `-text` tone) must be redeclared in each
  `[data-ok-preset]` scope. The primary text tone goes through `--_ok-primary-text-light|dark` and
  `--_ok-dark` so preset and scheme scopes nest in both directions (ADR-0017).
- `tokens` and `styles` tests run in Node (no DOM): put computed-style checks of the theme CSS in
  `core` (browser), e.g. `core/src/theme/theme-settings.test.ts`.
- `--ok-c-*` color bindings don't inherit (`@property … inherits: false`) and WebKit ignores an
  explicit `inherit` on them: a group whose items need the root's color (Pagination) reads the
  palette per `[data-ok-color]` on the items instead. Parity can't catch it (same CSS on both
  sides): assert computed colors per engine.
- Theme-dependent colors without new tokens: `light-dark()` inside `@supports (color: light-dark(#000, #fff))`
  with the light value as the base declaration (Baseline lacks it; Biome rejects duplicate
  properties). It follows the scope's `color-scheme`, so nested themes work (Alert).
- Parity normalization skips `<template>` (HTML-only markup such as Sortable's new-item template)
  and `[hidden]` elements (rows the HTML runtime pages out; React renders one page); `<select>` is
  compared by `:value` (React sets `<option>` selection as a property).
- Examples with state can't be expanded by `jsxSource()`: pass the Code panel source to
  `reactGroupsStory(groups, code)`. Prefer one demo file per story imported with `?raw` (Table)
  over a hand-written copy (Sortable).
- General rule for any part the library doesn't have yet (scrollbar, list, progress, divider,
  typography, backdrop, …): use a native feature or story-only demo markup, never a library
  stand-in, and list it in `docs/roadmap.md` → "Pending integrations", so the later component can
  integrate it without breaking DOM or API.
- A new component closes **every** wait on it in the same review: stand-ins *and* deferred
  stories (`docs/roadmap.md` → "Pending integrations" is the only list; grep the roadmap and specs
  for its name too). Example: Table "Pagination with API" — React slices rows for `page`, HTML
  links `nav[data-ok-pagination="<table id>"][data-ok-rows-per-page]` to the table.
- Scroll areas use the **Scrollbar component by composition**, never by adding other components to
  `scrollbar.css`: `TableContainer › Scrollbar › Table`, `DrawerContent › Scrollbar`, `Scrollbar ›
  Sortable`. The wrapping component's CSS adapts with `:has(> [data-ok-scrollbar])` (stop its own
  scrolling, move a frame onto the Scrollbar). The Scrollbar is focusable, so a native `<dialog>`
  focuses it first. Scrollbars are native: Chrome ≥ 121 ignores `::-webkit-scrollbar` once
  `scrollbar-color` is set, so the standard path sits in `@supports (scrollbar-color: auto)`. Test
  the thumb through a probe with `color: var(--_ok-scrollbar-now)`; Playwright's headless Firefox
  reports `scrollbar-width: none` everywhere.
- `--ok-spacing` is **4px** (Tailwind scale): `calc(var(--ok-spacing) * 9)` = 36px. Convert
  reference px values by dividing by 4.
- HTML behavior-only folders (e.g. `toggle-group`, whose markup lives in `toggle-button/examples`)
  have no `examples/`; the html build skips them. Snippet tests share helpers in `html/src/test-utils.ts`.
- Scrollable containers in snippets (`section[aria-label][tabindex=0]`, Table) need Biome's
  `noNoninteractiveTabindex` off for `examples/**` (biome.json override).
- One runtime definition per folder (`components.test.ts`): a second definition of the same
  component (e.g. `table-pagination`) gets its own behavior-only folder.
- `<div role="group">` is intentional for button / toggle groups (not form fields): Biome's
  `useSemanticElements` is off for snippets and suppressed inline in React.
- React group props reach children by `cloneElement` (ButtonGroup, server-safe) or context
  (ToggleButtonGroup, needs state): only **direct** child elements get ButtonGroup props.
- Foundations › Icons uses Iconify **offline** (`@iconify/react/offline`, Storybook dev deps only)
  with a generated subset, `icon-data.json`: edit `SETS` in `apps/storybook/scripts/icons.mjs`
  and run `pnpm --filter @owlky/storybook icons`. Never import a full
  `@iconify-json/*/icons.json` (megabytes). Credit each set's author and license (Solar is CC BY 4.0).
- Numeric options (Progress `value`, `size`, `thickness`) use the schema's `number` kind
  (`number(attr, default, description, { min, units })`, `parseNumber` / `readNumber`): invalid →
  default. `optionAttributes` writes only `data-ok-*` numbers; ARIA ones (`aria-valuenow`) are
  written by the component because they depend on the variant. Storybook needs `type: number`
  on the argType to turn URL args back into numbers (done in `controls.ts`).
- Values that CSS can't read from attributes (progress fractions, custom sizes): React passes
  private `--_ok-*` properties in `style`; the HTML runtime writes the same ones through CSSOM
  (`runtime/style.ts` `syncCustomProperties`) from an own `MutationObserver` with
  `attributeFilter`. Snippets never carry a `style` attribute (strict CSP). Parity ignores `style`.
- Button / IconButton loaders are a `CircularProgress` (`data-ok-button-spinner` on its root,
  sized by `button.css` through `--_ok-progress-size`): no runtime needed for an indeterminate,
  default-size progress. Tests that pick "the first `svg`" of a loading button now hit the loader.
- `styles.test.ts` lists the pseudo-elements allowed after `:where(…)`; `::before` is allowed
  (Progress tracks). Keyframe selectors must be one per block (`60%, 100%` fails the check).
- Selection controls (Checkbox, Switch) are a root span + a native `<input>` that covers the
  target (opacity 0) + decorative parts; CSS reads the state with `:has(> input:checked |
  :indeterminate | :disabled | :focus-visible)`. React `ref` and rest props go to the **input**
  (`className` / `style` to the root). `input.indeterminate` is a property only: React sets it in
  an effect every render, the HTML `checkbox` runtime mirrors `data-ok-indeterminate`. Code that
  sets a mixed state itself (Table's select-all) also toggles `data-ok-indeterminate` on the
  Checkbox root, so React and HTML markup match.
- `FormControlLabel`'s control is a **prop**: Storybook's `applyArgs` walks `control` too, so
  story Controls reach controls inside labels.
- TextField's floating label is CSS only: the root floats it on `:focus-within`,
  `[data-ok-shrink]`, a start adornment, a select, or `:not(:placeholder-shown)` — so inputs and
  textareas **always** carry a `placeholder` (`" "` when there's none to show; React adds it).
  Label position, scale and the outline's notch come from private variables set on the root
  (`--_ok-label-*`, `--_ok-legend-max`), so variants and sizes only change numbers. The outlined
  notch repeats the label in `fieldset › legend › span` (aria-hidden).
- Stories can't hold state inside helper components that `applyArgs` / `jsxSource` expand (they
  call them as plain functions): keep story examples stateless, or pass a `?raw` demo with `code`
  and no Controls (Checkbox "Indeterminate"). Text field stories render the password button
  without state; the docs page shows the stateful pattern.
- Story images (Avatar portraits) are original SVGs in `apps/storybook/public/avatars/`
  (`staticDirs`), referenced **relatively** (`avatars/avatar-1.svg`) so they work under the e2e
  server's sub-path. HTML snippet tests rewrite those `src`s to an inline pixel (`local()` in the
  avatar / badge / chip tests): Vitest doesn't serve Storybook's static folder.
- Components composed inside others restyle their child through the parent's CSS, never the
  child's (`[data-ok-chip-action] > [data-ok-avatar]` in `chip.css`, `[data-ok-badge-badge] >
  [data-ok-avatar]` in `badge.css`); a private variable the child reads (`--_ok-avatar-size`,
  `--_ok-bg`) is the hook.
- A `ul` may only hold `li` (axe `list` flags `hr`, `li[role=separator]` and `li[role=none]`): a
  Divider between List rows sits in a plain `<li>`; between lists it sits outside them. Controls in
  list rows are never inside a `ListItemButton` (nested interactive): label them with the row text
  (`<label for>` in `ListItemText`, or `aria-labelledby`).
- Snippets that mirror React examples exactly can be generated: bundle the examples with esbuild
  (aliases to the packages' `dist`), `renderToStaticMarkup`, drop `data-ok-runtime="off"`, then
  pretty-print (watch for parsers that lowercase `viewBox`).
- Anchored overlays (Popover, Menu, Tooltip) use core `createPopoverController`: `popover="manual"`
  (top layer) or `data-ok-fallback`; CSS shows them only with `data-ok-open` (author `display` beats
  the UA popover rule, so closed popovers need the explicit `display: none`). Position goes through
  CSSOM (`--_ok-popover-x|y|arrow`), the flipped side in `data-ok-current-placement` (parity ignores it).
  The arrow span is always rendered; `data-ok-arrow` shows it (so the Controls toggle keeps parity).
- Story CSS that targets `.sb-row > div:has(> [aria-labelledby])`-style hooks also matches overlay
  roots that sit in the row (a popover is a `div` with a labelled `ul`): scope demo rules to the
  component (`:has(> [data-ok-tooltip])`, `:not([popover])`).
- Overlay stories need state in React: one `?raw` demo per story (no Controls); generate the HTML
  snippet from the closed render and add the HTML triggers (`data-ok-popover-open`,
  `data-ok-dialog-open` / `-close`). Toast templates (`<template>`) are skipped by parity.
- Pointer-driven tests near fixed overlays (toasters) must keep the pointer off them: hovering a
  toaster pauses its timers.
- Any part with an author `display` that the runtime hides with `hidden` (collapsed breadcrumbs,
  stepper panels) needs an explicit `[hidden] { display: none }` rule: author CSS beats the UA one.
- WebKit lays out a sentence split into several text nodes differently (sub-pixel): in React demos
  keep each run of text in one node (`{" and the "}`, not `and the{" "}`) or pixel parity fails.
- Snippets generated from React must drop `style` attributes (LinearProgress writes private
  properties; the HTML runtime sets them through CSSOM).
- Controllers that measure layout (Tabs indicator) write `--_ok-*` through CSSOM and set a flag
  (`data-ok-ready`) after the first measure, so transitions only run between real positions.
  Both implementations share the controller, so its attributes need no parity exception.
- Token names are kebab-case: camelCase keys in `zIndex` (`mobileStepper`) become
  `--ok-z-mobile-stepper` in `css.ts`.
- Browsers sanitize `input.value` on range inputs (snapped to `step`, clamped to `min` / `max`), so
  Slider keeps its values in memory and only writes them; numeric options accept exponents
  (`1e-5`) because tiny steps serialize that way.
- WebKit forwards a label click to its radio with `detail === 0` (like Space): "a pointer click
  clears" logic (Rating) tracks `pointerdown` / `keydown` instead of reading `detail`. WebKit also
  doesn't wrap arrow keys in a radio group and drops `:focus-visible` when they move focus (native
  radios too): Tab in before asserting a focus ring, and reach the last radio going forward.
- Rating fractions overlap: unfilled fraction icons are hidden (not dimmed), except their label
  text, so translucent halves don't stack into a darker star.
- Autocomplete opens on the input's `mousedown`: focus shows every chip (`limitTags`), which moves
  the input before the click. The HTML runtime clones chips from `<template
  data-ok-autocomplete-tag>` and guards its tag rendering against re-entry (removing a focused chip
  fires `focusout`). Listbox options are focusless (`aria-activedescendant`), so
  `useFocusableInteractive` is off for snippets and suppressed inline in React.
- Motion (`data-ok-motion`, not `data-ok-animate`: that is the IconButton / Fab hover flag) plays
  CSS keyframes whose start comes from custom properties set per variant family and direction;
  exits play the same keyframe backwards under another name (`ok-motion-exit`) so the animation
  restarts. Entered in-variants use `animation-fill-mode: backwards` and out-variants start with
  `animation: none`: an interpolated `transform` at the end is a near-identity matrix, not `none`.
  Snippets never carry `data-ok-state` (no JavaScript → nothing hidden); React renders `initial`.
- Waiting for an asynchronous DOM change (IntersectionObserver, rAF counters) in unit tests: resolve
  a promise from a `MutationObserver`, never `vi.waitFor`; and never inside React's `act()` (it
  holds state updates until the scope ends, so the awaited change never comes).
- Docs guides and stories with live Motion previews: open them with reduced motion (the e2e helpers
  do) or axe measures text mid-fade. `finish()` can't end infinite animations: skip loops.
- React 19 inserts `<link rel="preload">` hints next to `<img>`: parity normalization skips `link`.
- Data grid (ADR-0020): the grid is `div`s with ARIA grid roles, so `packages/react/src/data-grid/**`
  turns off Biome's `useSemanticElements`, `useFocusableInteractive` (rows aren't focusable, cells
  are) and `useKeyWithClickEvents` (the navigation controller handles keys). Every cell and control
  inside renders `tabindex="-1"`; core `createGridNavigation` moves the one `tabindex="0"` and
  needs `sync()` after renders. React renders every filtered row (other pages `hidden`) so snippets
  carry all the data; HTML cells keep raw values in `data-ok-value` and custom-cell text in
  `data-ok-text`.
- A popover's width is `fit-content`, measured where it was last placed: Storybook demo CSS that
  caps popover content (`[data-ok-popover] > div`) must exclude component panels.
- TablePagination re-reads `data-ok-count` on every render: an owner (the data grid) may set it
  after the pagination's own setup.
- Generated snippets: keep inline label content on one line (`data-ok-table-pagination-rows`):
  Firefox measures a sentence split across text runs a fraction of a pixel differently.
