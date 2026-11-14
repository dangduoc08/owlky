# owlky.com (`@owlky/website`)

The Owlky docs website (ADR-0040) and the hosted MCP server with its accounts (ADR-0071): a
Next.js App Router app, built with Owlky itself, deployed to Vercel. The docs pages are
prerendered at build time; the account and MCP routes run on the server. Private: never published
to npm.

## Run it locally

```sh
pnpm install
pnpm build            # the website consumes the packages' dist
pnpm website:dev      # http://localhost:3000 (no search index in dev)
pnpm website:build    # production build in apps/website/.next (+ generated files in public/)
pnpm website:serve    # `next start` at http://localhost:4400 (PORT to change it)
pnpm --filter @owlky/website serve:mock   # the same with the mock GitHub / Google sign-in
```

Nothing needs configuring locally: without environment variables the server uses PGlite
(Postgres in WebAssembly, data in `.data/pglite`, `OWLKY_PGLITE_DIR=memory://` for none), a
development secret and no sign-in providers. `serve:mock` adds the mock OAuth providers
(`scripts/mock-oauth.mjs`: test people Ada Lovelace, Grace Hopper and Alan Turing). Every variable
is listed in [`.env.example`](.env.example); copy it to `.env.local` for `website:dev`.

Tests:

```sh
pnpm vitest run --project website                 # server code: accounts, tokens, OAuth, /mcp
pnpm --filter @owlky/website smoke:mcp            # HTTP smoke test of /mcp against the build
cd e2e && PORT=4400 npx playwright test -c website.config.ts --project chromium   # website e2e
```

## How it is built

- **Content.** Guides with live previews come from `apps/docs-content` (shared with Storybook).
  Website-only pages (Home, Get started) and the page registry are data in `src/content/`.
  The guide UI gets its code block (Shiki, highlighted at build time), prose (Owlky's `Markdown`,
  rendered at build time) and preview frame from `src/site/guide-host.tsx`.
- **Home page.** A landing page with its own header and footer (`src/site/landing/`); the docs
  pages share the `(docs)` route group's frame (`src/site/docs-shell.tsx`). It uses Owlky
  components only, with layout CSS in `landing.css` (tokens for every value). Counts it states
  (components, test files) come from `scripts/prepare.mjs`. The home page never uses `next/link`:
  Next.js would list the home page's chunk for every page that imports it.
- **Static pages, server routes.** Every page is `force-static` and prerendered. The server
  routes are `src/app/api/auth/[...all]` (Better Auth), `api/health`, `mcp` and `mcp/[version]`
  (the remote MCP server) and `.well-known/*` (OAuth discovery). Pages end with a slash; the
  automatic redirect is off so `/mcp` and the OAuth callbacks keep their exact paths, and
  `src/proxy.ts` adds the slash to page paths only. Builds use webpack (`next build --webpack`):
  Turbopack can't resolve the workspace's `.js` specifiers of TypeScript sources
  (`experimental.extensionAlias` maps them).
- **Server code** (`src/server/`, ADR-0071 implementation notes): `env.ts` (configuration),
  `schema.ts` + `drizzle/` (one Drizzle schema and its migrations), `db.ts` (node-postgres or
  PGlite), `auth.ts` (Better Auth: GitHub, Google, `jwt`, `@better-auth/mcp`),
  `account-plugin.ts` (the account endpoints under `/api/auth/owlky/*`), `tokens.ts` (personal
  access tokens), `clients.ts` (connected OAuth clients), `usage.ts` (rate limit and per-tool
  counts), `mcp-handler.ts` (Streamable HTTP, stateless), `manifests.ts` (latest and pinned
  versions), `metadata.ts` (discovery documents, health). The pages that use it are
  `src/app/(site)/` (sign-in, account, OAuth consent, the draft privacy policy and terms).
- **Packages from `dist`.** `@owlky/*` resolve through their `exports`, like any app.
  `optimizePackageImports` keeps the `@owlky/react` barrel from shipping every component.
- **Heavy opt-in entries.** Pages that need the Code editor, Map or Editor will load them with
  `next/dynamic` and `ssr: false` (Monaco self-hosted under `public/monaco/`, ADR-0034). The pilot
  pages need none.
- **Build steps.** `scripts/prepare.mjs` (before `next`): copies the CDN bundle to `public/cdn/`,
  writes the HTML sandbox pages (`public/sandbox/`, opened by **Open HTML demo**) and the subset of
  the MCP manifest the pages read (`src/generated/manifest.json`). `scripts/postbuild.mjs` (after
  `next build`): one `.md` per page, `llms.txt`, `llms-full.txt` and the Pagefind index
  (`public/pagefind/`, built from the prerendered HTML in `.next/server/app`). `public/` is
  entirely generated.
- **Pinned MCP versions.** On a release commit, `node apps/website/scripts/pin-manifest.mjs`
  writes `manifests/v<major>.<minor>.json.gz` from the current manifest; commit it. `/mcp/v0.1`
  then answers from that copy for good, while `/mcp` follows the latest manifest.

## Deployment (owner's one-time setup)

Deploys run from GitHub Actions with the Vercel CLI (`.github/workflows/website.yml`): a preview
for each pull request after CI passes, production after a release is published, or by hand
(**Actions › Website › Run workflow** redeploys the latest release). Until the secrets below exist,
the jobs end with a notice and CI stays green.

1. **Create the Vercel project.** Import `github.com/dangduoc08/owlky` in Vercel, then in
   **Settings › General** set **Root Directory** to `apps/website` and the framework to
   **Next.js** (`vercel.json` sets the framework and the install and build commands). In
   **Settings › Git**, keep Git deployments off: `vercel.json` already disables them
   (`git.deploymentEnabled: false`).
2. **Create a token.** Vercel **Account Settings › Tokens**, scoped to the team that owns the
   project.
3. **Find the IDs.** Run `npx vercel@65.2.0 link` in `apps/website` and read
   `.vercel/project.json` (`orgId`, `projectId`), or copy them from the project's settings. Don't
   commit `.vercel/`.
4. **Add the secrets.** GitHub **Settings › Environments › New environment** `website` (add
   required reviewers if you want to approve each deploy), then the environment secrets
   `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
5. **Add the domain.** In Vercel **Settings › Domains**, add `owlky.com` and `www.owlky.com`, and
   set `www.owlky.com` to redirect (308) to `owlky.com`. At the DNS provider, point the apex
   `owlky.com` to Vercel (`A 76.76.21.21`, or the record Vercel shows) and `www` to
   `cname.vercel-dns.com`.
6. **First production deploy.** It happens with the first `release/v*` tag (ADR-0012), or run the
   workflow by hand once a release tag exists.
7. **Accounts and the MCP server (ADR-0071).** Create the GitHub OAuth app (callback
   `https://owlky.com/api/auth/callback/github`), the Google OAuth client (redirect URI
   `https://owlky.com/api/auth/callback/google`), a Neon database and an auth secret
   (`openssl rand -base64 32`). In Vercel **Settings › Environment Variables**, set
   `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `GITHUB_CLIENT_ID`,
   `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (`.env.example` explains
   each). On Vercel the server refuses to start without them, and refuses the local switches.
8. **Migrate the database** before the first deploy and after each schema change:
   `DATABASE_URL=<Neon connection string> pnpm --filter @owlky/website db:migrate`.
9. **Check the preview** before production: sign in with both providers, create a token, connect
   an MCP client to `<preview URL>/mcp`, and confirm that `/llms.txt`, a `.md` page and search
   work (they are files written after `next build`).
