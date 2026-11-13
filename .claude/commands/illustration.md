---
name: illustration
description: Add a picture to the illustration set in its style ($ARGUMENTS: <name> "<description>"): compose from the parts, catalog it, run the style tests, check the All contact sheet. Several pictures run in parallel agents.
---

# Mission

Draw a new **original** illustration that looks like it was always part of the set: same
canvas, backdrop, ground shadow, sparkles, people, stroke weights and palette balance. The rules
are `docs/illustrations-style.md`; the shared details are the parts in
`packages/core/src/illustrations/parts.ts`; `packages/core/src/illustrations/style.test.ts`
enforces the measurable rules. Never trace or copy third-party art (ADR-0041).

**Auto-approval (standing user instruction):** the step 3 proposal is **granted for your
recommendation**, as in `/component`. Don't stop to ask: record it as *auto-approved* and carry
on. Ask only when the description is genuinely ambiguous (two unrelated heroes), or for what
CLAUDE.md reserves (Docker Desktop, commit, push, publish).

**Language with the user:** the proposal, the contact sheet notes and the report are in
**Vietnamese** (identifiers, file names and tone names stay as they are). Repository files stay
in English.

---

## Steps

1. **Parse.** `$ARGUMENTS` = `<name> "<description>"` (the description may be in Vietnamese).
   `name`: kebab-case, not taken (`illustrations` in `packages/core/src/illustrations/index.ts`),
   no `-shape` suffix unless it is a shape (own viewBox, not a scene). Export: camelCase of the
   name. Several `<name> "<description>"` pairs → [Multi mode](#multi-mode).

2. **Read.** `docs/illustrations-style.md` (all of it), `parts.ts`, `style.test.ts`, two existing
   pictures close to the subject (`data/*.ts`), AGENTS.md → "Illustrations" and "Illustration
   style" gotchas. Pick the category story (`ILLUSTRATION_FILES` in
   `apps/storybook/src/foundations/illustrations/illustration-examples.tsx`: errors, states,
   account, dashboard, shapes); a new category only if none fits.

3. **Propose (Vietnamese, auto-approved).** A short table: hero object (shape, tones: lit `main` /
   shaded `dark` split), props, person (`person({ x, pose, skin, shirt, hair })` or none, skin tone
   chosen to keep the set varied), parts used, sparkles (count, tones, positions in the margins),
   category story and group title (`"<Title> (<exportName>)"`), and any new part (only when a
   detail is now shared by two pictures: add it to `parts.ts` with tests, and refactor the other
   picture to use it, its snippets byte-identical).

4. **Write `packages/core/src/illustrations/data/<name>.ts`.** Compose the parts in the guide's
   draw order: `backdrop()`, `groundShadow()` (or a cloud bank for a sky scene), back props, the
   hero centered on x 240, front props / person, sparkles. Tones from the guide's table only;
   numbers only (no colors, ids, styles); repeated small shapes through a local helper. One-line
   JSDoc `<Title>: <what it shows>. Original artwork (MIT).`

5. **Catalog it.**
   - `packages/core/src/illustrations/index.ts`: import, export, `illustrations` list.
   - `illustration-examples.tsx`: import, `ILLUSTRATION_FILES[<story>]` entry, `PICTURES[<story>]`.
     The **All** story picks it up (it throws if the picture is in no story).
   - New category only: export the story in `illustrations.stories.tsx`, add it to `parity.spec.ts`
     (the `illustrations` list) and `STORIES` in `e2e/tests/illustrations.responsive.spec.ts`.
   - `pnpm build && node apps/storybook/scripts/illustration-snippets.mjs`: only the new snippet
     appears in `git status` (and Upload's snippets only if the `upload` picture changed).
   - Counts and lists: the docs page (`illustrations-docs.tsx`: "Owlky includes N …"),
     `docs/roadmap.md` (Illustrations list), the illustration module comment in
     `scripts/check-size.mjs` if the measured size moved.

6. **Rules.** `pnpm test packages/core/src/illustrations` — the style rules (`style.test.ts`), the
   set test and the parts tests. A failure means the picture breaks the guide: fix the picture,
   never the limits. Change a limit or add an exception only with a reason the guide records
   (and say so in the report).

7. **Contact sheet.** `pnpm storybook:build`, then a throwaway Playwright script in the scratchpad
   (run from `e2e/`, where `@playwright/test` resolves; delete the copy afterwards) that opens
   `iframe.html?id=foundations-illustrations--all&globals=theme:<light|dark>;framework:react` and
   saves full-page screenshots at 1280px light and dark, and at 375px with a touch context. Look
   at them next to the neighbors: same blob and shadow, sparkles in the margins, stroke weight,
   no tone dominating (accent), the hero's size and center like the others, readable at phone
   width. Fix and repeat until it fits; list what you checked in the report.

8. **Test standard** for the touched files (`/component` → test standard, scoped):
   - `pnpm check` (lint, typecheck, `check:size` per picture: ≤ 3 kB and no other picture in its
     bundle, `check:specs`).
   - `VITEST_BROWSERS=chromium,firefox,webkit pnpm test illustration upload` (one browser at a
     time if they time out).
   - E2E (never two runs at once; another port in multi mode, `PORT=4322`):
     `tests/illustrations.responsive.spec.ts`, and the illustration entries of `parity`,
     `options-parity`, `a11y`, `foundations` and `csp` (`-g "illustration"`).
   - Security: `/component` → Security checklist S1–S17 for the new files (data only: S14 and S16
     matter; the core test rejects references, scripts and colors).
   - Visual baselines: the new story pictures are 🆕; never generate them outside Docker.

9. **Hand-off.** `pnpm changeset` (minor for `@owlky/core`: a new picture is a new export),
   report in Vietnamese: the composition, parts used, contact sheet paths, size, tests
   with numbers. Ask before committing (CLAUDE.md); commit message
   `feat(illustrations): add the <name> illustration`.

## Multi mode

Two or more pictures: one agent per picture (max 3 at a time), each in its own git worktree and
branch `illustration/<name>`, e2e on its own port (4322, 4323, …). Agents commit on their branch
(no push); this session merges them one by one (`index.ts`, `illustration-examples.tsx` and the
docs count conflict: keep both entries), regenerates the snippets, reruns step 6–8 on the merged
tree and builds one contact sheet with every new picture.
