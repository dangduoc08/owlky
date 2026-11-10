---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Editor (ADR-0050): tables (`tables` / `data-ok-tables`: a toolbar table menu that inserts tables and edits rows, columns, header rows and columns, merged cells), mentions (`mentions={{ items(query) }}`; HTML: the list markup with a `<template data-ok-editor-mention-items>` or the `ok:editor:mentionsearch` event), a bubble menu over selected text (`bubbleMenu`, reached with Alt+F10), a form value (`name`: a hidden input with the HTML), and Tiptap's settings passed through: `extensions`, `editorProps`, `parseOptions` (HTML: `createEditor({ … })`), `autofocus`, `textDirection`, `enableInputRules`, `enablePasteRules` (`data-ok-autofocus`, `data-ok-text-direction`, `data-ok-enable-input-rules`, `data-ok-enable-paste-rules`). New stories: Bubble menu, Table, Mentions. Alt+F10 in the text now moves focus to the toolbar (or the bubble menu). New dependencies of `@owlky/core/editor`: `@tiptap/extension-table`, `@tiptap/extension-mention`, `@tiptap/suggestion` and `@floating-ui/dom`; `owlky-editor.js` grows to about 155 kB gzip.
