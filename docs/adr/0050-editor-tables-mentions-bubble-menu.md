# ADR-0050: Editor — tables, mentions, a bubble menu and Tiptap pass-through

**Status:** Accepted (2026-11-10; auto-approved under the owner's standing instruction to run the
approved plan). Extends ADR-0023.

## Context
Roadmap row 4.16 (with 4.18.34 / 4.18.35): the Editor keeps a fixed Tiptap extension set
(ADR-0023), so tables, mentions, a menu on the selection, custom extensions, editor settings and
form submission are missing. Tiptap ships tables and mentions as extensions
(`@tiptap/extension-table`, `@tiptap/extension-mention` with the `@tiptap/suggestion` utility)
and its bubble menu as `@tiptap/extension-bubble-menu` (Floating UI). ADR-0023 decided that new
editor features mean new extensions, React and HTML at once, and that the schema is the
sanitizer.

## Decision
1. **New dependencies of `@owlky/core`, editor entry only** (exact pins, 3.32.0 like the rest of
   Tiptap): `@tiptap/extension-table` (Table, TableRow, TableHeader, TableCell; the table logic is
   `prosemirror-tables`, already inside `@tiptap/pm`), `@tiptap/extension-mention` and
   `@tiptap/suggestion`. The suggestion utility declares `@floating-ui/dom` as a peer dependency
   and calls it only from its `mount` helper, which Owlky doesn't use (it only builds the
   `offset` / `flip` middleware when a suggestion starts): it becomes a pinned dependency (1.8.0,
   July 2026) so installs resolve it. `owlky-editor.js` aliases it to `src/floating-ui-stub.ts`
   (placeholders for the middleware, an error if anything positions with it), like the Monaco
   stub of ADR-0034, which saves about 6 kB gzip; npm consumers bundle the real package.
   They are reached only through `@owlky/core/editor`, `@owlky/html/editor` and `owlky-editor.js`;
   `owlky.js` and `@owlky/core` stay free of them (`check-size` budgets).
2. **Tables and mentions are opt-in.** `tables` (`data-ok-tables`) adds the table nodes and a
   toolbar menu (insert, rows, columns, header row and column, merge, split, delete); `mentions`
   (React: an `items(query)` callback; HTML: a `<template data-ok-editor-mention-items>` list or
   the `ok:editor:mentionsearch` event) adds the mention node and its suggestion list. Without
   them the schema, and so what content survives, is exactly the ADR-0023 set.
3. **Schema and sanitizer impact.** With `tables`: `table`, `tbody`, `tr`, `th`, `td` with
   `colspan`, `rowspan`, `colwidth` and cell alignment (written as `style="text-align: …"`);
   Tiptap writes a `colgroup` and a `min-width` style on the table (column resizing stays off:
   it adds handles and inline widths). With `mentions`: an inline atom
   `span[data-type="mention"][data-id][data-label]` (+ `data-mention-suggestion-char`), labelled
   with plain text, marked `data-ok-editor-mention` for its style. No other markup is accepted;
   ids and labels are text, never markup or URLs.
4. **The bubble menu is Owlky's own**, not `@tiptap/extension-bubble-menu`: core
   `createEditorBubbleMenu` opens a Popover (the popover controller, top layer) on a virtual
   anchor from the selection (`posToDOMRect`), with Tiptap's default `shouldShow` (a non-empty
   text selection in an editable, focused editor), `placement` and `updateDelay` (250 ms). Its
   buttons are toolbar actions in a `role="toolbar"` with roving focus. Keyboard: **Alt+F10** in
   the text moves focus to the bubble menu when it shows, else to the main toolbar (the
   convention of TinyMCE and CKEditor); Escape goes back to the text with the selection kept.
   Presses on the menu don't take focus from the text, so the selection stays.
5. **Mention list** = an Autocomplete-style listbox in a Popover anchored to the suggestion's
   rectangle; focus stays in the text, which carries `aria-controls`, `aria-expanded` and
   `aria-activedescendant` while the list is open. ArrowUp / ArrowDown move, Enter / Tab pick,
   Escape closes. Core renders the options with DOM methods into the owner's listbox, for both
   implementations.
6. **Pass-through** (Tiptap editor settings): `extensions` (appended; one with the name of a
   built-in replaces it), `editorProps` (merged; Owlky's own attributes win), `parseOptions`,
   `autofocus`, `textDirection`, `enableInputRules`, `enablePasteRules`. Scalars are options
   (`data-ok-autofocus`, `data-ok-text-direction`, `data-ok-enable-input-rules`,
   `data-ok-enable-paste-rules`); objects and functions are `createEditor({ … })` options in
   HTML. Extensions are trusted code: they may widen the schema, and what they accept is theirs
   to sanitize.
7. **Form value.** `name` writes a hidden `input[data-ok-editor-input]` holding the HTML value
   (`""` when empty), updated on every change, so the editor submits with its form.

## Consequences
- `owlky-editor.js` grows from 130.8 to 155.1 kB gzip (tables about 13 kB, mentions about 4 kB,
  the bubble menu, the mention list and the popover controller the rest); its budget goes from
  135 to 163 kB. The schema grows only for pages that turn tables or mentions on.
- A Tiptap upgrade must check that Suggestion still positions only through `mount` (the stub
  throws otherwise, visibly).
- Not done: Tiptap's `FloatingMenu`, `@tiptap/react` (`useEditor`, `EditorContent`,
  `useCurrentEditor`), column resizing, several mention triggers in one editor (`suggestions`),
  custom mention item rendering. HTML reaches the Tiptap editor through `instance.controller.editor`.
