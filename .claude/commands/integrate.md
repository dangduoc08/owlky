---
name: integrate
description: Integrate newly available components into the existing ones (backward-compatible updates) — find every stand-in, deferred story or "needs <Name>" note waiting for a component that now exists, re-capture each dependent's section from its spec's Reference URL, report, then implement the approved items through /component's Update steps. $ARGUMENTS is optional component names or reference URLs (several run in parallel agents); without it every open wait on an existing component is found and integrated.
---

# Mission

Close every **wait on a component that now exists**: stand-ins (native feature, demo markup, a
small built-in part) and stories or features deferred until that component was built. Each
integration is additive — no DOM or API change unless a breaking item is unavoidable (then it is
listed item by item with a migration note).

**Auto-approval (standing user instruction):** the report's approval — the (a) items to implement
and any breaking item — is **granted for your recommendation**, the same way as `/component`'s
*Auto-approval*. Don't stop to ask: mark each item *auto-approved* (or *skipped* with a reason),
and implement. Ask only when there is no sensible recommendation (for example, a missing
`Reference URL:`), when a dependent's upstream component has an **HTML version** (ask whether to
build our HTML from it or write our own — `/component` → "Upstream HTML version"), for paid
services or accounts, or for actions CLAUDE.md reserves (Docker Desktop, commit, push, publish).

This command orchestrates; it doesn't duplicate `/component`. Capture and implementation follow
`/component` (`.claude/commands/component.md`) in **Update** mode.

---

## Steps

1. **Scope.** `$ARGUMENTS` = `[component-name | reference-url] …` (names kebab-case, e.g.
   `pagination`; URLs `http(s)`, e.g. `https://minimals.cc/components/mui/tabs`).
   - **URLs → components.** Match each URL (ignore a trailing `/`, query and `#hash`) against the
     `Reference URL:` lines of `specs/components/*.md`; every spec that matches counts (one page can
     give several components: Buttons → button, icon-button, fab, button-group, toggle-button).
     No match: derive the name from the last path segment as `/component` step 1 does
     (`/components/mui/tabs` → `tabs`). Still no component → report "not built yet — run
     `/component <url>` first" for that URL and continue with the others. Remove duplicates; show
     the URL → component list before step 2.
   - Given: integrate only what that component unlocks. If it doesn't exist yet (no
     `specs/components/<name>.md` and no `packages/react/src/<name>/`), say so and stop.
   - **Empty (`/integrate` alone): discover and integrate everything.** Every existing component
     (one per `specs/components/*.md`) is a candidate; step 3 keeps those with at least one open
     wait. Don't ask which ones: the resulting components are the scope (list them before step 2,
     with the waits found). One component with waits → continue here; two or more → as below.
   - **Two or more components** after resolving (`/integrate tabs chip popover`, several URLs,
     a URL that maps to several specs, or an empty `$ARGUMENTS` that found waits on several
     components): run steps 2–5 here for all of them (one combined report), then implement in
     [Multi-component mode](#multi-component-mode-parallel-agents).

2. **Read the project rules.** `CLAUDE.md`, `AGENTS.md` (gotchas: "General rule for any part the
   library doesn't have yet", "A new component closes every wait on it"), `docs/roadmap.md`.

3. **Find the waits** (read-only). For each candidate component `<Name>`, collect:
   - the rows of `docs/roadmap.md` → "Pending integrations" whose *Waiting for* names it;
   - `grep -rni "<Name>" docs/roadmap.md specs/` hits that describe it as missing ("needs",
     "waiting for", "deferred", "until", "stand-in") — backlog lines, deferred stories;
   - stand-in patterns in existing code, e.g. `overflow: auto` (Scrollbar), `<select>` (Select),
     `<input type="checkbox">` (Checkbox), `<hr>` (Divider), own spinners (Progress), demo markup
     in `apps/storybook/.storybook/preview.css` — grep it for surfaces (`box-shadow: var(--ok-shadow-`
     with a paper background → Paper / Card) and fonts (`--ok-typography-*`, `--ok-font-*` →
     Typography) in demo classes;
   - a wait recorded only outside "Pending integrations" is itself a finding: report it;
   - optional, when the Storybook MCP server (`storybook` in `.mcp.json`) answers — it needs
     `pnpm storybook` running; otherwise skip: `stories-find-by-component` on
     `packages/react/src/<name>/<name>.tsx` lists the stories that already render `<Name>`, and
     `docs-list` the existing components. Use them to cross-check the dependents above, never
     instead of the greps (the roadmap, specs and HTML snippets aren't in the MCP manifest).
   Keep only waits whose component **exists now**. No waits → report "nothing to integrate" and stop.

4. **Re-capture each dependent from its reference.** For every dependent component, read the
   `Reference URL:` line of `specs/components/<dependent>.md` (foundations: `specs/README.md` →
   "Foundations references") and capture **only the affected sections** with `/component`'s
   step 3. Never build from a backlog name, the story title or memory. No `Reference URL:` →
   ask the user for the URL and stop.
   Also run `/component`'s "Check for an upstream HTML version" for each dependent whose HTML
   side changes, unless its spec already records an `HTML source:` line.

5. **Report, then proceed (auto-approved).** Use the report format below:
   - **(a) Unlocked integrations (in scope):** per item — dependent, today's stand-in or deferred
     story, the change (what the reference shows, built with the existing component), public API
     impact (none / additive / **breaking** with a migration note), the stories / tests / visual
     baselines it touches, changeset level;
   - **(b) Other gaps from the reference (out of scope):** list only, each with the
     `/component <url> <name>` command to run separately.
   Write the report in Vietnamese, mark each (a) item *auto-approved* (or *skipped* with a
   reason), then continue to step 6 without waiting for a reply. A breaking item you still
   recommend is auto-approved but listed item by item with its migration note and a major
   changeset.
   Exception: if step 4 found an upstream HTML version for a dependent with no recorded
   `HTML source:`, ask the user with `AskUserQuestion` (build from it / write our own, as in
   `/component` → "Upstream HTML version") and wait for the answer before implementing that
   dependent's HTML side; the other items proceed.

6. **Implement the auto-approved (a) items** with `/component` steps 7–11 in Update mode, per
   dependent: spec first (keep its `Reference URL:`), then core → styles → React **and** HTML →
   stories (same names on both sides) → parity, e2e, coverage, visual. Remind the user to add a
   changeset (`pnpm changeset`) for every published package changed.

7. **Close and re-check.** Remove the closed rows from "Pending integrations", update the
   "Overview" table, move deferred
   stories that are now built into the roadmap status, update specs and `AGENTS.md` gotchas for
   anything new. Then rerun step 3: a wait on an existing component that is still open (and not
   skipped with a reason in step 5) is a failure — report it, never drop it silently.

---

## Multi-component mode (parallel agents)

Same orchestration as `/component` → "Multi-URL mode (parallel agents)" (read it: O1 plan,
O2 agent prompt, O3 merge, O4 after the last merge), with these differences:
- **The unit of work is a dependent**, not a name: after step 5's combined report, group the
  auto-approved (a) items by the dependent component they change (every Table item together,
  every Drawer item together). One agent per dependent, at most **3 at a time**, branch
  `integrate/<dependent>`; two agents never edit the same dependent.
- Each agent's prompt lists its (a) items verbatim (with the re-captured reference notes from
  step 4 and any upstream-HTML answer) and says: implement them with `/component` steps 7–11 in
  Update mode in this worktree, run `pnpm check`, commit on the branch
  (`feat(<dependent>): integrate <components>` or `fix(…)`, no Claude trailers) with a changeset
  at the level from the report, and reply with the "Integrations done" section for its items.
- The orchestrator removes the closed rows from `docs/roadmap.md` → "Pending integrations" after
  the merges (one commit), so agents don't conflict on that table.
- Invoking `/integrate` with several names, or with no argument, is the approval for branch
  commits and local merges; never push.

## Report Format

Reply in the user's language (Vietnamese); file names, code and identifiers stay in English.

```
## Integrations: <component | all>

Sources: Pending integrations N rows · grep N hits · code stand-ins N · Reference URLs fetched N · Storybook MCP: used (N stories) | skipped (not running)

### (a) Unlocked integrations
| # | Dependent | Waiting for | Today | Change (from the reference) | API impact | Upstream HTML version | Tests / stories | Changeset |
|---|---|---|---|---|---|---|---|---|

### (b) Other gaps from the reference (separate /component runs)
| Dependent | Gap | Command |
|---|---|---|

### Not recorded in "Pending integrations" (process findings)
- …

Auto-approved: items to implement (and each breaking item, with its migration note). Skipped: … (reason each)
```

After implementation:

```
## Integrations done: <component | all>
| # | Dependent | Change | API impact | Status |
Unit: N/N · E2E: N/N · Visual: N/N (or pending — Docker) · pnpm check: ✅
Pending integrations closed: N · still open: N (reason each)
```

---

## Rules

- **Integrate by composition, visible in code**: the dependents' stories, React examples and HTML
  snippets use the new component the way the reference composes them (e.g. `TableContainer ›
  Scrollbar › Table`); the dependent's CSS adapts with `:has(> [data-ok-<new>])`. Never add the
  dependents' selectors to the new component's stylesheet — that hides the integration and
  inverts the dependency.

- Report → implement: the report is auto-approved for your recommendation (see *Auto-approval*);
  never implement items you marked skipped.
- Re-fetch the reference from the spec's `Reference URL:`; never guess a URL or a section.
- Additive by default; a breaking change only when unavoidable, listed per item with a migration
  note and a major changeset.
- React and HTML change together; parity, e2e and coverage stay green (`pnpm check`).
- Only the integrations: no refactors, restyling or reference gaps outside (a).
- No new dependencies without an ADR. No commits (use `/commit`).
