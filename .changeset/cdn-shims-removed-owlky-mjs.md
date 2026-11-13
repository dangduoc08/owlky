---
"@owlky/html": minor
---

The separate opt-in scripts are removed: `owlky-editor.js`, `owlky-map.js`, `owlky-markdown.js`, `owlky-phone.js`, `owlky-illustrations.js` and `owlky-code-editor.js`. `owlky.js` loads the Editor, Map, Markdown, Phone input, Illustrations and Code editor by itself when the page holds one, from `dist/modules/`.

**Migration:** delete the `<script>` tags of those files. To load one of these components before it appears, add its module name to `data-ok-preload` on the `owlky.js` script, for example `data-ok-preload="editor map"`. Move a `data-ok-monaco-path` attribute from `owlky-code-editor.js` to the `owlky.js` script. With npm, nothing changes: keep importing `@owlky/html/editor`, `@owlky/html/map` and the other entries.

`owlky.mjs` is new: the same script as an ES module, for pages that load `<script type="module">`. It takes the same `data-ok-preload` and `data-ok-modules` attributes and loads the same modules.
