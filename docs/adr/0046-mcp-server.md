# ADR-0046: MCP server — `@owlky/mcp` over stdio, answering from a generated manifest

**Status:** Superseded by ADR-0071 (2026-11-12). Was: Accepted (2026-11-09; auto-approved under the owner's standing instruction to run the
approved plan)

## Context
Coding agents that use Owlky (library users, and the agent that builds the website, ADR-0040)
guess props, `data-ok-*` names and token names unless they can look up the real API. Storybook's
MCP (`@storybook/addon-mcp`) only covers React stories, needs a running dev server and has no
props (story metas don't set `component`, ADR-0018). The sources of truth already exist as data:
105 option schemas (`optionSchemas` in `core/src/anatomy/anatomy.ts`, ADR-0015), the specs, the
guide sections that docs pages export (`buttonSections`, `shadowsSections`…), 523 HTML snippets,
the React Code panel source (`jsxSource()` or `?raw` demos) and `tokens.json`. A remote MCP on
owlky.com was considered and deferred by the owner, so the website stays static.

## Decision
1. **Package `packages/mcp` → `@owlky/mcp`**, published with the fixed version group (Changesets).
   Bin `owlky-mcp`; run with `npx -y @owlky/mcp`. Node ≥ 22.12. **stdio transport only**.
2. **Runtime dependencies:** `@modelcontextprotocol/sdk` 1.32.2 and `zod` 4.6.7 (the SDK's peer),
   pinned; both are ≥ 14 days old. They are dependencies of `@owlky/mcp` only: no other package
   gains a dependency. The package imports nothing from `@owlky/react` or `@owlky/html` at run time
   (`check:boundaries` gets an `mcp` rule).
3. **One generated `manifest.json`, shipped in the package.** `scripts/manifest.mjs` builds it
   after `pnpm build` from: option schemas (name, attribute, kind, values, default, description),
   spec sections (anatomy, options, states, keyboard, accessibility, events, parity notes), guide
   sections exported by the docs pages (prose + HTML / React code), HTML snippets per story, the
   React Code panel source per story (the same `jsxSource()` / `?raw` code Storybook shows), and
   tokens (`tokens.json`). It carries the library version. No network, no file access outside the
   package at run time. `pnpm check:manifest` (in `pnpm check` and CI) regenerates it and fails on
   a diff, so the manifest never drifts from the code.
4. **Tools** (inputs validated with zod; outputs as text + structured content):
   | Tool | Returns |
   |---|---|
   | `list_components` | every component (name, title, summary, React exports, HTML root attribute), optional text filter |
   | `get_component` | one component: options table (React prop ↔ `data-ok-*` ↔ values ↔ default), anatomy, states, keyboard, accessibility, events, related components |
   | `get_examples` | a component's stories with HTML snippet and / or React source (`framework`: `html` · `react` · `both`) |
   | `search_tokens` | `--ok-*` variables and Tailwind utilities matching a query (group, value, light / dark) |
   | `get_guide` | a foundations or component docs guide, section by section |
   | `validate_markup` | checks HTML against the anatomy: unknown `data-ok-*` names, values outside an option's allowlist, missing required parts; a small tag / attribute scanner, no HTML parser dependency, never executes or renders input |
5. **Resources and prompts.** Resources `owlky://components/<name>`, `owlky://tokens`,
   `owlky://guides/<id>`; prompts for building a page with Owlky in HTML or React that tell the
   agent to call the tools instead of guessing.
6. **Registration.** `.mcp.json` gets `owlky` (local: `node packages/mcp/dist/cli.js`) next to
   `storybook`. The README documents `npx -y @owlky/mcp` for Claude Code, Cursor and VS Code.
7. **Tests.** Generator unit tests (every schema and snippet lands in the manifest; deterministic
   output), server tests through the SDK's in-memory transport (every tool, invalid input,
   size limits), and an `npx` smoke test of the packed tarball (`pnpm pack`, start it, `tools/list`).

## Consequences
- Agents get the exact API offline, versioned with the installed library.
- Every component review must keep the manifest current (`check:manifest` fails otherwise); docs
  pages keep exporting their sections as data.
- The website (ADR-0040) reads the same manifest for its option and prop tables and emits
  `llms.txt`, `llms-full.txt` and one `.md` per page.
- The SDK brings its own transitive dependencies (HTTP server libraries it doesn't use over stdio);
  they ship only with `@owlky/mcp`, never with the component packages.
- A remote (HTTP) server stays out of scope until a new ADR.
