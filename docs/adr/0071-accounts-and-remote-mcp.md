# ADR-0071: Accounts and a remote MCP at owlky.com/mcp

**Status:** Accepted (owner's decisions 2026-11-12, "Road to 0.1.0" track 3). Supersedes ADR-0046
(the stdio package `@owlky/mcp`) and ADR-0040's static-only hosting. Implemented after the design
styles (`docs/roadmap-styles.md`), before 0.1.0.

## Context
ADR-0046 ships the MCP server as a stdio package run with `npx`. The owner wants one hosted
endpoint that AI clients reach by URL, behind a sign-in, to know who really uses Owlky and to
market a premium tier later. `@owlky/mcp` was never published, so removing it breaks nobody. The
packages stay MIT and the repository public: the sign-in gates the hosted service, not the code.

## Decision
1. **No local MCP.** `@owlky/mcp` stops being a published package: its CLI, `npx` docs,
   `smoke:mcp` and the `owlky` entry in `.mcp.json` go. The shared code (manifest generation,
   tools, resources, prompts, search, `validate_markup`) becomes a private workspace package that
   the website imports; `check:manifest` keeps guarding the data. Done in M0 (2026-11-13): the
   folder stays `packages/mcp` (so `scripts/manifest.mjs`, the size budget, Biome and the API
   reference test keep their paths), renamed `@owlky/mcp-server` with `"private": true`, no `bin`
   and no README; it is out of `check:packages` and `check-release` (the manifest's `version` is
   still checked and synced), and its changeset entries were dropped.
2. **Hosting:** the website leaves `output: "export"`; pages stay statically rendered and
   `app/mcp/route.ts` serves the MCP over Streamable HTTP, stateless. Vercel's free plan for the
   free release; a paid plan (or another host such as AWS) when premium starts. The server code
   stays host-neutral: web-standard `Request` / `Response` handlers, a standard Postgres driver,
   no host-specific storage.
3. **Sign-in:** GitHub and Google OAuth through **Better Auth**, whose MCP plugin provides the
   OAuth 2.1 authorization server the MCP spec asks for: PKCE, dynamic client registration and
   protected-resource metadata (RFC 9728), so Claude Code, Cursor and VS Code sign in through the
   browser.
4. **Personal access tokens** for clients without OAuth: created, listed and revoked on the account
   page, sent as `Authorization: Bearer`; stored hashed only.
5. **Database:** Neon Postgres, schema and migrations with Drizzle.
6. **Data per account:** name, email, avatar, provider, created date, last MCP use, and call
   counts per tool. Never prompts, tool arguments or results. Marketing email is an unticked
   opt-in stored with its date. Users delete their account themselves (rows removed, not hidden).
7. **Rate limit:** about 60 calls per minute per account, a fixed window counted in Postgres (no
   extra service until traffic needs one); over the limit the server answers with a retry-after
   error.
8. **Versions:** `/mcp` serves the latest manifest; `/mcp/v0.1` stays pinned to that release.
9. **Gating:** only the MCP needs an account now. Docs, code samples, Copy, previews and **Open
   HTML demo** stay public; installing the npm packages needs no account. Accounts carry
   entitlements so templates, blocks and a premium tier can be gated later without a schema change.
10. **Owner's part:** GitHub OAuth app, Google OAuth client, the Neon database, the auth secret, a
    privacy policy and terms of use (drafted by us, reviewed with L6).

## Consequences
- The website gets server code, secrets and a database: security review (CSRF, cookie flags,
  token hashing, scopes) and e2e with mocked providers are part of the work (M2).
- Docs traffic is measured without accounts (privacy-friendly analytics, npm downloads).
- Contributors look things up through the remote `/mcp` (or the Storybook MCP) instead of a local
  `owlky` server; CLAUDE.md's "Owlky MCP" section changes with M0.
