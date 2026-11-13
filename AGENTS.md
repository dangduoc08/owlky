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
2. `core/src/anatomy/<name>.ts` (one module per component, re-exported by `anatomy.ts`;
   ADR-0068): the option schema `<name>Options` (`defineOptions`, ADR-0015) and
   `<name>Attributes()` built from it (`optionAttributes`); behavior → `core/src/<name>/` + tests
   (native **and** fallback paths), exported from `core/src/index.ts`. Keep module-level code
   pure (literal value lists, no calls of unannotated helpers): bundlers keep it otherwise. A
   schema whose options spread shared objects goes in a `/* @__PURE__ */ (() => defineOptions(…))()`
   IIFE, and a value list joined from others uses `/* @__PURE__ */ ([] as T[]).concat(…)`: minifiers
   keep a bare spread (Motion, FormControl). Each option's description is the factory's string or
   template literal, never a variable: the core build (`packages/core/scripts/option-docs.mjs`)
   moves every description into `dist/option-docs.json` (`@owlky/core/option-docs.json`) and
   leaves `""` in `dist`, so the runtime ships no docs (ADR-0068 §4). Build scripts read schemas
   through `scripts/option-schemas.mjs` (`describeOptions`); Storybook reads the source schemas.
   The per-component entries (`@owlky/<package>/<spec>`) are generated from the barrels:
   `pnpm entries` after changing an `index.ts` (`check:entries` in `pnpm check`). Every other `data-ok-*`
   name (parts, states, values, triggers) goes in `core/src/anatomy/parts.ts` as a
   `<Name>Parts` interface member with a comment (ADR-0049).
3. `styles/src/components/<name>.css` + `@import` in `styles/src/index.css`. (First component
   only: restore the `"./components/*": "./dist/components/*"` export in `styles/package.json`.)
4. `react/src/<name>/<name>.tsx` + `<name>.test.tsx` (behavior + axe), export from `react/src/index.ts`.
   Interactive roots render `data-ok-runtime="off"`; files with hooks start with `"use client"`.
5. `html/src/components/<name>/examples/*.html` (canonical snippets; first component only: restore
   the `"./snippets/*": "./dist/snippets/*"` export in `html/package.json`). If it needs JS:
   `<name>.ts` (`defineComponent<Instance, Events>`, both exported, every member and event
   commented: the API reference reads them, ADR-0049) + tests, one line in
   `html/src/components/index.ts`. React props carry JSDoc (description, "Default `x`.").
6. Storybook: `apps/storybook/src/components/<name>/<name>.stories.tsx`, title
   `Components/<Name>` — **one story per reference section, every framework in it** (ADR-0018):
   `frameworkStory({ html: snippetStory(…, htmlSetup(css, runtime)), react: reactGroupsStory(…) })`.
   The toolbar's Framework menu picks the rendering; the **Code** panel shows that framework's
   source with what to import, plus a copy button. No Playground.
   **Docs page** (ADR-0019): `components/<name>/<name>-docs.tsx` with `GuideDocs`
   (`helpers/guide.tsx`) and `OptionsTable` / `PropsTable` / `KeyboardTable`
   (`helpers/guide-tables.tsx`), attached with `tags: ["autodocs"]` +
   `parameters.docs.page`; sections Overview → usage → Options → Content and behavior → Events and
   methods → Keyboard → Accessibility → API reference (`apiReferenceSection(<name>Api)` from
   `@owlky/docs-content/guide/api-data`, the JSON imported from `@owlky/docs-content/api/<name>.json`
   `with { type: "json" }`; ADR-0049). Add it to `GUIDES` and `OPTION_TABLES` in
   `e2e/tests/foundations.spec.ts` (`API_PAGES` follows them). Model: Button.
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
8. `pnpm build && pnpm api && pnpm manifest` (the API reference, ADR-0049, then the MCP server's
   data, ADR-0046: the docs page keeps exporting its `<name>Sections: GuideSection[]`, stories keep
   `frameworkStory`), `pnpm changeset`, then `pnpm check` (`check:api` and `check:manifest` fail
   when stale; `check:api` also fails on an undocumented prop, name, event or method).

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
  themes and brand colors"); reference sections are nouns ("Palette", "Token reference").
- **Sentences:** short, complete, one idea each. No fragments ("Values: …"), no em dashes or
  semicolons to chain ideas, no "simply", "just" or "easy".
- **Words:** "for example" / "such as", not "e.g." / "i.e."; no internal terms (the reference
  site, ADR numbers, `--_ok-*` private variables, test details).
- **UI names:** bold and exact, with where to find them ("the **Theme** menu in the toolbar").
- **Advice:** say why ("…unlike some `color-mix()` fallbacks that drop the transparency").
- **Lists:** parallel items; definitions as "**Label:** sentence".
- **Code:** HTML and React tabs show the same idea, as complete snippets that work when copied:
  no `…` placeholders; React is a module with its imports and an exported component (data and
  state declared in it, Solar icons: `Icon` from `@iconify/react/offline`, data from
  `@iconify-icons/solar/<name>`); HTML is the markup React renders, plus what
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
- A custom property that references another one is resolved where it is declared. Theme axes
  (ADR-0070, switch technique ADR-0072): every token an axis changes, and every token defined from
  another (shadows, gradients, typography families, focus ring colors), is declared once in the
  resolver on `SCOPE_SELECTOR` (`:root, [data-ok-style], [data-ok-theme], .dark,
  [data-ok-surface], [data-ok-contrast]`) as space toggles over its variants (`var(--_ok-d1, A)
  var(--_ok-d0, B)`: `initial` = active, a single space = inactive), each variant
  `var(--_ok-t<key>-<v>, <Soft's literal>)`. Never write an input name by hand (generated keys);
  never read a theme input in component CSS. Computed colors stay `rgb()` (no `color-mix()`
  switching). An author override of a color token on `:root` stops at the next axis scope:
  declare it on the scopes too, or use `createTheme({ brand })` / `applyThemeBrand()`
  (`@owlky/core/theme-brand`). Density scopes declare literal sizes (no resolver). The minifier
  keeps the single space of an empty toggle (`--_ok-d0: ;`).
- Soft is the default style (ST3): Tailwind indigo primary, zinc neutrals, Nunito (load it: Owlky
  doesn't bundle fonts; Storybook and the website use `@fontsource-variable/nunito`), radius
  10 / 18px, chips and labels pill-shaped, two-layer shadows tinted with indigo 950. Every color
  role comes from the generator (`tokens/src/roles.ts`, `theme.ts`); `roles.test.ts` asserts every
  pair in light / dark × surface × contrast. Palette-colored text (text and outlined variants,
  Typography, Link, selected Tabs, Markdown links…) uses the `-text` tone, never `main`.
  `CONTRAST_EXEMPT` lists only disabled parts. Field outlines use `--ok-control-border-color`
  (3:1). Tests that read a dark page with axe give the page its background
  (`documentElement.style.background = "var(--ok-bg-default)"`): axe reads a transparent page as
  white.
- Colored components read their color from the `[data-ok-color]` binding (`--ok-c-main`,
  `-channel`, `-lighter`, `-light`, `-hover` (= dark), `-darker`, `-contrast`, `-text`) with a
  default as fallback, not one rule per palette color (size, ADR-0072). Bindings don't inherit:
  a group that colors its items copies them into private properties on its root (Pagination's
  `--_ok-pg-*`).
- Component CSS never writes a design value (ST2, `docs/styles-inventory.md`): radii are roles
  (`--ok-radius-control|control-sm|inner|surface|surface-md|surface-sm|chip`, `-full`), borders
  `--ok-border-width(-strong|-heavy)`, SVG strokes `--ok-line-width-*`, focus rings
  `--ok-focus-ring-width|offset|inset|offset-tight` and `-color(-brand)`, control sizes the density
  tokens (`--ok-control-height-*`, `--ok-field-padding-*`, `--ok-item-*`…), loader cycles
  `--ok-duration-spin|progress-*`. Each default is the value the components used before; the label
  role (Button, Fab, Toggle button, Chip, Label, Badge, Tab, Pagination) reads
  `--ok-font-family-label`, `--ok-label-text-transform` and `--ok-label-letter-spacing`. A new
  value that no token holds needs a token in `tokens/src`, not a literal.
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
  `/integrate` sweep found 14 such stand-ins that had no row, and the 2026-11-12 sweep nine
  more, in places the first one didn't grep: outlined boxes (`border` + radius → Paper
  `variant="outlined"`), Tailwind utilities in Foundations components (`rounded-* bg-paper
  shadow-*` → Paper / Card, a styled `<a>` → Link) and docs examples (`<input type="range">` →
  Slider, a `tabindex` + `overflow: auto` box → Scrollbar). Story CSS keeps layout only;
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
- Component icons are Solar (ADR-0070 § 9): `packages/core/src/icons/solar.ts` is generated by
  `packages/core/scripts/icons.mjs` from `@iconify-json/solar` (a core dev dependency; the core build
  runs it, `pnpm check:icons` fails when the committed file is stale, `icons.test.ts` compares every
  path with the set). Add a name to `NAMES`, then `pnpm icons`. React draws them with the internal
  `Icon` (`react/src/utils/icon.tsx`), HTML runtimes with core `createIcon`, node-tree renderers
  (Chart, Gantt) with `iconTree`; part attributes come first, then `data-ok-icon="<name>"`, the
  viewBox, `aria-hidden`, `focusable` and the presentation attributes. The markup carries no
  `stroke-width`: `icon.css` sets `--ok-icon-stroke` (a stroke attribute would lose to it anyway).
  À-la-carte CSS needs `icon.css` next to the component's file. Checkbox boxes and radio rings are
  CSS spans (`data-ok-checkbox-box`, `data-ok-radio-ring`); only the marks are icons. The Map
  compass needle stays a component graphic (`mapCompass`). Docs examples and stories use Solar
  (`helpers/solar-icons.tsx`, names in `DOCS` of `apps/storybook/scripts/icons.mjs`): stories render
  `SolarIcon` (Iconify's `Icon` markup, which the HTML snippets copy: `xmlns`, `role="img"`, `1em`),
  the Code panel prints `<Icon icon={…} />` (`jsxSource`, `solarSource` for `?raw` demos). Parity
  skips `svg` children: pixel parity is what checks icons.
  Solar's credit is generated (`ARTWORK` in `scripts/check-licenses.mjs`, `pnpm notices`).
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
  runtime are opt-in (`@owlky/core/illustrations`, the CDN's lazy `modules/illustration.js`): `illustration` is in
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
- Scroll progress (5.2, ADR-0062 note): the root is `data-ok-scroll-progress`, never
  `data-ok-scroll` (Dialog's and Tabs' `scroll` option: `option-names.test.ts` caught the clash, which
  would have started the runtime on every scrolling dialog). The progress shows
  `--_ok-scroll-progress` (registered, so it animates); `scroll-progress.css` feeds it to the Linear bar and the Circular arc. Three paths:
  CSS `scroll(root)` for the page (inside `@supports`: without scroll timelines a CSS animation
  with no timeline jumps to its end), the engine on a `ScrollTimeline` / `ViewTimeline`, or a
  paused animation moved by the script (`data-ok-fallback`; Firefox). Those animations end only
  when the scroll does: anything that awaits `animation.finished` must skip paused animations and
  timelines other than `document.timeline` (`waitable` in the test utils, core
  `runningAnimations`), or it hangs. Test the fallback by stubbing `CSS.supports` for
  `animation-timeline` **only** (a blanket `false` also turns `linear` easing into the default
  curve). Scroll events and timelines update on the next frames: wait two `requestAnimationFrame`s.
- Motion gestures (ADR-0062 5.3, `core/src/motion/drag.ts`, `gesture.ts`, `swipe.ts`): the pan
  layer (`trackPan`) hears moves and releases on the **window** after a press on the element, and
  measures velocity with `performance.now()` (not `event.timeStamp`): tests fake the clock with
  `vi.spyOn(performance, "now")` (core `fakeClock()` in `test-utils.ts`) and dispatch synthetic
  `PointerEvent`s (`press` on the element, `move` / `release` on the window). Drag writes
  `translate` inline; a glide is an `animate()` keyframe list (finish the element's animations,
  then wait a task, to read its end). A drag's element is in a module `WeakSet` so a nested
  draggable drags alone (no `stopPropagation`). The `while…` states animate a property back to
  its own value and then restore its inline value: never style a gesture-animated property
  inline yourself. In HTML gesture tests the Motion's CSS entrance is also an animation: filter
  `CSSAnimation`s out before reading the script's timing. Drag props are free attributes (JSON,
  ids), not schema options, like the keyframes. The swipeable Drawer (`core/src/drawer/
  drawer-swipe.ts`) shows the dialog **non-modally** (`open` attribute) while a finger opens it
  (a modal one would make the strip inert under the pointer) and calls `controller.open()` on
  success; its swipe rules sit **before** the exit rules in `drawer.css` so an exit that starts
  while the panel is held slides on from there. React's owner acts a frame later: the helper
  waits up to 8 frames (`whenOwner`) before treating a swipe as refused.
- Motion layout (ADR-0062 5.4, `core/src/motion/layout.ts`, `values.ts`, `easing.ts`): layout
  animations play `transform` (never committed, `commit: false`) and measure **layout** boxes:
  anything with a transform on it or an ancestor (a CSS entrance, a drag, an animating parent) is
  measured from its offsets, so don't expect `getBoundingClientRect()` precision there. Core keeps
  module-scoped node state: tests `destroy()` every node and `flushLayout()` in `afterEach`, and
  read a mid-flight box after `pause()` + `currentTime` (a path's time is its animation's own
  clock). A snapshot flushes a **microtask** later: React tests `await act(async () => await
  Promise.resolve())`; HTML tests `settle()` (the watcher flushes inside its MutationObserver).
  The HTML watcher observes the whole document while a layout Motion exists and animates from the
  **last known** box (the DOM already changed): a change no mutation shows needs `measure()` /
  `animateLayout()`. React snapshots in a class component's `getSnapshotBeforeUpdate`, so Motion
  renders a Fragment (that class, then the root). In e2e, tasks move: locate a moved item by its
  content, never `nth()` (it re-resolves to another item), and check that an animation started by
  recording `Element.prototype.animate` calls (`motion-layout.spec.ts`), not by finding one still
  running after a click. A moving `layoutId` element sets `initial={false}` (`data-ok-initial`),
  or its default entrance plays at every move. `transition` JSON may carry a `layout` key (one
  level).
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
- Data grid cell editors (ADR-0067) are InputBase (text, number, dates), a bare listbox Select
  (`singleSelect`) and a small Checkbox (`boolean`); `data-ok-data-grid-edit-input` marks the field
  that takes the focus (the Select's trigger, never its `aria-hidden` form input, which also holds
  the HTML value). The listbox is a top-layer Popover *inside* the cell: grid navigation ignores
  keys from `[role=combobox]` and inside a listbox, and the copy / undo / cell menu guards skip
  anything inside a `[data-ok-editing]` cell. Enter on the trigger saves, so the grid takes it
  before the Select controller (React `onKeyDownCapture`, HTML a capture listener on `main`; the
  controller skips `defaultPrevented` keys). A cell-mode pick saves after the draft is set (React:
  an effect on `drafts`; HTML: `ok:select:close` with reason `select`). The list is open at the start
  in cell mode: tests pick options by role (`option`), not `selectOptions()`. The HTML grid composes
  the `select` runtime: a test runtime must register it (and the popover) or the list never opens.
- Data grid date time filters (`dateTime` columns) use the DateTimePicker (same `[data-ok-date-picker]`
  root and `ok:date-picker:change` event, `data-ok-value-type="date-time"`); HTML filter panels copy
  `template[data-ok-data-grid-date-time]`; the value is `YYYY-MM-DDTHH:mm:ss` (local). A header
  filter's DateTimePicker needs a column of about 280px or axe flags its squeezed sections
  (`target-size`).
- Editor (ADR-0023): Tiptap is reached only through `@owlky/core/editor` (Storybook aliases it)
  and the opt-in HTML entries (`@owlky/html/editor`, the CDN's lazy `modules/editor.js`): `editor` isn't in
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
- Editor tables, mentions, bubble menu (ADR-0050): the bubble menu and the mention list are
  `data-ok-runtime="off"` popovers that core drives (`createEditorBubbleMenu`, the Suggestion
  renderer in `editor/mention.ts`), so the HTML popover runtime and its delegated triggers skip
  them (the editor runtime opens the link form from the bubble's link button itself). Tiptap's
  `commands.focus()` lands a frame later: tests and the bubble's Escape use `editor.view.focus()`
  before setting a selection. Tiptap's `isEmpty` counts a table of empty cells as empty
  (`getValue()` checks for a table). The CDN modules build aliases `@floating-ui/dom` to
  `src/floating-ui-stub.ts` (Suggestion only builds middleware). The Bubble menu, Table and
  Mentions snippets: `pnpm build && node apps/storybook/scripts/demo-snippets.mjs editor`.
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
- Geo chart regions with a pattern or a picture (4.18.97) carry their own `fill` attribute: CSS paints
  regions only `:where([data-ok-chart-region]:not([fill]))`, like bars. Pictures are `pattern`s in
  `userSpaceOnUse` at the region's box (an `image` node: `ChartNodeTag` includes `image`), URLs only
  through `safeChartImage`. The plot's description (4.18.99) is a `p[data-ok-chart-description]`
  inside the plot after the tooltip (a fixed position both owners keep; after the plot would race
  with the status and filter parts). Geo annotations (4.18.100) are laid out in `layoutGeo`, which
  has the projection's fit, not in `chartAnnotationNodes` (no axis maps on geo charts).
- Sankey charts (ADR-0047): `type="sankey"` takes links, not series (React `nodes` / `edges`; HTML
  one table row per link, read by `readChartSankeyTable`), and `renderChart` branches to
  `renderSankey` before any series logic (`series` is optional in React and core). The layout
  (`chart-sankey.ts`) precomputes each mark's tooltip and highlight in `mark.flow` (layout mode
  `flow`): `chartTooltip` / `chartActiveNodes` just copy them. Link opacity and loop dashes are SVG
  attributes from the layout, so CSS must never set `fill-opacity`, `stroke-opacity` or
  `stroke-dasharray` on `[data-ok-chart-link]`. Gradient links use `gradientUnits="userSpaceOnUse"`
  with one stop per node color. New options that every chart would write (styles) need
  `{ optional: true }` or every snippet changes (`orientation`).
- Stock charts (ADR-0047): `indicators` / `navigator` turn a time chart into `layoutStock`: the
  generated indicator series are appended to `data.series` (fields `indicator`, `pane`, `table`,
  `scale`, `guides`), so the legend, the tooltip and the table see them like data. Each pane is a
  `layoutChart` call with `plotLeft`, `banded`, `fitZoom`, `xLabels` and (price) `zeroBased: false`,
  wrapped in `g[data-ok-chart-pane][transform]`; marks are re-indexed to global series and moved by
  the pane offset, and the pane groups lose their own crosshair / active groups (one of each at the
  top level). Indicator columns (`th[data-ok-indicator]`) are skipped by `readChartTable` and
  rewritten by the HTML runtime after each draw. The navigator is `layout.navigator`: gestures check
  it first (a brush on the zoom); `navigator` turns zoom on in both owners.
- Data grid charts integration: core `gridChartOptions(model, data)` is the only mapping from the
  chart model to the Chart's options (React spreads it on `<Chart>`, HTML writes it with
  `chartAttributes` and removes the other option attributes), and the HTML grid feeds data through
  the chart instance's `updateSeries` (it writes the table itself only without the chart runtime).
  The chart rewrites table cells in place, so tests read cell texts, not `tr.textContent`
  (whitespace of the snippet stays). Snippets of pivoted examples hold the unpivoted rows +
  `data-ok-pivot-active`, but the pivoted chart's table and panel (render React twice).
  `secondaryValues` goes through the Chart's `yaxis` (HTML `data-ok-yaxis`, which the grid removes
  itself: it is a text attribute, not one of the chart's option attributes).
- Data grid batch E (4.18.87–93): `data-grid-snippets.mjs` rewrites `cells-group` / `pivot-derived`
  with today's date in their pickers: revert those two unless the change is yours. A dispatched
  `click` on a checkbox toggles it and fires `change` itself: HTML tests never dispatch `change`
  after it (Shift + click ranges read Shift from that click). State reports (`onStateChange`,
  `ok:data-grid:statechange`) come a microtask after the update and wait for a pressed pointer's
  release: tests resolve a microtask, and dispatch `pointerup` on the document after a synthetic
  `pointerdown`. Server pivot rows (HTML) are built with DOM methods and their data lives in a
  `WeakMap`: read values through the instance or the cells, never `data-ok-value`. Moving items of
  the columns tool panel keeps the focused one in place (the others move around it), or the focus
  is lost. Range chart handle drags in the 414px test page: `scrollIntoView` the target cell
  before measuring it (`elementFromPoint` sees nothing outside the viewport).
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
  (`pnpm build && node apps/storybook/scripts/carousel-snippets.mjs`: `renderToStaticMarkup`, drop
  `style`, `data-ok-runtime`, `data-ok-state`, preload `<link>`s). Story slides compose Image
  (lazy, custom ratios such as `16/10` written by the runtimes), so e2e waits for each Image's
  state to match its `img`, never for every `img` to be `complete` (far slides never load);
  HTML tests swap story images for an SVG pixel *with a size*, or overlays cover the dots
  (axe `target-size`). In a git worktree under `.claude/`, the repo's `coverage.include`
  (`packages/*/src/**`) matches nothing: measure with an include such as `**/src/carousel/**`.
- Code editor (ADR-0034): Monaco is reached only through `@owlky/core/code-editor` (Storybook aliases
  it) and the opt-in HTML entries (`@owlky/html/code-editor`, the CDN's lazy `modules/code-editor.js`,
  `OPT_IN` in `components.test.ts`); the CDN module holds no Monaco (the html build aliases
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
- Map snippets from 4.18.94 on are generated (`pnpm build && node apps/storybook/scripts/map-snippets.mjs
  [story …]`; older map snippets stay hand-written): it bundles the demos against `packages/react/src`
  (so the internal `InlineCorners` is the same context), swaps `Source` / `Layer` for components that
  render the HTML declarations, and moves each map's corner contents into its own four corners (a
  map's parts render before its corners). Data a demo fetches (hexbins, pixel grids) is empty in
  the snippet; the page script fills it with the instance's `hexbin()` / `pixelGrid()` and
  `setSourceData`. Pixel maps share feature state through `promoteId` on the cells' region
  property, so `MapRegions` / `mapRegionLayers` work unchanged. Box selection (ADR-0065) listens for
  pointer events in the capture phase on the canvas container and suspends `dragPan`; unit tests
  dispatch `PointerEvent`s with `shiftKey` and wait for `queryRenderedFeatures` to find every
  region first (label anchors come from `querySourceFeatures`, which needs loaded tiles). The link
  registry is module-scoped: tests destroy every controller they create. A snippet with two maps
  laid out by story CSS measures zero width in unit tests: give the roots a width before axe
  (`target-size` on the folded attribution otherwise).
- Markdown (ADR-0035): unified is reached only through `@owlky/core/markdown` and the opt-in HTML
  entries (`@owlky/html/markdown`, the CDN's lazy `modules/markdown.js`; `markdown` is in `OPT_IN`). Both renderers
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
- Motion engine (ADR-0062): core `animate()` is the only code that starts script animations; it
  commits end values to the inline style (`commitStyles()`), so a later class change of the same
  property needs the inline value cleared. Declarative keyframes are JSON attributes
  (`data-ok-keyframes`, `data-ok-transition`) that both owners write and core
  `createMotionKeyframes` plays from `data-ok-state`; `[data-ok-keyframes]` turns the variant's CSS
  animation off. JSON has no `Infinity`: write `"Infinity"` (React's `motionKeyframesAttributes`
  does), `jsxSource` prints `Infinity`, and `demo-snippets.mjs` writes the JSON in single quotes.
  Loops don't start under reduced motion: e2e calls `emulateMedia({ reducedMotion:
  "no-preference" })` after `openStory` (the player restarts on the media change).
- Exits before close (ADR-0062): the modal controller plays `data-ok-state="exiting"` (and a Motion
  paper's `exit`) before `dialog.close()`, so Dialog / Drawer close, focus return and HTML
  `ok:*:close` are asynchronous whenever something animates. Tests close, then `await
  finishExit(element)` (react / html `test-utils`: `finish()` + a task, React inside `act()`)
  before asserting `open`, focus or events; core tests inject their own exit CSS. Chromium's
  `getAnimations({ subtree: true })` includes `::backdrop` animations: a test of the synchronous
  path disables the paper's and `dialog::backdrop`'s animations. React `keepMounted={false}`
  children stay rendered until the exit ends (`shown` state); MotionPresence waits for the Motions
  that register through its context (children without Motions leave at once).
- Library surfaces are Papers (ADR-0066): every popover root (`popoverAttributes()` writes
  `data-ok-paper` right after `data-ok-popover`; Walktour steps and the Editor overlays write it
  by hand), the Dialog paper, the Drawer content and the Map controls / popup contents. Their own
  CSS restates radius, background and shadow after `paper.css`; a default shadow rule is
  `:not([data-ok-elevation])`, so an `elevation` (Popover, Menu, Dialog: `surfacePaperAttributes`)
  picks Paper's shadow. Paper's `transition: box-shadow` now runs on them: tests that change an
  elevation read the shadow after `settled(element)` (mid-transition values serialize as
  `oklab(…)`). A new surface puts the marker right after its own (snippets read `data-ok-x
  data-ok-paper`) and must not carry Paper's `variant` when it has a `data-ok-variant` of its
  own. `querySelectorAll("[data-ok-paper]")` now finds overlays too: scope Paper checks to their
  story.
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
- Gantt (ADR-0048): core `renderGantt` returns every node of the toolbar and the treegrid (rows,
  cells, bars, ticks, the background SVG): React maps them (`tabindex` → `tabIndex`, `style` holds
  the `--_ok-gantt-*` positions), the HTML runtime patches them in place with keyed rows (task ids)
  so focus survives redraws — never move an unchanged element (`insertBefore` blurs it and cancels
  a click in progress). The controller reads the DOM (rows, `aria-level`, `aria-expanded`,
  `aria-selected`) and reports intent; it keeps the focus on the task it acted on across owner
  re-renders and turns a row focused another way into the active one. Parity skips SVG and `style`:
  `e2e/tests/gantt.spec.ts` compares the canvases and the private properties. Dates are UTC day
  numbers, so tests never fake time zones; stories pass `today`. The task list narrows by a
  container query (the Gantt's own width), so Testing Library can't find the hidden columns in
  the 414px test page (query the DOM). `toHaveTextContent` in this repo matches the whole text: use
  `textContent` for exact checks. Snippets: `pnpm build && node apps/storybook/scripts/gantt-snippets.mjs`
  (the root's attributes and the data table of the React render; the Editing story also keeps
  the dialog that follows the Gantt). Editing (phase 2, `gantt-edit.ts`): drags preview on the bar
  through CSSOM and undo the preview before reporting, so a refused change needs no re-render;
  `setPointerCapture` throws for synthetic pointers (tests dispatch `PointerEvent`s), so it is
  wrapped. HTML redraws rewrite every `--_ok-gantt-*` property: never draw during a drag.
  Virtualization (phase 3, `height`): the first window comes from the `height` option, not a
  measure, so server, React and HTML agree; owners follow the keyboard's row (`follow` flag, set
  by `onActiveChange`, cleared by the next scroll) or a wheel scroll would snap back to it. The
  controller keeps a pending focus whose row is in `rowList` but not rendered yet (React renders
  after the key), and drops it only for rows that went away. Downloads render the layout again
  without a window (`exportGantt(root, layout, format)`), colors from computed styles.
- Phone input (ADR-0061): libphonenumber-js is reached only through `@owlky/core/phone` (Storybook
  aliases it) and the opt-in HTML entries (`@owlky/html/phone`, the CDN's lazy `modules/phone-input.js`, `phone-input` in
  `OPT_IN`); `check-size.mjs` fails if `owlky.js` holds the metadata (`country_calling_codes`). The
  option schema stays in `@owlky/core` (no metadata). The root is a TextField with
  `data-ok-phone-input`; the country select is a bare Select (`SelectRoot host="select"`) in a
  `div` start adornment, styled by `phone-input.css` only. HTML snippets keep the listbox empty
  (`demo-snippets.mjs` strips the options): the runtime builds MenuItem / ListItemIcon /
  ListItemText options with DOM methods in React's attribute order, and reads the country from the
  Select's hidden input. Country names come from `Intl.DisplayNames` (`locale`, default `en`):
  never hard-code an engine's name in a cross-engine test. `getCountryCallingCode`'s shared codes
  (+1, +44) detect no country while typing: tests use unique codes (+84, +61). The API reference's
  sentence splitter cuts at "E.164" (a dot inside a word): JSDoc says "international form" instead.
  Validation tests leave the field with Shift+Tab (Firefox keeps the focus on a last control).
  Image flags (`flags="image"`, ADR-0070 section 9): Circle Flags SVGs are copied by the html build
  (`copy-assets.mjs`: only `^[a-z]{2}\.svg$`, `circle-flags` dev dependency, plus its license)
  into `dist/flags/`, never into a JS bundle (`COPIES` in `check-licenses.mjs`, which also checks
  the copied license). URLs come only from `phoneFlagSource` (sanitized folder + a two-letter
  code); the CDN module sets the default folder (the html component's `setPhoneFlagsPath`, `../flags/`
  from `modules/phone-input.js`), React has none (`flagsPath` or emoji). Storybook serves the folder
  at `/flags` (`staticDirs`), so the story's relative `flags/` resolves under the e2e sub-path.
  Menu / Select typeahead (`createTypeahead`) skips `aria-hidden` descendants, so a flag emoji
  before the name doesn't stop "aus" from reaching Australia.
- Third-party notices (legal step L5): `scripts/check-licenses.mjs` (`pnpm check:licenses`, in
  `pnpm check` and CI) reads every published `dist`'s source maps (plus the verbatim copies in its
  `COPIES` list: MapLibre's workers, `dist/monaco/`) and fails when a bundled package has no entry
  in that package's generated `THIRD_PARTY_NOTICES.md` or a license outside its allowlist. After a
  dependency upgrade or a new bundled dependency: `pnpm build && pnpm notices`. A copy without a
  source map must be added to `COPIES`, or the check can't see it. The manifest (`publicText` in
  `scripts/manifest.mjs`) drops `Reference URL:` lines and design-reference names from spec text.
- CDN loader (ADR-0068): `owlky.js` registers `components/light.ts` and one stub definition per
  lazy module (`html/src/loader/modules.ts`, `loader:<name>`, the module's root selectors); the
  stub's setup imports `modules/<name>.js` (`src/modules/<name>.ts`, built by `vite build --mode
  modules` with shared chunks in `modules/chunks/`). A new component with a runtime goes in
  `light.ts` or in a module (entry file + table row): `loader/modules.test.ts` fails otherwise,
  and checks the table's selectors against the definitions. `@owlky/html/auto`, Storybook and
  unit tests register every component directly; the e2e loader spec (`loader.spec.ts`,
  `examples/loader/`) and the CSP page exercise the real loader. Code in both `owlky.js` and a
  chunk has two module instances: `check:size` lists those files and fails on module state in
  them (`STATE_ALLOWED` names the safe ones). `new URL("…", import.meta.url)` in a module needs
  `/* @vite-ignore */`, or Vite inlines the target as a data URL (it found `src/monaco.ts`).
  Pages with a strict Trusted Types policy refuse `innerHTML` in e2e too: build test markup
  with DOM methods. Firefox and WebKit hold `load` for a pending module import: `goto` with
  `waitUntil: "domcontentloaded"` when a test holds a module request. Design style sheets are
  CSS-only entries `style:<id>` of the same loader (ADR-0073 § 9): a `:root` definition watches
  `data-ok-style` attributes (the runtime observer sees added nodes only), sheets go right after
  the core `<link>`; loader unit tests remove every `data-ok-style` they set (`afterEach`).
- CSS split (ADR-0068 S4): `owlky.css` is the core sheet (tokens + light components); every lazy
  family is listed once in `packages/styles/src/families.json` (module → files, rank order) and
  becomes `modules/<name>.css`; `owlky-all.css` is everything. `index.css` must list the core
  files first and the families after them in that order, the loader's `LAZY_MODULES` keys follow
  the file's key order, and no core file may name a lazy root (`styles.test.ts`). A new lazy
  component: add its CSS file to a family (usually after the lazy components it composes; a
  lazy file now follows every core file, so repeat a core `[hidden]` rule it overrides), its module
  to the table, then `pnpm build`. Tests, Storybook and the website import `owlky-all.css` /
  `src/index.css`: `owlky.css` alone styles no large component. A lazy module that needs another
  module's sheet waits through `runtime.load()` (the data grid's chart kit).
- Parallel work: never run two `/component` / `/integrate` sessions (or two `pnpm build` /
  `pnpm test:e2e`) in the same working tree — builds wipe each other's `dist/` and
  `storybook-static/`, e2e servers share port 4321, and staging part of a shared file while
  another session edits it put lines in the wrong places (commit 7d2e745, repaired in 6eeb0d6).
  Use the commands' multi-URL / multi-component mode: one git worktree and branch per agent, e2e on
  its own port (`PORT=4322 pnpm test:e2e`), merged one by one by the orchestrator. Verification
  tiers (light local checks per agent behind `flock /tmp/owlky-heavy.lock`, the full matrix on
  an integration pull request, `main` only when green, one full local run per roadmap):
  `docs/testing.md` › "Parallel agents and verification tiers".
- Organization chart (ADR-0036): connectors are borders on `::before` / `::after` of the children
  `ul` and each child `li` (logical properties); the last child's start half is shifted by the line
  width so every vertical line uses the same pixels. Free lengths (`lineHeight`…) are `number`
  options turned into `--_ok-org-*` by core `organizationChartStyle` (React `style`, HTML runtime
  CSSOM); all private properties are redeclared on every root (nested charts). A node without
  children renders no children `ul` (an empty one would draw a line down). Snippets are generated
  from the React stories: `pnpm build && node apps/storybook/scripts/organization-chart-snippets.mjs`
  (it adds `data-ok-popover-open` to the card menu buttons; esbuild must keep `monaco-editor`,
  `maplibre-gl` and `@tiptap/*` external because the React dist reaches them).
- Organization chart tree mode (ADR-0063, `enableKeyboardNavigation` / `enableSelection`): core
  `createOrganizationChartTree` writes `role` (tree / treeitem / group), `aria-expanded`,
  `aria-selected`, `aria-multiselectable` and the roving `tabindex` in both implementations; React
  renders only `data-ok-selected`, so snippets stay plain lists. Items are named from their
  content like Tree view's: an `aria-labelledby` pointing at the label fails axe
  `label-content-name-mismatch` (the item's text includes its children). The focused item is the
  `li`, so lineage-highlight CSS lists `[data-ok-organization-chart-node]:focus-visible` next to
  `label:focus-within` (and the node itself, which `:has()` can't match), and the highlight
  controller treats a focused item as its own node. The zoom controller's "widgets with their own
  keys" check skips the chart's own `role=tree`; typeahead leaves + / = / − / 0 to zoom.
- Chart tree labels (4.18.86, `externalLabel`): any placement (chart, level or node) switches the
  tree layout to margins computed from each label's estimated, rotated box; without one the layout
  is the old code path, byte for byte. Placement text lives in `data-ok-external-label` (root and
  row headers) and `-levels`: chart-text keys appended at the end of `CHART_TEXT_ATTRIBUTES` so no
  existing snippet's attribute order changes.
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
- API reference (ADR-0049): `scripts/api-reference.mjs` reads React props with TypeScript 7's
  `typescript/unstable/sync` API (props declared in `packages/*`; the rest is "native"), parts from
  `core/src/anatomy/parts.ts` (type only, never in a bundle), events from each runtime's
  `EventSpec` map and methods from its instance interface, then writes
  `apps/docs-content/src/api/<spec>.json` (Biome skips them). `--list-missing` prints the
  declarations that still lack JSDoc. Runtime files are matched by `defineComponent<I, E>({ name:`
  with a literal name: keep that form. `emit` only takes the map's names and detail types, so a
  helper that forwards a name (the data grid's `change`) types it as a union of the map's keys.
  forwardRef drops the named props of a props type with an index signature (CardMedia): the
  generator falls back to the exported `<Name>Props`. Maintainer prose in JSDoc ("— spec:", ADR
  numbers, snippets, parity, `--_ok-*`) is cut from the reference: write user-facing sentences.
  Docs pages import their reference JSON `with { type: "json" }` (the website loads
  docs-content modules in Node). Rows carry `data-docs-api-row="<kind>:<entry>:<name>"`, not
  `data-docs-option` (the Options table test counts those).
- Docs examples (`pnpm check:docs`, in `pnpm check` and CI): no `…` anywhere in an example, not even
  in UI text ("Loading…" reads "Loading"); React examples are modules that declare their data;
  long HTML comes from the canonical snippets through `snippetElement(markup, match)`
  (`apps/storybook/src/helpers/snippet-markup.ts`, snippets imported with `?raw` by relative path),
  with page helpers on top (`gridOf()` keeps a grid's first rows, `htmlLightbox()`, `htmlEditor()`).
  An icon an example needs: add its Solar name to `DOCS` in `apps/storybook/scripts/icons.mjs`, run
  `pnpm --filter @owlky/storybook icons`, then use `SolarIcon` / `solarMarkup()` / `solarImports()`
  (`helpers/solar-icons.tsx`); the checker rejects names that aren't in the Solar set.
- Copy to clipboard (4.20): core `copyToClipboard` checks `navigator.userActivation` before any
  await and never throws. Tests stub every path (`Object.defineProperty(navigator, "clipboard",
  …)`, `document.execCommand`, `userActivation` getter): a real write can open a prompt that
  Firefox waits on forever. The HTML `clipboard` runtime and its `data-ok-clipboard-*` triggers
  are HTML-only hooks (parity `IGNORED`); React demos copy from click handlers. React tests show
  their toaster at `bottom-left`: a toast at the top right covers the field's end buttons.
- Number field (4.24): React reports typing from its own `onChange`, never from a native `input`
  listener that sets state. During the native event that update re-renders the controlled input
  first, React's value tracker then matches the DOM and `onChange` never fires: the keystroke is
  undone. Hence `createNumberFieldController(root, callbacks, { input: false })` and the shared
  `typedNumberChange`. Step options avoid `data-ok-step` (the Stepper's step root, which
  `stepper.css` styles): `data-ok-step-size`, `data-ok-small-step`, `data-ok-large-step`.
  React's static markup keeps `autoComplete` / `inputMode` camelCase: `demo-snippets.mjs`
  lowercases them.
- Countdown (4.22): the clock is `Date.now()` (anchored to `now` when given), timers fire once
  per change of the shown value. Unit tests fake `["setTimeout", "clearTimeout", "Date"]` and
  advance time (React inside `act()`); e2e uses `page.clock`: `install` then `pauseAt` before
  asserting values (the load time moves the first value), and parity / visual fix `Date.now()`
  with `setFixedTime` (timers still run, the values don't move). The toggle and restart triggers
  are HTML-only hooks (parity `IGNORED`); React demos use `paused` and `key`.
- Color swatches (4.23): `data-ok-swatch` is free text (not in a schema) on Radio, Checkbox and
  Avatar roots; core `swatchStyle` sanitizes it and returns `--_ok-swatch` / `--_ok-swatch-mark`
  (React `style`, HTML runtimes through `runtime/swatch.ts`). The Map legend uses the same
  attribute name on its own parts: never select a bare `[data-ok-swatch]` in CSS or a runtime.
  Radio got a runtime only for swatches (`[data-ok-radio][data-ok-swatch]`); React Radio still
  renders no `data-ok-runtime="off"` (the runtime writes the same values). Swatch sizes
  transition: unit tests finish the swatch's animations (`getAnimations()`) or `await settled()`
  before reading a checked width.
