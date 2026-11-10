---
name: refactor
description: Improve the code in $ARGUMENTS without changing its API or behavior — clarity (default) or `optimize` (bytes, main-thread work, leaks, measured before/after). No argument: the file open in the IDE or the one most recently discussed.
---

# Mission

`$ARGUMENTS` = `[optimize] <file or folder …>`. Two goals, one procedure:

- **clarity** (default): structure, naming and idiom only.
- **optimize**: what users pay for: bytes shipped, main-thread work, memory, then correctness.

**Never changes:** exports, React props, `data-ok-*` anatomy, `--ok-*` variables, `ok:*` events
and their `detail`, runtime API, snippet markup, rendered DOM, CSS cascade outcome, event order.
Leak, correctness and security fixes (optimize) are the only behavior changes allowed, each
reported. A change that would touch callers in other packages: flag it and ask first.

---

## Steps

1. **Read** the target fully, plus `AGENTS.md` (naming, ground rules, gotchas).
2. **Tests first.** Tests live next to the source (`<name>.test.ts(x)`). Add missing cases for
   any path you'll touch; for code with listeners / observers / timers, a test proving they are
   released (destroy, removal, `stop()`, unmount, StrictMode).
3. **Baseline** (stop and report if anything fails before you start): `pnpm build && pnpm test`
   (one browser is enough here); rendered output → also `pnpm storybook:build && pnpm --filter
   @owlky/e2e exec playwright test tests/parity.spec.ts --project chromium`. Optimize:
   `pnpm check:size`, and for hot paths a `performance.now()` measurement test over realistic sizes
   (1 000+ elements), deleted afterwards unless it guards a regression.
4. **Split first** if a file is over ~300 lines and mixes responsibilities: move code only,
   re-export from the original entry, no boundary crossed; test, then continue per file.
5. **Analyse.**
   - **Naming:** misleading / too long names, predicates (`isOpen`), consistent acronyms, repo
     conventions (kebab-case files, `data-ok-<component>-<part>`, `--_ok-*`, `ok:<component>:<event>`).
   - **TypeScript:** early returns over nesting, named constants, dead branches, long functions
     with an obvious extraction, `any` / `!` / needless assertions → narrowing, modern built-ins
     (`Object.hasOwn`, `.at`, `??`, `?.`, `AbortController`).
   - **React:** derivable state in effects, wrong dependencies, state duplicating props, context
     values without `useMemo`, `{...props}` last, `forwardRef` names kept.
   - **CSS:** one `:where(…)` per selector; order base → sizes → variants → hover → focus →
     disabled; tokens for values; duplicated declarations → the base rule or a `--_ok-*` variable.
   - **Optimize, bytes:** dead code in the CDN bundle, duplicated helpers, imports that defeat
     tree-shaking, top-level work at import time, unused or duplicated CSS.
   - **Optimize, main thread:** layout reads interleaved with writes, per-event work that belongs in
     setup, document-wide queries where a subtree suffices, observers scanning more than the added
     nodes, React re-renders, `:has()` on large subtrees, transitions on layout properties.
   - **Optimize, memory and correctness:** listeners not tied to the instance signal, references
     kept after destroy, ADR-0007 shared state left inconsistent on errors, missing null checks on
     malformed markup, selectors from attribute values without `CSS.escape`.
6. **Lifecycle audit** (optimize, every runtime / controller / React component touched): idempotent
   init (StrictMode too), cleanup on removal while active (scroll lock, layer stack, focus traps),
   two library copies and React + HTML on one page (`data-ok-runtime="off"`), no new globals.
7. **Apply** one change at a time, `pnpm test` after each (and parity when output could change);
   revert and note any change that fails. Optimize: re-measure after each; keep a change only for a
   measurable gain, the simpler version when the delta is noise.
8. **Lint:** `pnpm lint:fix`, `pnpm lint`, `pnpm typecheck`, `pnpm check:boundaries`; fix only
   files you touched.
9. **Report** in Vietnamese:

```
## Refactor report (clarity | optimize)
| File | Change | Category | Reason | Size before → after (gzip) | Time before → after |
Lifecycle / leak fixes: … · Lint fixes: … · Skipped (would change behavior): …
Verification: unit N/N · parity ✅ / not affected
```

---

## Rules

- No features, options, error handling or abstractions beyond the task; the smallest change that
  reaches the goal.
- Comments explain *why* (quirks, invariants, ADRs), never *what*; Biome formats.
- Never weaken accessibility for size or speed.
- Measurements come from real runs, never estimates. Never raise a size budget to make an
  optimization pass.
- Each package owns its output: fix artifacts at the source.
