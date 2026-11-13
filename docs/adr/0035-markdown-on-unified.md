# ADR-0035: Markdown — unified (remark / rehype) behind opt-in entries, safe by default

**Status:** Accepted (2026-11-09, auto-approved in `/component`; the owner chose "build from
unified").

**Note (2026-11-13, ADR-0068 S6):** `owlky-markdown.js` was removed before 0.1.0. On a CDN page, `owlky.js` loads this component from its lazy module (`modules/markdown.js`) when the page holds one; the text below keeps the original decision.

## Context
The reference's "Markdown" page renders a Markdown document and an HTML document with
react-markdown (MIT): GitHub Flavored Markdown (tables, task lists, strikethrough), highlighted
code, raw HTML, images, links and quotes. react-markdown is a thin React layer over unified
(remark-parse, remark-rehype, rehype plugins), which is framework-free: the same pipeline can
feed the HTML runtime. A CommonMark + GFM parser and an HTML parser for raw HTML can't be written
again. Markdown is untrusted input in most apps, so the component must be safe by default (XSS
through `javascript:` URLs, raw HTML, event handler attributes) and work under the strict CSP
(no HTML strings, no `style` attribute strings).

## Decision
1. **Runtime dependencies of `@owlky/core`, pinned exactly (MIT, ≥ 14 days old):** `unified`
   11.0.5, `remark-parse` 11.0.0, `remark-gfm` 4.0.1, `remark-rehype` 11.1.2, `rehype-raw` 7.0.0,
   `hast-util-sanitize` 5.0.2, `property-information` 7.2.0, `html-url-attributes` 3.0.1 and
   `@types/hast` 3.0.5 (public types). Young transitive releases are held back with scoped
   `overrides` (removal date noted). react-markdown itself is not used: its React layer is
   rewritten (no source copied) so that React and HTML share one pipeline.
2. **One pipeline in core** (`@owlky/core/markdown`, not re-exported from `@owlky/core`):
   `markdownTree(source, options)` / `markdownTreeAsync` return a hast tree after Owlky's last
   step (react-markdown's post-processing: raw HTML as text or dropped, element filters,
   `urlTransform`, table alignment as `text-align`, plus external links, highlighting and task
   list labels). `markdownElementAttributes` / `markdownElementStyle` are the only attribute and
   style serializers, so React (`createElement`) and HTML (`createElement`, `setAttribute`, CSSOM)
   write the same DOM.
3. **Safe by default.** `defaultUrlTransform` keeps relative URLs and `http(s)`, `mailto`,
   `irc(s)`, `xmpp` (react-markdown's list); other URLs are removed. Raw HTML shows as text
   unless `rawHtml`, which parses it (rehype-raw) and sanitizes it with an allow list
   (hast-util-sanitize's GitHub schema plus `u`, `mark` and `style` narrowed to `text-align` /
   `text-transform`). Whatever the options and plugins, both renderers drop `script`, `style`,
   frames, `object`, `embed`, `base`, `link`, `meta`, `template`, `noscript`, `on*` attributes,
   `srcdoc` and invalid attribute names; styles never become attribute strings. Plugins, custom
   `urlTransform`, `sanitizeSchema` and React `components` are trusted consumer code (documented).
4. **Options beyond react-markdown** (ADR-0015, HTML can't pass plugins through attributes):
   `gfm` (default on: the reference renders GFM), `rawHtml`, `externalLinks`, `sanitizeSchema`,
   `highlighter` (lowlight-compatible, as the Editor: no grammar bundled, ADR-0023).
5. **Opt-in entries.** `@owlky/html/markdown` and `owlky-markdown.js` (IIFE loaded after
   `owlky.js`) register the `markdown` definition; it is not in `components` (`OPT_IN`), so
   `owlky.js` and `@owlky/html/auto` stay free of unified. `createMarkdown({ … })` takes the
   JavaScript-only options (plugins, `allowElement`, `urlTransform`, `sanitizeSchema`,
   `highlighter`, `async`). React's `Markdown` is tree-shaken when unused.
6. **HTML source.** The Markdown is the text of a `pre[data-ok-markdown-source]` (escaped `&` and
   `<`): without JavaScript the page shows the Markdown text; the runtime renders before it and
   hides it. No `<script type="text/markdown">` (snippets carry no scripts) and no `<template>`
   (its content is parsed as HTML).

## Consequences
- `owlky-markdown.js` is about 100 kB gzip (micromark, GFM, parse5 for raw HTML, the sanitizer);
  it gets its own size budget. Pages that don't use Markdown never load it.
- The unified ecosystem's plugins (math, slugs, directives…) work in both implementations.
- Raw HTML is never trusted: content that needs more elements extends `markdownSanitizeSchema`.
