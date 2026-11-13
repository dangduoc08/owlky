import { CDN, type GuideSection } from "@owlky/docs-content/guide/text";
import type { SitePage } from "./types.js";

/*
 * Sandbox pages (ADR-0040 decision 7): each HTML example that is plain markup gets a static page
 * that loads the CDN bundle, built by scripts/prepare.mjs. **Open HTML demo** shows it in an
 * iframe, so the HTML runtime and React never share a page.
 */

const LOCAL_CDN = "/cdn";

/** Plain markup with components: no module scripts, CSS-only snippets or document fragments. */
export const hasSandbox = (section: GuideSection): boolean =>
  section.html !== undefined &&
  /data-ok-/.test(section.html) &&
  !/<script|@import|<\/?html|<!doctype/i.test(section.html);

/** URL of a section's sandbox page. */
export const sandboxUrl = (page: SitePage, section: GuideSection) =>
  `/sandbox${page.path}${section.id}.html`;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Applies the website's theme settings, passed in the query string, before the first paint. Only
// known values are written (an allowlist), so the query can't inject anything.
const THEME_SCRIPT = `(function () {
  var q = new URLSearchParams(location.search), d = document.documentElement;
  var allow = ${JSON.stringify({ theme: ["light", "dark", "system"] })};
  var attr = { theme: "data-ok-theme" };
  for (var key in allow) { var v = q.get(key); if (allow[key].indexOf(v) !== -1) d.setAttribute(attr[key], v); }
})();`;

export function sandboxDocument(page: SitePage, section: GuideSection): string {
  const markup = (section.html ?? "")
    // The page loads the stylesheet itself (the local build: the CDN copy isn't published yet).
    .replace(/^\s*<!-- Load once per page -->\n/m, "")
    .replace(new RegExp(`^\\s*<link rel="stylesheet" href="${CDN}/owlky.css">\\n*`, "m"), "")
    .replaceAll(CDN, LOCAL_CDN)
    .trim();
  const indented = markup.replace(/^/gm, "      ");
  return `<!doctype html>
<html lang="en" data-ok-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${escapeHtml(`${section.title} · ${page.title} · HTML demo`)}</title>
    <script>${THEME_SCRIPT}</script>
    <link rel="stylesheet" href="${LOCAL_CDN}/owlky.css">
    <link rel="stylesheet" href="${LOCAL_CDN}/base.css">
    <script src="${LOCAL_CDN}/owlky.js" defer></script>
    <style>
      body { padding: 24px; }
      main { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
    </style>
  </head>
  <body>
    <main>
${indented}
    </main>
  </body>
</html>
`;
}

/** Every sandbox page of the site: path under public/sandbox/ and its document. */
export function sandboxPages(pages: readonly SitePage[]) {
  return pages.flatMap((page) =>
    (page.guide?.sections ?? []).filter(hasSandbox).map((section) => ({
      file: sandboxUrl(page, section).replace(/^\/sandbox\//, ""),
      html: sandboxDocument(page, section),
    })),
  );
}
