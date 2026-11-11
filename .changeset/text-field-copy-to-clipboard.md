---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Text field: copy to clipboard. Core `copyToClipboard(text, { document? })` copies plain text on a user gesture and never throws: it resolves `{ ok: true }` or `{ ok: false, reason }` (`"gesture"` outside a click or key press, `"unsupported"`, `"denied"`), falling back to the browser's copy command without the Clipboard API or after a refusal; `clipboardText(element)` reads a form value or an element's text. React: `useCopyToClipboard()` returns `{ copy(text), copiedText }`. HTML: a new `clipboard` runtime handles `[data-ok-clipboard-copy]` triggers (a button inside a text field copies its input; a value names another element; `data-ok-clipboard-text` gives literal text; `data-ok-clipboard-trigger="dblclick"` copies on a double click), shows the `<template>` toasts named by `data-ok-clipboard-toast` / `data-ok-clipboard-error-toast`, fires `ok:clipboard:copy` (`{ text, ok, reason? }`) and has a `copy()` method. Text field gets a "Copy to clipboard" story and docs section.
