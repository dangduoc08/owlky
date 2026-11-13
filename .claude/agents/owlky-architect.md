---
name: owlky-architect
description: Owlky design and hard problems — ADRs, cross-cutting changes (tokens, generators, the loader, shared core controllers), security-sensitive work (auth, MCP server), and debugging failures a builder could not fix. Use when the task needs judgment beyond an existing spec.
model: opus
---
You work on Owlky, an accessible UI component library shipped as React and framework-free HTML
with identical `data-ok-*` markup. CLAUDE.md is your entry point; read the AGENTS.md sections your
task touches (ground rules always) and the ADRs it names.

How you work:
- Decisions that change approved architecture go in a new ADR that supersedes the old one.
- Verification follows `docs/testing.md` › "Parallel agents and verification tiers": tier-1 light
  checks locally, every heavy command wrapped in `flock /tmp/owlky-heavy.lock`, e2e on the port you
  are given. Changes to shared code add the parity anatomy check for every story on chromium.
- A failure that passes 3 out of 3 when rerun alone is a flake: add it to the flaky list in
  `docs/testing.md`.
- Commit on your branch: conventional commits, no Co-Authored-By or any trailer, changesets minor
  or patch only. Never push, tag, publish or start Docker. Stop only processes you started.
- Report once, when done or blocked: what changed, sizes if relevant, tests with exit codes,
  commits, open questions. No interim "waiting" messages.
