import { uploadOptions } from "@owlky/core";
import { Upload, UploadAvatar, UploadBox } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const uploadSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An upload lets people choose files by dropping them on a zone, by pressing the zone to open the file dialog, or by pasting them. It checks each file against the types, sizes and counts you allow, lists the files it keeps with a preview, a name and a size, and lists the rejected files with the reasons. The zone is built around a native file input, so it works with the keyboard and screen readers, and a form submits the files it holds. The upload never sends files anywhere: you decide when and how to send them.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-upload data-ok-variant="default" data-ok-layout="vertical">
  <div data-ok-upload-zone>
    <input type="file" data-ok-upload-input id="photo" name="photo" title=" "
      aria-labelledby="photo-title">
    <div data-ok-upload-placeholder>
      <!-- The "upload" illustration (Foundations › Illustrations) -->
      <svg data-ok-illustration="upload" data-ok-color="primary" data-ok-upload-illustration
        aria-hidden="true" focusable="false" viewBox="0 0 480 360">…</svg>
      <div data-ok-upload-placeholder-text>
        <span data-ok-upload-title id="photo-title">Drop or select a file</span>
        <span data-ok-upload-description>Drag a file here, or <span data-ok-upload-browse>browse</span> your device.</span>
      </div>
    </div>
    <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm"
      data-ok-upload-remove id="photo-remove" aria-labelledby="photo-remove photo-preview" hidden>
      <span data-ok-upload-remove-text>Remove</span><svg aria-hidden="true" viewBox="0 0 24 24">…</svg>
    </button>
  </div>
  <div data-ok-upload-rejections role="alert"></div>
</div>`,
    react: `import { Upload } from "@owlky/react";

export function Photo() {
  return <Upload name="photo" />;
}`,
  },
  {
    id: "multiple",
    title: "Accept several files",
    body: "Turn on `multiple` to keep adding files: each drop or pick adds its files to the list. Without it, a new file replaces the current one. In HTML, put `multiple` on the input and add the list, its item `<template>` and, if you want them, the **Remove all** and **Upload** buttons. In React, `onRemoveAll` and `onUpload` show those buttons. Pass `value` with `onChange` to control the files yourself; `onChange` receives every file the upload holds.",
    html: `<div data-ok-upload data-ok-variant="default" data-ok-layout="vertical">
  <div data-ok-upload-zone>
    <input type="file" data-ok-upload-input id="docs" name="docs" multiple title=" "
      aria-labelledby="docs-title">
    …
  </div>
  <div data-ok-upload-rejections role="alert"></div>
  <ul data-ok-upload-list aria-live="polite"></ul>
  <!-- Each file gets a copy of this row -->
  <template data-ok-upload-template>
    <li data-ok-upload-item><span data-ok-upload-thumb></span><span data-ok-upload-item-text><span data-ok-upload-item-name></span><span data-ok-upload-item-size></span></span><button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-upload-remove><span data-ok-upload-remove-text>Remove</span><svg aria-hidden="true" viewBox="0 0 24 24">…</svg></button></li>
  </template>
  <div data-ok-upload-actions hidden>
    <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit"
      data-ok-size="sm" data-ok-upload-remove-all><span data-ok-button-label>Remove all</span></button>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit"
      data-ok-size="sm" data-ok-upload-submit><span data-ok-button-label>Upload</span></button>
  </div>
</div>`,
    react: `import { useState } from "react";
import { Upload } from "@owlky/react";

export function Documents() {
  const [files, setFiles] = useState([]);
  return (
    <Upload
      multiple
      value={files}
      onChange={setFiles}
      onRemoveAll={() => setFiles([])}
      onUpload={(chosen) => send(chosen)}
    />
  );
}`,
  },
  {
    id: "rules",
    title: "Limit types, sizes and counts",
    body: '`accept` takes the same values as the input\'s `accept` attribute, such as `image/*,.pdf`, or, in React, a map of MIME types to extensions such as `{ "image/*": [".png", ".jpg"] }`. The file dialog shows those types, and dropped or pasted files are checked against them too. `maxSize` and `minSize` are in bytes. `maxFiles` caps how many files a multiple upload holds. Add your own check with `validator`: it receives each file and returns `null`, an error `{ code, message }` or a list of errors, and it may return a promise. Rejected files appear under the zone with their reasons. Rewrite the messages, for example to translate them, with `getErrorMessage`.',
    html: `<div data-ok-upload data-ok-variant="default" data-ok-layout="vertical"
  data-ok-max-files="3" data-ok-max-size="1048576">
  <div data-ok-upload-zone>
    <input type="file" data-ok-upload-input id="pics" multiple accept="image/png,image/jpeg"
      title=" " aria-labelledby="pics-title" aria-describedby="pics-helper">
    …
  </div>
  <div data-ok-upload-helper-text id="pics-helper">PNG or JPEG, up to 1 MB each.</div>
  …
</div>

<script type="module">
  const upload = window.Owlky.get(document.querySelector("[data-ok-upload]"), "upload");
  upload.setValidator((file) =>
    file.name.length > 60 ? { code: "name-too-long", message: "Use a shorter name" } : null,
  );
</script>`,
    react: `<Upload
  multiple
  accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
  maxFiles={3}
  maxSize={1048576}
  helperText="PNG or JPEG, up to 1 MB each."
  validator={(file) =>
    file.name.length > 60 ? { code: "name-too-long", message: "Use a shorter name" } : null
  }
  onDropRejected={(rejections) => console.warn(rejections)}
/>`,
  },
  {
    id: "list",
    title: "Show the files",
    body: 'The list shows a row per file with a preview, the name and the size. Set `layout` to `horizontal` for a wrapping row of tiles instead: the names stay available to screen readers. Image files show a preview made from a temporary object URL, which the upload releases when the file leaves. Turn previews off with `thumbnail={false}` (HTML: `data-ok-thumbnail="false"`) to show a colored file type icon for every file.',
    html: `<div data-ok-upload data-ok-variant="default" data-ok-layout="horizontal"
  data-ok-thumbnail="false">…</div>`,
    react: `<Upload multiple layout="horizontal" thumbnail={false} />`,
  },
  {
    id: "avatar",
    title: "Pick an avatar or a small box",
    body: "`UploadAvatar` is a round photo picker: the photo fills the circle and **Update photo** shows on hover and focus. It accepts images by default. `UploadBox` is a small box for toolbars and forms: it shows a cloud icon, or the `placeholder` you give it, and keeps the files without a list. In HTML, set `data-ok-variant` to `avatar` or `box`.",
    html: `<div data-ok-upload data-ok-variant="avatar" data-ok-layout="vertical">
  <div data-ok-upload-zone>
    <input type="file" data-ok-upload-input id="me" accept="image/*" title=" "
      aria-labelledby="me-title">
    <div data-ok-upload-placeholder>
      <svg data-ok-upload-icon aria-hidden="true" viewBox="0 0 24 24">…</svg>
      <span data-ok-upload-title id="me-title" data-ok-label-upload="Upload photo"
        data-ok-label-update="Update photo">Upload photo</span>
    </div>
  </div>
  <div data-ok-upload-rejections role="alert"></div>
</div>`,
    react: `import { UploadAvatar, UploadBox } from "@owlky/react";

export function Profile() {
  return (
    <>
      <UploadAvatar maxSize={3145728} helperText="Images up to 3 MB" />
      <UploadBox />
    </>
  );
}`,
  },
  {
    id: "open",
    title: "Open the file dialog yourself",
    body: "With `noClick`, pressing the zone no longer opens the file dialog, and with `noKeyboard` the input leaves the tab order. Give people a button instead: any element with `data-ok-upload-open` inside the upload opens the dialog, in HTML and in React. You can also call `open()` from a click handler: on the HTML instance, or on the `apiRef` in React. Browsers only open the dialog right after a user action. `noDrag` turns dropping off and `noPaste` turns pasting off.",
    html: `<div data-ok-upload data-ok-variant="default" data-ok-layout="vertical"
  data-ok-no-click data-ok-no-keyboard>
  <div data-ok-upload-zone>
    <input type="file" data-ok-upload-input multiple title=" " aria-label="Files" tabindex="-1">
    <div data-ok-upload-placeholder>
      <span>Drag files here</span>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit"
        data-ok-size="md" data-ok-upload-open><span data-ok-button-label>Open file dialog</span></button>
    </div>
  </div>
  …
</div>`,
    react: `import { Button, Upload } from "@owlky/react";

<Upload
  multiple
  noClick
  noKeyboard
  aria-label="Files"
  placeholder={
    <Button variant="outlined" color="inherit" data-ok-upload-open="">
      Open file dialog
    </Button>
  }
/>`,
  },
  {
    id: "send",
    title: "Send the files",
    body: "The upload copies the files it holds into its input, so a form with the input's `name` submits them, including dropped and pasted files. To send them yourself, read `files` from the HTML instance or the `onChange` value in React, and post them with `fetch()` and `FormData`. The **Upload** button gives you the files in `onUpload` (HTML: the `ok:upload:upload` event). Files a user chose before, such as a saved avatar, can be URL strings in `value`: the upload shows them but can't put them in the input.",
    html: `<form method="post" action="/profile" enctype="multipart/form-data">
  <div data-ok-upload data-ok-variant="default" data-ok-layout="vertical">
    <div data-ok-upload-zone>
      <input type="file" data-ok-upload-input name="attachments" multiple title=" " …>
      …
    </div>
  </div>
  <button type="submit">Save</button>
</form>`,
    react: `<Upload
  multiple
  onUpload={async (files) => {
    const body = new FormData();
    for (const file of files) if (file instanceof File) body.append("attachments", file);
    await fetch("/attachments", { method: "POST", body });
  }}
/>`,
  },
  {
    id: "drag-rejections",
    title: "Explain a rejection while dragging",
    body: "While files are over the zone, the browser tells only their types and their count. `dragFileRejections` lists the dragged files that would be rejected, each with its `index`, `type` and `errors` (`file-invalid-type` or `too-many-files`), so the zone can say why before the drop. In React, read it from the state that `placeholder` receives, or from `useDropzone`. In HTML, read `detail.rejections` of the `ok:upload:drag` event, or the instance's `dragState.rejections`. File names and sizes are only known at drop time, so the other checks run then.",
    react: `import { Upload } from "@owlky/react";

export function Images() {
  return (
    <Upload
      accept="image/*"
      placeholder={({ isDragReject, dragFileRejections }) =>
        isDragReject
          ? \`\${dragFileRejections.length} file(s) can't be added: \${dragFileRejections[0]?.errors[0]?.message ?? ""}\`
          : "Drop images here"
      }
    />
  );
}`,
  },
  {
    id: "hook",
    title: "Build your own drop zone",
    body: "In React, `useDropzone(options)` gives the upload's behavior without its look: spread `getRootProps()` on your drop target and `getInputProps()` on a file input inside it. The root opens the file dialog on a press, Enter or Space, takes dropped and pasted files, and reports them to `onDrop(accepted, rejections)`. The hook returns the same drag state as the zone (`isDragActive`, `isDragAccept`, `isDragReject`, `dragFileRejections`), plus `isFocused`, `acceptedFiles`, `fileRejections` and `open()`. `Dropzone` is the same hook as a component that takes a render function. Give the root a name and a role, as in the example: the input is hidden, so the root is the control people reach. In HTML, the `upload` runtime is the behavior, and `createUploadController` from `@owlky/core` drives markup of your own.",
    react: `import { useDropzone } from "@owlky/react";
import { useState } from "react";

export function DropTarget() {
  const [names, setNames] = useState<string[]>([]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (accepted) => setNames(accepted.map((file) => file.name)),
  });
  return (
    <div {...getRootProps({ role: "button", "aria-label": "Add images" })}>
      <input {...getInputProps()} />
      {isDragActive ? "Drop the images here" : "Add images"}
      <ul>
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}`,
  },
  { id: "options", title: "Options", body: "Every option, as a React prop and an HTML attribute." },
  {
    id: "props",
    title: "Content and behavior",
    body: "Props and attributes that aren't styling options: files, texts, callbacks and the input's own attributes.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: 'In HTML, the runtime fires these events on the upload root and adds methods to its instance (`window.Owlky.get(root, "upload")`). `ok:upload:drop` is cancelable: cancel it to keep the files as they are. `ok:upload:change` reports the files after every change, with the reason: `add`, `remove`, `clear` or `reset` (the form was reset). `ok:upload:remove` is cancelable too. `ok:upload:drag` reports the drag state, and the root carries it as `data-ok-drag` (`accept`, `reject` or `unknown`) and `data-ok-drag-global`, which you can style. Instance methods: `open()`, `setFiles(files)`, `removeFile(file)`, `clearFiles()`, `setValidator(fn)`, `setErrorMessage(fn)` and `setFilesFromEvent(fn)`; properties `files`, `rejections`, `dragState`, `isFileDialogActive` and `isProcessing`.',
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The input is the zone's focus target, so the zone shows a focus ring.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: "- **Native control:** the zone holds a real file input, named by the zone's title (or `aria-label`) and described by the helper text. Screen readers announce it as a file button, and it works without JavaScript.\n- **Errors:** with `error`, the input gets `aria-invalid`. Rejected files appear in an alert, so screen readers announce them.\n- **New files:** the list is a polite live region, so added files are announced.\n- **Remove buttons:** each one is named after its file, such as \"Remove report.pdf\". When a removed button had the focus, the focus moves to the next remove button, or back to the input.\n- **Text and contrast:** the texts meet a contrast ratio of at least 4.5:1, including the zone's description and the helper text. File names are always shown as text, never as markup.",
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Upload />
    </Preview>
  ),
  list: () => (
    <Preview>
      <Upload multiple layout="horizontal" />
    </Preview>
  ),
  avatar: () => (
    <Preview>
      <UploadAvatar />
      <UploadBox />
    </Preview>
  ),
  options: () => <OptionsTable schema={uploadOptions} />,
  props: () => (
    <PropsTable
      label="Upload content and behavior"
      rows={[
        {
          react: "value / defaultValue / onChange",
          html: "files, setFiles(), ok:upload:change",
          type: "(File | string)[] / (files) => void",
          description: "The files the upload holds. Strings are URLs of files chosen before.",
        },
        {
          react: "accept",
          html: "accept on the input",
          type: "string | { [mime]: string[] } | { description, accept }[]",
          description: "Accepted types. Groups label the rows of the File System Access picker.",
        },
        {
          react: "helperText",
          html: "data-ok-upload-helper-text (aria-describedby on the input)",
          type: "ReactNode",
          description: "Text under the zone, such as the accepted types.",
        },
        {
          react: "title / description / placeholder",
          html: "the zone's markup",
          type: "ReactNode / (state) => ReactNode",
          description:
            "Texts of the zone, or your own content. A function receives the drag state, such as `isDragAccept`.",
        },
        {
          react: "validator",
          html: "setValidator(fn)",
          type: "(file) => error | error[] | null | Promise",
          description: "Your own check per file.",
        },
        {
          react: "getErrorMessage",
          html: "setErrorMessage(fn)",
          type: "(error, file) => string",
          description: "Rewrites rejection messages.",
        },
        {
          react: "getFilesFromEvent",
          html: "setFilesFromEvent(fn)",
          type: "(event | handles) => File[] | Promise",
          description: "Reads files from a drop, a pick or a paste yourself.",
        },
        {
          react: "onDrop / onDropAccepted / onDropRejected",
          html: "ok:upload:drop",
          type: "(accepted, rejections) => void",
          description: "Every drop, pick or paste, after the checks.",
        },
        {
          react: "onFileDialogOpen / onFileDialogCancel",
          html: "ok:upload:dialogopen / ok:upload:dialogcancel",
          type: "() => void",
          description: "The file dialog opened or was dismissed.",
        },
        {
          react: "onError",
          html: "ok:upload:error",
          type: "(error) => void",
          description: "A validator or a file reader threw. The drop is discarded.",
        },
        {
          react: "onRemove / onRemoveAll / onUpload",
          html: "ok:upload:remove, ok:upload:change (clear), ok:upload:upload",
          type: "(file) => void / () => void / (files) => void",
          description: "Remove buttons, and the Remove all and Upload buttons they show.",
        },
        {
          react: "autoFocus",
          html: "autofocus on the input",
          type: "boolean",
          description: "Focuses the input on load.",
        },
        {
          react: "name / form / required / capture / inputId",
          html: "the input's attributes",
          type: "string / boolean",
          description: "Passed to the native input.",
        },
        {
          react: "apiRef",
          html: 'window.Owlky.get(root, "upload")',
          type: "Ref<UploadApi>",
          description: "`open()`, `removeFile()`, `clearFiles()`, `files` and `rejections`.",
        },
        {
          react: "labels",
          html: "the text in the markup",
          type: "Partial<UploadLabels>",
          description: "Texts of the remove, Remove all and Upload buttons and the avatar titles.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves to the zone's input, then to each remove button and the action buttons."],
        ["Enter or Space", "Opens the file dialog (unless `noKeyboard`)."],
        [
          "Ctrl + V (Command + V on macOS)",
          "Pastes files, such as a screenshot (unless `noPaste`).",
        ],
        ["Enter or Space on a remove button", "Removes that file."],
      ]}
    />
  ),
};

/** Upload docs page (ADR-0019). */
export function UploadDocs() {
  return <GuideDocs sections={uploadSections} previews={PREVIEWS} />;
}
