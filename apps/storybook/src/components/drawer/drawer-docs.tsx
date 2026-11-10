import { drawerOptions } from "@owlky/core";
import drawerApi from "@owlky/docs-content/api/drawer.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Drawer,
  DrawerClose,
  type DrawerCloseReason,
  DrawerContent,
  DrawerTrigger,
  Scrollbar,
} from "@owlky/react";
import { useState } from "react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const LOAD = `<!-- Load once per page, with the script for interactive components -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>`;

export const drawerSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A drawer is a panel that slides in from an edge of the screen, for navigation, filters or details. A **temporary** drawer opens over the page as a modal: the rest of the page can't be used until it closes. **Persistent** and **permanent** drawers sit next to the page content instead.

The drawer is a native \`<dialog>\`, so the browser keeps focus inside it and closes it with Escape.`,
    html: `${LOAD}

<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" aria-haspopup="dialog" data-ok-drawer-open="filters">
  <span data-ok-button-label>Filters</span>
</button>

<dialog id="filters" data-ok-drawer data-ok-anchor="right" data-ok-variant="temporary" aria-label="Filters">
  <div data-ok-drawer-content>
    <section data-ok-scrollbar aria-label="Filter options" tabindex="0">
      …
    </section>
  </div>
</dialog>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Drawer, DrawerContent, DrawerTrigger, Scrollbar } from "@owlky/react";

export function Filters() {
  return (
    <Drawer>
      <DrawerTrigger variant="outlined">Filters</DrawerTrigger>
      <DrawerContent anchor="right" aria-label="Filters">
        <Scrollbar aria-label="Filter options">…</Scrollbar>
      </DrawerContent>
    </Drawer>
  );
}`,
  },
  {
    id: "anchor",
    title: "Choose the edge",
    body: "Set `anchor` to `left` (the default), `right`, `top` or `bottom`. Side drawers take the full height; top and bottom drawers take the full width. A drawer never covers the whole screen: a 56px gap keeps the backdrop visible, so people can tap it to close the drawer.",
    html: `<dialog id="menu" data-ok-drawer data-ok-anchor="bottom" data-ok-variant="temporary" aria-label="Menu">
  <div data-ok-drawer-content>…</div>
</dialog>`,
    react: `<DrawerContent anchor="bottom" aria-label="Menu">…</DrawerContent>`,
  },
  {
    id: "close",
    title: "Close the drawer",
    body: "Escape and a click on the backdrop ask the drawer to close. Add your own close button with `DrawerClose` in React, or `data-ok-drawer-close` in HTML. Set `disableEscapeKeyDown` or `hideBackdrop` to turn those ways off.",
    html: `<dialog id="filters" data-ok-drawer data-ok-anchor="right" data-ok-variant="temporary" aria-label="Filters">
  <div data-ok-drawer-content>
    …
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-drawer-close>
      <span data-ok-button-label>Apply</span>
    </button>
  </div>
</dialog>`,
    react: `<DrawerContent anchor="right" aria-label="Filters">
  …
  <DrawerClose variant="contained" color="primary">
    Apply
  </DrawerClose>
</DrawerContent>`,
  },
  {
    id: "controlled",
    title: "Control when it opens and closes",
    body: "In React, pass `open` and `onOpenChange` to `Drawer`. `onOpenChange` receives the requested state and the reason: `escape`, `backdrop` or `close`. To keep the drawer open, don't update `open`. In HTML, listen to `ok:drawer:beforeclose` and call `preventDefault()`.",
    html: `<script type="module">
  document.addEventListener("ok:drawer:beforeclose", (event) => {
    if (event.detail.reason === "backdrop" && formHasChanges) event.preventDefault();
  });
</script>`,
    react: `export function EditPanel() {
  const [open, setOpen] = useState(false);
  return (
    <Drawer
      open={open}
      onOpenChange={(next, reason) => {
        if (!next && reason === "backdrop" && formHasChanges) return; // keep it open
        setOpen(next);
      }}
    >
      …
    </Drawer>
  );
}`,
  },
  {
    id: "docked",
    title: "Dock the drawer next to the page",
    body: "Set `variant` to `persistent` for a drawer that people can show and hide next to the content, or `permanent` for one that is always visible. Docked drawers have no backdrop and don't trap focus. Place the drawer and the page area in a flex row (left and right) or column (top and bottom).",
    html: `<div style="display: flex">
  <aside data-ok-drawer data-ok-anchor="left" data-ok-variant="permanent" aria-label="Navigation">
    <div data-ok-drawer-content>…</div>
  </aside>
  <main>…</main>
</div>`,
    react: `<div style={{ display: "flex" }}>
  <Drawer variant="permanent">
    <DrawerContent aria-label="Navigation">…</DrawerContent>
  </Drawer>
  <main>…</main>
</div>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "In React, the drawer is made of parts: `Drawer` holds the state, and the other parts go inside it.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:drawer:beforeopen\`** (cancelable) fires before the drawer opens, and **\`ok:drawer:open\`** after.
- **\`ok:drawer:beforeclose\`** (cancelable) fires before it closes, with \`detail.reason\`. **\`ok:drawer:close\`** fires after, with the reason: \`escape\`, \`backdrop\`, \`trigger\`, \`api\` or \`native\`.
- **Instance:** \`runtime.get(element, "drawer")\` returns \`{ isOpen, open(trigger?), close(reason?), toggle() }\`.
- **React:** \`onOpenChange(open, reason)\` on \`Drawer\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "A temporary drawer is a modal dialog: focus stays inside it until it closes.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A drawer needs a name: set \`aria-label\`, or \`aria-labelledby\` pointing to its title.
- When a temporary drawer opens, focus moves into it and the rest of the page becomes inert. When it closes, focus returns to the button that opened it.
- Triggers carry \`aria-haspopup="dialog"\`. Docked drawers' triggers carry \`aria-expanded\` and \`aria-controls\` instead.
- If the content can scroll, put it in a **Scrollbar**: it becomes a named region that keyboard users can scroll, and it's the first thing focused when the drawer opens.`,
  },
  apiReferenceSection(drawerApi),
];

function ControlledPreview() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DrawerCloseReason | "">("");
  return (
    <Preview>
      <Drawer
        open={open}
        onOpenChange={(next, why) => {
          setOpen(next);
          if (!next) setReason(why ?? "");
        }}
      >
        <DrawerTrigger variant="outlined">Open the drawer</DrawerTrigger>
        <DrawerContent anchor="right" aria-label="Example drawer">
          <Scrollbar aria-label="Drawer content">
            <div className="flex w-72 flex-col items-start gap-4 p-6">
              <p className="m-0">Press Escape, click outside, or use the button.</p>
              <DrawerClose variant="contained" color="primary">
                Close
              </DrawerClose>
            </div>
          </Scrollbar>
        </DrawerContent>
      </Drawer>
      <span className="text-[0.8125rem] text-text-secondary">
        Last close reason: {reason || "none yet"}
      </span>
    </Preview>
  );
}

const PREVIEWS = {
  controlled: ControlledPreview,
  options: () => <OptionsTable schema={drawerOptions} />,
  props: () => (
    <PropsTable
      label="Drawer parts"
      rows={[
        {
          react: "Drawer",
          type: "open, defaultOpen, onOpenChange, variant",
          description: "Holds the open state. Renders no element.",
        },
        {
          react: "DrawerTrigger",
          html: "data-ok-drawer-open",
          type: "Button props",
          description: "A Button that opens the drawer (and toggles a docked one).",
        },
        {
          react: "DrawerContent",
          html: "dialog[data-ok-drawer] or aside",
          type: "anchor, hideBackdrop, disableEscapeKeyDown",
          description: "The panel. Needs a name.",
        },
        {
          react: "DrawerClose",
          html: "data-ok-drawer-close",
          type: "Button props",
          description: "A Button that closes the drawer.",
        },
        {
          react: "defaultOpen",
          html: "data-ok-open",
          type: "boolean",
          description: "Opens a temporary drawer initially.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        [
          "Tab / Shift+Tab",
          "Moves focus among the drawer's elements; it doesn't reach the page behind.",
        ],
        ["Escape", "Asks the drawer to close (unless `disableEscapeKeyDown`)."],
      ]}
    />
  ),
};

/** Drawer docs page (ADR-0019). */
export function DrawerDocs() {
  return <GuideDocs sections={drawerSections} previews={PREVIEWS} />;
}
