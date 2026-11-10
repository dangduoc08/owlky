---
name: implement
description: Build or upgrade a component or feature that has no reference page ($ARGUMENTS: a description, a component name or a file), in React + HTML, through /component's implementation steps.
---

# Mission

The entry point for work **without a reference page**: a roadmap row, an upstream prop, a bug
fix that changes behavior, a feature of an existing component. With a reference URL (or a spec
`Reference URL:` to follow), use `/component` instead; for API-preserving cleanups, `/refactor`.

## Steps

1. **Resolve the target.** A file path → its component; a name → `specs/components/<name>.md`;
   a description → the component(s) it changes. No argument: the file open in the IDE or the one
   most recently discussed. Ambiguous → ask.
2. **Read** CLAUDE.md, AGENTS.md (ground rules, checklist, every gotcha for the component), the
   spec (its "Upstream API mapping"), the ADRs it cites, and the upstream API page for the props
   you add (ADR-0015: map prop by prop, never invent names).
3. **Gate.** A change to an approved decision needs a new ADR; a new runtime dependency needs an
   ADR. Unless a standing approval covers the work (an approved roadmap, `/component`
   auto-approval), show a short proposal (numbered decisions, API impact: none · additive ·
   breaking with a migration note) and wait.
4. **Build and verify** with `.claude/commands/component.md` **steps 7–11** in Update mode (spec
   first; core → styles → React **and** HTML → stories and docs page → parts, events and JSDoc for
   the API reference; tests to full coverage; security checklist; `pnpm check`, unit tests per
   browser, affected e2e). Skip the reference capture and comparison (steps 3, 4, 11's visual
   comparison with the reference).
5. **Hand off** with `/component` step 12 (roadmap, specs, AGENTS.md gotchas, changeset) and
   report in Vietnamese with `/component`'s report format, leaving out the reference sections.
