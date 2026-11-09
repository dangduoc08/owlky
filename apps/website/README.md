# owlky.com (`@owlky/website`)

The Owlky docs website (ADR-0040): a Next.js App Router app, built with Owlky itself, exported as
static files and deployed to Vercel. Private: never published to npm.

## Run it locally

```sh
pnpm install
pnpm build            # the website consumes the packages' dist
pnpm website:dev      # http://localhost:3000 (no search index in dev)
pnpm website:build    # static output in apps/website/out
pnpm website:serve    # serves out/ at http://localhost:4400 (PORT to change it)
```

E2E against the build: `pnpm --filter @owlky/e2e test:website` (or
`cd e2e && PORT=4400 npx playwright test -c website.config.ts --project chromium`).

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
- **Static only.** `output: "export"`, every route `force-static`, no route handlers or middleware.
  Builds use webpack (`next build --webpack`): Turbopack can't resolve the workspace's `.js`
  specifiers of TypeScript sources (`experimental.extensionAlias` maps them).
- **Packages from `dist`.** `@owlky/*` resolve through their `exports`, like any app.
  `optimizePackageImports` keeps the `@owlky/react` barrel from shipping every component.
- **Heavy opt-in entries.** Pages that need the Code editor, Map or Editor will load them with
  `next/dynamic` and `ssr: false` (Monaco self-hosted under `public/monaco/`, ADR-0034). The pilot
  pages need none.
- **Build steps.** `scripts/prepare.mjs` (before `next`): copies the CDN bundle to `public/cdn/`,
  writes the HTML sandbox pages (`public/sandbox/`, opened by **Open HTML demo**) and the subset of
  the MCP manifest the pages read (`src/generated/manifest.json`). `scripts/postbuild.mjs` (after
  `next build`): one `.md` per page, `llms.txt`, `llms-full.txt` and the Pagefind index
  (`out/pagefind/`).

## Deployment (owner's one-time setup)

Deploys run from GitHub Actions with the Vercel CLI (`.github/workflows/website.yml`): a preview
for each pull request after CI passes, production after a release is published, or by hand
(**Actions › Website › Run workflow** redeploys the latest release). Until the secrets below exist,
the jobs end with a notice and CI stays green.

1. **Create the Vercel project.** Import `github.com/dangduoc08/owlky` in Vercel, then in
   **Settings › General** set **Root Directory** to `apps/website` and leave the framework as
   **Other** (`vercel.json` sets the install and build commands and the `out` directory). In
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
