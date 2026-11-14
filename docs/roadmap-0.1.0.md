# Road to 0.1.0

Owner's review 2026-11-12. Order: bundle size and clean IP in parallel (they touch different
areas), then the design styles (they replace L4), then accounts and the remote MCP at
owlky.com/mcp (every earlier track changes what the manifest describes), then the release.

| Track | Form | Where |
|---|---|---|
| 1. Bundle size | own roadmap (S1–S6) | [`roadmap-size.md`](roadmap-size.md) |
| 2. Clean IP and own identity | short roadmap + one ADR (below) | this file, part 2 |
| 2b. Design styles (replace L4) | own roadmap (ST1–ST7) | [`roadmap-styles.md`](roadmap-styles.md) |
| 3. Accounts and remote MCP | roadmap + one ADR (below) | this file, part 3 |
| 4. Publish 0.1.0 | checklist (below) | this file, part 4 |

Open decision for the owner: publish 0.1.0 before website phase 2, or together with it
(`roadmap.md` step 7 says "together with the website" today).

## Part 2 — Clean IP and own identity

Goal: everything Owlky ships is either written by us or used under a license whose terms we meet
and record, with a visual identity of its own rather than a close copy of the reference kit. The
reference sites stay a source of behavior and API names only. A lawyer reviews the conclusions
before 0.1.0; this track prepares everything they need.

| # | Step | Scope | Done when | Status |
|---|---|---|---|---|
| L1 | Inventory | every external input per package and app: runtime and dev dependencies (license, copyright, notice duty), copied or adapted code and CSS, icons, illustrations, images, fonts, demo content (names, texts, data sets, map data), token values (palette, shadows, radii, type scale), layouts and page structures taken from the reference kits (Minimals, MUI, MUI X, ApexCharts family, Sonner, Framer Motion…) | a table in `docs/legal/inventory.md`: item, source, license, how it is used | ⬜ |
| L2 | Assessment | classify each row: own work · permissive (MIT / BSD / Apache / ISC / CC BY: attribution) · needs permission · must not ship (no license, commercial-only, look and feel copied closely) | every row classified with the reason; the "must not ship" list is the L4 work list | ⬜ |
| L3 | Identity ADR | Owlky's own visual identity: palette and brand colors, type pairing (fonts with open licenses), radius / shadow / spacing character, iconography, illustration style (already original, ADR-0041), component details that read as the reference kit's signature; how presets and themes keep working; contrast rules (ADR-0014) restated | ADR accepted by the owner, with a token diff | ⬜ |
| L4 | Replace (superseded 2026-11-12: colors, fonts and the look move to the design styles, `roadmap-styles.md`; demo content and naming stay here, done by L4a) | apply the identity (tokens, component CSS where it hard-codes the reference look), replace every "must not ship" item with original work (demo content, sample data, images, layouts), rename anything that copies the reference's naming where it isn't an API name we keep on purpose (ADR-0015 maps upstream API names, which is fine) | the L1 table has no "must not ship" row; parity and a11y green; new visual baselines | ⬜ |
| L5 | Notices | `LICENSE` (MIT) per package, `THIRD_PARTY_NOTICES` with every attribution the licenses require (Solar icons CC BY 4.0, MapLibre, Tiptap, Monaco, libphonenumber-js metadata (Apache-2.0), unified, fonts…), the "inspired by, not affiliated with" statements, docs and website footer wording, package `license` / `author` fields | a check script that fails when a shipped dependency has no notice entry | ⬜ |
| L6 | Review | the owner and a lawyer review L1–L5; trademark check of the name "Owlky" and the logo | sign-off recorded | ⬜ |

## Part 3 — Accounts and the remote MCP at owlky.com/mcp

Owner's direction (2026-11-12): hosting option A (the website leaves `output: "export"`; pages stay
static, server routes are added); the local Node MCP (`@owlky/mcp` through `npx`, ADR-0046) is
removed; the website asks users to sign in with GitHub or Google (OAuth) to use the MCP, and later
to get templates and blocks (website phase 3, then premium); the docs stay open to everyone (code
samples, Copy, previews), for adoption and search; installing the npm packages needs no account
(free tier). Purpose of the accounts: know who really uses Owlky, to market premium later, with
opt-in consent for marketing email. Runs after
tracks 1, 2 and 2b (they change what the manifest describes) and needs the owner's accounts (part 4). Its decisions are discussed now.

Note: the packages are MIT and the repository is public, so the sign-in is an access and
registration flow for the hosted MCP and future templates, not a protection of the code itself.
Docs traffic is measured without accounts (privacy-friendly analytics, npm downloads, GitHub stars).

| # | Step | Scope | Done when | Status |
|---|---|---|---|---|
| M0 | Remove the local MCP | stop publishing `@owlky/mcp` (stdio CLI, `npx -y @owlky/mcp`, `smoke:mcp`, its README and release entries, the `owlky` entry in `.mcp.json`, docs mentions); keep the shared code the remote server needs (manifest generation `scripts/manifest.mjs`, `createOwlkyServer`, search, validate) as a private workspace package or inside the website; ADR-0046 superseded by the new ADR | no published or documented local MCP; `check:manifest` still guards the data | ✅ 2026-11-13: private `@owlky/mcp-server` in `packages/mcp` (no CLI, bin, README or `smoke:mcp`; ADR-0071 § 1) |
| M1 | ADR (accounts and remote MCP) — **accepted 2026-11-12: [ADR-0071](adr/0071-accounts-and-remote-mcp.md)** (Better Auth, Neon + Drizzle, tokens hashed, 60 calls / min in Postgres, Vercel free plan until premium) | hosting A on Vercel; identity: GitHub and Google OAuth through one auth library (Auth.js or Better Auth), sessions, a database for users and tokens (for example Neon / Vercel Postgres); MCP authorization per the MCP spec: OAuth 2.1 with PKCE, protected-resource metadata (RFC 9728) and dynamic client registration so Claude Code, Cursor and VS Code sign in through the browser, plus personal access tokens from the account page for clients without OAuth; transport Streamable HTTP, stateless; rate limits per account; versioning (`/mcp` latest, `/mcp/v0.1` pinned); privacy (no prompt logging, no telemetry, a privacy policy and terms); room for a later paid tier (entitlements per account) | ADR accepted by the owner | ⬜ |
| M2 | Accounts | sign-in with GitHub and Google, sign-out, an account page (tokens: create, list, revoke), account deletion; security review (CSRF, cookie flags, token hashing, scopes) | e2e for the flows with mocked providers; security checklist done | ⬜ |
| M3 | Account-gated features | the website gates only the MCP now (and leaves room for templates and blocks in website phase 3 and premium later: an entitlement per account); docs, code samples, Copy and **Open HTML demo** stay public; sign-up asks for the minimum (name, email) with an unticked opt-in for product and marketing email; privacy-friendly analytics for docs traffic | e2e: guests read docs and copy code; MCP and gated routes require a session; consent stored per account | ⬜ |
| M4 | Remote MCP server | `app/mcp/route.ts` with the shared server and an HTTP transport, the OAuth resource-server checks and token checks, rate limits, health check, version in server info; the same tools, resources and prompts as before | unit tests for transport and auth; an HTTP smoke test | ⬜ |
| M5 | Data audit | the manifest checked against the code after tracks 1–2 (per-component import paths, React and HTML examples, user-facing descriptions); `validate_markup` with no false positives on every snippet | report with zero blocking gaps | ⬜ |
| M6 | Clients and evaluation | sign in and connect by URL from Claude Code, Claude Desktop, Cursor and VS Code; a small eval (an agent builds pages in HTML and React with the MCP; output passes `validate_markup`, typecheck, no console errors, axe) | setup verified per client; eval results recorded | ⬜ |
| M7 | Deploy and docs | preview deploy first, then owlky.com; a "Use Owlky with AI" page (sign in, connect, tokens, privacy, versioning) | live endpoint answering signed-in clients; docs reviewed with the owner | ⬜ |

## Part 4 — Publish 0.1.0 (checklist)

Owner (accounts and money):
- [ ] GitHub OAuth app and Google OAuth client (callback URLs for preview and owlky.com); a database for accounts (for example Neon / Vercel Postgres); the auth secret
- [ ] Privacy policy and terms of use (accounts, OAuth data, MCP usage)
- [ ] npm org `@owlky`; npm trusted publishing for `dangduoc08/owlky` (or an `NPM_TOKEN` secret)
- [ ] Vercel project (root `apps/website`), token, the `website` GitHub environment with `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] DNS for owlky.com (`www` redirects to the apex)

Engineering:
- [ ] Tracks 1, 2, 2b and 3 done (size budgets met; IP sign-off; `/mcp` live on the preview deploy)
- [ ] Visual baselines regenerated in Docker after the identity change (`pnpm test:visual:update`)
- [ ] Every changeset is `minor` or `patch` (a `major` would version 0.0.0 as 1.0.0); `pnpm changeset version` previews 0.1.0 for every package (fixed versioning)
- [ ] READMEs, docs and the website say what 0.1.0 is (and is not yet: more frameworks)
- [ ] `pnpm check`, the three unit engines and the full e2e green on CI for the release commit
- [ ] The HTTP smoke test of `/mcp` on the preview deploy, and a packed-tarball install test (`pnpm pack` → install in a sample React app and a plain HTML page)
- [ ] Tag `release/v0.1.0` on that `main` commit (ADR-0012), then verify the packages on npm and the CDN URLs
