# CLAUDE.md

Owlky: an accessible UI component library inspired by the Minimal dashboard design
language. Every component ships twice — **React** and **framework-free HTML** — with identical
`data-ok-*` markup, one prebuilt stylesheet and one shared behavior core.

Conventions, naming and the add-a-component checklist are in AGENTS.md (imported below). This
file covers project status, workflow and orientation.

## Status (updated 2026-11-12)

| Phase | Scope | State |
|---|---|---|
| 0 Foundation tooling | pnpm workspace, TS 7 strict, Biome, Vitest browser mode, Playwright, Storybook 10, Changesets, CI | ✅ done |
| 1 Tokens & theming | tokens → CSS vars, light/dark/system/nested, `createTheme()`, AA contrast tests, Tailwind v4 theme, HTML runtime | ✅ done |
| 2 Pattern components | Button, Switch, Dialog | ↩ removed (ADR-0011); reference at commit `bd5fb2d` |
| 2' Foundations | Tokens + Storybook › Foundations (Colors, Typography, Shadows, Grid, Icons, Settings, Illustrations — ADR-0041: theme-aware set in `@owlky/core/illustrations`, a lazy CDN module): one story per section, default Storybook UI | ✅ done, awaiting review |
| Theme settings | Mode and root font size through `applyThemeSettings` (ADR-0070 § 2; presets and font presets removed in ST2, styles and axes follow in ST3) | ✅ done, awaiting review |
| Components | Button, Icon button, Fab, Button group, Toggle button, Drawer, Sortable, Accordion, Alert, Table, Pagination, Scrollbar, Circular / Linear progress, Checkbox, Switch, Form control label, Radio, Text field, Avatar, Badge, Chip, Label, Divider, List, Popover, Tooltip, Menu, Dialog, Snackbar, Backdrop, Tabs, Breadcrumbs, Stepper, Timeline, Rating, Slider, Transfer list, Tree view, Autocomplete, Motion (Animate: Motion, MotionGroup, MotionText, CountUp, MotionBorder, Countdown; full version ADR-0062: `animate()` engine with springs and exits, MotionPresence, scroll progress on Linear / Circular progress, drag and gesture states, layout animations and shared values), Number field and Phone input (Text field family; phone opt-in, ADR-0061), color swatches on Radio / Checkbox / Avatar, Paper composed by the overlay surfaces (ADR-0066), Data grid (phases 1–6 of 6, ADR-0020 / 0021), Editor (Tiptap, ADR-0023; updated 2026-11-09: text transform, fullscreen Backdrop), Map (MapLibre GL JS, ADR-0025), Carousel (ADR-0033: native scroll snapping, Embla options and plugins, loop without clones), Lightbox (ADR-0032: a modal dialog around the Carousel, every yet-another-react-lightbox plugin), Markdown (unified, ADR-0035; the Editor preview renders with it), Chart (complete: phases 1–4, ADR-0024 / 0027 / 0029 / 0031; Sankey and stock charts with indicators, panes and a navigator, ADR-0047), Date pickers (complete, phases 1–4, ADR-0022 / 0026 / 0028 / 0030: DatePicker, TimePicker and DateTimePicker families, Date / Time / DateTimeField, DateCalendar, Month / YearCalendar, TimeClock, DigitalClock, MultiSectionDigitalClock, LocalizationProvider; DateRangeCalendar, DateRangePicker, TimeRangePicker and DateTimeRangePicker families, single / multi input range fields; time zones, date adapters, calendar systems, locale packs, right to left, slots and view renderers), Code editor (Monaco, ADR-0034: CodeEditor, DiffEditor, useMonaco, loader), Organization chart (ADR-0036: nested lists, CSS connectors), Upload (ADR-0037: a native file input under the drop zone, react-dropzone options; Upload, UploadAvatar, UploadBox), Image (ADR-0038: native lazy loading, placeholder, ratios, overlays; Markdown pictures compose it), Walktour (ADR-0039: react-joyride API, steps as Popovers over a Backdrop with an SVG spotlight, beacons), Paper (CSS only, any element: elevation 0–24, outlined, square; the base of Card), Typography (CSS only, the type scale tokens; MUI API with `component` / `variantMapping`), Collapse (ADR-0044: `hidden` is the state, a core controller animates the size; nested lists, tree view groups and StepContent compose it), Card (CSS only, on Paper: header, media, content, actions, action area), Form control (CSS only: FormControl, FormLabel, FormGroup, FormHelperText; states on the root, `useFormControl` context in React), Link (CSS only, on Typography: underline, button links, `rel` on new tabs; Breadcrumbs items compose it), Select (ADR-0045: select-only combobox with roving focus, InputLabel, native, multiple, chips, grouping; TextField and TablePagination compose it with `selectProps`), Gantt (ADR-0048, complete, phases 1–3: one treegrid with a timeline column drawn by a core node layout; scales and zoom, summary tasks, milestones, dependencies, baselines, critical path, selection, tooltips, keyboard, editing by drag and keyboard, row virtualization, SVG / PNG / CSV downloads) ✅ (via `/component`) | awaiting review |
| MCP server | `@owlky/mcp` (ADR-0046): stdio server (`npx -y @owlky/mcp`), six tools, resources, prompts, answering from the generated `packages/mcp/manifest.json` (`pnpm manifest`, `check:manifest`) | ✅ done, awaiting review |
| API reference | ADR-0049 (roadmap 3.2–3.4): every React prop, `data-ok-*` name (options, parts, states, values, triggers), event, instance method, type and CSS variable, per React component and HTML part, generated by `scripts/api-reference.mjs` (`pnpm api`, `check:api`) into `apps/docs-content/src/api/*.json`; an "API reference" section on every docs page; `get_component` returns it | ✅ done, awaiting review |
| Website phase 1 | ADR-0040: `apps/website` (owlky.com, Next.js static export built with Owlky: Home, Get started, Colors, Button, Pagefind search, `llms.txt` + `.md` per page, **Open HTML demo** sandboxes), `apps/docs-content` (pilot guides + guide UI, Storybook renders them through its host), `website.yml` (Vercel CLI, skips until the secrets exist) | ✅ done, awaiting review; phase 2 (migrate the other guides) next |

Full plan: `docs/roadmap.md` ("After the waves"). **Component completion is done** (2026-11-12,
`docs/roadmap-components.md`: every row ✅ or ⏸ with a reason). **Next:** the road to 0.1.0
(`docs/roadmap-0.1.0.md`, approved 2026-11-12): bundle size (`docs/roadmap-size.md`: S1 to S3
done) and clean IP in parallel → design styles (`docs/roadmap-styles.md`: nine styles, Soft default,
Solar icons) → accounts and the remote MCP (ADR-0071) → 0.1.0 → more frameworks.
Not published
yet. Repository:
`github.com/dangduoc08/owlky` (public; the GitHub org `owlky` only reserves the name).

**Blocked on the user before publishing 0.1.0:** npm org `@owlky` (ADR-0016), `NPM_TOKEN` secret
or npm trusted publishing, visual baselines via `pnpm test:visual:update` (Docker only), and the
website (ADR-0040; steps in `apps/website/README.md` › Deployment): the Vercel project (root
`apps/website`), a Vercel token, the `website` GitHub environment with `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and DNS for owlky.com (`www` redirects to the apex). Until
then `website.yml` skips with a notice.

**CI jobs** (`ci.yml`, docs/testing.md): `check` (lint, types, build, checks, Node unit tests),
`unit` × chromium / firefox / webkit (browser unit tests, one engine per runner), `e2e` shards,
`website`, `audit`.

**Releasing:** CI only on `main`; publish = push tag `release/v<version>` on a `main` commit
whose packages already carry that version (ADR-0012).

## Workflow with the user

- Work in **review gates**: propose (numbered decisions) → user approves → implement.
  Stop at each phase boundary for review.
- Don't redesign approved architecture. Changing a decision = a new ADR in `docs/adr/` that
  supersedes the old one.
- The user writes in Vietnamese; repository docs and code stay in English.
- Commit, push or publish only when asked.

## Stack

Node ≥ 22.12 · pnpm 12 · TypeScript 7 (native `tsc`) · React 19 (peer `^18.3 || ^19`) ·
Tailwind CSS 4.3 · Biome 2.6 · Vitest 5 (browser mode, Playwright provider) · Playwright 1.64 ·
Storybook 10.6 · Vite 8 · Changesets (fixed versioning).

## Repository map

```
packages/tokens   design tokens (TS source of truth → tokens.css / tokens.json)
packages/styles   prebuilt CSS (components in @layer components) + Tailwind v4 theme.css
packages/core     framework-free behavior + anatomy, shared by react and html
packages/react    React components
packages/html     HTML Core Runtime, snippets (src/components/*/examples), CDN IIFE bundle
packages/mcp      MCP server @owlky/mcp (stdio) + generated manifest.json (ADR-0046; Node, no other Owlky package at run time)
apps/storybook    Foundations guides (src/foundations/*) + component stories (one per section, Framework toolbar, ADR-0018)
apps/docs-content guides shared by Storybook and the website (ADR-0040; phase 1: Colors, Button) + guide UI; private
apps/website      owlky.com: Next.js static export built with Owlky, Vercel via GitHub Actions; private
e2e               Playwright: parity, interactions, themes, a11y, plain-HTML, visual
examples          plain-html consumer example (uses dist)
specs/components  component contracts — update before code
docs              architecture.md, roadmap.md, roadmap-components.md, testing.md, adr/
scripts           check-boundaries, check-size, check-packages, sync-versions, api-reference (ADR-0049), manifest (MCP data), smoke-mcp
```

## Commands

```sh
pnpm install
pnpm build                                  # required before tests (they load built CSS)
pnpm test                                   # unit/component, Chromium
VITEST_BROWSERS=chromium,firefox,webkit pnpm test
pnpm test:node                              # Node projects only (tokens, styles, mcp)
VITEST_BROWSERS=firefox pnpm test:browser   # browser projects only (core, react, html), one engine: what each CI unit job runs
pnpm storybook                              # http://localhost:6006
pnpm storybook:network                      # same, reachable from other devices (LAN, Tailscale; WSL: mirrored networking)
pnpm storybook:build && pnpm test:e2e       # Chromium, Firefox, WebKit, mobile
pnpm website:dev                            # http://localhost:3000 (needs pnpm build)
pnpm website:build && pnpm website:serve    # static owlky.com in apps/website/out, :4400
pnpm --filter @owlky/e2e test:website       # website e2e against out/
pnpm lint:fix
pnpm check                                  # everything CI runs
pnpm api                                    # after pnpm build: regenerate the API reference (apps/docs-content/src/api)
pnpm check:api                              # fails when it is stale or something is undocumented
pnpm manifest                               # after pnpm api: regenerate packages/mcp/manifest.json
pnpm check:manifest                         # fails when the manifest is out of date (in pnpm check and CI)
pnpm icons                                  # regenerate packages/core/src/icons/solar.ts (Solar component icons)
pnpm check:icons                            # fails when solar.ts is stale (in pnpm check)
pnpm smoke:mcp                              # pack @owlky/mcp, start it with npx, tools/list (CI)
```

## Slash commands (`.claude/commands/`)

| Command | Use |
|---|---|
| `/component <url> [name] \| <name> …` | Create or update a component from a reference page (a name alone uses its spec's `Reference URL:`): capture, propose, build React + HTML with viewport matrix, visual, coverage and security checks. Several targets: parallel agents, one worktree each (max 3), merged one by one |
| `/integrate [component \| url …]` | Close every wait on a component that now exists, then implement via `/component` Update. No argument: every open wait. Several: one agent per dependent (max 3) |
| `/illustration <name> "<description>"` | Add a picture to the illustration set (`docs/illustrations-style.md`), catalog it, rule tests, **All** contact sheet |
| `/implement <description \| component \| file>` | Work without a reference page (roadmap rows, upstream props): runs `/component` steps 7–12 |
| `/refactor [optimize] <file>` | No API or DOM change: clarity (default) or bytes / main thread / leaks, measured |
| `/sync-docs [package \| component \| kb \| audit [readiness]]` | All docs in sync with code: README or spec + docs page; `kb` (default) the knowledge base; `audit` read-only report, `readiness` simulates a new agent |
| `/check-staged` | Impact report of staged changes (read-only) |
| `/commit [message]` | Conventional commits from staged changes, no trailers |

## Key decisions (details in docs/adr/)

- Styling via `data-ok-*` attributes; zero-specificity `:where()` selectors in `@layer components`;
  no `--tw-*` in dist (ADR-0003).
- Behavior implemented once in `core` controllers that report intent (`onDismiss`) (ADR-0004).
- HTML runtime: registry + document-level delegation + MutationObserver, idempotent (ADR-0005).
- Baseline Chrome/Edge 114, Firefox 128, Safari 17; feature detection + visible fallbacks (ADR-0006).
- Only three `Symbol.for` globals; runtime protocol/version policy (ADR-0007).
- React ⟷ HTML never import each other; enforced by lint + scripts (ADR-0008).
- Brand colors follow the reference (white on fills, `main` text; ADR-0014); neutral and soft
  text are AA-tested.
- Component API comes from the upstream component (MUI…), mapped prop by prop; one option schema
  per component in `core` drives React, HTML, Controls and parity (ADR-0015).
- Storybook: one story per component section; the toolbar's Framework menu picks HTML or React (ADR-0018).
- Every component has a Storybook usage guide page (Docs), built like the Foundations guides; `/sync-docs <component>` refreshes spec + page (ADR-0019).
- Map: MapLibre GL JS behind opt-in entries (`@owlky/core/map`, `@owlky/html/map`, the CDN's lazy
  `modules/map.js` + `owlky-map-worker.js`); Owlky draws controls, markers and popups around the canvas; no tile
  service built in (ADR-0025).
- Chart: one SVG engine in core written by us (ApexCharts isn't MIT); HTML data is a `<table>` (ADR-0024); every ApexCharts chart type (ADR-0027); zoom is an x-axis window in state, linked charts through a module-scoped registry, annotations as an HTML list (ADR-0031).
- Code editor: Monaco behind opt-in entries, self-hosted (`@owlky/html/dist/monaco/`), never loaded
  from a CDN by default; its CSP is documented and tested on its own page (ADR-0034).
- Design styles (ADR-0070, `docs/roadmap-styles.md`): component CSS reads style tokens only (radius
  roles, border / line widths, focus rings, density, font roles, `--ok-icon-stroke`); theme settings
  are the mode (`data-ok-theme`) and the root `font-size`; a brand color or font is a token override
  or `createTheme()`. Component icons are Solar, generated into `@owlky/core` (`check:icons`).
- Gantt: one `role=treegrid` whose rows hold the task-list cells and a timeline cell (sticky list
  and header in one scroll container); core `renderGantt` returns a node tree both implementations
  draw; HTML data is `table[data-ok-gantt-data]`; ISO days as UTC day numbers (ADR-0048).
- API reference (ADR-0049): generated from typed sources only — React prop types + JSDoc
  (TypeScript compiler API), option schemas, `core/src/anatomy/parts.ts` (`<Spec>Parts`, type
  only), runtime event maps (`EventSpec`) and instance interfaces, component CSS; shown by
  `apiReferenceSection` on every docs page and returned by `get_component`.
- Illustrations are data (SVG node trees with `data-ok-tone`, one export per picture) in the opt-in
  `@owlky/core/illustrations`; tones map to tokens in `illustration.css`; HTML runtime opt-in
  (`@owlky/html/illustrations`, the CDN's lazy module). All artwork is original (ADR-0041).

## Storybook MCP

`@storybook/addon-mcp` serves an MCP server from the dev server (`pnpm storybook` →
`http://localhost:6006/mcp`, registered in `.mcp.json` as `storybook`; restart a running
Storybook after installing). Use it to look things up, not as a contract:

- `docs-list`: every component and docs page with its id; `stories-find-by-component`: which
  stories render a file (the dependents to re-check in `/integrate`); `docs-show-story`, `stories-preview`.
- `docs-show` lists a component's stories but no props: story metas don't set `component`
  (ADR-0018 keeps Controls on the option schema). Props and attributes come from the spec and
  the option schema in `core/src/anatomy/anatomy.ts`, which stay the source of truth (the
  server's own advice to trust only its docs doesn't apply here).
- React only: the HTML implementation isn't in the manifest. No `test-run` (no `@storybook/addon-vitest`).

## Owlky MCP

`@owlky/mcp` (ADR-0046) is registered in `.mcp.json` as `owlky` (`node packages/mcp/dist/cli.js`,
needs `pnpm build`). It answers from `packages/mcp/manifest.json` (option schemas, spec sections,
every story's HTML and React Code panel, snippets, guides, tokens), so it covers HTML **and**
React with props, unlike the Storybook MCP. Tools: `list_components`, `get_component`,
`get_examples`, `search_tokens`, `get_guide`, `validate_markup` (`get_component` also returns the API reference; `part` narrows it to one entry). Regenerate the manifest with
`pnpm build && pnpm api && pnpm manifest` after changing a schema, spec, story, docs page, snippet or token,
or `check:manifest` fails; a running server only sees the new manifest after a restart.

## Local environment notes

- pnpm 12 is a native binary corepack can't run: it is installed with `npm i -g pnpm` and
  `corepack disable pnpm` was applied.
- Docker daemon is usually off; visual baselines must only be generated inside Docker.
  Don't start Docker Desktop without asking.

@AGENTS.md
