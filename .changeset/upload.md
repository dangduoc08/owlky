---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add the Upload (ADR-0037): a drop zone around a native file input, so pressing it opens the file dialog and dropping files fills it even without JavaScript. One behavior controller for React and HTML covers react-dropzone's options: `accept` (input string, MIME → extensions map or labeled groups), `multiple`, `maxFiles`, `maxSize`, `minSize`, `disabled`, `noClick`, `noKeyboard`, `noDrag`, `noDragEventsBubbling`, `noPaste`, `preventDropOnDocument`, `useFsAccessApi`, `autoFocus`, `validator` (sync or async), `getFilesFromEvent`, `getErrorMessage`, the drag states (`data-ok-drag`), folder drops, paste and `open()`. The upload keeps the files (single replaces, multiple adds), mirrors them into the input for forms, shows a preview, a list of rows or tiles with thumbnails, names and sizes, and the rejected files with their reasons. React: `Upload`, `UploadAvatar`, `UploadBox` and `UploadCloudIcon`. In HTML, the `upload` runtime clones list rows from a `<template>`, emits `ok:upload:*` events and exposes `open`, `setFiles`, `removeFile`, `clearFiles` and the validator setters on its instance.
