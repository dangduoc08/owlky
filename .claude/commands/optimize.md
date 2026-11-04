---
name: optimize
description: Optimize the code in $ARGUMENTS for size, runtime performance and correctness. If no argument is given, optimize the file currently open in the IDE or the file most recently discussed.
---

# Mission

Optimize code for what users pay for: **bytes shipped, main-thread work, memory and correctness**.

Size and runtime-cost reductions are the top priority, without changing public API or behavior.

---

## Steps

1. **Read** the target file(s) fully before touching anything.

2. **Check tests** for the target:
   - Tests live next to the source as `<name>.test.ts(x)`. If none exist, create them with meaningful edge cases before changing code.
   - If tests exist, add missing cases for any untested path you are about to touch.
   - For code that registers listeners, observers or timers, ensure there is a test proving they are released (destroy, removal from DOM, `stop()`, React unmount, StrictMode).

3. **Baseline** — all must pass, record the numbers:
   ```
   pnpm build
   pnpm test
   pnpm check:size
   ```
   For runtime hot paths (mounting many components, delegated dispatch, observer flush), write a measurement test that times the operation with `performance.now()` over realistic sizes (e.g. 1 000+ elements) and logs the result. Run it before and after; delete it afterwards unless it guards a regression.

4. **Analyse** — size and runtime cost first, then correctness:

   **Bytes**
   - Code in the CDN bundle or the runtime that is not needed (dead branches, duplicated helpers, verbose error strings that could be shared).
   - Imports that defeat tree-shaking (barrels with side effects, `sideEffects` misconfiguration, top-level work at import time).
   - CSS: duplicated declarations across variants, rules that could move to the base rule or a private `--_ok-*` variable, unused selectors.

   **Main thread / rendering**
   - Layout thrashing: reads (`getBoundingClientRect`, `offsetWidth`, `getComputedStyle`) interleaved with writes; batch reads before writes.
   - Work per event instead of once (selector building, option parsing) → move to registration/setup.
   - Querying the whole document where a subtree suffices; repeated `querySelectorAll` in loops.
   - MutationObserver handling that scans more than the added nodes.
   - React: context values recreated every render, effects that run every render without need, state updates that cause avoidable re-renders.
   - CSS: expensive selectors on hot elements (`:has()` on large subtrees), transitions on layout properties instead of `transform`/`opacity`.

   **Memory & correctness**
   - Listeners/observers/timers not tied to an `AbortSignal` or cleanup.
   - Strong references kept after destroy (Maps keyed by removed elements, closures holding DOM nodes).
   - Shared state (ADR-0007) left inconsistent on error paths (scroll lock count, layer stack).
   - Missing bounds checks / null checks that can throw on malformed markup.

   **Security**
   - String-built HTML, selectors from untrusted attribute values without `CSS.escape`, `eval`-like constructs.

5. **Lifecycle & coexistence audit** — for every runtime component, controller or React component touched:
   - [ ] Init is idempotent (same element × component mounted once; React StrictMode safe).
   - [ ] Every listener uses the instance `signal`; observers disconnect; timers are cleared.
   - [ ] Removal while active releases scroll lock, layer stack and focus traps.
   - [ ] Behavior is correct with two library copies on the page and with React + HTML together (`data-ok-runtime="off"`).
   - [ ] No new `window` properties or `Symbol.for` slots.

6. **Apply** changes one at a time. After each change:
   - Run `pnpm test` — if anything fails, revert that change and note why.
   - Re-run `pnpm check:size` / the measurement test.
   - Keep a change when it gives a measurable gain (bytes or time) even at a modest readability cost; keep the simpler version when the delta is within noise.
   - Prefer platform/built-in APIs over manual equivalents.
   - Leak, correctness and security fixes are always applied.

7. **Lint & verify:** `pnpm lint`, `pnpm typecheck`, `pnpm check:boundaries`, and — if rendered output could change — `pnpm storybook:build && pnpm --filter @owlky/e2e exec playwright test --grep-invert @visual --project chromium` (parity must stay green).

8. **Report** in two versions — English first, then Vietnamese.

---

## Report Format

```
## Optimization Report

| Change | Why | Size before → after (gzip) | Time before → after |
|--------|-----|----------------------------|---------------------|

### Lifecycle / leak fixes (if any)
| Issue | Fix |

### Lint fixes (if any)
| Issue | Fix |
```

```
---
## Báo Cáo Tối Ưu

| Thay đổi | Lý do | Kích thước trước → sau (gzip) | Thời gian trước → sau |
|----------|-------|-------------------------------|------------------------|

### Sửa lỗi lifecycle / rò rỉ (nếu có)
| Vấn đề | Cách sửa |

### Sửa lỗi lint (nếu có)
| Vấn đề | Cách sửa |
```

---

## Rules

- Never change public API (exports, props, `data-ok-*`, `--ok-*`, events, runtime API) or rendered DOM.
- Never weaken accessibility for size or speed.
- Do not add features, options or abstractions beyond the task.
- Do not add comments to the code unless they explain a non-obvious WHY.
- If a change affects other packages or components, flag it before applying.
- Never raise a size budget in `scripts/check-size.mjs` to make a change pass.
- Measurements must come from actual runs — never estimate or invent numbers.
- Each package owns its output: fix artifacts at the source rather than leaving them to consumers.
