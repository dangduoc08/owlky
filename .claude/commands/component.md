---
name: component
description: Create or update a component from a reference URL (e.g. a Minimal UI kit component page) — capture what the reference shows, then build it, or bring the existing component in line with it, the project's way in React + HTML with tokens, parity tests, full test coverage, responsive and visual regression checks, a security checklist and Storybook docs. $ARGUMENTS is the URL, optionally followed by the component name.
---

# Mission

Turn a reference component page into a **Owlky component** — or bring an existing one
in line with it: same *content* (variants, colors, sizes, states, behavior), built with this
project's architecture, tokens and conventions — responsive at every viewport, fully tested, and
passing the security checklist.

The command runs in one of two modes, detected in step 1:

| Mode | When | Goal |
|---|---|---|
| **Create** | the component doesn't exist yet | build every slice from scratch |
| **Update** | the component already exists | close the gaps between the reference and the current implementation, in place, keeping the public API stable |

The reference is for **content only**. Presentation, naming, code and structure follow this
project. Never copy the reference's source code, branding or assets.

---

## Steps

1. **Parse the arguments.**
   - $ARGUMENTS = `<url> [component-name]`. If the URL is missing or not `http(s)`, ask for it and stop.
   - Derive the name from the last path segment when not given (`/components/mui/buttons` →
     `button`): singular, kebab-case. If the name is ambiguous, ask.
   - **Detect the mode.** *Update* if any slice exists — `specs/components/<name>.md`,
     `packages/styles/src/components/<name>.css`, `packages/react/src/<name>/`,
     `packages/html/src/components/<name>/` or `<name>Attributes` in
     `packages/core/src/anatomy/anatomy.ts`; otherwise *Create*. State the mode and the slices
     found. If only some slices exist, it's an Update that also completes the missing slices.
     In Update mode compare the URL with the spec's `Reference URL:` line; if they differ, say so.

2. **Read the project rules first.** `CLAUDE.md` (status, workflow), `AGENTS.md` (conventions,
   checklist, gotchas), the ADRs it touches (0003 styling, 0004 core, 0005 runtime, 0006
   browsers, 0011 foundations-first). Check `docs/roadmap.md`: if the component isn't the next
   approved item, say so in the plan (step 5).

3. **Capture the reference** (it is usually client-rendered — `WebFetch` only sees the title).
   Write a throwaway Playwright script in the scratchpad and run it from `e2e/` (where
   `@playwright/test` resolves), e.g. `cp <scratch>/grab.mjs e2e/zz-grab.mjs && node e2e/zz-grab.mjs <out>`,
   then delete the copy. Capture:
   - full-page screenshots and main text at **every viewport of the [Viewport matrix](#viewport-matrix)**
     — note what changes per breakpoint (stacking, wrapping, hidden parts, sizes), using a touch
     context (`hasTouch: true, isMobile: true`) for the mobile widths;
   - the section list ("On this page" / headings) — each section becomes a **story**;
   - for one representative element per variant/size/color: tag, `display`, padding, gap,
     radius, border, font (family/weight/size/line-height), color, background, box-shadow,
     min-height, transition — via `getComputedStyle`;
   - states: hover (`locator.hover()`), focus-visible (keyboard `Tab`), active, disabled, and
     behavior for interactive components (open/close, keyboard, focus movement, ARIA roles and
     attributes — dump `outerHTML` of one instance with `class` attributes stripped);
   - dark mode, if the reference has a toggle.
   Look at the screenshots. Never copy text or code verbatim; record values.

   **Read the upstream component (ADR-0015).** The reference page links the component it is built
   on (the first link under the title: MUI, Atlassian pragmatic-drag-and-drop, simplebar…). Read
   its API page (MUI: `https://mui.com/material-ui/api/<name>/`) and demo page with `WebFetch`:
   every prop with its type, default and description, events / callbacks, keyboard and ARIA notes,
   and the features the Minimals demo doesn't show (e.g. Drawer `variant`, `hideBackdrop`). Record
   behavior and API only — never copy source code.

   **Update mode — also capture the current component** with the same script against the built
   Storybook (`pnpm build && pnpm storybook:build`, served by `e2e/serve.mjs`) for both
   implementations, and read its spec, CSS, React/HTML sources and tests. Build a **gap table**:
   *reference ↔ current* per variant, size, color, state, behavior, section/story and viewport —
   each row marked *missing*, *different* or *matches*.

4. **Map the reference to tokens.**
   - Every color, radius, shadow, font, spacing, breakpoint and duration must map to an existing
     `--ok-*` token. Build a table *reference value → token*.
   - A value with no token is a **foundation gap**: propose adding the token (foundations first,
     ADR-0011) instead of hard-coding it.
   - Contrast (ADR-0014): brand colors follow the reference (white on `main` fills, `main` text
     for outlined / text, MUI's 3:1 rule for swatches); neutral text and soft tones must meet
     WCAG 2.2 AA. Mark brand-colored demo elements that are exempt from `color-contrast` the
     same way as Button (`CONTRAST_EXEMPT` in the test helpers) — never disable axe wholesale.

5. **Propose, then wait for approval** (review-gated workflow). Show the mode, then:
   - the **API mapping table** (ADR-0015): every upstream prop → *kept* (same name) · *renamed*
     (reason) · *deferred* (backlog row in `docs/roadmap.md`) · *not applicable* (reason: `sx`,
     `classes`, `slotProps`, `component`, transition / ripple props…). Callbacks keep this
     project's value-first shape (`onOpenChange(open, reason?)`, `onChange(value)`);
   - **options beyond the reference:** every option found neither on the reference page nor
     upstream, with its reason (accessibility, security, HTML parity) — each needs approval;
   - the **React ↔ HTML option table**: each option's React prop, HTML attribute / state /
     event / instance method per the ADR-0015 mapping, default and kind (`style` · `behavior` ·
     `state`) — this becomes the component's option schema in `core/src/options/`;
   - the draft spec (anatomy with `data-ok-*` attributes, options table HTML ↔ React prop ↔
     default, states, keyboard, ARIA, events, **responsive behavior per breakpoint**) — following
     the template in `specs/README.md`;
   - the pattern: CSS-only / native control / runtime behavior (core controller);
   - token mapping + any new tokens; intentional differences from the reference (AA, assets,
     unsupported features) as a numbered list;
   - the **test plan**, organized by the [Testing architecture](#testing-architecture): the
     [Coverage matrix](#coverage-matrix) filled in for this component, the responsive checks per
     viewport, the stories that get visual baselines, and the
     [Security checklist](#security-checklist) items that apply;
   - **tooling status — verify, never assume** (read `package.json`, `e2e/package.json`,
     `apps/storybook/package.json`, `apps/storybook/.storybook/main.ts`, `vitest.config.ts`):
     - coverage: if `@vitest/coverage-v8` and a `test:coverage` script don't exist, propose adding
       them (dev dependency pinned to the installed Vitest version, thresholds below);
     - visual regression: report whether Chromatic (`chromatic`, `@chromatic-com/storybook`) or
       Storybook Visual Tests are configured. If not, the existing Playwright `@visual` suite is
       used (see [Visual regression](#visual-regression)); Chromatic or any other paid service or
       new dependency may only be *proposed* here, never added without approval;
   - the stories (one per reference section) and the files to be created (Create) or changed (Update);
   - **reuse and stand-ins:** which existing components / core helpers this one reuses; every part
     the reference builds from a component we don't have yet, and how it is covered meanwhile —
     native platform feature or story-only demo markup, never a home-made stand-in in the library
     (a later component must integrate without DOM or API changes); add each to
     `docs/roadmap.md` → "Pending integrations" — so are reference sections / stories deferred
     because a component is missing (never only a backlog line);
   - **integrations this component unlocks:** (capture each dependent's section from the
     `Reference URL:` of its spec — never build it from a backlog name alone) the rows of
     "Pending integrations" waiting for it,
     plus `grep -rn "<Name>" docs/roadmap.md specs/` for anything else that names it as missing
     (backlog lines, deferred stories), plus a search of existing components for the same pattern
     (e.g. `overflow: auto` for a Scrollbar) — with the planned change per dependent and its API
     impact (normally additive). These are part of this component's scope, built in the same
     review: never just reword a "needs <Name>" note into "<Name> now exists". Integrate **by
     composition visible in the dependents' code** (their stories, examples and snippets use the
     new component as the reference does; their CSS adapts with `:has(> [data-ok-<name>])`) —
     never by adding the dependents' selectors to this component's CSS;
   - **Update mode:** the gap table and the planned change for each gap; the **public API
     impact** — none / additive (new option, value, story) / **breaking** (renamed or removed
     prop, `data-ok-*` attribute or value, `--ok-*` variable, event, changed default or DOM
     structure) — with a migration note for every breaking item; the resulting changeset level
     (patch / minor / major); the visual baselines expected to change.
   Stop and ask for approval. Do not write code or add dependencies before the user approves.
   Breaking changes need an explicit yes, item by item.

6. **First component only** (Create mode, when `packages/styles/src/components/` has no `.css` yet):
   - restore the export globs: `"./components/*": "./dist/components/*"` in
     `packages/styles/package.json`, `"./snippets/*": "./dist/snippets/*"` in `packages/html/package.json`;
   - restore `e2e/tests/parity.spec.ts` (`git show bd5fb2d:e2e/tests/parity.spec.ts`), emptying its pairs;
   - restore React helpers when needed (`git show bd5fb2d:packages/react/src/utils/<file>`);
   - add the approved coverage tooling (step 5);
   - extend `e2e/tests/visual.spec.ts` from foundations to component stories with the
     [Viewport matrix](#viewport-matrix) widths (see [Visual regression](#visual-regression)).

7. **Implement** with `/implement`'s checklist (AGENTS.md → "Adding a component"), using the
   removed pattern references at commit `bd5fb2d` as the model (ADR-0011). **Create** writes
   every slice below. **Update** edits the existing slices in place — spec first, then every
   slice the approved gaps touch, always React **and** HTML together — keeping existing names,
   defaults and DOM unless a breaking change was approved; add the missing slices if any:
   1. `specs/components/<name>.md` (the approved spec), with `Reference URL: <url>` under the
      `Reference:` line
   2. `packages/core` — the option schema in `src/options/` (ADR-0015) and `<name>Attributes()`
      in `anatomy/anatomy.ts` built from it; behavior controller in
      `src/<name>/` if interactive (reports intent, owns no state; native + fallback paths)
   3. `packages/styles/src/components/<name>.css` — single `:where()` selectors in
      `@layer components`, order base → sizes → variants → hover → focus → disabled, `--ok-*`
      tokens only, `@media (hover: hover)` for hover, `prefers-reduced-motion`; **mobile-first**:
      base rules for the smallest viewport, `min-width` media queries at token breakpoints
      (600 / 900 / 1200px) for larger ones; intrinsic sizing (`min-width: 0`, wrapping, no fixed
      widths that can overflow)
   4. `packages/react/src/<name>/` — component(s) + tests (+ `"use client"` only with hooks;
      interactive roots render `data-ok-runtime="off"`)
   5. `packages/html/src/components/<name>/examples/*.html` — canonical snippets; plus
      `<name>.ts` (`defineComponent`) + tests and one line in `components/index.ts` if it needs JS
   6. `apps/storybook/src/components/<name>/` — `<name>.react.stories.tsx` and
      `<name>.html.stories.tsx` with **identical story names = the reference sections**, default
      Storybook UI (no custom page chrome), no docs page or Playground: stories built with
      `reactGroupsStory()` / `snippetStory(…, htmlSetup())` so the Code panel shows the source,
      the imports and a copy button; both stories get the same Controls from the option schema
      (`<NAME>_CONTROLS`, see AGENTS.md) and the component joins `options-parity.spec.ts`
   7. `e2e/tests` — parity pairs, an interaction spec (incl. touch on mobile widths) and a
      **responsive spec** (`<name>.responsive.spec.ts`) run for both implementations over the
      [Viewport matrix](#viewport-matrix); `a11y.spec.ts` and `visual.spec.ts` pick up stories
      from `index.json` (`storyIds()` in `e2e/tests/helpers.ts`)

8. **Test to full coverage and check responsive + visual behavior.**
   - Write every test in the [Coverage matrix](#coverage-matrix) (Update: keep the existing
     tests passing unchanged except where an approved change requires it; add tests for every
     closed gap and a regression test for every fixed bug). If coverage tooling was
     approved and added (step 5), run `pnpm test:coverage` and meet the thresholds; if not, report
     coverage as "matrix only — no coverage tool" and never claim percentages. Any uncovered
     branch is either tested or removed — never excluded to reach a threshold.
   - Run the responsive spec for both implementations at every viewport; diff React vs HTML
     results (dimensions, wrapping, overflow) and fix unintended differences in the CSS/markup.
   - Run visual regression (see [Visual regression](#visual-regression)) and review every diff.

9. **Run the security checklist.** Go through every item of the
   [Security checklist](#security-checklist), run its check, and fix every failure. Record each
   finding with its [severity](#severity) — Critical and High must be fixed before hand-off;
   Medium and Low are fixed or explicitly accepted by the user. Items that don't apply are marked
   N/A with a reason. Never add a security tool or dependency without approval.

10. **Verify** — all must pass (every command below exists today, except where marked):
    ```
    pnpm build
    VITEST_BROWSERS=chromium,firefox,webkit pnpm test
    pnpm test:coverage                       # only if approved and added in step 5
    pnpm storybook:build && pnpm test:e2e    # e2e: interactions, responsive, a11y, parity (4 projects)
    pnpm test:visual                         # visual regression — Docker only (see Visual regression)
    pnpm lint && pnpm typecheck && pnpm check:boundaries && pnpm check:size && pnpm check:packages
    pnpm audit --audit-level=high            # pnpm built-in, same as CI
    ```
    If Docker isn't running, don't generate baselines locally: report the visual status as
    "pending — runs in CI (e2e chromium job, `--grep @visual`)".
    Then check the built CSS: `grep -n "@supports (color: color-mix" packages/styles/dist/components/<name>.css`
    must find nothing — Tailwind rewrites `color-mix()` with alpha-dropping fallbacks (AGENTS.md).

11. **Compare with the reference.** Put the visual-regression screenshots of every story (each
    viewport, light and dark) next to the reference capture. List remaining visual differences:
    fix the unintended ones, keep and report the intentional ones.

12. **Document & hand off.** Update `docs/roadmap.md` (the "Overview" row → ✅, status and "Pending integrations": add new
    stand-ins and deferred stories, remove the rows this component closed — a row it unlocked but
    didn't close is a bug in this review; if any remain, tell the user to run `/integrate <name>`) / `CLAUDE.md` status, package READMEs if
    exports changed, `AGENTS.md` gotchas for anything new you learned, and remind the user to add
    a changeset (`pnpm changeset`) at the level from step 5 — Update mode with breaking changes
    also lists the migration notes for the changeset and the `!` / `BREAKING CHANGE:` commit
    marker (see `/commit`). Do not commit.

---

## Viewport matrix

Every story is checked at each viewport, in light and dark, for **both implementations**:

| Viewport | Width × height | Context | Crosses breakpoint |
|---|---|---|---|
| Mobile | 375 × 812 | touch (`hasTouch`, `isMobile`, `hover: none`) | — (below 600px) |
| Mobile Large | 430 × 932 | touch (`hasTouch`, `isMobile`, `hover: none`) | — (below 600px) |
| Tablet | 768 × 1024 | touch | 600px |
| Laptop | 1280 × 800 | mouse | 900px, 1200px |
| Desktop | 1440 × 900 | mouse | 1200px |

Set per test with `page.setViewportSize()`, or a `browser.newContext({ viewport, hasTouch,
isMobile })` for touch contexts (`isMobile` is Chromium-only; the existing `mobile` Playwright
project is Pixel 7 with touch).

Required responsive assertions (Playwright, per viewport, React **and** HTML):
- **Horizontal overflow:** `document.documentElement.scrollWidth <= innerWidth`.
- **Clipping:** no component part is cut off (`scrollWidth <= clientWidth` and
  `scrollHeight <= clientHeight` where overflow is hidden; text not truncated unless specified).
- **Overlapping:** interactive parts' bounding boxes don't intersect, and nothing covers them
  (`document.elementFromPoint` at each part's center returns the part or a descendant).
- **Text wrapping:** labels wrap or truncate exactly as the spec says; no word overflows its box.
- **Spacing & dimensions:** gaps, paddings and component sizes match the tokens for that
  breakpoint (assert `getBoundingClientRect()` / computed values against the spec).
- **Touch (mobile/tablet):** interactions work with `locator.tap()`; targets are ≥ 24 × 24 CSS px
  (WCAG 2.2 2.5.8); hover-only affordances never hide information.
- **Breakpoint behavior** matches the spec (what stacks, wraps, hides or resizes at 600 / 900 / 1200px).
- **React ↔ HTML:** the same story yields the same dimensions, wrapping and overflow results in
  both implementations (compare the measured boxes); any difference is a bug unless the spec
  lists it as a parity exception.

---

## Testing architecture

Each concern has one owner. Use the scripts that exist — never invent one.

| Testing | Responsibility | Tooling in this repo | Command |
|---|---|---|---|
| Vitest | Unit and component logic: anatomy, options, state, events, lifecycle, fallbacks, SSR | Vitest browser mode (Playwright provider), Testing Library | `pnpm test` (`VITEST_BROWSERS=chromium,firefox,webkit` for all engines) |
| Accessibility | WCAG 2.2 AA: axe rules, keyboard, focus, ARIA, contrast, reflow at 320 CSS px (1.4.10), text spacing (1.4.12) | `axe-core` in Vitest; `@axe-core/playwright` in `e2e/tests/a11y.spec.ts`; Storybook addon-a11y for manual review | `pnpm test`, `pnpm test:e2e` |
| Visual regression | Screenshot baselines of every story × theme × viewport; approval of changes | Playwright `toHaveScreenshot` in `e2e/tests/visual.spec.ts` (`@visual`), Docker-pinned rendering. Chromatic / Storybook Visual Tests only if configured or approved | `pnpm test:visual`, `pnpm test:visual:update` |
| Playwright | E2E: interactions, touch, responsive matrix, React ↔ HTML parity (anatomy + pixels) | `e2e/tests/*.spec.ts` against the built Storybook and the plain-HTML example | `pnpm storybook:build && pnpm test:e2e` |
| Security checks | Injection, unsafe rendering, URLs/SVG/attributes, secrets, dependencies | grep checks below, Vitest/Playwright tests (CSP), `pnpm audit` | see [Security checklist](#security-checklist) |

Screenshot comparison has two distinct jobs and no overlap: **visual regression** compares a story
with its approved baseline (`visual.spec.ts`); **parity** compares the React story with the HTML
story in the same run (`parity.spec.ts`). Don't add baseline screenshots anywhere else.

---

## Visual regression

1. **Check what's configured** (step 5). Chromatic / Storybook Visual Tests are used only if
   already configured or approved by the user; otherwise use the existing Playwright suite.
2. **Coverage:** `e2e/tests/visual.spec.ts` takes every story id from the built Storybook
   `index.json` (`storyIds()`), for light and dark, at every [Viewport matrix](#viewport-matrix)
   width. Baseline names: `<story-id>-<theme>-<width>.png`.
3. **Deterministic rendering:** run only in the Playwright Docker image (`pnpm test:visual`,
   same image as CI) with reduced motion and loaded fonts. Never commit baselines produced
   outside Docker.
4. **Review:** on failure, inspect the expected/actual/diff images in `e2e/test-results/` and
   classify each diff as *unintended* (fix the code) or *intentional* (new story, deliberate
   design change).
5. **Approval:** list every intentional change (story, theme, width, reason) in the report and
   ask the user to approve before running `pnpm test:visual:update`. New stories' first
   baselines also need approval.
6. **Baseline status** per story is one of: ✅ matches · 🆕 new (awaiting approval) ·
   ⚠️ changed (awaiting approval) · ❌ unintended diff · ⏸ pending (Docker unavailable — CI).

---

## Coverage matrix

**Thresholds** (`pnpm test:coverage` once approved and added, per component file in `core`,
`react`, `html`):
statements ≥ 95 %, branches ≥ 95 %, functions 100 %, lines ≥ 95 %. Public behavior is covered at
100 % by the matrix below — percentages are a floor, not the goal.

| Area | Must be tested | Where |
|---|---|---|
| Anatomy | `<name>Attributes()` defaults and every option value | core unit |
| Options | every prop / `data-ok-*` value, including defaults and invalid values (fall back to default) | react + html unit |
| States | hover, focus-visible, active, disabled, `aria-disabled`, loading/selected/open etc. | unit + e2e |
| Controlled / uncontrolled | both modes, callbacks fired once per change, controlled refusal | react unit |
| Keyboard | every row of the spec's keyboard table | unit (3 browsers) + e2e |
| Focus | entry, order, trap/return where specified, never lost to `body` | unit + e2e |
| ARIA | roles, names, descriptions, states (`aria-expanded`, `aria-selected`…) | unit (Testing Library roles) |
| Events / API | every `ok:<name>:<event>` (order, `detail`, cancelable) and instance method | html unit |
| Lifecycle | init idempotent, inserted later (observer), removed (cleanup), `stop()`, React unmount, StrictMode | unit |
| Platform paths | native **and** fallback (`forceFallback`) for every native API used | core unit |
| Coexistence | React + HTML on one page, two runtime copies | html unit + e2e |
| SSR | `renderToString` of every React export doesn't throw and matches client markup | react unit |
| Parity | anatomy + pixels, light + dark, every shared story | e2e |
| Accessibility | axe WCAG 2.2 AA on every story, light + dark, each state worth scanning (open, error…) | unit + e2e |
| Responsive | the [Viewport matrix](#viewport-matrix) assertions, React ↔ HTML compared | e2e |
| Visual | every story × theme × viewport against approved baselines | e2e `@visual` (Docker) |
| Security | the automated checks of the [Security checklist](#security-checklist) | unit + e2e |

---

## Security checklist

Run each check; every item ends as ✅ pass, ❌ fixed, or N/A (with reason). Every finding gets a
[severity](#severity).

| # | Risk | Rule | How to check |
|---|---|---|---|
| S1 | DOM XSS sinks | No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, string `setTimeout`/`setInterval`, `createContextualFragment` in library code; build nodes with `createElement` / `textContent` | check S1 below is empty |
| S2 | React raw HTML | No `dangerouslySetInnerHTML` in packages (Storybook helpers only) | check S2 below is empty |
| S3 | Dangerous URLs | Never build URLs from attributes/props; links pass consumer `href` through untouched; no `javascript:` in snippets; `target="_blank"` always with `rel="noopener noreferrer"` | check S3 below is empty |
| S4 | Untrusted attribute input | Every `data-ok-*` value read by the runtime is validated against an allowlist (unknown → default); ids resolved with `getElementById`; any selector built from input uses `CSS.escape` | unit tests with malicious values (`"><img onerror>`, `../`, very long strings) — no throw, no injection |
| S5 | Prototype pollution | Option/theme merges skip `__proto__`, `constructor`, `prototype`; never `Object.assign` untrusted objects onto shared objects | unit test merging `JSON.parse('{"__proto__":{"x":1}}')` leaves `({}).x` undefined |
| S6 | CSP / Trusted Types | Works under `script-src 'self'; style-src 'self'; require-trusted-types-for 'script'`: no inline handlers or `<script>` in snippets, no `style` attribute *strings* set by JS (CSSOM properties are fine), no Trusted Types sink usage | e2e page with that CSP; fail on any `securitypolicyviolation` event |
| S7 | Global state | No new `window` properties or `Symbol.for` slots (ADR-0007); nothing written to `localStorage`/cookies | check S7 below lists only the ADR-0007 slots; plain-HTML globals test |
| S8 | Event hygiene | No `stopPropagation`; delegated handlers only via the runtime; handler errors can't break other components; no `message`/`postMessage` listeners | check S8 below is empty; runtime isolation tests |
| S9 | Sensitive data | Never log, store or mirror user input into attributes/data (`console.*` limited to library warnings); inputs keep `autocomplete` semantics | check S9 below; review every hit |
| S10 | Clipboard / permissions | Clipboard, fullscreen etc. only on a user gesture, with failure handled and announced | unit test the denied path |
| S11 | Overlay abuse | Overlays can always be dismissed or are explicit (no permanent focus trap), stay in viewport, never cover the page invisibly | unit + e2e (Escape, focus return) |
| S12 | Supply chain | No new runtime dependency without approval; dev deps pinned and ≥ 2 weeks old (security fixes are exempt, as in Renovate's `vulnerabilityAlerts`); transitive fixes via scoped `overrides` in `pnpm-workspace.yaml`, each with a removal note; no new install scripts (`allowBuilds`); `pnpm audit` clean | `git diff package.json pnpm-workspace.yaml`; audit |
| S13 | Boundaries | No React in `tokens/styles/core/html`, no `html` in `react` (ADR-0008) | `pnpm check:boundaries` |
| S14 | Unsafe SVG | Icons are static inline SVG written in the repo: no `<script>`, `<foreignObject>`, `on*` attributes, external `href`/`xlink:href`, `<use>` of remote files; never inject SVG strings from props/attributes (accept React nodes or DOM nodes) | check S14 below is empty; review every SVG |
| S15 | Event handler injection | No `on*` attributes in snippets or markup; never `setAttribute(name, …)` with a name from input; React components don't forward unvalidated attribute *names* from strings | check S15 below is empty |
| S16 | Secrets / sensitive data in the repo | No tokens, keys, passwords, `.env` files or internal URLs in code, snippets, stories, fixtures or screenshots | check S16 below; review every hit |
| S17 | Security-sensitive attributes | `href`, `src`, `action`, `formaction`, `srcdoc`, `target`, `rel`, `allow`, `sandbox`, `autocomplete`, `style` are only set from trusted, documented options; never derived from arbitrary input | check S17 below; review every hit |

Automated checks (run from the repo root; "empty" = no output):

```sh
SRC="packages/*/src"; EX='--exclude=*.test.ts --exclude=*.test.tsx --exclude=test-utils.*'
# S1 — DOM XSS sinks
grep -rnE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|createContextualFragment|set(Timeout|Interval)\(\s*["`]' $SRC $EX
# S2 — React raw HTML
grep -rn 'dangerouslySetInnerHTML' $SRC $EX
# S3 — dangerous URLs in snippets / sources
grep -rniE 'javascript:' $SRC
grep -rnE 'target="_blank"' $SRC | grep -v 'rel="noopener noreferrer"'
# S7 — global state (expect only the ADR-0007 slots)
grep -rnE 'Symbol\.for\(|globalThis\.|window\.[A-Za-z]+\s*=|localStorage|sessionStorage|document\.cookie' $SRC $EX
# S8 — event hygiene
grep -rnE 'stopPropagation|stopImmediatePropagation|addEventListener\(\s*["`]message' $SRC $EX
# S9 — logging
grep -rnE 'console\.(log|info|debug|table)' $SRC $EX
# S14 — unsafe SVG content
grep -rniE '<script|<foreignObject|xlink:href=|<use[^>]+href="https?:' $SRC apps/storybook/src
# S15 — inline event handlers / attribute names from input
grep -rnE '\son[a-z]+="' $SRC --include=*.html
grep -rnE 'setAttribute\(\s*[a-z]' $SRC $EX
# S16 — secrets (expect no hits outside docs)
grep -rniE '(api[_-]?key|secret|token|password|bearer)\s*[:=]\s*["`][^"`]{8,}' $SRC apps e2e --include=*.ts --include=*.tsx --include=*.html --include=*.json
git ls-files | grep -iE '(^|/)\.env' 
# S17 — security-sensitive attributes (review each hit)
grep -rnE '(srcdoc|formaction|sandbox|allow)=|\.(href|src|action)\s*=' $SRC $EX
# Dependencies (existing tooling)
pnpm audit --audit-level=high
```

### Severity

| Severity | Meaning | Examples | Action |
|---|---|---|---|
| Critical | Exploitable injection or secret exposure in shipped code | DOM XSS sink fed by props/attributes, committed secret, `javascript:` URL built by the library | Fix before hand-off; stop and tell the user immediately |
| High | Exploitable under realistic consumer usage, or a high/critical advisory | Unsanitized SVG/HTML from props, `on*` attribute injection, CSP/Trusted Types breakage, `pnpm audit` high | Fix before hand-off |
| Medium | Weakens defenses or needs unusual conditions | Prototype pollution in option merges, `target="_blank"` without `rel`, unvalidated `data-ok-*` values | Fix, or the user explicitly accepts it |
| Low | Hardening / hygiene | Verbose logging, missing `autocomplete`, debug-only globals | Fix or list as follow-up |

---

## Report Format

Report in **two versions — English first, then Vietnamese**.

```
## Component Report: <Name> — Created | Updated

Reference: <url>

### Built / changed
| Slice | Files | Created / changed |
|-------|-------|-------------------|

### Changes vs previous version (Update mode)
| Gap (reference ↔ previous) | Change made | API impact (none / additive / breaking) |
|----------------------------|-------------|-----------------------------------------|
Changeset level: patch | minor | major · Migration notes: …

### Reference → tokens
| Reference value | Token | Note |
|-----------------|-------|------|

### Stories
| Story (= reference section) | React | HTML | Parity |
|-----------------------------|-------|------|--------|

### Responsive (React / HTML)
| Viewport | Overflow | Clipping | Overlap | Wrapping | Spacing & size | Touch | React ↔ HTML |
|----------|----------|----------|---------|----------|----------------|-------|--------------|
| Mobile 375×812 | | | | | | | |
| Mobile Large 430×932 | | | | | | | |
| Tablet 768×1024 | | | | | | | |
| Laptop 1280×800 | | | | | | — | |
| Desktop 1440×900 | | | | | | — | |

### Visual regression
Tool: Playwright `@visual` (Docker) | Chromatic | Storybook Visual Tests
| Story | Theme | Viewports | Baseline status (✅ / 🆕 / ⚠️ / ❌ / ⏸) |
|-------|-------|-----------|----------------------------------------|
Intentional changes awaiting approval: …

### React ↔ HTML parity
| Story | Anatomy | Pixels (light / dark) |
|-------|---------|-----------------------|

### Accessibility
| Check | Result |
|-------|--------|
| axe WCAG 2.2 AA (every story, light + dark) | |
| Keyboard map | |
| Focus management | |
| Reflow 320px / text spacing | |
| Contrast deviations from the reference | |

### Coverage
| Package | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
Matrix: N/N areas covered (or "matrix only — no coverage tool")

### Security
| Severity | Finding | Check | Status (fixed / accepted / follow-up) |
|----------|---------|-------|---------------------------------------|
| Critical | | | |
| High | | | |
| Medium | | | |
| Low | | | |
Checklist: S1–S17 → ✅ / ❌ fixed / N/A (reason)

### Intentional differences from the reference
| Difference | Reason (AA / asset / architecture) |
|------------|------------------------------------|

### Verification
Unit: N/N (3 browsers) · E2E: N/N (4 projects) · Visual: N/N (or pending) · Size: before → after (gzip) · a11y: ✅ · audit: ✅
```

```
---
## Báo Cáo Component: <Tên> — Tạo mới | Cập nhật

Tham chiếu: <url>

### Đã xây dựng / thay đổi
| Phần | File | Tạo mới / thay đổi |
|------|------|--------------------|

### Thay đổi so với phiên bản trước (chế độ Update)
| Khác biệt (tham chiếu ↔ bản trước) | Thay đổi đã làm | Ảnh hưởng API (không / bổ sung / breaking) |
|------------------------------------|-----------------|--------------------------------------------|
Mức changeset: patch | minor | major · Ghi chú migration: …

### Giá trị tham chiếu → token
| Giá trị tham chiếu | Token | Ghi chú |
|--------------------|-------|---------|

### Stories
| Story (= mục của trang tham chiếu) | React | HTML | Parity |
|------------------------------------|-------|------|--------|

### Responsive (React / HTML)
| Viewport | Tràn ngang | Bị cắt | Chồng lấn | Xuống dòng | Khoảng cách & kích thước | Chạm | React ↔ HTML |
|----------|------------|--------|-----------|------------|--------------------------|------|--------------|
| Mobile 375×812 | | | | | | | |
| Mobile Large 430×932 | | | | | | | |
| Tablet 768×1024 | | | | | | | |
| Laptop 1280×800 | | | | | | — | |
| Desktop 1440×900 | | | | | | — | |

### Visual regression
Công cụ: Playwright `@visual` (Docker) | Chromatic | Storybook Visual Tests
| Story | Theme | Viewport | Trạng thái baseline (✅ / 🆕 / ⚠️ / ❌ / ⏸) |
|-------|-------|----------|--------------------------------------------|
Thay đổi có chủ đích đang chờ duyệt: …

### Parity React ↔ HTML
| Story | Anatomy | Pixel (sáng / tối) |
|-------|---------|--------------------|

### Accessibility
| Kiểm tra | Kết quả |
|----------|---------|
| axe WCAG 2.2 AA (mọi story, sáng + tối) | |
| Bàn phím | |
| Quản lý focus | |
| Reflow 320px / giãn chữ | |
| Khác biệt tương phản so với tham chiếu | |

### Coverage
| Package | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
Ma trận: N/N hạng mục đã có test (hoặc "chỉ ma trận — chưa có công cụ coverage")

### Bảo mật
| Mức độ | Phát hiện | Kiểm tra | Trạng thái (đã sửa / chấp nhận / làm sau) |
|--------|-----------|----------|-------------------------------------------|
| Critical | | | |
| High | | | |
| Medium | | | |
| Low | | | |
Checklist: S1–S17 → ✅ / ❌ đã sửa / N/A (lý do)

### Khác biệt có chủ đích so với tham chiếu
| Khác biệt | Lý do (AA / tài sản / kiến trúc) |
|-----------|----------------------------------|

### Kiểm chứng
Unit: N/N (3 trình duyệt) · E2E: N/N (4 project) · Visual: N/N (hoặc pending) · Kích thước: trước → sau (gzip) · a11y: ✅ · audit: ✅
```

---

## Rules

- The reference is for content only: never copy its source code, class names, logo,
  illustrations, icon packs or brand text. Use our own markup, tokens and inline SVG icons.
- Never ship one implementation alone: React and HTML land together with parity tests.
- Never hard-code a design value: map it to a token, or propose a new token first.
- Contrast follows ADR-0014: reference look for brand colors, WCAG 2.2 AA for neutral text and
  soft tones; list every remaining deviation from the reference in the report.
- Responsive is not optional: the component passes every row of the viewport matrix in both
  implementations, with matching results between React and HTML.
- Visual baselines are updated only after the user approves the listed changes, and only from
  the Playwright Docker image.
- Never invent a script or claim a test runs without verifying the project configuration; never
  add Chromatic, a paid service, or a new testing/security dependency without approval.
- Coverage thresholds are a floor; never exclude code or weaken assertions to reach them.
- Every security checklist item ends as pass, fixed or N/A with a reason — never skipped;
  Critical and High findings block hand-off.
- Wait for the user's approval of the plan (step 5) before writing code or adding dependencies.
- Update mode keeps the public API stable: a breaking change needs explicit, item-by-item
  approval, a migration note and a major changeset; never silently rename, remove or change a
  default.
- Follow the approved architecture (ADRs); a needed change means a new ADR, proposed first.
- Do not add options or features the reference doesn't show unless the spec needs them for
  accessibility or security.
- Throwaway capture scripts live in the scratchpad; delete any copy placed in the repo.
- Do not commit; do not add Claude-related attribution anywhere.
