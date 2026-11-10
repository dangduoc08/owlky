---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Editor: access to the Tiptap editor and its events. React `editorRef` (the Tiptap editor, `null` after destroy), `onBeforeCreate`, `onCreate`, `onEditorFocus`, `onEditorBlur`, `onSelectionUpdate`, `onTransaction`, `onEditorPaste`, `onEditorDrop`, `onDelete`, `onContentError`, `onDestroy` (Tiptap's arguments). HTML `ok:editor:beforecreate`, `create`, `focus`, `blur`, `selectionupdate`, `transaction`, `paste`, `drop`, `delete`, `contenterror`, `destroy` with plain details; the instance gets `editor`, `getJSON()` and `getText()`. New options `enableContentCheck` / `emitContentError` (`data-ok-enable-content-check`, `data-ok-emit-content-error`): with the check, an invalid `setContent` / `value` is refused and reported instead of throwing. Core: controller `getJSON()`, `getText()`, options `onEvent`, `enableContentCheck`, `emitContentError`; `editorEventNames`, `EditorEventName`, `EditorEventProps`, `TiptapEditor`, `EditorJSONContent`.
