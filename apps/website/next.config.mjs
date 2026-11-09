// owlky.com (ADR-0040): every route is static (`output: "export"` refuses server features), so
// the build is a folder of files that any host can serve. Vercel serves it in production.

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  // `/components/button/` → `out/components/button/index.html`: plain folders on any static host.
  trailingSlash: true,
  // The guides are TypeScript sources in a private workspace package; `@owlky/*` packages are
  // consumed from their `dist`, like any app would (no `src` aliases).
  transpilePackages: ["@owlky/docs-content"],
  // Types are checked by `pnpm typecheck` (TypeScript 7, `tsc`), not by `next build`.
  typescript: { ignoreBuildErrors: true },
  // The workspace imports TypeScript sources with `.js` specifiers (NodeNext style). Turbopack
  // can't map them to `.ts` / `.tsx`, so the website builds with webpack (`--webpack`).
  experimental: {
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
    // `@owlky/react` is one barrel of client modules: without this, a page that imports Button
    // ships every component (and the opt-in engines reached through them).
    optimizePackageImports: ["@owlky/react", "@owlky/core"],
  },
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
