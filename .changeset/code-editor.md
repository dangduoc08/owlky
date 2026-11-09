---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add the Code editor and the Diff editor, built on Monaco (ADR-0034): `CodeEditor`, `DiffEditor`, `useMonaco` and `loader` in React with `@monaco-editor/react`'s props (models per `path`, `value`, `language`, `theme`, `line`, `options`, `beforeMount`, `onMount`, `onChange`, `onValidate`, `keepCurrentModel`…), and the `code-editor` and `diff-editor` runtimes in HTML through `data-ok-*` options and `ok:code-editor:*` events. Monaco loads on demand from the `monaco-editor` package or from `@owlky/html/dist/monaco/` (self-hosted, never a third-party CDN), behind opt-in entries (`@owlky/core/code-editor`, `@owlky/html/code-editor`, `owlky-code-editor.js`). Light and dark Monaco themes are built from the tokens and follow `data-ok-theme`; a `<textarea>` keeps the value without JavaScript and when Monaco can't load.
