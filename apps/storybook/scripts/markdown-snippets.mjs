// Writes the Markdown HTML snippets (packages/html/src/components/markdown/examples/*.html) from
// the same documents as the React stories (src/components/markdown/markdown-content.ts):
//   node apps/storybook/scripts/markdown-snippets.mjs
// The source element is a <pre>: its text is the Markdown, so `&` and `<` are escaped and the
// browser parses no tags inside it (without JavaScript the page shows the Markdown text).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
// Plain data: Node strips the types.
const { HTML_CONTENT, MARKDOWN_CONTENT } = await import(
  resolve(here, "../src/components/markdown/markdown-content.ts")
);
const out = resolve(root, "packages/html/src/components/markdown/examples");
mkdirSync(out, { recursive: true });

const escapeText = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One Markdown root; `attributes` as written on the root (React writes the same ones). */
const snippet = (attributes, source) =>
  `<div data-ok-markdown${attributes}>\n<pre data-ok-markdown-source>${escapeText(source)}</pre>\n</div>\n`;

writeFileSync(
  resolve(out, "markdown-html-content.html"),
  snippet(" data-ok-raw-html data-ok-external-links", HTML_CONTENT),
);
writeFileSync(
  resolve(out, "markdown-markdown-content.html"),
  snippet(" data-ok-external-links", MARKDOWN_CONTENT),
);
console.log("markdown: wrote 2 snippets");
