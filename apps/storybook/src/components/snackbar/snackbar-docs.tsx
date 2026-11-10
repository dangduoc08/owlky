import { toasterOptions } from "@owlky/core";
import snackbarApi from "@owlky/docs-content/api/snackbar.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { ExpandDemo, RichColorsDemo, StatusDemo } from "./snackbar-demos.js";

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
    id: "stack",
    title: "Stack toasts",
    body: 'By default the toasts are listed one under another. Set `expand` to `false` to stack them: the newest toast stays in front and two more peek out behind it. The stack expands while the pointer or the focus is in it. Press **Alt + T** to expand it from the keyboard and move the focus to the toasts, and press **Escape** to collapse it again. Change the keys with `hotkey`, such as `["ctrlKey", "KeyM"]` (HTML: `data-ok-hotkey="ctrlKey+KeyM"`), or pass `[]` to turn it off.',
    html: `<section data-ok-toaster data-ok-position="bottom-right" data-ok-expand="false" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>`,
    react: `import { Toaster } from "@owlky/react";

export function StackedToaster() {
  return <Toaster position="bottom-right" expand={false} />;
}`,
  },
  {
    id: "swipe",
    title: "Swipe toasts away",
    body: "People can swipe a toast toward the edge of the screen to close it: up or down, and toward the side for toasts in a corner. A short swipe springs back. Set `swipeDirections` to choose the directions, or pass `[]` to turn swiping off (HTML: `data-ok-swipe-directions`, empty to turn it off). Because a swipe needs a dragging movement, every toast that can be swiped also shows a close button, unless you set `closeButton` to `false`. Keyboard users close a focused toast with **Escape**.",
    html: `<section data-ok-toaster data-ok-position="top-center" data-ok-swipe-directions="top" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>`,
    react: `import { Toaster } from "@owlky/react";

export function SwipeUpToaster() {
  return <Toaster position="top-center" swipeDirections={["top"]} />;
}`,
  },
  {
    id: "colors",
    title: "Color toasts",
    body: 'Set `richColors` to give success, info, warning and error toasts their status color: the dark tone of the color on its light tone. Set `invert` to reverse the colors: plain toasts become light and typed toasts dark. Both work on the toaster, for every toast, or on one toast, where `false` turns the toaster\'s setting off. In HTML, put `data-ok-rich-colors` or `data-ok-invert` on the toaster or on a toast (`="false"` turns it off for that toast).',
    html: `<section data-ok-toaster data-ok-position="top-right" data-ok-rich-colors aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>
<template id="saved-toast">
  <li data-ok-toast data-ok-type="success">
    <div data-ok-toast-content><div data-ok-toast-title>Event has been created</div></div>
  </li>
</template>
<button type="button" data-ok-toast-open="saved-toast">Show toast</button>`,
    react: `import { Button, Toaster, toast } from "@owlky/react";

export function RichColors() {
  return (
    <>
      <Button variant="contained" onClick={() => toast.success("Event has been created")}>
        Show toast
      </Button>
      <Button variant="outlined" onClick={() => toast("Draft saved", { invert: true })}>
        Inverted
      </Button>
      <Toaster richColors />
    </>
  );
}`,
  },
  {
    id: "place",
    title: "Place toasts and change the spacing",
    body: 'A toast can ask for another position than the toaster\'s with its own `position`: it then shows in a list of its own at that position. `offset` sets the distance from the edges of the screen (16px by default) as a number of pixels, a CSS length such as `2rem`, or one value per side. `mobileOffset` does the same on screens under 600px wide, and `gap` sets the space between toasts (12px). For right-to-left languages, set `dir="rtl"` on the toaster: the icon, the text and the close button swap sides.',
    html: `<section data-ok-toaster data-ok-position="top-right" data-ok-offset="24" data-ok-gap="8" dir="rtl" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>
<script type="module">
  const toaster = document.querySelector("[data-ok-toaster]");
  const instance = Owlky.runtime.get(toaster, "toaster");
  instance.show({ title: "Copied", position: "bottom-center" });
</script>`,
    react: `import { Button, Toaster, toast } from "@owlky/react";

export function PlacedToasts() {
  return (
    <>
      <Button onClick={() => toast("Copied", { position: "bottom-center" })}>Copy</Button>
      <Toaster offset={{ top: 24, right: 24 }} mobileOffset={8} gap={8} dir="rtl" />
    </>
  );
}`,
  },
  {
    id: "toasters",
    title: "Use several toasters and set defaults",
    body: "Give a toaster an `id` to keep it apart: it shows only the toasts whose `toasterId` names it, and a toaster without an `id` shows the others. In HTML, each toaster has its own instance, and a trigger picks one with `data-ok-toast-toaster`. In React, `toastOptions` sets defaults for every toast of a toaster, such as `duration` or `closeButton`, and `icons` replaces the type icons and the close icon.",
    html: `<section id="uploads" data-ok-toaster data-ok-position="bottom-left" aria-label="Uploads">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>
<template id="upload-toast">
  <li data-ok-toast data-ok-type="info">
    <div data-ok-toast-content><div data-ok-toast-title>Upload started</div></div>
  </li>
</template>
<button type="button" data-ok-toast-open="upload-toast" data-ok-toast-toaster="uploads">Upload</button>`,
    react: `import { Button, Toaster, toast } from "@owlky/react";
import { CheckIcon } from "lucide-react";

export function UploadToasts() {
  return (
    <>
      <Button onClick={() => toast.success("Upload done", { toasterId: "uploads" })}>Upload</Button>
      <Toaster />
      <Toaster
        id="uploads"
        position="bottom-left"
        aria-label="Uploads"
        toastOptions={{ duration: 8000, closeButton: true }}
        icons={{ success: <CheckIcon /> }}
      />
    </>
  );
}`,
  },
  {
    id: "promise",
    title: "Follow a promise and read the toasts",
    body: "`toast.promise()` shows the `loading` message until the promise settles, then `success` or `error` in the same toast. It also takes toast options, such as `position` or `duration`, and `finally`, which runs after the result shows. It returns the toast's id with an `unwrap()` method that gives the promise's own result. The id is an object, so compare it with `id.valueOf()`. `toast.getToasts()` returns the toasts shown now, `toast.getHistory()` every toast shown so far, and the `useSonner()` hook keeps a component up to date with the toasts. In HTML, the instance has `promise()` with `finally`, `getToasts()` and `getHistory()`.",
    html: `<section data-ok-toaster data-ok-position="top-right" aria-label="Notifications">
  <ol data-ok-toaster-list aria-live="polite"></ol>
</section>
<script type="module">
  const toaster = document.querySelector("[data-ok-toaster]");
  const instance = Owlky.runtime.get(toaster, "toaster");
  const saving = fetch("/api/save", { method: "POST" });
  instance.promise(saving, {
    loading: "Saving",
    success: "Saved",
    error: "Couldn't save",
    finally: () => console.log(instance.getHistory().length, "toasts so far"),
  });
</script>`,
    react: `import { Button, Toaster, toast, useSonner } from "@owlky/react";

export function SaveButton() {
  const { toasts } = useSonner();
  const save = async () => {
    const id = toast.promise(fetch("/api/save", { method: "POST" }), {
      loading: "Saving",
      success: "Saved",
      error: "Couldn't save",
    });
    const response = await id.unwrap();
    console.log(response.status);
  };
  return (
    <>
      <Button onClick={save}>Save ({toasts.length} shown)</Button>
      <Toaster />
    </>
  );
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
    body: `- **\`ok:toaster:show\`** (\`detail.toast\`) and **\`ok:toaster:dismiss\`** (\`detail.toast\`, \`detail.reason\`: \`close\`, \`dismiss\`, \`action\`, \`cancel\`, \`timeout\`, \`escape\`, \`swipe\`, \`api\` or \`overflow\`) fire on the toaster.
- **\`ok:toaster:action\`** (cancelable) fires before an action or cancel button closes its toast.
- **Instance:** \`runtime.get(toaster, "toaster")\` returns \`{ show(options), showTemplate(template), promise(promise, messages), dismiss(id?), getToasts(), getHistory() }\`. \`show()\` builds the toast from text, never from HTML.
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
- Swiping is never the only way to close a toast: swipeable toasts show a close button, and **Escape** closes a focused toast.
- Rich colors pair each status color's dark tone with its light tone, at a contrast ratio of at least 4.5:1.
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
  stack: () => (
    <Preview>
      <ExpandDemo />
    </Preview>
  ),
  colors: () => (
    <Preview>
      <RichColorsDemo />
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
        ["Escape", "On a focused toast: closes it. In an expanded stack: collapses it."],
        ["Alt + T", "Expands the toaster and moves the focus to its toasts (`hotkey`)."],
      ]}
    />
  ),
};

/** Snackbar docs page (ADR-0019). */
export function SnackbarDocs() {
  return <GuideDocs sections={snackbarSections} previews={PREVIEWS} />;
}
