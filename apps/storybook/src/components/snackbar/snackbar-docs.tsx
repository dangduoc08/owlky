import { toasterOptions } from "@owlky/core";
import snackbarApi from "@owlky/docs-content/api/snackbar.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { StatusDemo } from "./snackbar-demos.js";

export const snackbarSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A snackbar, or toast, shows a brief message at the edge of the screen and closes by itself after 4 seconds. Render one toaster per page. Then show toasts from anywhere: with the `toast()` function in React, or with a `<template>` and a button in HTML. Toasts pause while you hover over or focus the toaster.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<section data-ok-toaster data-ok-position="top-right" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>

<template id="saved">
  <li data-ok-toast data-ok-type="default">
    <div data-ok-toast-content><div data-ok-toast-title>Changes saved</div></div>
  </li>
</template>
<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-toast-open="saved">
  <span data-ok-button-label>Save</span>
</button>`,
    react: `import { Button, Toaster, toast } from "@owlky/react";

export function App() {
  return (
    <>
      <Button variant="contained" onClick={() => toast("Changes saved")}>
        Save
      </Button>
      <Toaster />
    </>
  );
}`,
  },
  {
    id: "types",
    title: "Show the status",
    body: "Use `toast.info`, `toast.success`, `toast.warning` or `toast.error` for a toast with a colored icon. `toast.promise` shows a loading toast and replaces it with the result. In HTML, set `data-ok-type` on the toast; a loading toast with `data-ok-then` is replaced by another template when its time (`data-ok-duration`) runs out, and the instance's `promise()` method follows a real promise.",
    html: `<script type="module">
  const toaster = window.Owlky.get(document.querySelector("[data-ok-toaster]"), "toaster");
  toaster.show({ type: "success", title: "Event created", description: "Monday at 6:00 PM" });
  toaster.promise(fetch("/api/save"), { loading: "Saving", success: "Saved", error: "Not saved" });
</script>`,
    react: `import { Button, Toaster, toast } from "@owlky/react";

export function SaveEvent() {
  const save = () => {
    toast.success("Event created", { description: "Monday at 6:00 PM" });
    toast.promise(fetch("/api/save", { method: "POST" }), {
      loading: "Saving",
      success: "Saved",
      error: "Not saved",
    });
  };
  return (
    <>
      <Button onClick={save}>Create event</Button>
      <Toaster />
    </>
  );
}`,
  },
  {
    id: "actions",
    title: "Add an action",
    body: "Pass `action: { label, onClick }` to add a button, such as **Undo**. The toast closes when it is clicked, unless the handler calls `preventDefault()`. Pass your own nodes as `action` for several buttons. Toasts with an action have no close button.",
    html: `<template id="deleted">
  <li data-ok-toast data-ok-type="default">
    <div data-ok-toast-content><div data-ok-toast-title>Message deleted</div></div>
    <button type="button" data-ok-toast-action>Undo</button>
  </li>
</template>`,
    react: `import { Button, Toaster, toast } from "@owlky/react";
import { useState } from "react";

export function DeleteMessage() {
  const [deleted, setDeleted] = useState(false);
  const remove = () => {
    setDeleted(true);
    toast("Message deleted", { action: { label: "Undo", onClick: () => setDeleted(false) } });
  };
  return (
    <>
      <Button onClick={remove} disabled={deleted}>
        Delete message
      </Button>
      <Toaster />
    </>
  );
}`,
  },
  {
    id: "position",
    title: "Move the toaster",
    body: "Set `position` to a corner or the center of the top or bottom edge. At the bottom, the newest toast sits nearest to the edge. In HTML, a trigger with `data-ok-toaster-position` moves the toaster before it shows its toast.",
    html: `<section data-ok-toaster data-ok-position="bottom-center" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>`,
    react: `import { Toaster } from "@owlky/react";

export function SnackbarPosition() {
  return <Toaster position="bottom-center" />;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop of `Toaster` in React, an attribute of the toaster in HTML.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These are the `toast()` options. In HTML they are the toast's markup and attributes.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:toaster:show\`** (\`detail.toast\`) and **\`ok:toaster:dismiss\`** (\`detail.toast\`, \`detail.reason\`: \`close\`, \`dismiss\`, \`action\`, \`cancel\`, \`timeout\`, \`escape\`, \`api\` or \`overflow\`) fire on the toaster.
- **\`ok:toaster:action\`** (cancelable) fires before an action or cancel button closes its toast.
- **Instance:** \`runtime.get(toaster, "toaster")\` returns \`{ show(options), showTemplate(template), promise(promise, messages), dismiss(id?) }\`. \`show()\` builds the toast from text, never from HTML.
- **React:** \`toast()\` returns the toast's id; \`toast.dismiss(id?)\` closes one toast or all of them. \`onDismiss\` and \`onAutoClose\` report how it closed.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Toasts don't take focus when they appear, so they never interrupt typing.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The toast list is a polite live region: screen readers announce new toasts without interrupting.
- Time pauses while the pointer or focus is in the toaster, so people can read and act.
- Don't rely on a toast for anything that must be done: it closes by itself. Use a Dialog instead.
- Icons are decorative; the title carries the message. Typed toasts keep their text at a contrast ratio of at least 4.5:1.`,
  },
  apiReferenceSection(snackbarApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <StatusDemo />
    </Preview>
  ),
  options: () => <OptionsTable schema={toasterOptions} />,
  props: () => (
    <PropsTable
      label="Toast options"
      rows={[
        {
          react: "description",
          html: "data-ok-toast-description",
          type: "ReactNode",
          description: "A second line.",
        },
        {
          react: "action",
          html: "data-ok-toast-action",
          type: "{ label, onClick } | ReactNode",
          description:
            "A button, or your own buttons (HTML: `data-ok-toast-dismiss` closes the toast).",
        },
        {
          react: "cancel",
          html: "data-ok-toast-cancel",
          type: "{ label, onClick }",
          description: "A secondary button.",
        },
        {
          react: "duration",
          html: "data-ok-duration",
          type: "number",
          description: "Milliseconds before it closes; `Infinity` keeps it.",
        },
        { react: "icon", type: "ReactNode", description: "Replaces the type's icon." },
        {
          react: "id",
          html: "data-ok-toast-id",
          type: "string | number",
          description: "Reuse an id to update a toast in place.",
        },
        {
          react: "dismissible",
          type: "boolean",
          description: "`false`: no close button, Escape ignored.",
        },
        {
          react: "toast.custom(node)",
          type: "ReactNode",
          description: "Your own content in the toast frame.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves to the toaster's buttons (time pauses while focus is there)."],
        ["Escape", "On a focused toast: closes it."],
      ]}
    />
  ),
};

/** Snackbar docs page (ADR-0019). */
export function SnackbarDocs() {
  return <GuideDocs sections={snackbarSections} previews={PREVIEWS} />;
}
