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
  <div data-ok-drawer-content data-ok-paper>
    <section data-ok-scrollbar aria-label="Filter options" tabindex="0">
      <label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-checkbox data-ok-color="primary" data-ok-size="medium"><input type="checkbox" data-ok-checkbox-input id="filter-shoes"><span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span><span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span><span data-ok-form-control-label-text>Shoes</span></label>
      <label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-checkbox data-ok-color="primary" data-ok-size="medium"><input type="checkbox" data-ok-checkbox-input id="filter-bags"><span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span><span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span><span data-ok-form-control-label-text>Bags</span></label>
      <label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-checkbox data-ok-color="primary" data-ok-size="medium"><input type="checkbox" data-ok-checkbox-input id="filter-jackets"><span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span><span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span><span data-ok-form-control-label-text>Jackets</span></label>
    </section>
  </div>
</dialog>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import {
  Checkbox,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  FormControlLabel,
  FormGroup,
  Scrollbar,
} from "@owlky/react";

export function Filters() {
  return (
    <Drawer>
      <DrawerTrigger variant="outlined">Filters</DrawerTrigger>
      <DrawerContent anchor="right" aria-label="Filters">
        <Scrollbar aria-label="Filter options">
          <FormGroup>
            <FormControlLabel control={<Checkbox />} label="Shoes" />
            <FormControlLabel control={<Checkbox />} label="Bags" />
            <FormControlLabel control={<Checkbox />} label="Jackets" />
          </FormGroup>
        </Scrollbar>
      </DrawerContent>
    </Drawer>
  );
}`,
  },
  {
    id: "anchor",
    title: "Choose the edge",
    body: "Set `anchor` to `left` (the default), `right`, `top` or `bottom`. Side drawers take the full height; top and bottom drawers take the full width. A drawer never covers the whole screen: a 56px gap keeps the backdrop visible, so people can tap it to close the drawer.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" aria-haspopup="dialog" data-ok-drawer-open="menu">
  <span data-ok-button-label>Menu</span>
</button>
<dialog id="menu" data-ok-drawer data-ok-anchor="bottom" data-ok-variant="temporary" aria-label="Menu">
  <div data-ok-drawer-content data-ok-paper>
    <nav aria-label="Main">
      <ul data-ok-list>
        <li data-ok-list-item data-ok-disable-padding><a href="/dashboard" data-ok-list-item-button><span data-ok-list-item-text><span data-ok-list-item-text-primary>Dashboard</span></span></a></li>
        <li data-ok-list-item data-ok-disable-padding><a href="/orders" data-ok-list-item-button><span data-ok-list-item-text><span data-ok-list-item-text-primary>Orders</span></span></a></li>
      </ul>
    </nav>
  </div>
</dialog>`,
    react: `import { Drawer, DrawerContent, DrawerTrigger, List, ListItem, ListItemButton, ListItemText } from "@owlky/react";

export function BottomMenu() {
  return (
    <Drawer>
      <DrawerTrigger variant="outlined">Menu</DrawerTrigger>
      <DrawerContent anchor="bottom" aria-label="Menu">
        <nav aria-label="Main">
          <List>
            <ListItem disablePadding>
              <ListItemButton href="/dashboard">
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton href="/orders">
                <ListItemText primary="Orders" />
              </ListItemButton>
            </ListItem>
          </List>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}`,
  },
  {
    id: "close",
    title: "Close the drawer",
    body: "Escape and a click on the backdrop ask the drawer to close. Add your own close button with `DrawerClose` in React, or `data-ok-drawer-close` in HTML. Set `disableEscapeKeyDown` or `hideBackdrop` to turn those ways off.",
    html: `<dialog id="filters" data-ok-drawer data-ok-anchor="right" data-ok-variant="temporary" aria-label="Filters">
  <div data-ok-drawer-content data-ok-paper>
    <label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-checkbox data-ok-color="primary" data-ok-size="medium"><input type="checkbox" data-ok-checkbox-input id="close-filter-shoes"><span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span><span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span><span data-ok-form-control-label-text>Shoes</span></label>
          <label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-checkbox data-ok-color="primary" data-ok-size="medium"><input type="checkbox" data-ok-checkbox-input id="close-filter-bags"><span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span><span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span><span data-ok-form-control-label-text>Bags</span></label>
          <label data-ok-form-control-label data-ok-label-placement="end"><span data-ok-checkbox data-ok-color="primary" data-ok-size="medium"><input type="checkbox" data-ok-checkbox-input id="close-filter-jackets"><span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></span><span data-ok-checkbox-icon="checked" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" /><path data-ok-checkbox-mark d="m7.75 12.25 2.75 2.75 5.75-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span><span data-ok-form-control-label-text>Jackets</span></label>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-drawer-close>
      <span data-ok-button-label>Apply</span>
    </button>
  </div>
</dialog>`,
    react: `import {
  Checkbox,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
  FormControlLabel,
  FormGroup,
} from "@owlky/react";

export function FilterPanel() {
  return (
    <Drawer>
      <DrawerTrigger variant="outlined">Filters</DrawerTrigger>
      <DrawerContent anchor="right" aria-label="Filters">
        <FormGroup>
          <FormControlLabel control={<Checkbox />} label="Shoes" />
          <FormControlLabel control={<Checkbox />} label="Bags" />
          <FormControlLabel control={<Checkbox />} label="Jackets" />
        </FormGroup>
        <DrawerClose variant="contained" color="primary">
          Apply
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}`,
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
    react: `import { Drawer, DrawerContent, DrawerTrigger, TextField } from "@owlky/react";
import { useState } from "react";

export function EditPanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const formHasChanges = name !== "";
  return (
    <Drawer
      open={open}
      onOpenChange={(next, reason) => {
        if (!next && reason === "backdrop" && formHasChanges) return; // keep it open
        setOpen(next);
      }}
    >
      <DrawerTrigger variant="outlined">Edit</DrawerTrigger>
      <DrawerContent anchor="right" aria-label="Edit the project">
        <TextField label="Name" value={name} onChange={setName} />
      </DrawerContent>
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
    <div data-ok-drawer-content data-ok-paper>
      <nav aria-label="Main">
        <ul data-ok-list>
          <li data-ok-list-item data-ok-disable-padding><a href="/dashboard" data-ok-list-item-button><span data-ok-list-item-text><span data-ok-list-item-text-primary>Dashboard</span></span></a></li>
          <li data-ok-list-item data-ok-disable-padding><a href="/orders" data-ok-list-item-button><span data-ok-list-item-text><span data-ok-list-item-text-primary>Orders</span></span></a></li>
        </ul>
      </nav>
    </div>
  </aside>
  <main>
    <h1>Dashboard</h1>
  </main>
</div>`,
    react: `import { Drawer, DrawerContent, List, ListItem, ListItemButton, ListItemText } from "@owlky/react";

export function DrawerDocked() {
  return (
    <div style={{ display: "flex" }}>
      <Drawer variant="permanent">
        <DrawerContent aria-label="Navigation">
          <nav aria-label="Main">
            <List>
              <ListItem disablePadding>
                <ListItemButton href="/dashboard">
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton href="/orders">
                  <ListItemText primary="Orders" />
                </ListItemButton>
              </ListItem>
            </List>
          </nav>
        </DrawerContent>
      </Drawer>
      <main>
        <h1>Dashboard</h1>
      </main>
    </div>
  );
}`,
  },
  {
    id: "elevation",
    title: "Change the shadow and the speed",
    body: `- **Shadow:** \`elevation\` sets the panel's shadow from \`0\` (none) to \`24\`, from the same scale as Paper. Without it, each edge has its own shadow and docked drawers have none.
- **Speed:** \`transitionDuration\` sets how long the panel takes to slide in and out, in milliseconds. A temporary drawer slides back to its edge before it closes, and focus returns to the trigger after that.
- **Temporary drawers:** \`disableRestoreFocus\` keeps focus where it is when the drawer closes, and \`disableScrollLock\` lets the page behind scroll. In React, \`keepMounted={false}\` renders the content only while the drawer is open.`,
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  data-ok-drawer-open="filters" aria-haspopup="dialog">
  <span data-ok-button-label>Filters</span>
</button>
<dialog id="filters" data-ok-drawer data-ok-anchor="right" data-ok-variant="temporary" data-ok-elevation="4"
  data-ok-transition-duration="150" aria-label="Filters">
  <div data-ok-drawer-content data-ok-paper>
    <p data-ok-typography data-ok-variant="body2">Filters slide in quickly.</p>
  </div>
</dialog>`,
    react: `import { Drawer, DrawerContent, DrawerTrigger, Typography } from "@owlky/react";

export function FilterDrawer() {
  return (
    <Drawer>
      <DrawerTrigger variant="outlined">Filters</DrawerTrigger>
      <DrawerContent anchor="right" aria-label="Filters" elevation={4} transitionDuration={150}>
        <Typography variant="body2">Filters slide in quickly.</Typography>
      </DrawerContent>
    </Drawer>
  );
}`,
  },
  {
    id: "swipeable",
    title: "Open and close with a swipe",
    body: `Add \`swipeable\` to a temporary drawer so people on touch screens can swipe it. A swipe towards the drawer's edge closes it, and a swipe from a strip along the edge of the screen opens it. The panel follows the finger, and the backdrop fades with it.

- **Distance and speed:** \`hysteresis\` is how far the panel must be pulled to open or close, as a share of its size (default \`0.52\`). \`minFlingVelocity\` is the speed, in pixels per second, from which a shorter swipe still counts (default \`450\`).
- **Edge strip:** \`swipeAreaWidth\` sets its width in pixels (default \`20\`). The strip only shows on touch screens, and it covers the page under it. \`disableSwipeToOpen\` removes it, so a swipe only closes the drawer. Consider it on iOS, where a swipe from the left edge goes back. In HTML, place an empty \`data-ok-drawer-swipe-area\` element right after the dialog.
- **Discovery:** touching the strip slides a sliver of the panel in. \`disableDiscovery\` turns this off.
- **Backdrop:** \`disableBackdropTransition\` keeps the backdrop fully shown during a swipe, which is less work on slow devices.

In React, \`onOpenChange\` receives \`"swipe"\` as the reason. In HTML, \`ok:drawer:beforeopen\` fires with \`trigger: null\`, and \`ok:drawer:beforeclose\` with the reason \`swipe\`. A swipe is a pointer gesture: keep a button that opens the drawer and one that closes it (WCAG 2.5.7).`,
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  data-ok-drawer-open="menu" aria-haspopup="dialog">
  <span data-ok-button-label>Menu</span>
</button>
<dialog id="menu" data-ok-drawer data-ok-anchor="left" data-ok-variant="temporary" data-ok-swipeable aria-label="Menu">
  <div data-ok-drawer-content data-ok-paper>
    <p data-ok-typography data-ok-variant="body2">Swipe left to close.</p>
    <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-drawer-close>
      <span data-ok-button-label>Close</span>
    </button>
  </div>
</dialog>
<!-- The strip along the left edge where a swipe opens the drawer -->
<div data-ok-drawer-swipe-area aria-hidden="true"></div>`,
    react: `import { Drawer, DrawerClose, DrawerContent, DrawerTrigger, Typography } from "@owlky/react";

export function SwipeableMenu() {
  return (
    <Drawer onOpenChange={(open, reason) => console.log(open, reason)}>
      <DrawerTrigger variant="outlined">Menu</DrawerTrigger>
      <DrawerContent anchor="left" aria-label="Menu" swipeable>
        <Typography variant="body2">Swipe left to close.</Typography>
        <DrawerClose color="inherit">Close</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}`,
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
- **\`ok:drawer:beforeclose\`** (cancelable) fires before it closes, with \`detail.reason\`. **\`ok:drawer:close\`** fires once it has closed (a temporary drawer slides out first), with the reason: \`escape\`, \`backdrop\`, \`trigger\`, \`api\`, \`native\` or \`swipe\`.
- **Instance:** \`runtime.get(element, "drawer")\` returns \`{ isOpen, open(trigger?), close(reason?), toggle() }\`.
- **React:** \`onOpenChange(open, reason)\` on \`Drawer\`. A swipeable drawer reports \`swipe\` when a swipe opens or closes it.`,
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
- If the content can scroll, put it in a **Scrollbar**: it becomes a named region that keyboard users can scroll, and it's the first thing focused when the drawer opens.
- A swipeable drawer still needs its buttons: swipes only work with touch and a pen, and some people can't make them (WCAG 2.5.7).`,
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
