# ADR-0037: Upload — a native file input under the drop zone, one controller in core

**Status:** Accepted (2026-11-09)

## Context
The reference's "Upload" page shows single and multiple file drop zones (with a file list,
thumbnails, Remove all and Upload buttons), an avatar picker and small upload boxes, built on
react-dropzone. The owner wants react-dropzone's whole API (`accept`, `maxFiles`, sizes, `noClick`,
`noKeyboard`, `noDrag`, `noDragEventsBubbling`, `noPaste`, `validator`, `preventDropOnDocument`,
`useFsAccessApi`, the drag states, `open()` …) in React and framework-free HTML. react-dropzone is
React only and makes a `div` with `role="presentation"` focusable while hiding the input; it also
stops event propagation for `noDragEventsBubbling`, which this project forbids (AGENTS.md).

## Decision
1. **Native first.** The zone holds a real `<input type="file">` that covers it with `opacity: 0`:
   it is the focus target and the accessible control (named by the zone's title, described by the
   helper text), a press opens the file dialog and a drop fills it even without JavaScript.
   `noClick` lets presses through with CSS (`pointer-events: none`) and refuses pointer clicks in
   JavaScript; `noKeyboard` takes the input out of the tab order.
2. **One controller in core** (`createUploadController`) for React and the HTML runtime: drag and
   drop with a drag verdict (`accept`, `reject`, `unknown`) written on the root as `data-ok-drag`,
   folders read recursively, paste, Enter, `[data-ok-upload-open]` triggers, the File System
   Access picker, the input's native `cancel` event for `onFileDialogCancel` (no focus timer),
   form reset, `preventDropOnDocument`, and the checks (core `evaluateUploadFiles`: type, sizes,
   validator, then the count). It reports the checked files; the owner decides what it keeps.
3. **The upload holds files** (unlike the hook): single replaces, multiple adds, and `maxFiles`
   counts the files held. The files are mirrored into `input.files` with `DataTransfer`, so a form
   submits dropped and pasted files too. No network code: sending is the owner's job.
4. **`noDragEventsBubbling` without `stopPropagation`:** an inner upload marks the drag event as
   claimed (module-scoped `WeakSet`), outer uploads skip claimed events. Native listeners above
   still see the event (documented difference).
5. **Upstream API (ADR-0015):** option names kept; `multiple` defaults to `false` (Minimals'
   `Upload`); `onDrop(accepted, rejections)` drops the event argument; the drag and dialog states
   reach React through a `placeholder(state)` function and HTML through attributes and
   `ok:upload:*` events; `open`, `removeFile`, `clearFiles` on `apiRef` / the HTML instance. The
   `getRootProps` / `getInputProps` hook is deferred (backlog). Minimals' `Upload`,
   `UploadAvatar` and `UploadBox` are one root with `data-ok-variant`.
6. **Security:** file names are text only (`textContent` / React children); file contents are never
   read; image previews are object URLs revoked when the file leaves and on unmount / destroy;
   `accept` values are filtered to MIME types, wildcards and extensions.

## Consequences
- The HTML list item is a `<template data-ok-upload-template>` the runtime clones per file (like
  Autocomplete's chips); previews and rejections are built with DOM methods.
- A disabled zone is dimmed like the reference: test helpers exempt it from `color-contrast`
  (inactive component).
- No new token, no dependency.
