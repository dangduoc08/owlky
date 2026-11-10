---
name: check-staged
description: Read-only impact report of the staged changes (correctness, public surface, parity, project rules, size, changeset), after stashing unstaged work.
---

# Mission

Inspect staged changes for correctness, logic integrity, and impact relative to the last commit.

Stash unstaged work first so the working tree is clean and the diff is unambiguous.

---

## Steps

1. **Abort if nothing is staged.**
   Run `git diff --staged --stat`. If the output is empty, tell the user and stop.
   If `git rev-parse HEAD` fails (no commits yet), treat the whole staged tree as the change set.

2. **Stash unstaged changes.**
   Run `git stash --keep-index --include-untracked -m "check-staged: temp stash"`.
   If it fails (nothing to stash), continue — the tree is already clean.
   Record whether a stash was created so you can restore it at the end.

3. **Collect the staged diff.**
   Run `git diff --staged` for the full diff and `git diff --staged --stat` for a summary.

4. **Verify.** Run, in order, and record every failure as a finding:
   ```
   pnpm lint
   pnpm typecheck
   pnpm build
   pnpm check:boundaries
   pnpm check:size
   pnpm test
   ```
   If the diff touches `packages/styles`, `packages/html/src/components/*/examples`, any React/HTML component, `apps/storybook` or `e2e`, also run:
   ```
   pnpm storybook:build
   pnpm --filter @owlky/e2e exec playwright test --grep-invert @visual --project chromium
   ```
   If `package.json` exports or `files` changed, also run `pnpm check:packages`.

5. **Analyse the diff for impact**, file by file, against AGENTS.md (ground rules, naming,
   gotchas) and the ADRs it touches:
   - **Behavior:** what observably changes (open / close, focus, keyboard, events, rendering).
   - **Public surface:** exports, React props, `data-ok-*` names, `--ok-*` variables, `ok:*` events
     and their `detail`, runtime methods, package `exports` (and whether `pnpm api` /
     `pnpm manifest` output is staged with them).
   - **Parity:** both implementations changed together; spec, snippets, React output and
     `e2e/tests/parity.spec.ts` still agree.
   - **Rules:** accessibility (roles, names, focus, contrast), boundaries (ADR-0008), lifecycle and
     idempotency (ADR-0005), globals (ADR-0007), CSS (`:where()`, `@layer components`, tokens, no
     `--tw-*`), baseline browsers (ADR-0006), security (`/component` → Security checklist).
   - **Size** from `check:size`; **release:** a publishable package changed without a staged
     changeset.

6. **Restore stashed changes.**
   If a stash was created in step 2, run `git stash pop`.
   If `pop` fails, report the conflict to the user and stop — do NOT lose their work.

7. **Write the report** in the format below in Vietnamese.

---

## Report Format

```
## Staged Change Impact Report

**Lint / Types / Build:** ✅ / ❌
**Boundaries / Size:** ✅ / ❌ (size deltas if any)
**Unit tests:** ✅ pass / ❌ fail (list failing tests)
**E2E (if run):** ✅ pass / ❌ fail / ⏭ not needed

### Files changed
| File | +lines | -lines | Category |
|------|--------|--------|----------|

### Findings
| # | File | Finding | Severity |
|---|------|---------|----------|
| 1 | ...  | ...     | info / warning / critical |

### Conclusion
**Behaviour change vs last commit:** YES / NO
**Public API change:** YES / NO (list)
**React ↔ HTML parity preserved:** YES / NO
<one or two sentences — what changed functionally, or confirm nothing changed>
```


---

## Rules

- Never commit, push, or modify staged files.
- If `git stash pop` fails, stop immediately and warn the user — restoring their work takes priority over completing the report.
- Severity guide:
  - **critical** — behaviour change, broken public API, parity break, accessibility regression, boundary violation, leak/double-init, build/test failure
  - **warning** — missing test or changeset, CSS rule-order/specificity risk, size growth, missing fallback, docs/spec out of sync
  - **info** — cosmetic, naming, dead code, style
- Keep findings concise — one line per finding.
- Every conclusion line must be explicit: YES or NO, not "possibly" or "depends".
