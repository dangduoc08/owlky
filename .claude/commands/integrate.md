---
name: integrate
description: Integrate newly available components into the existing ones (backward-compatible updates) — find every stand-in, deferred story or "needs <Name>" note waiting for a component that now exists, re-capture each dependent's section from its spec's Reference URL, report, then implement the approved items through /component's Update steps. $ARGUMENTS is an optional component name; without it every existing component is checked.
---

# Mission

Close every **wait on a component that now exists**: stand-ins (native feature, demo markup, a
small built-in part) and stories or features deferred until that component was built. Each
integration is additive — no DOM or API change unless the user approves a breaking item.

This command orchestrates; it doesn't duplicate `/component`. Capture and implementation follow
`/component` (`.claude/commands/component.md`) in **Update** mode.

---

## Steps

1. **Scope.** `$ARGUMENTS` = `[component-name]` (kebab-case, e.g. `pagination`).
   - Given: integrate only what that component unlocks. If it doesn't exist yet (no
     `specs/components/<name>.md` and no `packages/react/src/<name>/`), say so and stop.
   - Empty: every existing component (one per `specs/components/*.md`) is a candidate.

2. **Read the project rules.** `CLAUDE.md`, `AGENTS.md` (gotchas: "General rule for any part the
   library doesn't have yet", "A new component closes every wait on it"), `docs/roadmap.md`.

3. **Find the waits** (read-only). For each candidate component `<Name>`, collect:
   - the rows of `docs/roadmap.md` → "Pending integrations" whose *Waiting for* names it;
   - `grep -rni "<Name>" docs/roadmap.md specs/` hits that describe it as missing ("needs",
     "waiting for", "deferred", "until", "stand-in") — backlog lines, deferred stories;
   - stand-in patterns in existing code, e.g. `overflow: auto` (Scrollbar), `<select>` (Select),
     `<input type="checkbox">` (Checkbox), `<hr>` (Divider), own spinners (Progress), demo markup
     in `apps/storybook/.storybook/preview.css`;
   - a wait recorded only outside "Pending integrations" is itself a finding: report it.
   Keep only waits whose component **exists now**. No waits → report "nothing to integrate" and stop.

4. **Re-capture each dependent from its reference.** For every dependent component, read the
   `Reference URL:` line of `specs/components/<dependent>.md` (foundations: `specs/README.md` →
   "Foundations references") and capture **only the affected sections** with `/component`'s
   step 3. Never build from a backlog name, the story title or memory. No `Reference URL:` →
   ask the user for the URL and stop.

5. **Report, then wait for approval.** Use the report format below:
   - **(a) Unlocked integrations (in scope):** per item — dependent, today's stand-in or deferred
     story, the change (what the reference shows, built with the existing component), public API
     impact (none / additive / **breaking** with a migration note), the stories / tests / visual
     baselines it touches, changeset level;
   - **(b) Other gaps from the reference (out of scope):** list only, each with the
     `/component <url> <name>` command to run separately.
   Stop. Don't write code before approval. Breaking items need an explicit yes, item by item.

6. **Implement the approved (a) items** with `/component` steps 7–11 in Update mode, per
   dependent: spec first (keep its `Reference URL:`), then core → styles → React **and** HTML →
   stories (same names on both sides) → parity, e2e, coverage, visual. Remind the user to add a
   changeset (`pnpm changeset`) for every published package changed.

7. **Close and re-check.** Remove the closed rows from "Pending integrations", update the
   "Overview" table, move deferred
   stories that are now built into the roadmap status, update specs and `AGENTS.md` gotchas for
   anything new. Then rerun step 3: a wait on an existing component that is still open (and not
   rejected by the user) is a failure — report it, never drop it silently.

---

## Report Format

Reply in the user's language (Vietnamese); file names, code and identifiers stay in English.

```
## Integrations: <component | all>

Sources: Pending integrations N rows · grep N hits · code stand-ins N · Reference URLs fetched N

### (a) Unlocked integrations
| # | Dependent | Waiting for | Today | Change (from the reference) | API impact | Tests / stories | Changeset |
|---|---|---|---|---|---|---|---|

### (b) Other gaps from the reference (separate /component runs)
| Dependent | Gap | Command |
|---|---|---|

### Not recorded in "Pending integrations" (process findings)
- …

Awaiting approval: items to implement (and each breaking item).
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

- Review-gated: report → approval → implement. Never implement unapproved items.
- Re-fetch the reference from the spec's `Reference URL:`; never guess a URL or a section.
- Additive by default; breaking changes only with an explicit, per-item yes.
- React and HTML change together; parity, e2e and coverage stay green (`pnpm check`).
- Only the integrations: no refactors, restyling or reference gaps outside (a).
- No new dependencies without an ADR. No commits (use `/commit`).
