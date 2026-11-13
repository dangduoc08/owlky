---
"@owlky/html": minor
"@owlky/core": patch
---

The CDN `owlky.js` loads what a page uses. It now holds the runtime and the common components (45 kB gzip, down from 307 kB). The Chart, Data grid, date pickers, Gantt, Carousel and Lightbox, Motion, Organization chart, Upload, Walktour, Tree view, Sortable, Autocomplete, Transfer list, Editor, Map, Markdown, Code editor, Phone input and Illustrations are ES modules in `dist/modules/`, next to `owlky.js`: when the page holds one of them, `owlky.js` loads its module, and until then the markup works as it does without JavaScript. A page keeps one stylesheet and one script, also under a strict CSP with Trusted Types.

- `data-ok-preload="chart data-grid"` on the `owlky.js` script loads modules ahead of use, and `data-ok-modules` serves them from another folder.
- `Owlky.load(name)` and `Owlky.loaded(name)` (`runtime.load()` / `runtime.loaded()` in `@owlky/html`) load a module from JavaScript.
- A module that fails to load logs an error and dispatches `ok:runtime:error` on `document` (`detail`: `module`, `url`, `error`); the next `load()` or the browser coming back online tries again.
- `owlky-editor.js`, `owlky-map.js`, `owlky-markdown.js`, `owlky-phone.js`, `owlky-illustrations.js` and `owlky-code-editor.js` are now small scripts that only preload their module, so existing pages keep working. Host the whole `dist/` folder (`modules/`, `monaco/`, `owlky-map-worker.js`).
- The MCP server's `get_component` returns `imports`: the component's per-component entries, its stylesheets and its CDN module.
