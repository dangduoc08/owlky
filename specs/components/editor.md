# Editor

Reference: Minimal UI kit "Editor" page (one demo: the editor, a "Full item" switch and a
preview), content only. Upstream: Tiptap 3 (ADR-0023), the Minimals `Editor` wrapper's props
(ADR-0015). Created with `/component`; updated with `/component` (2026-11-09: text transform mark,
fullscreen Backdrop with scroll lock and Tab containment, heading menu typography, language menu rule;
2026-11-10, Phase 4 row 4.16 with 4.18.34–35, ADR-0050: tables, mentions, a bubble menu, Tiptap
`extensions` / `editorProps` / `parseOptions` pass-through, `autofocus`, `textDirection`, input and
paste rules, a form `name`; row 4.18.33: Tiptap events, editor access, `getJSON` / `getText`, content check).
Reference URL: https://minimals.cc/components/extra/editor
HTML source: built from Tiptap

## Purpose
Rich text editing: headings, marks, lists, alignment, code, quotes, links and images, with
HTML in and out. Tiptap (framework-free) runs in core `createEditorController`
(`@owlky/core/editor`), shared by React and the HTML runtime; the toolbar is Owlky markup.

## Anatomy
```
div[data-ok-editor][data-ok-full-item]?[data-ok-error]?[data-ok-editable="false"]?[data-ok-fullscreen]?[data-ok-placeholder]?
  div[data-ok-backdrop][data-ok-open]?                              (Backdrop, composed; open while fullscreen; optional in HTML)
  div[data-ok-editor-toolbar][role=toolbar][aria-label="Formatting"][aria-controls=<content id>]
    button[data-ok-editor-heading][aria-haspopup=menu][aria-expanded][aria-controls=<menu id>]   (HTML: data-ok-popover-open)
      span[data-ok-editor-heading-label] ("Paragraph", "Heading 1" … "Heading 6") + svg
    div[data-ok-editor-group][data-ok-full]?                       (9 groups; data-ok-full = only with fullItem)
      button[data-ok-editor-action=<action>][aria-label][aria-keyshortcuts]?[aria-pressed]?[disabled]?
        svg[aria-hidden]                                           (fullscreen: svg[data-ok-editor-icon=enter|exit])
  div[data-ok-editor-body]                                         (scrolls; grey 8% tint)
    div[data-ok-editor-content][id][role=textbox][aria-multiline=true][aria-label|aria-labelledby][aria-describedby]?[aria-invalid]?
      …content (Tiptap: contenteditable, class "tiptap ProseMirror", translate=no, aria-readonly when read only)
      div[data-ok-editor-code-block] › select[data-ok-editor-language][aria-label=Language]? + pre › code.language-<x>
        (select: "auto" (value ""), a disabled "—" rule, then the highlighter's languages)
      span[style="text-transform: uppercase|lowercase|capitalize"]  (text transform mark; input also data-ok-text-transform)
  p[data-ok-editor-helper][id]?
  Menu: div[data-ok-popover][data-ok-paper][id] › ul[data-ok-menu][role=menu][aria-labelledby=<heading>] › li[data-ok-menu-item][data-ok-editor-block=paragraph|h1…h6][data-ok-selected]?
        (each item in its block's type: Paragraph body2, Heading 1 17px … Heading 6 12px, bold)
  Popover (link): div[data-ok-popover][data-ok-paper][role=dialog][aria-labelledby] › form[data-ok-editor-form=link][novalidate]
    › p[data-ok-editor-form-title] + div[data-ok-editor-form-row] › TextField (input[data-ok-editor-field=href]) + Button[type=submit]
  Popover (image): same › form[data-ok-editor-form=image] › title + TextField (src) + TextField (alt) + Button[type=submit]
  -- ADR-0050 --
  (toolbar, with tables) div[data-ok-editor-group] › button[data-ok-editor-action=table][aria-label=Table][aria-haspopup=menu][aria-expanded][aria-controls=<table menu>]
                                                    (before the fullscreen group; HTML: data-ok-popover-open)
  Menu (tables): div[data-ok-popover][data-ok-paper][id] › ul[data-ok-menu][role=menu][aria-labelledby=<table button>]
    › li[data-ok-menu-item][data-ok-editor-table-action=<action>][aria-disabled]?   (12 items, editorTableActions)
  content (tables): table › tbody › tr › th|td (colspan, rowspan, colwidth; Tiptap adds colgroup + min-width style)
  content (mentions): span[data-type=mention][data-ok-editor-mention][data-id][data-label][data-mention-suggestion-char]? "@Label"
  Bubble menu: div[popover=manual][data-ok-popover][data-ok-editor-bubble-menu][data-ok-runtime=off][id][role=toolbar]
               [aria-label="Text formatting"][aria-controls=<content id>][data-ok-placement]?[data-ok-update-delay]?
    › button[data-ok-editor-action] …                             (toolbar buttons; default bold italic underline strike code link)
  Mention list: div[popover=manual][data-ok-popover][data-ok-editor-mentions][data-ok-runtime=off][data-ok-char]?[data-ok-allow-spaces]?
    › ul[role=listbox][id][aria-label="Suggestions"] › li[role=option][id][data-ok-editor-mention-option][aria-selected]   (written by core)
  template[data-ok-editor-mention-items] › [data-ok-value=<id>] "Label" …           (HTML only: the items)
  input[type=hidden][data-ok-editor-input][name]                    (with `name`: the HTML value)
```
The bubble menu and the mention list carry `data-ok-runtime="off"` in both implementations: the
editor's core controllers own them (the HTML popover runtime stays away).
Actions: `bold italic underline strike | bulletList orderedList | alignLeft alignCenter alignRight
alignJustify | code codeBlock (full) | blockquote horizontalRule (full) | link unlink image |
hardBreak clearFormat | undo redo (full) | fullscreen`. Labels and keys: `editorToolbar` in core.
Action without a button: `textTransform` (`run("textTransform", { textTransform })`, as the
reference's TextTransform extension).

## Options
<!-- options:editor (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-editor`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `fullItem` | `data-ok-full-item` | flag | boolean | off | Every toolbar group: adds code, code block, blockquote, horizontal rule, undo and redo. |
| `error` | `data-ok-error` | flag | boolean | off | Error state: red border and helper text, `aria-invalid` on the textbox. |
| `editable` | `data-ok-editable="false"` turns it off | behavior | boolean | on | The content can be changed (`false`: read only, toolbar disabled). |
| `tables` | `data-ok-tables` | flag | boolean | off | Tables: the table nodes and the toolbar's table menu (insert, rows, columns, headers, merge, split, delete). |
| `autofocus` | `data-ok-autofocus="…"` | style | `start` `end` `all` | — | Puts the caret in the editor once it is ready: at the `start`, the `end`, or selects `all`. React also takes `true` or a position. |
| `textDirection` | `data-ok-text-direction="…"` | style | `ltr` `rtl` `auto` | — | Text direction of the content: `ltr`, `rtl` or `auto`. Default: inherited. |
| `enableInputRules` | `data-ok-enable-input-rules="false"` turns it off | behavior | boolean | on | Markdown-like shortcuts while typing, such as `# ` for a heading (`false`: off). |
| `enablePasteRules` | `data-ok-enable-paste-rules="false"` turns it off | behavior | boolean | on | The same shortcuts on pasted text (`false`: off). |
| `enableContentCheck` | `data-ok-enable-content-check` | flag | boolean | off | Checks content against what the editor supports: invalid content fires a content error event (initial content loads without the invalid parts; a new value is refused). |
| `emitContentError` | `data-ok-emit-content-error` | flag | boolean | off | Fires the content error event for invalid inserted content even without the check (the content is kept). |
| `name` | `name` on each `input[data-ok-editor-input]` | native | boolean | off | Form field name: a hidden input holds the HTML value, so the editor submits with its form. |
| `fullscreen` | `data-ok-fullscreen` · event `ok:editor:fullscreen` | state | — | — | Fills the viewport (the toolbar's Fullscreen button, Escape leaves). |
| `value` | `data-ok-editor-content` · event `ok:editor:change` | state | — | — | The content: markup inside the content element. |
<!-- /options:editor -->

Other props: `value` / `defaultValue` / `onChange(html)` (`""` when empty), `placeholder`
(default "Write something awesome..."; HTML `data-ok-placeholder`), `helperText`, `highlighter`
(lowlight-compatible; HTML `createEditor({ highlighter })`), `onFullscreenChange(fullscreen)`,
`aria-label` (default "Editor") / `aria-labelledby` (go to the textbox).
ADR-0050: `bubbleMenu` (`true` | `{ actions, placement, updateDelay, shouldShow, label }`; HTML: the
bubble menu markup, `data-ok-placement`, `data-ok-update-delay`), `mentions` (`{ char, items(query),
allowSpaces, label }`; HTML: the list markup, `data-ok-char`, `data-ok-allow-spaces`, items from the
template or `ok:editor:mentionsearch`), `extensions`, `editorProps`, `parseOptions` (read at
creation; HTML `createEditor({ extensions, editorProps, parseOptions })`), `autofocus` (also `true`
or a position in React).

API mapping: see "Upstream API mapping" below.

## Layout and tokens
Root: 1px `rgb(grey-500 / 0.2)` border (error: `error-main`), radius `--ok-radius-md`, min height
240px, max height 720px. Toolbar: padding 10px, gap 8px, wraps; groups gap 4px, each preceded by a
1 × 16px rule. Buttons 28 × 28px, radius `--ok-radius-sm`, icons 18px; heading trigger 32px high,
min 120px, 1px border, body2 medium. Hover `--ok-action-hover` (hover devices), pressed /
expanded `--ok-action-selected`, disabled `--ok-text-disabled`, focus 2px inner outline. Body:
`rgb(grey-500 / 0.08)`, content padding 0 16px 16px, typography h1–h6 / body1, paragraphs 20px
apart, links `primary-main` (brand, ADR-0014), inline code `rgb(grey-500 / 0.2)` + text primary,
code blocks `grey-900` / white mono, padding 40px 24px 24px, lines wrap; syntax colors are palette
`*-light` tones (≥ 4.5:1 on grey-900). Fullscreen: fixed, inset 16px, `--ok-z-modal`, no shadow,
over the composed Backdrop (`--ok-backdrop`, `z-index: -1` inside the root's stacking context, so
the toolbar, body and helper carry the paper themselves). Heading menu items: Paragraph body2,
Heading 1 `font-size-xl × 17/16`, Heading 2–6 `font-size-xl / lg / md / sm / xs`, bold. Read
only: toolbar hidden.

## Behavior
- Initial content: React `value ?? defaultValue` (HTML string); HTML: the markup inside the content
  element, parsed from the DOM (no string, no Trusted Types sink). Content keeps only what the
  schema knows (no scripts, handlers or unknown elements); links and images are checked with
  `safeEditorUrl` (http(s), mailto, tel, relative; images http(s) / relative; no `data:`).
- Tiptap's trailing node keeps an empty paragraph after a final block that isn't one.
- Controlled (`value`): a new `value` replaces the content; late echoes of values the editor
  reported itself are skipped (fast typing, batched renders). Edits the owner ignores are not
  undone (as Tiptap): rich text can't be held back key by key.
- Toolbar state (`aria-pressed`, `disabled`, heading label, selected menu item) follows every
  transaction (`onStateChange`). Undo / Redo / Remove link are disabled when they can't run.
- Link / image: the button opens its form popover (link prefilled with the current `href`); Apply
  is disabled until the URL is valid; submit (button or Enter) runs the action and closes it.
  A link with an empty selection inserts the URL as text.
- Fullscreen: the button toggles `data-ok-fullscreen` and opens the root's Backdrop
  (`data-ok-open`); Escape (outside popovers) leaves it. While fullscreen (core
  `holdEditorFullscreen`): page scroll locked (shared `lockScroll`), and focus leaving for the page
  wraps to the first tab stop (Tab) or the last one (Shift+Tab; links and the language menu inside
  the content aren't stops of their own). Focus leaving for the browser UI is let go. HTML markup
  that starts with `data-ok-fullscreen` is held at setup.
- Text transform: `span` with an allowed `text-transform` style or `data-ok-text-transform` is kept
  (other spans and values are dropped); output is always the `style` form (portable HTML).
- `editable=false`: `contenteditable=false`, `aria-readonly`, toolbar disabled and hidden.
- Tiptap's injected `<style>` is off (`injectCSS: false`, CSP); editor.css carries ProseMirror's rules.
- Tables (`tables`, ADR-0050): TableKit (Table, TableRow, TableHeader, TableCell; no column
  resizing). The table menu runs `insertTable` (3 × 3 with a header row), add / delete column and
  row, toggle header row / column, merge / split cells (a cell selection), delete table; items are
  `aria-disabled` when their command can't run (`can()`), like the toolbar's `disabled`. A run is
  checked with `can()` first (a refused chain would still move the focus). `getValue()` keeps a
  table of empty cells (Tiptap's `isEmpty` counts it as empty).
- Mentions (`mentions`): Tiptap's Mention + Suggestion; the list is a Popover (`bottom-start`) on
  the suggestion's rectangle, opened while there are items (async items: shown when they arrive),
  closed when there are none, on Escape and when the query ends. Core writes the options
  (`li[role=option]`, label text) into the owner's listbox; the textbox gets `aria-controls` and
  `aria-activedescendant` while it is open. Presses on the list keep the focus in the text. HTML
  items: the template's `[data-ok-value]` entries whose text contains the query (case-insensitive,
  10 at most), replaced by `respondWith()` of `ok:editor:mentionsearch`.
- Bubble menu (`bubbleMenu`): core `createEditorBubbleMenu`; shows after `updateDelay` (250 ms)
  when `shouldShow` holds (default: a non-empty text selection, editable, focus in the text or the
  menu), placed `top` of the selection (`posToDOMRect`); hides on blur unless focus moved into it,
  and when focus leaves it for the page. Its buttons are toolbar buttons (state, disabled, link /
  image forms). Presses don't take the focus (`mousedown` default prevented).
- Pass-through: `extensions` are added after the built-in set (a top-level one with the same name
  replaces it); `editorProps` merge with the editor's (`aria-readonly` wins); `parseOptions` also
  parse the HTML markup; `autofocus`, `textDirection`, `enableInputRules`, `enablePasteRules` go to
  Tiptap as given. These and `tables` / `mentions` are read when the editor is created (React:
  remount with `key` for new extensions).
- `name`: a hidden input (`data-ok-editor-input`) carries `getValue()` after every change and
  `setValue()`.
- Tiptap events (row 4.18.33): core `onEvent(name, props)` reports `beforeCreate` (during the
  constructor), `create` (a task after mount), `focus`, `blur`, `selectionUpdate`, `transaction`,
  `paste`, `drop`, `delete` (a task later, as Tiptap), `contentError`, `destroy` with Tiptap's
  props (`destroy` gets `{ editor }`). React calls the latest handler without a new editor; HTML
  relays them as `ok:editor:<lowercase>` with plain details (no transactions, slices or nodes).
  `update` stays `onChange` / `ok:editor:change`.
- Content check: `enableContentCheck` (Tiptap's): invalid initial content reports `contentError`
  and loads without the invalid parts; an invalid `setContent` (React `value`, HTML `setValue`)
  is refused and reported (Tiptap throws there; the controller catches its content errors only).
  `emitContentError` passes through (Tiptap reports invalid inserted content and keeps it). HTML
  snippet markup is parsed from the DOM by the schema, so it never reports a content error.
- Editor access: React `editorRef` gets the Tiptap editor after each creation and `null` after
  destroy (also `onCreate({ editor })`); HTML instance `editor`; both have `getJSON()` /
  `getText()` (controller and HTML instance).

## Keyboard
Toolbar: one tab stop (roving tabindex, `createToolbarNavigation`): ArrowLeft / ArrowRight
(wrap), Home, End. Text box: Tiptap defaults (Mod+B / I / U, Mod+Shift+S, Mod+Shift+7 / 8,
Mod+Shift+L / E / R / J, Mod+E, Mod+Alt+C, Mod+Shift+B, Shift+Enter, Mod+Z, Mod+Shift+Z) and
Mod+Shift+X (clear formatting, Owlky). Escape leaves fullscreen; Tab / Shift+Tab stay inside the
editor while fullscreen. Alt+F10 in the text: to the bubble menu when it shows, else to the
toolbar's current control (TinyMCE / CKEditor convention); in the bubble menu ArrowLeft /
ArrowRight / Home / End move, Escape goes back to the text (selection kept). Mention list:
ArrowDown / ArrowUp (wrap), Enter / Tab pick, Escape closes. Tables: Tiptap's Tab / Shift+Tab move
between cells.

## Accessibility
Textbox named by `aria-label` (default "Editor") or `aria-labelledby`, described by the helper,
`aria-invalid` with `error`. Toolbar buttons named, `aria-pressed` for toggles,
`aria-keyshortcuts` for shortcuts; popover triggers `aria-haspopup` / `aria-expanded` /
`aria-controls`. Forms are dialogs named by their title; Escape closes them and focus returns to the
button. Fullscreen keeps Tab inside the editor (WCAG 2.4.11: no focus on controls hidden behind it). Content links use the brand color (contrast exempt, ADR-0014).
The bubble menu is a named `toolbar` (Alt+F10 reaches it without a pointer); the table trigger is
`aria-haspopup="menu"`; the mention list is a named `listbox` the textbox points at with
`aria-activedescendant` (focus stays in the text, as Autocomplete). Mentions are brand-colored text
on a tint (ADR-0014).

## Events / API
HTML `ok:editor:change` (`{ value }`), `ok:editor:fullscreen` (`{ fullscreen }`). Instance
`{ value, setValue(html), fullscreen, setFullscreen(on), setEditable(on), focus(), controller,
editor, getJSON(), getText() }`. Tiptap events: `ok:editor:beforecreate` (no detail), `create`
(`{ value }`), `focus` / `blur` (`{ event }`), `selectionupdate` (`{ from, to, empty }`),
`transaction` (`{ docChanged }`), `paste` (`{ event, text }`), `drop` (`{ event, text, moved }`),
`delete` (`{ type, name, from, to, partial }`), `contenterror` (`{ message }`), `destroy` (no detail).
Core: `EditorState.textTransform` (value at the selection), `run("textTransform", { textTransform:
"uppercase" | "lowercase" | "capitalize" | null })`, `TextTransform` (the mark),
`editorTextTransforms`, `readTextTransform`, `holdEditorFullscreen(root)`.
Registration is opt-in: `@owlky/html/editor`, the CDN's lazy module (ADR-0068), or
`createEditor({ highlighter })`.
React: `onChange(html)`, `onFullscreenChange(fullscreen)`, `editorRef`, `onBeforeCreate`,
`onCreate`, `onEditorFocus`, `onEditorBlur`, `onSelectionUpdate`, `onTransaction`,
`onEditorPaste`, `onEditorDrop`, `onDelete`, `onContentError`, `onDestroy` (Tiptap's props;
`onFocus` / `onBlur` / `onPaste` / `onDrop` stay the root's DOM handlers, so the Tiptap ones are
prefixed), `enableContentCheck`, `emitContentError`. Core: controller `getJSON()`, `getText()`,
options `onEvent`, `enableContentCheck`, `emitContentError`; `editorEventNames`,
`EditorEventName`, `EditorEventProps`, `TiptapEditor`, `EditorJSONContent`.
ADR-0050: HTML `ok:editor:mentionsearch` (`{ query, char, items, respondWith(itemsOrPromise) }`),
`createEditor({ extensions, editorProps, parseOptions })`. Core: `createEditorBubbleMenu(editor,
menu, options)` (`isOpen`, `update()`, `focus()`, `setOptions()`, `destroy()`),
`defaultBubbleMenuShow`, `editorToolbarShortcut(root, content, bubble)`, `editorTableActions`,
`editorBubbleMenuActions`, `editorToolButton(action)`, `EditorMentionItem`, controller options
`tables`, `mentions`, `extensions`, `editorProps`, `parseOptions`, `autofocus`, `textDirection`,
`enableInputRules`, `enablePasteRules`; table actions through `run()`.

## Responsive
The toolbar wraps at every width (mobile: three to four rows); the body scrolls inside the 720px
cap; forms are `min(320px, 100vw − 48px)` wide. The story puts editor and preview side by side from
900px, stacked below; the preview renders the editor's HTML with Markdown (`rawHtml`, ADR-0035),
as the reference does, in an outlined Card (`component="section"`) under a Typography `h6`
title (`component="h3"`).

## Upstream API mapping
Upstream: the Minimals `Editor` wrapper's props and Tiptap 3 (tiptap.dev/docs/editor/api/editor,
/api/events).

| Upstream | Owlky | Status | Note |
|---|---|---|---|
| Minimals `value`, `onChange`, `editable`, `fullItem`, `error`, `helperText`, `placeholder` | same | kept | `onChange(html)`, `""` when empty |
| Minimals `resetValue` | `value=""` | not applicable | |
| Minimals `className`, `sx`, `slotProps` | root `className` | not applicable | ADR-0015 |
| Tiptap `content` | `value` / `defaultValue`; HTML: markup in the content element | renamed | |
| Tiptap `editable`, `setEditable()` | `editable`, `setEditable(on)` | kept | |
| Tiptap `element`, `mount()` / `unmount()` | `[data-ok-editor-content]` | not applicable | the anatomy owns the mount |
| Tiptap `injectCSS`, `injectNonce` | — | not applicable | `injectCSS: false` (CSP); editor.css |
| Tiptap `extensions` | `extensions` (after the built-in set; a same-named one replaces it) · HTML `createEditor({ extensions })` | kept | ADR-0050; read at creation |
| Tiptap `schemaSpec`, `coreExtensionOptions`, `enableExtensionDispatchTransaction` | — | deferred | |
| Tiptap `editorProps`, `parseOptions` | same (merged; read at creation) · HTML `createEditor({ editorProps, parseOptions })` | kept | |
| Tiptap `enableInputRules`, `enablePasteRules`, `textDirection`, `autofocus` | same · `data-ok-enable-input-rules`, `-enable-paste-rules`, `-text-direction`, `-autofocus` | kept | rule lists (arrays) in React only; HTML autofocus `start` · `end` · `all` |
| `@tiptap/extension-table` (TableKit) | `tables` / `data-ok-tables` + the table menu | kept | `resizable` and its options deferred |
| `@tiptap/extension-mention` + `@tiptap/suggestion` | `mentions` (`char`, `items`, `allowSpaces`) · HTML list markup + template / `ok:editor:mentionsearch` | kept | `suggestions` (several triggers), `renderText` / `renderHTML`, `deleteTriggerWithBackspace` deferred |
| event `update` | `onChange(html)`, `ok:editor:change` | renamed | |
| events `beforeCreate`, `create`, `selectionUpdate`, `transaction`, `destroy`, `delete`, `contentError` | React `onBeforeCreate`, `onCreate`, `onSelectionUpdate`, `onTransaction`, `onDestroy`, `onDelete`, `onContentError` · `ok:editor:beforecreate`, `create`, `selectionupdate`, `transaction`, `destroy`, `delete`, `contenterror` | kept | HTML details are plain values |
| events `focus`, `blur`, `paste`, `drop` | React `onEditorFocus`, `onEditorBlur`, `onEditorPaste`, `onEditorDrop` · `ok:editor:focus`, `blur`, `paste`, `drop` | renamed | the root's DOM `onFocus`… keep their names |
| events `mount`, `unmount`, `beforeTransaction` | — | not applicable / deferred | the anatomy owns the mount; `beforeTransaction` through `editorRef` / `editor.on()` |
| Tiptap `enableContentCheck`, `emitContentError` | same · `data-ok-enable-content-check`, `data-ok-emit-content-error` | kept | read at creation; invalid `setContent` reported, not thrown |
| `getHTML()` | `getValue()`, instance `value` | renamed | |
| `getJSON()`, `getText()` | controller and HTML instance `getJSON()`, `getText()`; React through `editorRef` | kept | |
| `isEmpty`, `isFocused`, `registerPlugin()`, `setOptions()`, `on()` / `off()` | the Tiptap editor: React `editorRef` / `onCreate`, HTML instance `editor` | kept | escape hatch |
| `chain()`, `can()`, `isActive()`, `getAttributes()` | `run(action, value)`, `EditorState` (`active`, `disabled`, `link`, `textTransform`) | renamed | |
| `commands.focus()`, `destroy()` | `focus()`, `destroy({ restore })` | kept | |
| `@tiptap/react` `BubbleMenu` (`shouldShow`, `updateDelay`, `options.placement`) | `bubbleMenu` (`actions`, `placement`, `updateDelay`, `shouldShow`) · HTML bubble menu markup | renamed | Owlky's own (popover controller, Alt+F10); `pluginKey`, `appendTo`, `resizeDelay`, other Floating UI options not applicable |
| `@tiptap/react` `useEditor` (the editor instance, its event options) | `editorRef`, `onCreate` and the event props | renamed | the component creates the editor |
| `@tiptap/react` `EditorContent`, `useCurrentEditor`, `FloatingMenu` | — | deferred | |
| form `name` (hidden input) | `name` · `input[data-ok-editor-input][name]` | kept | |

Beyond upstream: `defaultValue`, `highlighter`, `onFullscreenChange`, `aria-label` /
`aria-labelledby`, fullscreen.

## Parity notes
React renders `data-ok-runtime="off"` (root and Backdrop); popover triggers carry
`data-ok-popover-open` in HTML only. Snippets write text transforms as `data-ok-text-transform`
(no `style` in snippets); the content DOM after mount is the same `style` form on both sides.
Both mount the same controller, so the content DOM matches after mount (React fills it from
`value`, HTML from the markup). The Bubble menu, Table and Mentions snippets are generated from the
React demos (`node apps/storybook/scripts/demo-snippets.mjs editor`: content filled in, readable
ids, `data-ok-runtime="off"` kept on the bubble menu and the mention list, the mention template
added). The mention list's options and the textbox's `aria-activedescendant` exist only while the
list is open (core writes them in both).
