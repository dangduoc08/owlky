---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add Markdown, built on unified (remark / rehype): GitHub Flavored Markdown (tables, task lists, strikethrough, autolinks, footnotes), optional raw HTML through an allow list (`rawHtml`, `sanitizeSchema`), safe URLs by default (`defaultUrlTransform`), element filters, `urlTransform`, `components`, remark and rehype plugins, external links and syntax highlighting with a lowlight-compatible `highlighter`. React gets `Markdown`, `MarkdownAsync` and `MarkdownHooks` with react-markdown's props. HTML renders the text of `pre[data-ok-markdown-source]` with DOM methods (strict CSP) and is opt-in: `@owlky/html/markdown` or `owlky-markdown.js` after `owlky.js`; `createMarkdown({ … })` adds plugins. The pipeline is `@owlky/core/markdown`. The Editor story's preview now renders the editor's HTML with Markdown.
