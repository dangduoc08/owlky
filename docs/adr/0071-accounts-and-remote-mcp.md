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

## Implementation notes (M2–M4, 2026-11-14)

Owner's autonomy for the design decisions; these notes record them. Nothing here uses a real
account, secret or service: everything runs locally with PGlite and mock OAuth providers.

### Decisions
1. **Hosting (§ 2).** `output: "export"` is gone. Every page is still prerendered at build time
   (`○` in the build output); only `/api/auth/*`, `/api/health`, `/mcp`, `/mcp/[version]` and the
   three `/.well-known/*` routes run on demand (`ƒ`). `trailingSlash` stays; the automatic redirect
   is off (`skipTrailingSlashRedirect`) so `/mcp` and the OAuth callbacks keep their exact paths,
   and `src/proxy.ts` adds the slash to page paths only (`redirects()` can't: it matches paths
   without their slash and looped). `scripts/postbuild.mjs` writes the Markdown pages, `llms.txt`
   and the Pagefind index (from `.next/server/app/*.html`, URLs set per file) into `public/`, which
   is now entirely generated (gitignored). `website:serve` is `next start`; `vercel.json` uses the
   `nextjs` framework without `outputDirectory`. **To verify on the first preview (M7):** files
   written to `public/` after `next build` are deployed (Vercel collects `public/` after the
   build command).
2. **Better Auth 1.7.14.** Its MCP plugin moved out of the core package: `@better-auth/mcp`
   (`mcp()`, built on `@better-auth/oauth-provider`) plus the `jwt` plugin, whose keys sign the
   access tokens (JWT, audience-bound to the resource; the plugin's `/token` route is disabled so
   browser sessions never get one). Dynamic client registration is open (unauthenticated, as MCP
   clients need), PKCE is required and S256 only, every registered client needs the person's
   consent on `/oauth/consent/`. The sign-in page is the OAuth `loginPage`: `oauthProviderClient`
   resumes the authorization request after GitHub / Google (covered by e2e).
3. **Database (§ 5): Drizzle + node-postgres (`pg`), PGlite locally.** `pg` is the standard
   driver (Neon accepts it; no host-specific client). Without `DATABASE_URL` the app opens PGlite
   (Postgres compiled to WebAssembly, in process), chosen over pg-mem because it runs the real SQL:
   arrays, `on conflict` upserts and `on delete cascade`. One schema (`src/server/schema.ts`; the
   Better Auth tables match its generator, and Better Auth refuses to start on a mismatch),
   drizzle-kit migrations in `apps/website/drizzle/`. PGlite migrates when opened; Postgres is
   migrated by `pnpm --filter @owlky/website db:migrate` before a deploy, never by a request.
4. **Personal access tokens (§ 4).** `owlky_pat_` + 32 random bytes (base64url); the database
   keeps a SHA-256 (a fast hash suffices for 256 bits of entropy), the first 16 characters for the
   list, the name, scope `mcp`, dates (created, last used, expiry 30 / 90 / 366 days or never).
   At most 20 per account; revoking deletes the row. The secret is in the create response only
   (`Cache-Control: no-store`).
5. **Rate limit (§ 7).** Every HTTP request to `/mcp*` counts once (a batch is one request), in a
   fixed 60-second window per account: one atomic `insert … select from "user" … on conflict`
   that also records the last use and returns no row for a deleted account. Over 60: HTTP 429,
   `Retry-After` (seconds to the window's end) and a JSON-RPC error (-32003). Better Auth's own
   sign-in limits stay in its memory store, so no IP address is written to the database.
6. **Usage data (§ 6).** `mcp_usage` (window, last use) and `mcp_tool_usage` (calls and last call
   per tool). Tool names are counted only when they are one of the server's `TOOL_NAMES`
   (exported by `@owlky/mcp-server`, checked against `tools/list`). Nothing of a request body is
   stored or logged. Sessions store neither the IP address nor the user agent (a database hook
   clears them), and neither are the providers' tokens, which serve the sign-in only.
7. **Versions (§ 8).** `/mcp` serves `packages/mcp/manifest.json`. A pinned version is a gzipped
   copy (`apps/website/manifests/v<M>.<m>.json.gz`, about 1.7 MB) written once by
   `node apps/website/scripts/pin-manifest.mjs` on the release commit and never changed; the
   server code is shared, only the data is pinned. Each version is its own OAuth resource
   (`/mcp/v0.1`, its own protected-resource metadata), so a token for one isn't accepted by
   another. Nothing is pinned yet (the manifest says 0.0.0): `/mcp/v0.1` answers 404 until the
   0.1.0 release commit pins it. Considered and rejected: reading the manifest from the release
   tag at build time (Vercel's shallow clones may lack the tag).
8. **Transport (§ 2).** `WebStandardStreamableHTTPServerTransport`, stateless (no session id),
   JSON responses; a new `createOwlkyServer({ manifest })` per request, the manifest parsed once
   per process. POST only (GET / DELETE: 405), CORS `*` without credentials (bearer only), bodies
   over 1 MB refused (413). Server info carries the manifest's version.
9. **Scopes.** One resource scope, `mcp`, required by `/mcp` (403 `insufficient_scope` without
   it); clients learn it from the 401 challenge and the metadata. An OAuth access token is
   accepted only while its consent exists: **Connected clients** on the account page disconnects
   a client at once (consent, access and refresh tokens deleted), not when the token expires
   (1 hour).
10. **Gating (§ 9, M3).** Only `/mcp` needs an account. Docs, code, Copy, previews, **Open HTML
    demo**, `llms.txt` and the Markdown pages stay public (e2e). `user.entitlements` (`text[]`,
    empty) is the column for later gating; nothing reads it yet. The marketing opt-in is a
    checkbox on the account page, unticked, stored with its date; sign-in asks for nothing beyond
    what the provider sends.
11. **Analytics (M3): deferred to M7.** Every privacy-friendly option needs a service the owner
    must enable (Vercel Web Analytics, Plausible…) or one we would build; none is added now.
12. **Local and test runs.** `src/server/env.ts` reads the configuration; on Vercel it requires
    `BETTER_AUTH_URL` (https), `BETTER_AUTH_SECRET` (≥ 32 characters, not the development one) and
    `DATABASE_URL`, and refuses the local switches (`OWLKY_OAUTH_MOCK`, `OWLKY_AUTH_RATE_LIMIT=off`).
    `scripts/mock-oauth.mjs` plays GitHub and Google (authorize page, code exchange, user API, an
    ID token); in mock mode the server sends its provider requests there. `serve:mock`, the unit
    tests, the e2e config and `smoke:mcp` use it; the smoke test replaces the removed
    `smoke:mcp` of `@owlky/mcp` in CI (website job, chromium). The process keeps one database and
    auth instance on `globalThis` (`Symbol.for("owlky.website.server")`): Next.js may load a module
    once per route bundle, and two PGlite instances would be two databases (website code; ADR-0007
    is about the packages).
13. **Health:** `GET /api/health` answers the database state and the MCP versions, nothing else.
14. **Legal:** draft privacy policy and terms at `/privacy/` and `/terms/` (marked draft,
    `noindex`, bracketed items for the owner) for L6.

### Security checklist (M2)

| Area | Check | Status |
|---|---|---|
| CSRF | Better Auth's origin check on every cookie-carrying non-GET request (trusted origin = `BETTER_AUTH_URL`), set explicitly on (Better Auth turns it off under `NODE_ENV=test`, so tests see production); JSON bodies only (no cross-site form posts); `callbackURL` limited to the site | done, unit tests (foreign origin 403, form body refused, foreign callback 403) |
| Cookies | `owlky.` prefix, `HttpOnly`, `SameSite=Lax`, `Secure` when the URL is https (`useSecureCookies`), session 30 days, extended daily | done, unit test (flags) |
| Clickjacking | `/sign-in/`, `/account/`, `/oauth/consent/`: `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `no-store`; the rest `SAMEORIGIN` (the demo sandbox is framed by the site) and `nosniff` | done (headers in `next.config.mjs`) |
| Token hashing | PATs: SHA-256 only, shown once; OAuth: access tokens are signed JWTs, refresh tokens and client secrets stored hashed (oauth-provider defaults `storeTokens` / `storeClientSecret: "hashed"`); signing keys encrypted with the secret; provider tokens not stored | done, unit test (row holds the hash, not the token) |
| Scopes | `mcp` required (403 `insufficient_scope`); PATs carry `mcp` only; consent page lists the scopes | done, unit test |
| OAuth 2.1 | PKCE required, S256 only (plain refused, missing verifier refused); audience = the resource; `azp` and `sub` required; consent required for registered clients; redirect URIs fixed at registration; disconnect revokes at once | done, unit tests and e2e |
| Bearer only | `/mcp` ignores session cookies (no ambient authority, so CORS `*` is safe) | done, unit test |
| Authorization | tokens and clients are scoped to the session's account (another account's id: 404) | done, unit tests |
| Account deletion | rows removed through `on delete cascade` (sessions, accounts, tokens, usage, consents, OAuth tokens); a deleted account's PAT or JWT is refused | done, unit tests and e2e |
| Rate limits | MCP 60 / min / account (Postgres); sign-in endpoints Better Auth defaults (memory) | done, unit test |
| Input limits | MCP body ≤ 1 MB, token names ≤ 60, ids ≤ 64 / 200 characters, zod schemas on every endpoint | done |
| Privacy | no IP or user agent stored, no telemetry (`telemetry.enabled: false`), no request bodies logged | done |
| Secrets | none in the repository; `.env.example` lists names only; development defaults refused on Vercel | done, unit test |
| Dependencies | versions ≥ 14 days old except the hono / esbuild security overrides; `pnpm audit`: no known vulnerabilities | done |
| Open for M7 | verify `Secure` cookies and the headers on the preview deploy; Neon connection over TLS (`sslmode=require` in its URL); rotate `BETTER_AUTH_SECRET` only with a re-login | owner, at deploy |

### What the owner provides (M6 / M7)
1. A **GitHub OAuth app** (Settings › Developer settings › OAuth Apps): homepage `https://owlky.com`,
   callback `https://owlky.com/api/auth/callback/github` (and one app or extra callback per
   preview URL if previews should sign in) → `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
2. A **Google OAuth client** (Google Cloud console › APIs & Services › Credentials, type Web
   application, consent screen with the app name, the privacy and terms URLs and the `openid`,
   `email`, `profile` scopes): redirect URI `https://owlky.com/api/auth/callback/google` →
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
3. A **Neon project** (Postgres 16 or later), pooled connection string with `sslmode=require` →
   `DATABASE_URL`; then run `pnpm --filter @owlky/website db:migrate` against it once (and after
   each schema change).
4. An **auth secret**: `openssl rand -base64 32` → `BETTER_AUTH_SECRET` (never the development
   value).
5. **Vercel project settings** (already listed in `apps/website/README.md`), plus the environment
   variables above and `BETTER_AUTH_URL=https://owlky.com` (the preview URL on previews).
6. The **operator name, address and contact email** for the privacy policy and terms, the
   governing law, and the L6 review of both drafts.
7. Optional: an analytics service choice (decision 11).
