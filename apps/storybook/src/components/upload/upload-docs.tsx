import { uploadOptions } from "@owlky/core";
import uploadApi from "@owlky/docs-content/api/upload.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Upload, UploadAvatar, UploadBox } from "@owlky/react";
import avatarGroup from "../../../../../packages/html/src/components/upload/examples/avatar-group.html?raw";
import multipleGroup from "../../../../../packages/html/src/components/upload/examples/multiple-group.html?raw";
import openDialogGroup from "../../../../../packages/html/src/components/upload/examples/open-dialog-group.html?raw";
import singleGroup from "../../../../../packages/html/src/components/upload/examples/single-group.html?raw";
import validationGroup from "../../../../../packages/html/src/components/upload/examples/validation-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";

const uploadOf = (markup: string) => snippetElement(markup, "data-ok-upload ");
const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => (line ? `${" ".repeat(spaces)}${line}` : line))
    .join("\n");

export const uploadSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An upload lets people choose files by dropping them on a zone, by pressing the zone to open the file dialog, or by pasting them. It checks each file against the types, sizes and counts you allow, lists the files it keeps with a preview, a name and a size, and lists the rejected files with the reasons. The zone is built around a native file input, so it works with the keyboard and screen readers, and a form submits the files it holds. The upload never sends files anywhere: you decide when and how to send them.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${uploadOf(singleGroup)}`,
    react: `import { Upload } from "@owlky/react";

export function Photo() {
  return <Upload name="photo" />;
}`,
  },
  {
    id: "multiple",
    title: "Accept several files",
    body: "Turn on `multiple` to keep adding files: each drop or pick adds its files to the list. Without it, a new file replaces the current one. In HTML, put `multiple` on the input and add the list, its item `<template>` and, if you want them, the **Remove all** and **Upload** buttons. In React, `onRemoveAll` and `onUpload` show those buttons. Pass `value` with `onChange` to control the files yourself; `onChange` receives every file the upload holds.",
    html: `${uploadOf(multipleGroup)}`,
    react: `import { Upload, type UploadValue } from "@owlky/react";
import { useState } from "react";

// Your own upload: send the files to your API
async function send(files: UploadValue[]) {
  const body = new FormData();
  for (const file of files) if (file instanceof File) body.append("documents", file);
  await fetch("/documents", { method: "POST", body });
}

export function Documents() {
  const [files, setFiles] = useState<UploadValue[]>([]);
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
    html: `${uploadOf(validationGroup)}

<script type="module">
  const upload = window.Owlky.get(document.querySelector("[data-ok-upload]"), "upload");
  upload.setValidator((file) =>
    file.name.length > 60 ? { code: "name-too-long", message: "Use a shorter name" } : null,
  );
</script>`,
    react: `import { Upload } from "@owlky/react";

export function Pictures() {
  return (
    <Upload
      multiple
      accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
      maxFiles={3}
      maxSize={1048576}
      helperText="PNG or JPEG, up to 1 MB each."
      validator={(file) =>
        file.name.length > 60 ? { code: "name-too-long", message: "Use a shorter name" } : null
      }
      onDropRejected={(rejections) => console.warn(rejections)}
    />
  );
}`,
  },
  {
    id: "list",
    title: "Show the files",
    body: 'The list shows a row per file with a preview, the name and the size. Set `layout` to `horizontal` for a wrapping row of tiles instead: the names stay available to screen readers. Image files show a preview made from a temporary object URL, which the upload releases when the file leaves. Turn previews off with `thumbnail={false}` (HTML: `data-ok-thumbnail="false"`) to show a colored file type icon for every file.',
    html: `${uploadOf(multipleGroup).replace(
      'data-ok-layout="vertical"',
      'data-ok-layout="horizontal" data-ok-thumbnail="false"',
    )}`,
    react: `import { Upload } from "@owlky/react";

export function FileRow() {
  return <Upload multiple layout="horizontal" thumbnail={false} />;
}`,
  },
  {
    id: "avatar",
    title: "Pick an avatar or a small box",
    body: "`UploadAvatar` is a round photo picker: the photo fills the circle and **Update photo** shows on hover and focus. It accepts images by default. `UploadBox` is a small box for toolbars and forms: it shows a cloud icon, or the `placeholder` you give it, and keeps the files without a list. In HTML, set `data-ok-variant` to `avatar` or `box`.",
    html: `${uploadOf(avatarGroup)}`,
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
    html: `${uploadOf(openDialogGroup)}`,
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
${indent(uploadOf(multipleGroup), 2)}
  <button type="submit">Save</button>
</form>`,
    react: `import { Upload } from "@owlky/react";

export function Attachments() {
  return (
    <Upload
      multiple
      onUpload={async (files) => {
        const body = new FormData();
        for (const file of files) if (file instanceof File) body.append("attachments", file);
        await fetch("/attachments", { method: "POST", body });
      }}
    />
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
  apiReferenceSection(uploadApi),
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
