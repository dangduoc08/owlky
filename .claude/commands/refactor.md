---
name: refactor
description: Refactor the code in $ARGUMENTS for clarity and TypeScript/React/CSS idiom compliance. If no argument is given, use the file currently open in the IDE or the most recently discussed file.
---

# Mission

Refactor code for clarity and idiom compliance.

**Logic must not change.** Public API must not change: exports, React props, `data-mt-*` anatomy, `--mt-*` variables, `mt:*` events and their `detail`, runtime API, snippet markup, rendered DOM.

Only structure, naming, and style are in scope.

---

## Steps

1. **Read** the target file(s) fully before touching anything, plus `AGENTS.md` (naming conventions).

2. **Record a passing baseline** before any edits:
   ```
   pnpm build
   pnpm test
   ```
   If the target affects rendered output (styles, React components, snippets), also run
   `pnpm storybook:build && pnpm --filter @minimal-tailwind/e2e exec playwright test --grep-invert @visual --project chromium`.
   If anything fails before you start, stop and report — do not proceed.

3. **Check if the file should be split** before analysing individual issues:
   - Longer than ~300 lines and mixing responsibilities (e.g. React compound parts + context + hooks; runtime registry + delegation + observation).
   - A split is warranted when each new file has one clear focus, public exports stay identical (re-export from the original entry), and no package boundary is crossed.
   - Perform the split first (move code only), run tests, then continue on each new file.

4. **Analyse** — identify every issue in these categories:

   **Naming**
   - Names that are too long, too short or misleading; booleans that don't read as predicates (`isOpen`, `hasTitle`).
   - Acronyms consistent within a name (`getElementById`, `ariaId`, not mixed).
   - Repository conventions (AGENTS.md): kebab-case files, `data-mt-<component>-<part>`, `--_mt-*` for private CSS variables, `mt:<component>:<event>`.

   **Structure (TypeScript)**
   - Nested conditions that flatten with early returns; `else` after `return`.
   - Repeated literals that should be a named constant; dead branches; tautologies.
   - Declarations far from first use.
   - Functions > ~50 lines with an obvious single-purpose extraction.
   - `any`, non-null assertions (`!`), unnecessary type assertions — replace with narrowing.
   - Modern built-ins over manual code: `Object.hasOwn`, `Array.prototype.at`, `structuredClone`, `AbortController` for listener cleanup, `??`, `?.`.

   **React**
   - Effects that compute derivable values; missing or excess dependencies; state that duplicates props.
   - Inline object/array props that cause needless re-renders where it matters (context values → `useMemo`).
   - `forwardRef` + `displayName`/named function preserved; props spread order (`{...props}` last so consumers can override).

   **CSS**
   - Every selector a single `:where(...)`; order base → sizes → variants → hover → focus → disabled.
   - Hard-coded values that should be `--mt-*` tokens; duplicated declarations that belong in the component's base rule or a private `--_mt-*` variable.
   - `@apply` only for utilities that compile to plain declarations (no `--tw-*`).

5. **Apply** changes one file at a time, running `pnpm test` after each file (and the e2e parity run if rendered output could be affected). If any test fails, revert that specific change and note it.

6. **Lint** after all changes: `pnpm lint:fix`, `pnpm lint`, `pnpm typecheck`, `pnpm check:boundaries`. Fix only issues in files you touched.

7. **Report** in two versions — English first, then Vietnamese.

---

## Report Format

```
## Refactor Report

### Changes
| File | Line(s) | Category | Before | After | Reason |
|------|---------|----------|--------|-------|--------|

### Lint fixes (if any)
| Issue | Fix |

### Verification
All N unit tests pass. Parity e2e: ✅ / not affected.
```

```
---
## Báo Cáo Refactor

### Thay đổi
| File | Dòng | Loại | Trước | Sau | Lý do |
|------|------|------|-------|-----|-------|

### Sửa lỗi lint (nếu có)
| Vấn đề | Cách sửa |

### Kiểm chứng
Tất cả N unit test pass. Parity e2e: ✅ / không bị ảnh hưởng.
```

---

## Rules

- **Logic must not change.** If a structural change would alter behavior, rendered DOM, CSS cascade outcome or event order, skip it and note it in the report.
- **Public API must not change** (see Mission). Renames that would touch callers in other packages: flag and ask first.
- Do not add features, options, error handling or abstractions.
- Remove comments that describe *what* the code does; keep comments that explain *why* (platform quirks, invariants, ADR references).
- Let Biome handle formatting (`pnpm lint:fix`); focus on semantic clarity.
- Prefer the smallest change that achieves the clarity goal — do not refactor speculatively.
