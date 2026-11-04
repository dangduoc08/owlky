---
name: implement
description: Implement or upgrade the component or feature described in $ARGUMENTS across both implementations (React + HTML). If a file path is given, inspect it first and upgrade the existing implementation. If no argument is given, use the file currently open in the IDE or the most recently discussed file.
---

# Mission

Implement or upgrade components and features with full React ↔ HTML parity, accessibility, tests and documentation.

Always balance correctness, accessibility, and simplicity.

---

## Steps

1. **Read context first.**
   - `CLAUDE.md` (status, workflow), `AGENTS.md` (conventions + add-a-component checklist), `docs/roadmap.md`.
   - The relevant spec in `specs/components/`, ADRs it touches, and the target file(s) fully.
   - The pattern reference for the component type (ADR-0011, kept in git history at commit `bd5fb2d`): CSS-only → Button, native control → Switch, runtime behavior → Dialog. Read them with `git show bd5fb2d:<path>` (paths listed in ADR-0011).

2. **Gate check.**
   - If the work belongs to a roadmap phase that has not been approved, or changes an approved decision (ADR), **stop**: present a short proposal (numbered decisions) and wait for approval.
   - If a new runtime dependency is needed, state it and ask first.

3. **Classify** the task:
   - **New**: the component/feature does not exist → implement every slice from scratch.
   - **Upgrade**: it exists but is incomplete, inaccessible, lacks parity or coverage → improve in place.

4. **Design before writing** (one short block, shown to the user):
   - **Spec**: anatomy tree with every `data-ok-*` attribute; options table (HTML attribute ↔ React prop ↔ default); states; keyboard map; events/instance API.
   - **Pattern**: CSS-only / native control / runtime behavior. Runtime behavior goes in a `core` controller that reports intent (`onDismiss`-style) and never decides state by itself.
   - **Accessibility invariants**: role, accessible name/description, focus entry/exit/return, keyboard, contrast, reduced motion.
   - **Lifecycle contract**: every listener/observer/timer bound to the instance `AbortSignal`; behavior on removal while active; idempotent init.
   - **Platform**: native APIs used, baseline check (ADR-0006), feature detection + fallback.
   - **Global state**: none, unless it is one of the ADR-0007 slots (then: protocol impact).
   - If the design changes callers outside the touched component (other components, runtime contract, token names), flag it and ask before proceeding.

5. **Implement** following the AGENTS.md checklist, in this order:
   1. `specs/components/<name>.md`
   2. `packages/core` — anatomy function in `anatomy/anatomy.ts`; behavior in `src/<name>/`; export from `src/index.ts`
   3. `packages/styles/src/components/<name>.css` (+ import in `src/index.css`)
   4. `packages/react/src/<name>/<name>.tsx` (+ export; `"use client"` only if it uses hooks; interactive roots render `data-ok-runtime="off"`)
   5. `packages/html/src/components/<name>/examples/*.html`; if it needs JS: `<name>.ts` with `defineComponent` + one line in `src/components/index.ts`
   6. `apps/storybook/src/components/<name>/` — `.react.stories.tsx`, `.html.stories.tsx` (**identical story names**), built with `reactGroupsStory()` / `snippetStory(…, htmlSetup())` (Code panel with imports; no docs page)
   7. `e2e/tests` — parity pairs + interaction spec run for both implementations

   Keep public APIs stable. Do not add features, abstractions or options beyond what was asked. Prefer the platform over new dependencies.

6. **Security & robustness pass** — check and fix:
   - **DOM injection**: no `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `eval`, `new Function` or `dangerouslySetInnerHTML` in library code; build nodes with `createElement`/`textContent`.
   - **Untrusted attribute input**: values read from `data-ok-*` are validated (unknown values → default), ids looked up with `getElementById`, never interpolated into selectors without escaping (`CSS.escape`).
   - **Event hygiene**: no `stopPropagation`; delegated handlers only through the runtime; handler errors cannot break other components.
   - **Leaks / double init**: listeners use the instance signal; observers disconnect; timers cleared; React effects clean up and survive StrictMode.
   - **Global state**: no new `window` properties or `Symbol.for` slots (ADR-0007).
   - **Boundary**: no React in `tokens|styles|core|html`, no `html` in `react` (ADR-0008).
   - **Supply chain**: no new dependency or install script without approval.

7. **Tests** — create or extend (file naming: `<name>.test.ts(x)` next to the source):
   - **core** behavior: native **and** fallback paths (`forceFallback`), cleanup/idempotency, stacking with other overlays where relevant.
   - **react**: rendering/anatomy, controlled + uncontrolled, keyboard, focus, StrictMode, unmount while active, axe (`expectNoAxeViolations`).
   - **html**: runtime mounting (existing + inserted later), removal cleanup, events (incl. cancelable), options via attributes, axe.
   - **styles/tokens**: new tokens keep contrast tests green; new CSS passes `styles.test.ts`.
   - **e2e**: parity (anatomy + pixels, light + dark), interactions for both implementations, mobile fit.

   **Coverage checklist** — for every public prop/attribute/method verify: default, each value, invalid value, disabled/edge state, keyboard path, focus path, cleanup path, and every invariant from step 4 with at least one failing-input test.

8. **Run tests:**
   ```
   pnpm build
   VITEST_BROWSERS=chromium,firefox,webkit pnpm test
   pnpm storybook:build && pnpm test:e2e
   ```
   All must pass. If a test fails, fix the implementation (not the test) unless the test is wrong. Account for documented platform quirks (AGENTS.md → Gotchas) instead of weakening assertions.

9. **Measure:** `pnpm check:size` — record gzip sizes before/after.

10. **Lint & package checks:** `pnpm lint:fix`, then `pnpm lint`, `pnpm typecheck`, `pnpm check:boundaries`, `pnpm check:packages`. Fix errors first, then accessibility rules, then style.

11. **Documentation** — after everything passes:
    - Spec (attributes, keyboard, accessibility, JS API) and the `htmlSetup()` of the HTML stories (what to load).
    - Package `README.md` if the public API changed; `docs/roadmap.md` / `CLAUDE.md` status if a roadmap item is done.
    - Remind the user to add a changeset (`pnpm changeset`) — do not create it unasked.

---

## Report Format

Report in **two versions — English first, then Vietnamese**.

```
## Implementation Report

### What changed
| Item | Action (new / upgraded) | File |
|------|------------------------|------|

### Accessibility & security invariants
| Invariant | Status |
|-----------|--------|

### Parity
| Check | Status |
|-------|--------|
| Anatomy (React = HTML) | ✅ / ❌ |
| Pixels light/dark | ✅ / ❌ |

### Tests added
| Test name | Package | Category |
|-----------|---------|----------|

### Size (gzip)
| Artifact | Before | After |
|----------|--------|-------|

### Lint fixes (if any)
| Issue | Fix |
```

```
---
## Báo Cáo Implement

### Những thay đổi
| Mục | Hành động (mới / nâng cấp) | File |
|-----|---------------------------|------|

### Bất biến accessibility & bảo mật
| Bất biến | Trạng thái |
|----------|------------|

### Parity
| Kiểm tra | Trạng thái |
|----------|------------|
| Anatomy (React = HTML) | ✅ / ❌ |
| Pixel sáng/tối | ✅ / ❌ |

### Test đã thêm
| Tên test | Package | Loại |
|----------|---------|------|

### Kích thước (gzip)
| Artifact | Trước | Sau |
|----------|-------|-----|

### Sửa lỗi lint (nếu có)
| Vấn đề | Cách sửa |
```

---

## Rules

- Never implement only one side: React and HTML ship together, or the task is not done.
- Never break public API (exports, props, `data-ok-*`, `--ok-*`, events, runtime API) without flagging first.
- Never change an approved architecture decision without a new ADR approved by the user.
- Do not add features, options or abstractions beyond the stated task.
- Do not add comments unless the WHY is non-obvious (platform quirk, invariant, workaround).
- Accessibility, leak and security fixes are always applied, even when they reduce readability.
- Each package owns its output — no malformed markup or CSS left for consumers to patch.
- If a new dependency is required, state it explicitly before adding it.
