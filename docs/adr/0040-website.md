# ADR-0040: Website — a Next.js app in the monorepo, docs content shared with Storybook, deployed to Vercel

**Status:** Accepted (2026-11-09)

## Context
The docs live in Storybook: 59 usage guide pages (`*-docs.tsx`, about 15,000 lines) built with
`GuideDocs`, `Markdown`, live previews and HTML | React code tabs. The owner wants a public
website at **owlky.com** (home, docs, later blocks), with CI/CD on **Vercel**. This repository
becomes public; premium blocks will live in a separate private repository (decided later, its own
ADR). Storybook stays: e2e, parity, options parity, visual and a11y tests read its `index.json`.

## Decision
1. **`apps/website`**: a Next.js (App Router) app in this monorepo, next to `apps/storybook`. Docs
   change in the same pull request as the code they describe.
2. **One source of docs content: `apps/docs-content`** (private workspace package, never
   published). Guides, demos (React examples and HTML snippets) and the guide UI (`GuideDocs`,
   `OptionsTable`, `PropsTable`, `KeyboardTable`, code tabs) move there. The UI takes its code
   block and preview frame from a provider, so it has no Storybook import: Storybook passes its
   `Source` block, the website a Shiki block with a Copy button. `pnpm check:docs` checks this
   package.
3. **Storybook stays** as the workshop and the test bed; its docs pages render `docs-content`.
4. **The website uses the built packages** (`dist`, through `exports`), never `src` aliases like
   Storybook. It is a consumer like any other: it exercises `exports`, `"use client"` boundaries
   and server rendering in Next.js.
5. **Built with Owlky**: components, tokens, the Tailwind theme, and the theme settings (`mode`,
   preset, font) through `applyThemeSettings`.
6. **Static by default**: every route is statically generated (`force-static`); no server
   runtime, API routes or middleware in this app, so it stays portable. Server features of the
   premium side live in its own service.
7. **Live previews are React** in the page; the HTML tab shows the snippet. **Open HTML demo**
   opens a static sandbox page (iframe) that loads the CDN bundle, so two runtimes never share a
   page.
8. **Heavy opt-in entries** (Monaco, MapLibre, Tiptap) load with `next/dynamic` on the pages that
   need them. Monaco is self-hosted under `public/monaco/` (ADR-0034: never from a CDN).
9. **Search: Pagefind** (static index built after `next build`). Algolia DocSearch may replace it
   later.
10. **CI/CD on Vercel through GitHub Actions and the Vercel CLI** (`vercel pull` → `vercel build`
    → `vercel deploy --prebuilt`); Vercel's own Git deployments are off (`vercel.json`
    `git.deploymentEnabled: false`):
    - **Preview** for each pull request after `ci.yml` passes; the URL is posted on the PR.
      Pull requests from forks get none (no secrets).
    - **Production** from the `release/v*` tag, after `release.yml` has published to npm (ADR-0012),
      so owlky.com always documents the version on npm. A manual `workflow_dispatch` redeploys the
      latest release (docs-only fixes).
    - Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, in a protected `website`
      environment. Domain `owlky.com` on Vercel, `www.owlky.com` redirects to it.
11. **Tests**: the website joins e2e (axe in light and dark, phone width, broken internal links,
    every guide page renders), run against `next build` output.

## Information architecture
Home · Get started (CDN, npm with HTML, React, Tailwind) · Foundations · Components (overview,
one demo per reference section, Options, Keyboard, Accessibility) · Theming · Blocks (free first)
· Changelog · GitHub.

## Phases (one review each)
1. **Skeleton + pilot pages**: `apps/website`, `apps/docs-content` holding only what two pilot
   pages need (Foundations › Colors, Components › Button), Storybook renders those two from
   `docs-content`, the Vercel workflows, the domain.
2. **Migrate the guides** in batches (Foundations, then components by roadmap wave); Storybook's
   `*-docs.tsx` become thin wrappers, then disappear.
3. **Home, search, changelog, free blocks** (the blocks tier gets its own ADR).

## Consequences
- Docs are written once; the only per-host code is the code block and the preview frame.
- A docs fix reaches owlky.com only with a release or a manual redeploy, never from `main`.
- The website build needs `pnpm build` first (dist), like typecheck and tests.
- Next.js becomes a dev dependency of the workspace (release-age rule: versions ≥ 14 days).
- The owner provides: the Vercel project and token, DNS for owlky.com.
