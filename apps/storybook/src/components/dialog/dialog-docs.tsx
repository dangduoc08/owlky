import { dialogOptions } from "@owlky/core";
import dialogApi from "@owlky/docs-content/api/dialog.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { AlertDialogDemo } from "./dialog-demos.js";

export const dialogSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A dialog asks for a decision or shows information that needs attention, over the page. It is a native modal `<dialog>`: the page behind it is inert, Tab stays inside it, and Escape or a click outside asks it to close. Focus returns to the element that opened it.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  aria-haspopup="dialog" data-ok-dialog-open="discard">
  <span data-ok-button-label>Discard draft</span>
</button>
<dialog id="discard" data-ok-dialog data-ok-max-width="sm" data-ok-scroll="paper" aria-labelledby="discard-title">
  <div data-ok-dialog-paper>
    <h2 id="discard-title" data-ok-dialog-title>Discard this draft?</h2>
    <div data-ok-dialog-content>
      <p data-ok-dialog-content-text>You can't undo this.</p>
    </div>
    <div data-ok-dialog-actions>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-dialog-close>
        <span data-ok-button-label>Cancel</span>
      </button>
    </div>
  </div>
</dialog>`,
    react: `import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@owlky/react";
import { useState } from "react";

export function DiscardDraft() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Discard draft
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle>Discard this draft?</DialogTitle>
        <DialogContent>
          <DialogContentText>You can't undo this.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}`,
  },
  {
    id: "size",
    title: "Size the dialog",
    body: "The paper is as wide as its content, up to `maxWidth`: `xs` (444px), `sm` (600px, the default), `md` (900px), `lg` (1200px), `xl` (1536px) or `none`. Add `fullWidth` to always take that width. On phones the paper keeps 16px from the edges, and 32px from 600px up. `fullScreen` covers the whole viewport.",
    html: `<dialog id="settings" data-ok-dialog data-ok-max-width="md" data-ok-full-width data-ok-scroll="paper" aria-labelledby="settings-title">…</dialog>`,
    react: `<Dialog open={open} onOpenChange={setOpen} maxWidth="md" fullWidth>…</Dialog>`,
  },
  {
    id: "scroll",
    title: "Scroll long content",
    body: 'With `scroll` set to `paper` (default), the title and actions stay in view and the content scrolls. Make the content focusable (`tabindex="0"` and a name) so keyboard users can scroll it. With `body`, the whole dialog scrolls with the page. Add `dividers` to draw lines above and below the content.',
    html: `<div data-ok-dialog-content data-ok-dividers tabindex="0" aria-label="Terms">…</div>`,
    react: `<DialogContent dividers tabIndex={0} aria-label="Terms">…</DialogContent>`,
  },
  {
    id: "transition",
    title: "Animate the entrance",
    body: "By default, the paper fades and scales in briefly. Set `transition` to a Motion entrance, such as `slideInUp` or `zoomIn`, to play that animation instead. In HTML, the paper becomes a Motion that plays when the dialog opens, so the page also needs the Motion styles. With reduced motion, the dialog appears at once.",
    html: `<div data-ok-dialog-paper data-ok-motion data-ok-variant="slideInUp" data-ok-trigger="mount">…</div>`,
    react: `<Dialog open={open} onOpenChange={setOpen} transition="slideInUp">…</Dialog>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the state. They aren't options, because HTML writes them as markup or triggers.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:dialog:beforeopen\`** (cancelable) and **\`ok:dialog:open\`** fire on the dialog.
- **\`ok:dialog:beforeclose\`** (cancelable) and **\`ok:dialog:close\`** carry \`detail.reason\`: \`escape\`, \`backdrop\`, \`trigger\`, \`api\` or \`native\` (a \`form[method=dialog]\`).
- **Instance:** \`runtime.get(element, "dialog")\` returns \`{ isOpen, open(trigger?), close(reason?) }\`.
- **React:** \`onOpenChange(false, reason)\` with \`escape\`, \`backdrop\` or \`close\`. Set \`open\` to close it.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Focus stays inside the dialog while it is open.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The dialog is named by its title: React links \`DialogTitle\` automatically, and in HTML you point \`aria-labelledby\` at the title's \`id\`.
- When it opens, focus moves to the first focusable element (or an element with \`autofocus\`). When it closes, focus returns to the trigger.
- The page behind is inert, so screen readers and the keyboard stay in the dialog.
- Secondary text uses the secondary text color, with a contrast ratio of at least 4.5:1.`,
  },
  apiReferenceSection(dialogApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <AlertDialogDemo id="docs-dialog" />
    </Preview>
  ),
  options: () => <OptionsTable schema={dialogOptions} />,
  props: () => (
    <PropsTable
      label="Dialog content props"
      rows={[
        {
          react: "open / onOpenChange",
          html: "data-ok-dialog-open / data-ok-dialog-close",
          type: "boolean / (open, reason) => void",
          description: "Open state, and the request to close.",
        },
        {
          react: "DialogTitle",
          html: "data-ok-dialog-title",
          type: "h2",
          description: "The heading; it names the dialog.",
        },
        {
          react: "DialogContent dividers",
          html: "data-ok-dialog-content[data-ok-dividers]",
          type: "boolean",
          description: "Lines above and below the content.",
        },
        {
          react: "DialogContentText",
          html: "data-ok-dialog-content-text",
          type: "p",
          description: "Secondary text in the content.",
        },
        {
          react: "DialogActions disableSpacing",
          html: "data-ok-dialog-actions[data-ok-disable-spacing]",
          type: "boolean",
          description: "No gap between the action buttons.",
        },
        {
          react: "paperProps",
          type: "HTMLAttributes",
          description: "Props of the paper, such as `className`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab / Shift+Tab", "Moves between the dialog's controls; focus never leaves the dialog."],
        ["Escape", "Asks the dialog to close (unless `disableEscapeKeyDown`)."],
      ]}
    />
  ),
};

/** Dialog docs page (ADR-0019). */
export function DialogDocs() {
  return <GuideDocs sections={dialogSections} previews={PREVIEWS} />;
}
