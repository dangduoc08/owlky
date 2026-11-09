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
| Files                 | kebab-case; one component per folder  | `modal-controller.ts`          |

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
   **Docs content (ADR-0040):** guides migrated to the website live in `apps/docs-content`
   (phase 1: Foundations › Colors, Components › Button; the others follow in phase 2). There a
   guide is `src/<group>/<name>/<name>-docs-examples.ts` (sections and table rows as data, no
   React: the website's server code reads it) plus `<name>-docs.tsx` (`"use client"`:
   `<name>Previews`, `<Name>Guide`); Storybook's `<name>-docs.tsx` becomes a thin wrapper
   (`StorybookGuide`), and the page is added to `apps/website/src/content/site.ts`.
   Controls come from the option schema (ADR-0015): export `<NAME>_CONTROLS = { schema, keys }`
   from the examples file and pass it to both — React `reactGroupsStory(groups,
   { ...CONTROLS, target })`, HTML `snippetStory(…, setup, CONTROLS)`. Only options that change
   every example at once; defaults keep the examples identical. Add the component to
   `e2e/tests/options-parity.spec.ts`.
7. E2E: add pairs to `e2e/tests/parity.spec.ts` (first component: restore it with
   `git show bd5fb2d:e2e/tests/parity.spec.ts`); interaction spec for both implementations.
8. `pnpm build && pnpm manifest` (the MCP server's data, ADR-0046: the docs page keeps exporting
   its `<name>Sections: GuideSection[]`, stories keep `frameworkStory`), `pnpm changeset`, then
   `pnpm check` (`check:manifest` fails on a stale manifest).

## Foundations in Storybook
`apps/storybook/src/foundations/<name>/` — presentational components (`<name>.tsx`) and
`<name>.stories.tsx` with **one story per section** (they become the sidebar sub-items) plus the
autodocs page — a **usage guide** that never renders the stories again: what the tokens are,
their names, and how to use them in **HTML and React** (CSS variables, component options,
Tailwind, JavaScript, themes, accessibility). Each page: `<name>-docs.tsx` with its sections and
live previews, built with `apps/storybook/src/helpers/guide.tsx` (`GuideDocs`: prose in `Markdown`, a
preview, one code block with HTML | React tabs). The Introduction (MDX) uses `GuideSections`.
`e2e/tests/foundations.spec.ts` (`GUIDES`) checks that every `--ok-*` variable and token utility in
the examples exists, axe in light and dark, and phone width — add new guide pages there. Component docs pages use the same helpers (checklist step 6). MDX has no GFM: use lists, not tables. Use Storybook's default layout and Controls for anything adjustable; don't build
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
- **Code:** HTML and React tabs show the same idea, as complete snippets that work when copied:
  no `…` placeholders; React is a module with its imports and an exported component (data and
  state declared in it, icons from `lucide-react`); HTML is the markup React renders, plus what
  only HTML needs (the CDN `<link>` / `<script>`, triggers, a `<script>` for events). Long
  markup comes from a helper in the docs file (`htmlRating()`, `htmlTransferList()`), not a
  shortened copy. Comments explain where or why, in sentence case. `pnpm check:docs` checks the
  examples: placeholders, unknown `data-ok-*` names, and a typecheck of every React example.
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
  HTML | React tabs of `helpers/guide.tsx`; previews that are columns must not wrap.

Specs (`specs/**`), ADRs and code comments are for maintainers: terse is fine there.

## Commands

`pnpm build` · `pnpm test` · `pnpm storybook` · `pnpm storybook:build && pnpm test:e2e` ·
`pnpm lint:fix` · `pnpm check` (full CI locally). CI splits unit tests: `pnpm test:node` once in
the `check` job, `VITEST_BROWSERS=<engine> pnpm test:browser` in one `unit` job per engine.

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
- The browser's real mouse outlives tests and test files: a pointer left where an earlier test
  clicked hovers whatever is mounted there next (Firefox only after a later layout), and hover
  colors measure below the resting contrast (a hovered soft primary Button is 3.8:1).
  `expectNoAxeViolations` parks the pointer on a 1px element of its own first (`parkPointer()`);
  pass `{ pointer: "keep" }` to scan a hover state on purpose. Tests that read hover-sensitive
  computed styles park it the same way.
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
  integrate it without breaking DOM or API. **Every** stand-in gets a row, including story-only
  CSS in `.storybook/preview.css` that draws a surface (radius + paper background + a shadow →
  Paper / Card) or sets fonts (`--ok-typography-*` / `--ok-font-*` → Typography): the 2026-11-09
  `/integrate` sweep found 14 such stand-ins that had no row. Story CSS keeps layout only;
  exceptions are Storybook chrome (`.sb-group-title`, `.sb-row > [data-ok-theme]`) and demos
  whose point is the plain-CSS styling (Typography "Theme keys", the picker toolbar title).
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
- Illustrations (ADR-0041): new decorative art in library code goes into the set
  (`packages/core/src/illustrations/data/<name>.ts`, export + `illustrations` list, a story group,
  then `pnpm build && node apps/storybook/scripts/illustration-snippets.mjs`), never an `<img>` of a
  themed picture or hand-colored inline SVG. Shapes name a tone (`data-ok-tone`, allowlist in
  `core/src/illustration/illustration.ts`), never a color; outlines are `stroke` in the data
  (`data-ok-stroke`). Components compose `Illustration` with their own part attribute (Upload:
  `data-ok-upload-illustration`; its size stays in the component's CSS). The data entry and the
  runtime are opt-in (`@owlky/core/illustrations`, `owlky-illustrations.js`): `illustration` is in
  `OPT_IN` (`components.test.ts`); Storybook's `preview.tsx` registers it. Foundations stories
  with both frameworks are listed in `FRAMEWORK_FOUNDATIONS` (`e2e/tests/helpers.ts`).
- Illustration style (`docs/illustrations-style.md`, `/illustration`): pictures compose the parts
  of `core/src/illustrations/parts.ts` (`backdrop()`, `groundShadow()`, `sparkle()`, `person()`…);
  parts mark their first node with `part` (never rendered), which `style.test.ts` counts to
  enforce the guide (one backdrop drawn first, one ground, 2–6 sparkles, accent ≤ 30%, ≤ 48
  nodes). Refactors of the data must regenerate byte-identical snippets. The **All** story is
  built from the category stories (a picture missing from `ILLUSTRATION_FILES` throws).
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
- Demo wrappers that become a Paper / Card still match the old `div:has(> [data-ok-…])` demo
  rules (a Paper with a Divider child picked up the Divider stories' border and width): demo
  rules that paint a stand-in surface carry `:not([data-ok-paper])`.
- Overlay stories need state in React: one `?raw` demo per story (no Controls); generate the HTML
  snippet from the closed render and add the HTML triggers (`data-ok-popover-open`,
  `data-ok-dialog-open` / `-close`). Toast templates (`<template>`) are skipped by parity.
- Pointer-driven tests near fixed overlays (toasters) must keep the pointer off them: hovering a
  toaster pauses its timers.
- Any part with an author `display` that the runtime hides with `hidden` (collapsed breadcrumbs,
  stepper panels) needs an explicit `[hidden] { display: none }` rule: author CSS beats the UA one.
- WebKit lays out a sentence split into several text nodes differently (sub-pixel): in React demos
  keep each run of text in one node (`{" and the "}`, not `and the{" "}`) or pixel parity fails.
- Pixels depend on raster history, not only on the DOM: a picture decoded after the first paint
  is drawn into its own rectangle later, and anti-aliased edges overlapping it (the selected
  carousel thumbnail's rounded ring) come out a few levels off, once in some loads, in either
  framework. Waiting longer doesn't help (a load keeps its variant). Pixel parity calls
  `repaintFromScratch(page)` (`e2e/tests/helpers.ts`) before each screenshot: decode the loaded
  pictures, hide the story for a frame, paint it in one go. To locate a pixel diff, write both
  PNGs only when they differ and compare them with `pngjs` (in the store) for the differing box.
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
- Private custom properties (`--_ok-*`) inherit: a component whose optional parts are driven by
  them (MotionBorder's lights) resets them to `initial` on its root, or a nested instance picks up
  its owner's values. A `var(--x, fallback)` then sees the guaranteed-invalid value and falls back.
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
- Data grid phase 2: auto-fit grid tracks can't sit next to intrinsic tracks (`auto
  repeat(auto-fit, …)` is invalid and the grid falls back to one column): give fixed tracks.
  Moving rows or cells in the DOM drops the focus: re-sort before focusing (HTML editing).
  Pinned cells need an opaque background, so row hover / selected colors go through
  `--_ok-data-grid-row-bg`, painted over the paper. In Playwright's touch context `dblclick` hangs:
  e2e edits with Enter on the focused cell.
- Data grid phase 3: rows virtualize only once a **bounded** main area is measured and scrolls
  (`GridViewport.scrolls`); unbounded grids and the first render (SSR, snippets) show every row.
  The HTML runtime keeps its rows in memory (`rowEls`): the body holds only the window, so never
  query the body for "all rows". Tests and e2e on short screens see fewer rows: assert
  `aria-rowindex` / `aria-rowcount`, not row counts. Server pages offset `aria-rowindex` by
  `page × pageSize`. React's default data source cache is per source (`useMemo` on `dataSource`):
  a shared cache would serve the old source's rows. Stories that load after mount (Large dataset,
  Server side) are waited for in parity (`LOADS` in `parity.spec.ts`: a row and no `aria-busy`).
  Story HTML that needs a script uses `HtmlGroup.script` / `scriptSource` (`snippetStory(…, scripts)`);
  rows passed to `setRows` must fit `Record<string, unknown>`, so demo row types are type
  aliases, not interfaces.
- Data grid phase 4: React-only functions (`getRowHeight`, `isRowSelectable`, `colSpan`,
  `isCellEditable`, class names) write their result as attributes the HTML runtime reads
  (`data-ok-row-height`, `data-ok-selectable`, `aria-colspan` + hidden covered cells,
  `data-ok-editable`, `class`); HTML computes row spans itself. A row with a row-spanning cell
  fixes its track (`grid-template-rows`) or the tall cell would stretch it. Autosizing measures
  cells at `width: max-content` and runs again after `document.fonts.ready` (Firefox measured
  before the web font and broke pixel parity). The runtime moves header cells when it lays out
  columns: a header's Tooltip (a sibling) must move with it. HTML tests that mount two grids
  start one runtime only (a second `start()` leaks a runtime that also sets up later grids).
  `TablePagination.setRowsPerPage` fires its change event synchronously (the grid's listener
  resets the page): read the target page before calling it.
- Data grid phase 5: the grid can be `role="treegrid"`: find it by `[data-ok-data-grid-main]`,
  never `[role="grid"]` (runtime, tests). React renders every tree row (children of closed rows
  `hidden`) so the HTML markup holds the whole tree; detail panels render only when open (HTML
  keeps one `<template data-ok-data-grid-detail>` per row, made by the snippet generator). A row
  with a panel is always a `Fragment` in React (switching the element type remounts the row). The
  HTML runtime lays out a row's cells when it is drawn (`layoutRow`, versioned), not for every
  row on each change: large and lazy grids stayed blocked for seconds otherwise. Lazy grids never
  render every placeholder (first chunk before the first measure). Column virtualization is on for
  fixed-width grids: tests that reach every column of a wide grid in the 414px test page set
  `data-ok-disable-virtualization`. Never run two `pnpm test:e2e` at once (they broke `dist`
  builds mid-run).
- Data grid phase 6: group rows, the aggregation footer and the pivot's headers are built by the
  HTML runtime from the rows in the markup (DOM methods mirroring React's markup); the markup's
  `[data-ok-generated]` rows are dropped at setup, except in tree data (generated parents are data
  there). React's generated rows are marker objects (`GROUP` symbol): `rawValue` / `textOf` return
  nothing for them, so user callbacks never see them. The pivot story's HTML is the grid's data
  with `data-ok-pivot-active` (generator), not the pivot's render. A text area's `value` drops
  `\r`: the clipboard relay copies its own text, not `area.value`. React state set from native
  listeners (pointer, clipboard) flushes later: wrap test dispatches in `act()`. A DatePicker inside
  a grid cell is a nested `role=grid`: grid navigation skips rows / cells that aren't its own and
  leaves other tab stops alone. A controlled DatePicker must get back the invalid Date it reported
  while typing (or it clears its sections): keep it as a draft until the date is whole.
  Column virtualization hides cells in the 414px test page: tests that count cells set
  `disableVirtualization`.
- Data grid stacking (the scroll area isn't a stacking context): every body cell has `isolation:
  isolate` (a Checkbox / Switch / Rating input's `z-index: 1` stays in its cell); row-span cells 1,
  pinned cells 2, pinned rows and the aggregation footer 3, the editing cell 4 (its error overflows
  downward), the header 5 (column groups, header filters), the loading layer 6. A new sticky or
  positioned layer takes a slot in that order (comment at `[data-ok-data-grid-header]`).
  `e2e/tests/data-grid.scroll.spec.ts` scrolls every story and checks `elementFromPoint` on header
  and pinned-row cells.
- Data grid date time filters (`dateTime` columns) use the DateTimePicker (same `[data-ok-date-picker]`
  root and `ok:date-picker:change` event, `data-ok-value-type="date-time"`); HTML filter panels copy
  `template[data-ok-data-grid-date-time]`; the value is `YYYY-MM-DDTHH:mm:ss` (local). A header
  filter's DateTimePicker needs a column of about 280px or axe flags its squeezed sections
  (`target-size`).
- Editor (ADR-0023): Tiptap is reached only through `@owlky/core/editor` (Storybook aliases it)
  and the opt-in HTML entries (`@owlky/html/editor`, `owlky-editor.js`): `editor` isn't in
  `components` (`OPT_IN` in `components.test.ts`), so `owlky.js` stays free of ProseMirror. The
  controller mounts on `[data-ok-editor-content]` itself (`element: { mount }`) with
  `injectCSS: false` (Tiptap's `<style>` uses `innerHTML`). Tiptap's trailing node appends `<p></p>`
  after a final heading / code block: expected values in tests include it. ProseMirror marks
  Escape as handled, so don't gate on `defaultPrevented`. Forms in popovers need `noValidate`
  (`type="url"` validation blocks `submit` silently) and no `method="dialog"` (outside a
  `<dialog>`, Chrome fires no `submit`). Tiptap's chained commands run as they are chained, and
  `focus()` moves the focus into the editor a frame later even if `run()` is never called: build
  a chain only once the action will run (a refused image URL used to pull the focus out of the
  form being typed in, so the alt text landed in the document under load).
- Runtimes must set up every markup the React side can render: a picker with every view renderer
  `null` has no `[data-ok-picker-layout]`. An exception in `setup` is only logged ("Failed to
  initialize") and the test still passes: read the stderr of unit runs, not only the verdict.
- Editor fullscreen: the root is `position: fixed` (a stacking context), so its composed Backdrop
  (first child) sits at `z-index: -1` and paints over the root's own background: the toolbar, body
  and helper carry the paper themselves (the body's tint is a gradient over `--ok-bg-paper`). Tiptap
  writes styles with a trailing `;` (`text-transform: uppercase;`): React compares a controlled
  `value` with the string it loaded, never with `getValue()`, or it reloads at mount. ProseMirror's
  `setAttribute("style")` passes the strict-CSP page (only parsed `style` attributes are refused).
- Chart (ADR-0024): core `renderChart` lays out a tree of SVG nodes (`ChartNode`); React maps
  attribute names to camelCase, the HTML runtime uses `createElementNS` + `setAttribute`. Text widths
  are **estimated** per glyph class (`chartTextWidth`), never measured, so server, React and HTML
  agree: when a label is clipped (responsive spec), fix the glyph classes, not one renderer. Parity
  skips `<svg>`: `e2e/tests/chart.spec.ts` compares the SVG trees. HTML data is the chart's
  `<table data-ok-chart-data>` (visually hidden once `data-ok-ready`; tables ignore `width`, so the
  hidden table also needs `table-layout: fixed` and breakable text, or its caption keeps it a word
  wide). Snippets are generated from `apps/storybook/src/components/chart/chart-data.ts` (plain data,
  type-only imports: Node runs it with type stripping): `pnpm build && node
  apps/storybook/scripts/chart-snippets.mjs`. Repeated x values in scatter tables get one
  row per point. Phase 2 (polar): `chart-polar.ts` lays out pie / donut / radial bar / radar
  (`renderChart` dispatches; `layoutChart` stays cartesian). Circular charts draw the first series
  with one slice or ring per category: legend items, `hiddenSeries` and keyboard slots are
  categories, and `chartData` writes every slice color onto its point so the generated HTML table
  carries `data-ok-color` per cell. Slots may skip hidden slices: look them up by `index`, never
  `slots[index]`. CSS beats SVG presentation attributes even at zero specificity: square caps of
  dashed rings come from `[data-ok-dashed]` on the series group, not a `stroke-linecap` attribute.
  Phase 3 (ADR-0029): heatmap / treemap in `chart-cells.ts`, funnel / slope in `chart-shapes.ts`;
  box plots, range areas, bubbles and sparklines stay in `layoutChart`. Cell shades are a
  `fill-opacity` attribute, so never set `fill-opacity` on `[data-ok-chart-cell]` in CSS (it would
  beat the attribute). Several values per point → a second `<thead>` row (`th[data-ok-part]`;
  React `colSpan` / `rowSpan`, the generator `colspan` / `rowspan`). The HTML runtime patches the
  SVG in place and reads its size from the `ResizeObserver` (`box`): tests that waited for
  `childList` on the `<svg>` must watch the subtree; tests that resize synchronously read the
  plot's size until the observer first reports. `updateSeries` / `appendData` rewrite the table and
  `takeRecords()` their own mutations; `data-ok-ready` is set before measuring, so a sparkline's
  plot is measured with the table already out of the flow. Full-page Playwright screenshots drop
  the hover tooltip (the viewport resize): capture the viewport when checking tooltips.
  Phase 4 (ADR-0031): zoom is a window of category indexes / x values passed to `layoutChart`
  (`layout.x` / `layout.y` axis maps serve zoom, brushes and annotations; only vertical charts with
  an x axis get them). Overlays (annotations, the selection, data label badges) are added to the
  nodes in `renderChart`, not in the layouts. The SVG annotation group is
  `g[data-ok-chart-annotation-layer]`; `[data-ok-chart-annotations]` is the authored `<ul>` only
  (a shared name made `querySelector` find the SVG group first). Gestures live in core
  `createChartGestures` (both owners attach it; their pointer tooltip skips while `dragging`), links
  in `linkChart` (module-scoped: tests must `unlink()` what they link). Downloads check
  `navigator.userActivation`: a test click shortly after a `userEvent` click still has transient
  activation, so mock `userActivation` for the refused path. The visually hidden data table is
  anchored at the root's bottom (`inset-block-end: 0`): anchored at the top, a long hidden table
  added its whole height to the page's scroll height. Weekly time ticks start on Mondays, so panning
  a date axis by one category can keep every label: e2e compares the drawn line instead.
- Data grid charts integration: core `gridChartOptions(model, data)` is the only mapping from the
  chart model to the Chart's options (React spreads it on `<Chart>`, HTML writes it with
  `chartAttributes` and removes the other option attributes), and the HTML grid feeds data through
  the chart instance's `updateSeries` (it writes the table itself only without the chart runtime).
  The chart rewrites table cells in place, so tests read cell texts, not `tr.textContent`
  (whitespace of the snippet stays). Snippets of pivoted examples hold the unpivoted rows +
  `data-ok-pivot-active`, but the pivoted chart's table and panel (render React twice).
- Date pickers (ADR-0022): field sections are `contenteditable` spinbuttons whose text only the owner
  writes — core `createFieldController` cancels `beforeinput` and restores IME text. Browsers keep
  the selection inside the focused editable section, so select-all is `data-ok-all-selected` on the
  group (CSS paints it). The group isn't labelable: the label's `for` points at it and a press on
  the label focuses a section. A field emits `ok:date-field:change` *before* it stores the value:
  owners read `detail`, not the instance. HTML calendars rebuild a month with DOM methods but patch
  the same month in place (`morph` in `date-calendar/picker-dom.ts`), or focus is lost on every key.
  A Popover opened with `disableAutoFocus` doesn't restore focus: pickers put it back on the open
  button. Picker stories use fixed dates (May 2025) so "today" never shows; React tests pass
  `today`, HTML tests fake `Date` (`vi.useFakeTimers({ toFake: ["Date"] })`). Never export a story
  named `Date` (a global): `DateStory` with `name: "Date"`.
- Time pickers (ADR-0026): time / date time fields and pickers are the date markup plus
  `data-ok-value-type`; the `date-field` / `date-picker` runtimes branch on it, so check the phase 1
  snippets still regenerate byte for byte after touching the shared React base (`PickerField`,
  `PickerBase`). Clock numbers have `pointer-events: none` (the face takes presses): in e2e press
  the dial at a position, not an option. The pointer is always rendered (`hidden` without a value)
  so the runtime patches it in place. Responsive time pickers render the desktop and mobile views
  and hide one, so the HTML layout can move between popover and dialog. HTML clock events carry
  `HH:mm:ss`; the picker merges it into its own date (and the calendar's day keeps the time).
  React and HTML tests of pickers run against core `dist`: new core helpers need core tests for
  `core/src/pickers/**` coverage.
- Range pickers (ADR-0028): HTML values are ISO intervals `start/end` (`/` = empty). The single
  input field is the DateField with `data-ok-range` (the format twice, sections carry `part`), and
  React shares its TextField through `SectionedTextField` / `useSectionedField` in `date-field.tsx`:
  regenerate every phase 1–2 snippet after touching them and expect no diff. A range calendar's own
  picks update its `lastValue` ref first, or the "outside value moved" check undoes auto month
  switching. The HTML range calendar emits `change` before `rangepositionchange`; the picker reads
  the calendar's position in its microtask *before* its own render (which pushes the picker's
  position back into the calendar). A drag ends with a click on the pressed day: owners call
  `consumeClick()` first in their pick handler. Range bands are each day's `::before` behind a row
  with `isolation: isolate` (a negative z-index would otherwise go under the paper). Every range
  day always has its `::before` / `::after` (states only restyle them): adding a pseudo-element
  to a button on hover rebuilds its box in Firefox, which then drops the press that follows.
- Pickers phase 4 (ADR-0030): the engine stays local-time `Date`; zones and adapters convert at
  the edge. React's public pickers are `withPickerAdapter(Implementation)` in
  `react/src/pickers/pickers.ts` (index exports those): implementations compose each other
  **unwrapped**, and tests of a component file test the implementation (no zone conversion).
  Importing an adapter entry widens `PickerValidDate` for the whole TypeScript program (tests
  too): internal code casts converter results (`toEngine<Date | null>`). Calendar math takes the
  system as an optional last argument (`startOfMonth(d, cal)`, `DateRules.calendar`); never call
  `getFullYear()` / `getMonth()` / `getDate()` for what a calendar *shows* (`cal.year(d)`…), only to
  copy Gregorian fields. `safeTimezone` keeps the name as written (engines canonicalize
  `Asia/Ho_Chi_Minh` differently). `PickerDay` passes its attributes through in render order:
  keep `{...owner}` before `tabIndex` or every disabled day reorders and the phase 1–3 snippets
  change. Story snippets of class-only demo hooks: `components.test.ts` allows only `data-ok-*`
  attributes in snippets (use a class, such as `.sb-day-dot`). The adapter tests load Day.js,
  Luxon and Moment through Vite: list them in the package's `optimizeDeps.include` (with the
  `.js` plugin paths) or the first run reloads mid-test.
- Carousel (ADR-0033): the viewport is a native scroll-snap container; the controller writes the
  derived state (slides' `data-ok-snapped` / `data-ok-in-view`, dots' and thumbnails'
  `aria-current`, arrows' `aria-disabled`, counter and live text) in both implementations, and React
  renders only the initial state (`startIndex`) — never render those attributes from React state.
  Loop rotates CSS `order` (no clones). Hovering pauses autoplay: unit tests park the real pointer
  away first (`userEvent.hover` on a fixed corner element) or Chrome's layout-time `mouseenter`
  pauses it. Settling is a 120 ms scroll debounce; tests of a synchronous move must not wait for a
  second settle (`idle(root)` in the core test). Snippets are generated from the React examples
  (`renderToStaticMarkup`, drop `style`, `data-ok-runtime`, `data-ok-state`, preload `<link>`s);
  HTML tests swap story images for an SVG pixel *with a size*, or overlays cover the dots
  (axe `target-size`). In a git worktree under `.claude/`, the repo's `coverage.include`
  (`packages/*/src/**`) matches nothing: measure with an include such as `**/src/carousel/**`.
- Code editor (ADR-0034): Monaco is reached only through `@owlky/core/code-editor` (Storybook aliases
  it) and the opt-in HTML entries (`@owlky/html/code-editor`, `owlky-code-editor.js`, `OPT_IN` in
  `components.test.ts`); `owlky-code-editor.js` holds no Monaco (the html build aliases
  `monaco-editor` to `src/monaco-stub.ts`) and imports `dist/monaco/monaco.js` from `paths.vs`.
  Tests and Storybook give the loader Vite `?worker` imports (`test-utils.ts` per package,
  `monaco-workers.ts`); the loader is module state, so error-path tests live in their own file
  (`*.error.test.ts[x]`: one module instance per test file). Wait for Monaco through
  `data-ok-status="ready"` with a MutationObserver (`whenAttribute`), never `vi.waitFor`; markers
  (`onDidChangeMarkers`) arrive on a later task. Dispose models only after the editors that show
  them (unmount / `runtime.stop()` first): Monaco throws "TextModel got disposed before
  DiffEditorWidget model got reset" otherwise, and the diff controller resets its model before
  disposing. Monaco drops the diff editor's side labels on every `updateOptions` that lacks them:
  the controller repeats them. Parity skips Monaco's subtree (and its mount element's own
  attributes) and ignores `data-ok-status`; pixel parity waits until `.scrollbar.visible` is gone
  (Monaco fades its scrollbars after a layout). Monaco's inline diff colors deleted lines once,
  maybe before the language's lazy tokenizer is loaded: stories keep the diff side by side
  (`useInlineViewWhenSpaceIsLimited: false`). Snippets are generated from the React demos:
  `pnpm build && node apps/storybook/scripts/code-editor-snippets.mjs`. Monaco has role=alert live
  regions of its own: find story alerts by text. Ctrl+M with Tab moving out of a document's last
  control keeps `document.activeElement` in Firefox: test Tab focus with Shift+Tab to a control.
- Map (ADR-0025): MapLibre is reached only through `@owlky/core/map` and the opt-in HTML entries
  (`map` is in `OPT_IN` of `components.test.ts`). MapLibre draws in a module Worker that it finds
  from `import.meta.url`, which bundlers break: tests, Storybook and apps call
  `setMapWorkerUrl(url)` with `@owlky/core/map-worker.js?url` (core's build copies the worker without
  its source map comment); the IIFE sets it from `document.currentScript`. Tests never touch the
  network: unit tests use inline styles (`mapFixtureStyle()` in core, `fixtures/*.json?url` in html),
  e2e `openStory` routes `tiles.openfreemap.org` to an offline style (Natural Earth land, no tiles,
  no glyphs: symbol labels don't draw). Wait for `data-ok-loaded` (MapLibre `load`); `data-ok-ready`
  only means the first style is in. A source updated every frame can hold `load` back. The headless
  browsers here have WebGL (Chromium: SwiftShader); the fallback is tested by stubbing
  `HTMLCanvasElement.prototype.getContext`. Pixel parity hides the canvas (`style` screenshot option).
  Coverage of browser tests only works from the repository root (`vitest run --coverage <path>`),
  not with `--project`. A GeoJSON source without data and paint strings MapLibre can't parse are
  refused with an `error` event, not an exception. `map.fire("click", { point })` drives the
  controller's map events in unit tests. React `Source` / `Layer` render nothing; HTML declarations
  are `hidden` elements read through an allowlist. Controls are portals into the corners (absent from
  server markup); the snippet generator renders them in place through the internal `InlineCorners`
  context.
- Markdown (ADR-0035): unified is reached only through `@owlky/core/markdown` and the opt-in HTML
  entries (`@owlky/html/markdown`, `owlky-markdown.js`; `markdown` is in `OPT_IN`). Both renderers
  write attributes from `markdownElementAttributes` and styles from `markdownElementStyle` (CSSOM),
  so fix serialization there, never in one renderer. The finished tree holds only elements and
  text; an empty URL from `urlTransform` removes the attribute (React drops empty `href` / `src`).
  Task boxes get a `label` after the element filters (axe `label`). HTML snippets are generated
  (`node apps/storybook/scripts/markdown-snippets.mjs`): the source `pre` escapes `&` and `<`, and the
  runtime renders before it and hides it, so tests and e2e wait for
  `[data-ok-markdown-source][hidden]` (HTML stories render in their page script). Links on
  secondary text (quotes, footnotes) are underlined: axe `link-in-text-block`. Lists set their
  markers: Storybook's Tailwind preflight removes them.
- Lightbox (ADR-0032): a `<dialog>` around a Carousel; `lightbox.css` loads after `carousel.css`
  (same zero specificity). The controller writes `inert` on other slides and the carousel's
  attributes from the root's options, so React renders only the first state. Its key and pointer
  handlers run in the capture phase and the Carousel skips `defaultPrevented` events (a zoomed
  image pans). The Carousel captures mouse presses: clicks land on the viewport, so the lightbox
  resolves the slide from the pressed element. Story CSS on `.sb-row > [data-ok-theme]` skips
  `[data-ok-lightbox]` (it is dark itself). Grids with `auto-fill` and a `max-width` need
  `min-width: 0` in flex rows, or the mobile layout viewport widens. Snippets are generated from
  `lightbox-examples.tsx` (renderToStaticMarkup; drop React 19's `<link rel="preload">`).
- Image (ADR-0038): `data-ok-state` (`loading` · `loaded` · `error`) is written by React and the
  `image` runtime only, never in snippets (the generator strips it): without a state the picture
  shows. A lazy picture far below the page never loads, so tests and parity wait for each
  Image's state to match its `img` (`complete`, `naturalWidth`) after `networkidle`, not for
  every image to be complete. React always renders the placeholder span (CSS hides it with
  `disablePlaceholder` / `visibleByDefault`) so Controls keep parity. Markdown composes Image
  with `images="image"`: React maps `img` to `Image`, the HTML runtime builds the same markup;
  the sanitizer drops raw HTML's `loading`, so composed pictures are always lazy unless a plugin
  sets it. The e2e server only serves `storybook-static`, not `public/`: example pages point at
  `apps/storybook/storybook-static/images/…`.
- Upload (ADR-0037): the native file input covers the zone (`opacity: 0`), so parts that must stay
  clickable (single remove button, `[data-ok-upload-open]` with `noClick`) sit above it (z-index 2)
  and nothing interactive goes in a `<label>` around it. Tests drop files with a plain event plus a
  `dataTransfer` object (`types: ["Files"]`, `files`, `items`): every engine accepts it, while
  `DragEvent` / `ClipboardEvent` init dictionaries differ. Previews are object URLs (different per
  page): dynamic parity runs with `thumbnail` off. The HTML runtime keeps per-element bookkeeping in
  `WeakMap`s, not attributes, so its markup stays equal to React's. A disabled zone is in
  `CONTRAST_EXEMPT` (inactive component, dimmed like the reference).
- Shadows always come from tokens: `--ok-elevation-*`, `--ok-shadow-*` (z scale, card, dropdown,
  dialog, colored) or `--ok-drop-shadow-z1|z4|z8` (`filter` for shapes: pins, icons). A reference
  value that matches none of them takes the **nearest** token (consistency over pixel copies), never a
  literal: a hand-written copy also misses `--ok-shadow-color` (grey in light, black in dark) and
  `createTheme`. `styles.test.ts` (`literalShadows`) rejects blurred literals; rings and borders drawn
  with a zero-blur shadow are fine. A deliberate exception (Lightbox's play icon over photos) carries a
  `/* shadow-literal: <reason> */` comment right before the declaration.
- Paper is the base surface: `paper.css` is imported **first** among the components, so a surface
  built on it (Card: `data-ok-paper` + `data-ok-card` on one element, Paper's options spread into
  its schema) overrides radius and shadow by source order and restates outlined / square for its
  own rules. Elevation is a `style` option with values `"0"`–`"24"` (`--ok-elevation-<n>`): React
  takes a number, `paperAttributes` stringifies it, the attribute is always written (outlined too)
  so Controls stay in parity.
- Collapse (ADR-0044): `hidden` is the state; core `createCollapseController` watches it (a
  MutationObserver, before paint) and animates with the Web Animations API, so tests `finish()` the
  element's animations and then wait a task (the controller settles on `animation.finished`; a
  `finish` *event* comes a frame later). A cancelled animation replaces its `finished` promise:
  grab the promise before interrupting. While exiting, an element whose author CSS hides
  `[hidden]` (`[data-ok-list][hidden]`) gets an inline `display` from CSSOM until the end, and a
  closed collapse with a collapsed size keeps one at rest; both are written `!important`, since
  Tailwind's preflight (Storybook) hides `[hidden]` with `display: none !important` in
  `@layer base`, which beats every component rule. Owners
  that write `hidden` (List, Tree view, Stepper runtimes) need no change: adding
  `data-ok-collapse` to the element animates it. Timing comes from `--_ok-collapse-duration` /
  `-easing` / `-reduce` read from computed style; e2e opens stories with reduced motion, so
  collapses are instant there unless a test emulates `reducedMotion: "no-preference"`.
- Card (on Paper): React `Card` renders a `Paper` with `data-ok-card` (attribute order: Paper's,
  then the card's). Only the default level casts `--ok-shadow-card` (a `:not()` list of the other
  levels in `card.css`), so explicit levels keep Paper's shadows. `overflow: hidden` clips
  anything placed outside the card (an avatar over its edge): the dependent's class sets
  `overflow: visible` (Organization chart member cards). `CardMedia` with a non-media element
  renders a cover `img` instead of MUI's `style` background (strict CSP). Wrapping a component that
  has no `component` prop (Motion) in a Card adds one element: dependents' tests locate the
  wrapper (`[data-ok-motion]:has(> [data-ok-card])`). Snippets: `node
  apps/storybook/scripts/card-snippets.mjs`; letter Avatars with `aria-label` need `role="img"`
  (Biome `useAriaPropsSupportedByRole`).
- Link (on Typography): React `Link` renders a `Typography` with `data-ok-link` (Typography's
  marker and variant first, so `linkAttributes` drops them before spreading). It passes `href`,
  `target` and `rel` only when given: a router component's own `href` (from `to`) must survive.
  `Link` is typed with two call signatures (`LinkComponent`): with `component`, the props of that
  component. Palette colors draw the `always` underline through `--ok-c-channel`; text tones have
  no channel, so their underline is `currentColor`. Inline links in story rows need the row's gap
  for axe `target-size`: HTML snippet tests lay the host out as a flex row with a gap.
  `breadcrumbs.css` loads after `link.css` and keeps its item rules, so a plain `a` and a Link look
  the same there.
- Select (ADR-0045): `[data-ok-select][data-ok-variant]` is the field box; a `[data-ok-select]`
  without a variant has none and its host draws it (TextField's control in text-field.css,
  TablePagination's bare select in table.css). Hosts that load **before** `select.css` (table.css)
  can't override the box rules at zero specificity: compose bare instead. The value lives in the
  options' `aria-selected` (HTML) and a hidden input whose `:placeholder-shown` floats the
  InputLabel (no JS focus / filled state). React's `SelectRoot` (internal) renders the parts for
  every host; snippets: `pnpm build && node apps/storybook/scripts/select-snippets.mjs` (adds the
  chip / placeholder templates and the demos' triggers). The InputLabel carries `for` = the
  trigger's id (Biome `noLabelWithoutControl`; a `div` isn't labelable, `labelId` names it).
  Checkboxes inside options are `inert` (axe `nested-interactive`). `check-docs-code.mjs` greps
  **tracked** files for known `data-ok-*` names: `git add` new runtime files before running it.
- MCP manifest (ADR-0046): `scripts/manifest.mjs` loads every `*.stories.tsx` and every file that
  exports `*Sections: GuideSection[]` with Vite's SSR loader in Node (Storybook, CSS, `?worker` and
  `?url` imports stubbed): story and docs modules must not touch `document` / `window` at import
  time. A story's React code is its Code panel (`transform` of `frameworkStory` with
  `globals.framework`), its id comes from Storybook's `toId(title, storyNameFromExport(key))`, and
  stories keep source order (`export const` order). Known `data-ok-*` names come from the packages'
  sources, specs, snippets and guides; required parts are the anatomy's non-optional parts of a
  root (no `?`, no "(omit / when / with / only …)" comment) that **every** snippet instance
  contains, so a snippet without a part drops the requirement. `validate.test.ts` validates every
  story's HTML with zero issues: a number option that takes a keyword (`auto`) must name it in
  backticks in its description, or `validate_markup` reports it. The repo's pnpm overrides for the
  SDK's young transitive dependencies don't reach `npx` users (npm resolves the SDK's own ranges).
  Coverage of `packages/mcp` runs from the root: `pnpm vitest run --coverage packages/mcp`.
- Docs content (ADR-0040): the guide UI (`GuideSections`, tables, code tabs, Copy button) lives in
  `apps/docs-content/src/guide/` and takes its prose, code block and preview frame from
  `GuideHostProvider`; `apps/storybook/src/helpers/guide.tsx` is Storybook's host and re-exports
  the helpers for pages not yet migrated. Never import Storybook from docs-content. Sections that
  describe Storybook's own UI (sidebar, toolbar) carry `bodyByHost.website`. Its sources are
  scanned by Tailwind through `@source` in both hosts' CSS. `scripts/manifest.mjs` and
  `check-docs-code.mjs` scan docs-content too (same `<group>/<folder>` layout).
- Website (ADR-0040): Next.js `output: "export"`, built with webpack (`--webpack`): Turbopack
  doesn't map the workspace's `.js` specifiers to `.ts` (`experimental.extensionAlias` does).
  `optimizePackageImports: ["@owlky/react", "@owlky/core"]` is required: the `@owlky/react`
  barrel otherwise ships every component (about 900 kB gzip per page instead of about 210 kB).
  In server components, never import data from a `"use client"` module (RSC turns it into a
  client reference): sections come from the `*-docs-examples.ts` modules. Prose (Owlky `Markdown`)
  and code (Shiki) render at build time and reach the client host as React nodes keyed by
  section id / `codeKey(language, code)`. Content files in `apps/website/src/content/` import
  only types and docs-content data modules: the build scripts load them in Node with type
  stripping (`scripts/content.mjs` maps `.js` → `.ts`). The website build and typecheck need
  `pnpm build` first (`scripts/prepare.mjs` copies the CDN bundle and the manifest subset).
- Parallel work: never run two `/component` / `/integrate` sessions (or two `pnpm build` /
  `pnpm test:e2e`) in the same working tree — builds wipe each other's `dist/` and
  `storybook-static/`, e2e servers share port 4321, and staging part of a shared file while
  another session edits it put lines in the wrong places (commit 7d2e745, repaired in 6eeb0d6).
  Use the commands' multi-URL / multi-component mode: one git worktree and branch per agent, e2e on
  its own port (`PORT=4322 pnpm test:e2e`), merged one by one by the orchestrator.
- Organization chart (ADR-0036): connectors are borders on `::before` / `::after` of the children
  `ul` and each child `li` (logical properties); the last child's start half is shifted by the line
  width so every vertical line uses the same pixels. Free lengths (`lineHeight`…) are `number`
  options turned into `--_ok-org-*` by core `organizationChartStyle` (React `style`, HTML runtime
  CSSOM); all private properties are redeclared on every root (nested charts). A node without
  children renders no children `ul` (an empty one would draw a line down). Snippets are generated
  from the React stories: `pnpm build && node apps/storybook/scripts/organization-chart-snippets.mjs`
  (it adds `data-ok-popover-open` to the card menu buttons; esbuild must keep `monaco-editor`,
  `maplibre-gl` and `@tiptap/*` external because the React dist reaches them).
- Walktour (ADR-0039): owners keep the state and run core `walktourTransition` / `walktourEvents`;
  `createWalktourController(root).render(state)` draws it in both implementations (step Popovers,
  the Backdrop overlay, the SVG cut-out through `setAttribute("d")`, `hidden` on buttons the
  options turn off, `aria-modal` + `inert` on the page outside the tour, the live text), so React
  renders every step and none of these
  states. Options are root attributes overridable per step (`"false"` = off); the HTML runtime
  re-renders when they change. The overlay blocks pointer clicks on the page and the beacon
  pulses forever (never "stable" for Playwright): unit tests click through the DOM
  (`element.click()` in `act()`). Hidden progress text stays in `textContent` ("Close (1/3)"):
  assert accessible names. A step's arrow sticks out of the step (`scrollWidth`): measure the
  content box. Story demo CSS on `[data-ok-popover] > div` excludes steps through
  `:where(:not([data-ok-walktour-step]))` (same specificity). Snippets: `pnpm build && node
  apps/storybook/scripts/walktour-snippets.mjs` (adds `data-ok-walktour-start` to the restart
  buttons, found by `aria-controls="tour-…"`).
- Typography is CSS only (`[data-ok-typography]` on any element) and `typography.css` is the
  **first** component in `owlky.css`: a component that composes it restyles it through its own CSS
  (same zero specificity, later wins). Demo text in stories is a Typography, never demo CSS for
  fonts; story CSS keeps layout only (margins, gaps). React picks the element from the variant
  (`typographyElement`: subtitles are `h6`, `caption` / `overline` / `button` are `span`): pass
  `component` for anything else (`component={DialogTitle}` keeps the dialog's label). Palette
  `color`s are brand text (`CONTRAST_EXEMPT`); `textPrimary` / `textSecondary` are AA-tested.
- Form control: the shared states are attributes on `[data-ok-form-control]` only; the parts'
  CSS reads them with descendant selectors, so React parts write their **own** props only (the
  context gives the asterisk and `useFormControl()`), and HTML markup stays equal. `--ok-c-text`
  doesn't inherit: the root copies it into `--_ok-form-focus` for its label. `disabled` is also the
  native attribute on a `fieldset` root (it disables the controls; `:disabled` styles them), so the
  stories' Controls don't offer it (HTML Controls write only `data-ok-*`). Snippets: `pnpm build &&
  node apps/storybook/scripts/form-control-snippets.mjs` (labels and helper texts stay on one line:
  a break before the asterisk would render a space).
