// owlky.com (ADR-0040, ADR-0071 § 2): the docs pages stay statically rendered at build time; the
// server routes (accounts under /api/auth, the remote MCP at /mcp, OAuth metadata under
// /.well-known) run on demand. The server code uses web-standard Request / Response handlers and
// a standard Postgres driver, so any Node host can run `next start`; Vercel serves it in
// production.

/** @type {import("next").NextConfig} */
const nextConfig = {
  // `/components/button/`: pages end with a slash, as before. The automatic redirect is off so
  // `/mcp` and `/api/auth/callback/github` aren't redirected (clients POST to them); pages get
  // the redirect from src/proxy.ts instead (`redirects()` sees paths without their slash).
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // The HTML demo sandbox is framed by the site itself.
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    // Pages that act for a signed-in person are never framed (clickjacking on consent).
    const deny = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "Cache-Control", value: "no-store" },
    ];
    return [
      { source: "/:path*", headers: base },
      ...["/sign-in/", "/account/", "/oauth/consent/"].map((source) => ({ source, headers: deny })),
    ];
  },
  // The guides are TypeScript sources in a private workspace package; `@owlky/*` packages are
  // consumed from their `dist`, like any app would (no `src` aliases).
  transpilePackages: ["@owlky/docs-content"],
  // Loaded by Node at run time, not bundled: PGlite ships WebAssembly, pg optional native
  // bindings, and the MCP server reads its manifest next to its own files.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "@owlky/mcp-server"],
  // Files the server functions read at run time (Vercel's tracing copies them).
  outputFileTracingIncludes: {
    "/mcp": [
      "./manifests/**",
      "../../packages/mcp/manifest.json",
      "./node_modules/@owlky/mcp-server/manifest.json",
    ],
    "/mcp/[version]": [
      "./manifests/**",
      "../../packages/mcp/manifest.json",
      "./node_modules/@owlky/mcp-server/manifest.json",
    ],
    "/api/health": [
      "./manifests/**",
      "../../packages/mcp/manifest.json",
      "./node_modules/@owlky/mcp-server/manifest.json",
    ],
  },
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
  // `OWLKY_SOURCE_MAPS=1 pnpm build`: browser source maps, to see which modules a chunk holds
  // when `check:js` (scripts/check-js.mjs) reports a heavier page. Never on deploys.
  productionBrowserSourceMaps: process.env.OWLKY_SOURCE_MAPS === "1",
  reactStrictMode: true,
};

export default nextConfig;
