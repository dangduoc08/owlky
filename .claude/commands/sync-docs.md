---
name: sync-docs
description: Keep every doc in sync with the code. $ARGUMENTS: a package or component → its README or spec + docs page; `kb` (or nothing) → the AI knowledge base (CLAUDE.md, AGENTS.md, docs/, ADRs, specs); `audit [readiness]` → read-only report, `readiness` adds a new-agent simulation and score.
---

# Mission

One command for all documentation, three modes:

| `$ARGUMENTS` | Mode | Writes |
|---|---|---|
| a package (`react`, `@owlky/styles`) or component (`dialog`), `all components` | **user docs** | package `README.md`, or `specs/components/<name>.md` + the docs page |
| `kb` or empty | **knowledge base** | `CLAUDE.md`, `AGENTS.md`, `docs/**`, ADRs, specs, READMEs |
| `audit`, `audit readiness` | **audit** | nothing (read-only report) |

Ambiguous target → ask instead of guessing.

# The documents

| File | Role | Update when |
|---|---|---|
| `CLAUDE.md` | Entry point: status, workflow with the user, stack, repo map, commands, key decisions, environment | status, commands, versions, layout or environment change |
| `AGENTS.md` | Ground rules, naming, add-a-component checklist, gotchas | a convention, checklist step or quirk appears or changes |
| `docs/architecture.md` | Packages, flows, distribution | responsibilities or flows change |
| `docs/adr/*.md` + `README.md` | Decisions | a decision is made or superseded (new ADR, never rewrite one) |
| `docs/roadmap.md`, `docs/roadmap-components.md` | Plans and status per item | an item is done, re-planned or found by an audit |
| `docs/testing.md` | Test layers and commands | test tooling or scripts change |
| `specs/components/*.md` | Maintainer contract (anatomy, options, keyboard, a11y, events, upstream mapping) | API or behavior changes |
| Docs pages (`apps/docs-content/src/<group>/<name>/` once migrated, else `apps/storybook/src/components/<name>/<name>-docs.tsx`) | User guide, HTML and React | API or usage changes |
| Package `README.md`s | npm-facing usage | exports change |

Never add a new documentation location if an existing one can hold it; never explain one thing
in two places: link to the canonical one.

---

# Steps: user docs

1. **Read the public surface.** Package: every `exports` entry with its exact types and JSDoc.
   Component: the option schema (`core/src/anatomy/<name>.ts`), parts (`core/src/anatomy/parts.ts`),
   controller, CSS header, React props, HTML snippets and runtime (options, triggers, events,
   instance API), and the generated API reference (`apps/docs-content/src/api/<name>.json`).
   Skip non-exported identifiers; no public surface → stop and say so.
2. **Real usage only.** Examples come from tests, stories and snippets; behavior rules (defaults,
   keyboard, focus, cancelable events and reasons, cleanup, fallbacks) only when a test asserts
   them. Purpose of an undocumented prop: read where it is consumed.
3. **Structure.** Component: spec and docs page modeled on Button (`specs/components/button.md`,
   `apps/docs-content/src/components/button/`), sections per AGENTS.md checklist step 6, page
   listed in `GUIDES` / `OPTION_TABLES` (`e2e/tests/foundations.spec.ts`). Package README: title +
   one line, install, one realistic usage example, API (every export: signature, types, defaults),
   behavior rules, browser support (ADR-0006), links to the root README and Storybook.
4. **Refresh, don't rewrite:** keep accurate prose, fix what is stale, add what is missing; spec,
   HTML and React docs agree. Sizes come from `pnpm build && pnpm check:size`.
5. **Verify:** every export, prop, `data-ok-*` name, event and key from step 1 is documented;
   `pnpm check:docs`, `pnpm check:specs`, `pnpm check:api`; for pages `pnpm storybook:build` and
   `tests/foundations.spec.ts` for the page. After a page or spec change:
   `pnpm api && pnpm manifest` (`check:manifest`).

Only documentation changes here: never library source, tests or snippets.

# Steps: knowledge base

1. **Discover from code, not docs:** `package.json` scripts, workspace, each package's exports
   and `src/index.ts`, controllers, the HTML runtime, CSS headers, snippets, Storybook, e2e, CI.
2. **Detect changes** since the docs were last accurate (`git log`, `git diff`): packages,
   components, exports, `data-ok-*`, `--ok-*`, events, scripts, dependencies, versions. Only one
   area changed → update only that area.
3. **Update** the affected documents (table above). Each public API change: purpose, inputs (types,
   defaults), outputs and events, lifecycle and cleanup, accessibility, side effects, common
   mistakes, related APIs.
4. **Record hidden knowledge:** invariants, forbidden behaviors, platform quirks from tests and
   fixes (AGENTS.md ground rules and gotchas). Mark low-confidence inferences, or ask.
5. **Compress** every modified document: tables and rules over prose, links over duplicates;
   `CLAUDE.md` stays a short entry point.
6. **Final check,** repeated until nothing meaningful is left: every documented command exists,
   every path and link resolves, `CLAUDE.md` status matches the roadmaps, every export / prop /
   attribute / event is in a spec, the ADR index lists every ADR with its status, no two documents
   contradict each other.

# Steps: audit (read-only)

You are an independent auditor: **never modify, create or delete files.** Question: "Will an
agent that reads only the docs write correct code here, without reading much source?"

1. **Read** the code (packages, runtime, CSS, snippets, Storybook, docs-content, website, e2e,
   scripts, CI, `exports`) and every document above plus `.claude/commands/*`.
2. **Score each category 0–100** with findings (severity Critical · High · Medium · Low · Info,
   confidence High · Medium · Low): coverage; correctness ("doc says X, code does Y — file:line");
   consistency (one name, one place, no contradictions, links, ADR index); parity docs (spec, HTML
   and React agree; parity exceptions match `e2e/tests/helpers.ts`); architecture (code against
   documented decisions, decisions only in code); anti-patterns not written down; commands
   (coverage, overlap, stale steps); token efficiency; overall AI readiness.
3. **`readiness`:** start from zero, work only from the docs, and attempt real tasks: a CSS-only
   component; a native form control (controlled / uncontrolled); a runtime component with
   keyboard, delegated triggers and a popover fallback; a Button variant; a token in the Tailwind
   theme; re-theming with AA contrast; a WebKit focus-return bug; a dialog after an htmx swap; two
   CDN copies; a parity failure; a docs page; a smaller CDN bundle; a new browser baseline; a
   breaking `data-ok-*` rename and its release; core controller tests (native + fallback); a
   release; reviewing a runtime change. Per task: done from the docs (yes · partially · no), what
   was missing and where it belonged, each source file read and why, hallucination risk (low ·
   medium · high). Extra scores: discoverability, retrieval, task completion, hallucination
   resistance, developer experience; a verdict with evidence.
4. **Recommend, never write:** concrete actions in priority order with their expected effect.

---

# Report (in Vietnamese; file names, code and identifiers stay in English)

- **user docs / knowledge base:** files changed, what was stale and is fixed, new knowledge
  recorded, checks run, open questions.
- **audit:** summaries, findings per category, simulated tasks (`readiness`), top risks, missing
  and outdated docs, recommended actions, scores, verdict.

# Rules

- Verify every statement against the code; never document assumptions as facts. Numbers come from
  real runs; behavior rules from real test assertions.
- User-facing docs follow AGENTS.md → "Writing documentation"; specs, ADRs and comments may be
  terse. Repository docs are in English.
- Every documented prop states its type and default; every example uses real identifiers and
  real `data-ok-*` names.
- Never rewrite an accepted ADR (supersede it). Never change the workflow section of `CLAUDE.md`
  without the user's instruction. Production code changes needed to document something: ask first.
- No Claude-related attribution anywhere. Commit only when the user asks.
