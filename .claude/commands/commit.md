---
name: commit
description: Commit staged changes with an auto-generated message. If $ARGUMENTS is provided, use it as the commit message directly.
---

# Mission

Commit staged changes with an auto-generated message.

If $ARGUMENTS is provided, use it as the commit message directly.

---

## Steps

1. Run `git diff --staged` to read all staged changes. If nothing is staged, tell the user and stop.

2. **Changeset check.** If any staged file is under a publishable package (`packages/tokens|styles|core|react|html/`, excluding tests, stories and README-only edits) and no new file under `.changeset/` is staged, warn the user that a changeset is missing (`pnpm changeset`) and ask whether to continue. Do not create the changeset yourself.

3. If $ARGUMENTS is provided, skip to step 6 using $ARGUMENTS as the message for a single commit covering all staged changes.

4. Group the staged changes into logical commit units:
   - Classify each file by concern (component feature, runtime, tokens/styles, tests, docs/ADR/spec, tooling/CI, config).
   - Keep one component's slices together when they implement one change: spec + core + styles + react + html + stories + e2e for the same component is **one** commit.
   - Keep an implementation file with its test file.
   - Split unrelated concerns into separate commits.
   - If everything belongs to one coherent concern, a single commit is fine — do not split arbitrarily.

5. For each commit group, generate a message:
   - Conventional Commits: `<type>(<scope>): <description>`
   - Types: `feat`, `fix`, `refactor`, `perf`, `test`, `chore`, `docs`, `build`, `ci`, `style`
   - Scope: the package or area — `tokens`, `styles`, `core`, `react`, `html`, `storybook`, `e2e`, `docs`, `ci`, `deps`, or a component name (`dialog`, `button`) when the change spans packages for one component.
   - Description: imperative mood, lowercase, no period, max 72 chars.
   - Add a body only if the *why* is not obvious (e.g. a fallback for a browser quirk, an ADR it implements).
   - Breaking change to public API (exports, `data-ok-*` anatomy, `--ok-*` variables, `ok:*` events, runtime protocol): add `!` after the scope and a `BREAKING CHANGE:` body line.

6. Show the commit plan (groups + messages, in order), then commit right away — invoking `/commit` is the approval. Stop and ask only for the changeset warning in step 2 or when the grouping is genuinely ambiguous.

7. For each group in order:
   a. Unstage everything: `git restore --staged .` (on a repository with no commits yet use `git rm --cached -r -q .` instead)
   b. Stage only the files in this group: `git add <file1> <file2> ...`
   c. Run: `git commit -m "<message>"`
   d. If the commit fails, stop and report the error.

---

## Rules

- Never use `--no-verify`.
- Never amend an existing commit.
- Never stage files that were not in the original staged set.
- Never commit generated output (`dist/`, `storybook-static/`, `test-results/`, screenshots made outside Docker).
- If a pre-commit hook fails, report the error and stop. Do not retry or bypass.
- Keep the message in English.
- Never add anything Claude-related to the commit: no `Co-Authored-By`, no `Generated with Claude`, no signatures, no trailers of any kind.
