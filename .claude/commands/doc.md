---
name: doc
description: Generate (or refresh) documentation for the package or component at $ARGUMENTS — a package README.md, or a component's spec + HTML docs page + React story docs. If no argument is given, use the package or component of the file currently open in the IDE or the one most recently discussed.
---

# Mission

Generate or refresh documentation that is accurate to the current code, for both audiences:
npm users (package README) and component users (spec, Storybook docs for React and HTML).

---

## Steps

1. **Resolve the target.**
   $ARGUMENTS may be a package (`react`, `packages/html`, `@owlky/styles`) or a component (`dialog`, `button`). Resolve it to exactly one target. If ambiguous, ask instead of guessing.
   - **Package** → output is `packages/<name>/README.md`.
   - **Component** → output is `specs/components/<name>.md` (maintainer contract) **and** its Storybook docs page `apps/storybook/src/components/<name>/<name>-docs.tsx` (ADR-0019, model: Button), attached in `<name>.stories.tsx` and listed in `GUIDES` / `OPTION_TABLES` (`e2e/tests/foundations.spec.ts`). "all components" = every folder in `specs/components/`.

2. **Read the structure references.**
   - Component docs: follow the Dialog spec from git history — `git show bd5fb2d:specs/components/dialog.md` — for structure and level of detail (ADR-0011).
   - Foundation docs: follow `apps/storybook/src/foundations/colors/` (page component + story).
   - Package README structure:
     - `# @owlky/<name>` + one-line description
     - Install
     - Usage — one complete, realistic example of the most common use
     - API — every export: signature, parameters, return value / props with type, default, required
     - Behavior rules (from tests, step 5)
     - Browser support / requirements if relevant (link ADR-0006)
     - Link back to the root README and Storybook

3. **Read the public surface.**
   - Package: everything exported from `src/index.ts` (and other `exports` entries in `package.json`), with exact TypeScript types and JSDoc.
   - Component: `core` anatomy function and controller, the CSS file header comment, React component props, HTML snippets in `packages/html/src/components/<name>/examples/`, the HTML definition (options read from attributes, delegated triggers, emitted events, instance API).
   - Skip non-exported identifiers.

4. **Cross-check real usage.**
   Base every example on real call patterns from tests, stories and snippets so docs never show an API, prop, attribute or event that doesn't exist.

5. **Derive behavior rules from tests.**
   From `*.test.ts(x)` and `e2e/tests/*.spec.ts`, extract concrete contracts: defaults, keyboard behavior, focus behavior, cancelable events and their reasons, cleanup guarantees, fallback behavior, idempotency. Only state a rule an actual test asserts — never invent one.

6. **Capture measured facts.**
   If the docs mention size, run `pnpm build && pnpm check:size` and use the real numbers (note they were captured at doc-generation time).

7. **Infer intent from code, not names.** If a prop's or attribute's purpose isn't documented, read where it is consumed before describing it.

8. **Audit existing docs before rewriting.**
   If the target files exist, treat this as a refresh: keep accurate prose, fix what is stale or missing relative to the code and the structure references, add missing sections. Make sure spec, HTML page and React docs agree with each other.

9. **Write** the documentation.

10. **Verify completeness and validity.**
    - Every export / prop / `data-ok-*` attribute / event / keyboard interaction found in step 3 is documented.
    - Every rule from step 5 appears.
    - HTML examples are copy-paste valid (same markup as the snippets); TypeScript examples type-check against the current API.
    - For component docs: `pnpm storybook:build` succeeds and `pnpm exec playwright test tests/foundations.spec.ts` (in `e2e/`) passes for the page.

---

## Rules

- Write user-facing docs per AGENTS.md → "Writing documentation".
- Never modify library source code, tests or snippets — output is documentation only (`README.md`, `specs/**`, docs pages `*-docs.tsx` and their `GUIDES` / `OPTION_TABLES` entries, story `docs` parameters).
- Every documented prop/field states its TypeScript type and default.
- Every example uses real exported identifiers and real `data-ok-*` attributes.
- Do not document internal (non-exported) identifiers.
- Do not add any Claude-related signature, attribution or generated-by note.
- Docs are written in English (repository convention).
- Rules must trace back to a real test assertion; numbers must come from a real run.
- If the package or component has no public surface, stop and tell the user instead of producing empty docs.
