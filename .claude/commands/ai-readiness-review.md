---
name: ai-readiness-review
description: Evaluate whether a new AI coding agent can successfully work on this repository using only the AI Knowledge Base. Simulate real tasks, identify missing knowledge, and score AI readiness. Read-only.
---

# Role

You are NOT the maintainer, the documentation author or a code reviewer.

You are a brand-new AI coding agent (Claude Code, Codex, Cursor, Copilot…) that has never seen this repository.

Your goal: determine whether the AI Knowledge Base lets you complete real tasks without reading large parts of the source code.

**Never modify files.**

---

# Ground Rules

- Start from zero; do not use prior knowledge of this project.
- Attempt every task using only: `CLAUDE.md`, `AGENTS.md`, `docs/**`, `specs/**`, package READMEs, `.claude/commands/*`.
- Inspect source only when unavoidable — and record **which file and why**. Every such read is a knowledge gap.

---

# Simulated Tasks

Simulate at least these, and add others that fit:

- Add a CSS-only component (Badge) in React + HTML
- Add a native form control (Checkbox) with controlled/uncontrolled React API
- Add a runtime component (Tabs or Dropdown) with keyboard support, delegated triggers and a popover fallback
- Add a new variant or size to Button in both implementations
- Add a design token and expose it in the Tailwind theme
- Let consumers re-theme primary color; verify AA contrast
- Fix a focus-return bug that only happens in WebKit
- Debug "dialog doesn't open after htmx swap"
- Debug "two copies of the CDN script on the page"
- Investigate a parity e2e failure (anatomy or pixels differ)
- Add a story + HTML docs page for an existing component
- Reduce the CDN bundle size
- Raise the browser baseline
- Rename a `data-ok-*` attribute (breaking change) and release it
- Write tests for a new core controller (native + fallback)
- Prepare and publish a release (changesets, CI, npm provenance)
- Review a pull request that touches `packages/html/src/runtime`

---

# For Every Task

- Could it be completed from the knowledge base alone? (yes / partially / no)
- What information was missing, and which document should have contained it?
- Which source files had to be read, classified as: not needed / helpful / required / impossible without — and why.
- **Hallucination risk** (low / medium / high): how likely would an agent invent wrong code — wrong attribute names, wrong event names, missing cleanup, single-implementation change, CSS outside `:where()`, new globals, untested fallback? Explain.

---

# Cross-cutting Evaluation

**Discoverability** — Would a new agent know where to look? Does `CLAUDE.md` route to the right document quickly? Is terminology consistent enough for search?

**Context efficiency** — Estimate tokens needed before writing correct code for a typical task. Identify oversized documents, repetition, missing summaries, weak cross-references.

**Commands review** — Using only `.claude/commands/*`, can common work be done? Missing commands, overlapping commands, commands with stale steps or wrong scripts, missing prerequisites.

**Predicted failures** — Where future agents are most likely to fail (e.g. editing only React, forgetting `pnpm build` before tests, Storybook side-effect imports, platform quirks, ADR violations). Document each one.

---

# Scores (0–100)

Architecture discoverability · Knowledge coverage · Retrieval quality · Task completion · Commands · Token efficiency · Hallucination resistance · Developer experience · **Overall AI readiness**

---

# Recommendations

In priority order, with expected effect on: context needed, hallucination risk, token usage, task success. Recommend — do not write — the changes.

---

# Final Verdict

Answer: **"If an advanced coding agent joins this repository tomorrow, can it confidently implement new components and features without spending significant time reading source code?"**

Justify with evidence from the simulated tasks.

Write the report in English, then a Vietnamese version under a `---` divider.
