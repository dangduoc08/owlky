import {
  listItemButtonOptions,
  listItemOptions,
  listItemTextOptions,
  listOptions,
  listSubheaderOptions,
} from "@owlky/core";
import listApi from "@owlky/docs-content/api/list.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { DemoIcon } from "../shared/demo-icon.js";
import { NestedDemo } from "./nested-demo.js";

const INBOX = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h4l1.5 2h5l1.5-2h4M4 13l2.5-7h11l2.5 7v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /></svg>`;
const CHEVRON = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" /></svg>`;

export const listSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A list shows rows of text, icons, avatars and controls, one below the other. It is a native `<ul>`, so assistive technology announces the number of items. Rows are plain list items, or buttons and links when people can choose them. Lists need no JavaScript, except to open and close nested lists in HTML.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<nav aria-label="Mailbox">
  <ul data-ok-list>
    <li data-ok-list-item data-ok-disable-padding>
      <button type="button" data-ok-list-item-button>
        <span data-ok-list-item-icon>${INBOX}</span>
        <span data-ok-list-item-text>
          <span data-ok-list-item-text-primary>Inbox</span>
        </span>
      </button>
    </li>
  </ul>
</nav>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@owlky/react";

export function Mailbox() {
  return (
    <nav aria-label="Mailbox">
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="Inbox" />
          </ListItemButton>
        </ListItem>
      </List>
    </nav>
  );
}`,
  },
  {
    id: "rows",
    title: "Build a row",
    body: `A row is a list item with up to four parts, in this order:

- **Icon or avatar:** \`ListItemIcon\` or \`ListItemAvatar\`, 16px before the text.
- **Text:** \`ListItemText\` with a \`primary\` line and an optional \`secondary\` line in the secondary text color.
- **Control:** a switch or another control at the end of the row.
- **End action:** \`secondaryAction\`, such as an icon button, placed 16px from the end.

Set \`alignItems\` to \`flex-start\` when the text wraps to several lines, so the icon or avatar stays next to the first line.`,
    html: `<li data-ok-list-item>
  <span data-ok-list-item-avatar>…</span>
  <span data-ok-list-item-text>
    <span data-ok-list-item-text-primary>Photos</span>
    <span data-ok-list-item-text-secondary>Jan 9, 2014</span>
  </span>
</li>`,
    react: `<ListItem>
  <ListItemAvatar>
    <Avatar>
      <ImageIcon />
    </Avatar>
  </ListItemAvatar>
  <ListItemText primary="Photos" secondary="Jan 9, 2014" />
</ListItem>`,
  },
  {
    id: "buttons",
    title: "Make rows clickable",
    body: `Put a \`ListItemButton\` in a list item with \`disablePadding\`: the button then fills the row. It is a native \`<button type="button">\`, or an \`<a>\` when you set \`href\`. Use \`selected\` to highlight the current choice with a primary tint. Because the tint is color only, also set \`aria-current\`: \`"page"\` in navigation, \`"true"\` otherwise.`,
    html: `<li data-ok-list-item data-ok-disable-padding>
  <a href="/drafts" data-ok-list-item-button data-ok-selected aria-current="page">
    <span data-ok-list-item-text>
      <span data-ok-list-item-text-primary>Drafts</span>
    </span>
  </a>
</li>`,
    react: `<ListItem disablePadding>
  <ListItemButton href="/drafts" selected aria-current="page">
    <ListItemText primary="Drafts" />
  </ListItemButton>
</ListItem>`,
  },
  {
    id: "subheader",
    title: "Add a subheader",
    body: "A subheader names the list. It is the first list item and sticks to the top while the list scrolls. Give it an `id` and point the list's `aria-labelledby` at it. Set `disableSticky` to let it scroll away.",
    html: `<ul data-ok-list aria-labelledby="settings-title">
  <li data-ok-list-subheader data-ok-color="default" id="settings-title">Settings</li>
  …
</ul>`,
    react: `<List
  aria-labelledby="settings-title"
  subheader={<ListSubheader id="settings-title">Settings</ListSubheader>}
>
  …
</List>`,
  },
  {
    id: "nested",
    title: "Nest lists",
    body: `Put a list inside a list item, after the item's button. Its rows start 32px in. To open and close it, give the button \`aria-expanded\` and \`aria-controls\` with the nested list's \`id\`, and add a \`ListItemExpandIcon\`: its chevron points down while the list is closed and up while it is open.

To animate the height as it opens and closes, make the nested list a Collapse.

- **HTML:** the runtime toggles \`aria-expanded\` on the button and \`hidden\` on the nested list when the button is clicked. Add \`data-ok-collapse\` to the nested list to animate it.
- **React:** keep the open state in your component and set \`aria-expanded\` from it. Render the nested list with \`<Collapse component={List} in={open}>\`: it sets \`hidden\` while the list is closed.`,
    html: `<!-- Load the runtime once per page -->
<script src="${CDN}/owlky.js" defer></script>

<li data-ok-list-item data-ok-disable-padding>
  <button type="button" data-ok-list-item-button aria-expanded="true" aria-controls="inbox-folders">
    <span data-ok-list-item-text>
      <span data-ok-list-item-text-primary>Inbox</span>
    </span>
    <span data-ok-list-item-expand-icon aria-hidden="true">${CHEVRON}</span>
  </button>
  <ul data-ok-collapse data-ok-timeout="auto" data-ok-list data-ok-disable-padding id="inbox-folders">
    …
  </ul>
</li>`,
    react: `import { useState } from "react";
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemExpandIcon,
  ListItemText,
} from "@owlky/react";

export function Inbox() {
  const [open, setOpen] = useState(true);
  return (
    <ListItem disablePadding>
      <ListItemButton
        aria-expanded={open}
        aria-controls="inbox-folders"
        onClick={() => setOpen(!open)}
      >
        <ListItemText primary="Inbox" />
        <ListItemExpandIcon />
      </ListItemButton>
      <Collapse component={List} id="inbox-folders" in={open} timeout="auto" disablePadding>
        …
      </Collapse>
    </ListItem>
  );
}`,
  },
  {
    id: "controls",
    title: "Add controls to rows",
    body: "A row can hold a checkbox or a switch. Don't put a control inside a `ListItemButton`: a control inside a button can't be reached or announced reliably. Instead, label the control with the row's text: a `<label>` around the text for a checkbox at the start, or `aria-labelledby` with the text's `id` for a switch at the end.",
    html: `<li data-ok-list-item>
  <span data-ok-list-item-icon>…</span>
  <span data-ok-list-item-text id="wifi-label">
    <span data-ok-list-item-text-primary>Wi-Fi</span>
  </span>
  <span data-ok-switch data-ok-color="primary" data-ok-size="medium" data-ok-edge="end">
    <input type="checkbox" role="switch" data-ok-switch-input aria-labelledby="wifi-label" checked>
    <span data-ok-switch-track aria-hidden="true"></span>
    <span data-ok-switch-thumb aria-hidden="true"></span>
  </span>
</li>`,
    react: `<ListItem>
  <ListItemIcon>
    <WifiIcon />
  </ListItemIcon>
  <ListItemText id="wifi-label" primary="Wi-Fi" />
  <Switch edge="end" aria-labelledby="wifi-label" defaultChecked />
</ListItem>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. `dense` on the list makes every row compact. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:list:toggle\`** (cancelable) fires on the list before a nested list opens or closes. \`event.detail\` is \`{ open, list }\`: the new state and the nested list.
- **Instance:** \`runtime.get(element, "list")\` returns \`{ toggle(button, open?) }\`.
- **React:** handle \`onClick\` on the \`ListItemButton\` and update your state.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "List item buttons and links are native, so they follow the browser's keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Wrap navigation lists in a \`<nav>\` with an \`aria-label\`, and mark the current page with \`aria-current="page"\`.
- Icons in rows are decorative (\`aria-hidden="true"\`): the text names the row.
- Secondary text uses the secondary text color, with a contrast ratio of at least 4.5:1, also on a selected row.
- Disabled buttons are native \`disabled\`. Disabled links lose their \`href\` and get \`aria-disabled="true"\`.`,
  },
  apiReferenceSection(listApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <nav aria-label="Mailbox preview">
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <DemoIcon name="inbox" />
              </ListItemIcon>
              <ListItemText primary="Inbox" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected aria-current="true">
              <ListItemIcon>
                <DemoIcon name="mail" />
              </ListItemIcon>
              <ListItemText primary="Drafts" secondary="2 messages" />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Preview>
  ),
  subheader: () => (
    <Preview className="block!">
      <List
        aria-labelledby="docs-list-subheader"
        subheader={<ListSubheader id="docs-list-subheader">Settings</ListSubheader>}
      >
        <ListItem>
          <ListItemText primary="Notifications" secondary="On" />
        </ListItem>
      </List>
    </Preview>
  ),
  nested: () => (
    <Preview className="block!">
      <NestedDemo />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={listOptions} />
      <OptionsTable schema={listItemOptions} />
      <OptionsTable schema={listItemButtonOptions} />
      <OptionsTable schema={listItemTextOptions} />
      <OptionsTable schema={listSubheaderOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="List content props"
      rows={[
        {
          react: "List subheader",
          html: "first li[data-ok-list-subheader]",
          type: "ReactNode",
          description: "Rendered before the rows, usually a `ListSubheader`.",
        },
        {
          react: "ListItem secondaryAction",
          html: "data-ok-list-item-secondary-action",
          type: "ReactNode",
          description: "An action at the end of the row, such as an icon button.",
        },
        {
          react: "ListItemButton href",
          html: "a[data-ok-list-item-button]",
          type: "string",
          description: "Renders a link instead of a button.",
        },
        {
          react: "ListItemText primary",
          html: "data-ok-list-item-text-primary",
          type: "ReactNode",
          description: "The main line. Defaults to `children`.",
        },
        {
          react: "ListItemText secondary",
          html: "data-ok-list-item-text-secondary",
          type: "ReactNode",
          description: "A second line in the secondary text color.",
        },
        {
          react: "ListItemText disableTypography",
          type: "boolean",
          description: "Renders `primary` and `secondary` without their wrappers.",
        },
        {
          react: "ListItemExpandIcon children",
          html: "data-ok-list-item-expand-icon",
          type: "ReactNode",
          description: "Replaces the chevron of a button that opens a nested list.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the next row button, link or control."],
        ["Enter", "Activates the focused row button or link, or opens and closes its nested list."],
        ["Space", "Activates the focused row button, or opens and closes its nested list."],
      ]}
    />
  ),
};

/** List docs page (ADR-0019). */
export function ListDocs() {
  return <GuideDocs sections={listSections} previews={PREVIEWS} />;
}
