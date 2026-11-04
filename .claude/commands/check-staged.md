---
name: check-staged
description: Inspect the staged changes for correctness, logic integrity, and impact relative to the last commit. Stash unstaged work first so the working tree is clean and the diff is unambiguous.
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
   pnpm --filter @minimal-tailwind/e2e exec playwright test --grep-invert @visual --project chromium
   ```
   If `package.json` exports or `files` changed, also run `pnpm check:packages`.

5. **Analyse the diff for impact.** For each changed file, examine:
   - **Logic changes** — Does observable behavior change (open/close, focus, keyboard, events, rendering)?
   - **Public surface** — Added/removed/renamed exports, React props, `data-mt-*` attributes, `--mt-*` CSS variables, `mt:<component>:<event>` events or their `detail`, runtime API methods, package `exports`.
   - **React ↔ HTML parity** — Was only one implementation changed? Do snippets in `packages/html/src/components/*/examples`, React output, the spec in `specs/components/` and the parity pairs in `e2e/tests/parity.spec.ts` still agree?
   - **Accessibility** — Roles, accessible names, `aria-*`, focus order/return, keyboard support, color contrast (token changes must keep `tokens.test.ts` green).
   - **Framework boundary** — Any React import in `tokens|styles|core|html`, or `html` import in `react` (ADR-0008)?
   - **Runtime lifecycle** — New listeners/observers/timers without the instance `signal` or cleanup; anything that can initialize twice or leak after removal (ADR-0005).
   - **Global state** — New `window` properties or `Symbol.for` slots; changed shape of a shared slot without a protocol bump (ADR-0007).
   - **CSS** — Selectors outside a single `:where()`, rules outside `@layer components`, hard-coded values instead of `--mt-*`, `--tw-*` leakage, ordering mistakes (base → sizes → variants → hover → focus → disabled).
   - **Browser support** — Use of APIs outside the baseline (Chrome/Edge 114, Firefox 128, Safari 17) without feature detection and fallback (ADR-0006).
   - **Size** — Bundle or CSS growth reported by `check:size`.
   - **Security** — `innerHTML`/`insertAdjacentHTML`/`eval`/`new Function` with non-constant input, `dangerouslySetInnerHTML` outside Storybook, new dependencies or install scripts (`allowBuilds`).
   - **Release** — Publishable package changed without a staged changeset.

6. **Restore stashed changes.**
   If a stash was created in step 2, run `git stash pop`.
   If `pop` fails, report the conflict to the user and stop — do NOT lose their work.

7. **Write the report** in the format below — English first, then Vietnamese under a `---` divider.

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

```
---
## Báo Cáo Tác Động Thay Đổi Staged

**Lint / Types / Build:** ✅ / ❌
**Boundaries / Size:** ✅ / ❌ (thay đổi kích thước nếu có)
**Unit tests:** ✅ pass / ❌ fail (liệt kê test thất bại)
**E2E (nếu chạy):** ✅ pass / ❌ fail / ⏭ không cần

### Files thay đổi
| File | +dòng | -dòng | Phân loại |
|------|-------|-------|-----------|

### Phát hiện
| # | File | Nội dung | Mức độ |
|---|------|----------|--------|
| 1 | ...  | ...      | info / warning / critical |

### Kết luận
**Thay đổi hành vi so với commit cuối:** CÓ / KHÔNG
**Thay đổi public API:** CÓ / KHÔNG (liệt kê)
**Giữ nguyên parity React ↔ HTML:** CÓ / KHÔNG
<một hoặc hai câu — mô tả thay đổi về mặt chức năng, hoặc xác nhận không có gì thay đổi>
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
