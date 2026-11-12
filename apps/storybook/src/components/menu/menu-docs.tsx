import { menuItemOptions, menuOptions, popoverOptions } from "@owlky/core";
import menuApi from "@owlky/docs-content/api/menu.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { SimpleMenuDemo } from "./simple-demo.js";

export const menuSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A menu shows a list of choices on a popover. Opening it moves focus to the selected item, or the first one. Choosing an item closes the menu, and focus returns to the button that opened it.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" id="account-button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  aria-haspopup="menu" aria-expanded="false" aria-controls="account-menu" data-ok-popover-open="account-menu">
  <span data-ok-button-label>Account</span>
</button>
<div id="account-menu" popover="manual" data-ok-popover data-ok-paper data-ok-placement="bottom-start">
  <ul data-ok-menu role="menu" aria-labelledby="account-button">
    <li data-ok-menu-item role="menuitem" tabindex="-1">Profile</li>
    <li data-ok-menu-item role="menuitem" tabindex="-1">Logout</li>
  </ul>
</div>`,
    react: `import { Button, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";

export function AccountMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        id="account-button"
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Account
      </Button>
      <Menu
        aria-labelledby="account-button"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        <MenuItem onClick={() => window.location.assign("/profile")}>Profile</MenuItem>
        <MenuItem onClick={() => window.location.assign("/logout")}>Logout</MenuItem>
      </Menu>
    </>
  );
}`,
  },
  {
    id: "selected",
    title: "Show the current choice",
    body: "Mark the current choice with `selected`: it is bold and tinted, and the menu focuses it when it opens. Use `disabled` for a choice that isn't available: the keyboard skips it and clicks are ignored.",
    html: `<li data-ok-menu-item role="menuitem" tabindex="-1" aria-disabled="true">Choose an option</li>
<li data-ok-menu-item role="menuitem" tabindex="-1" data-ok-selected>Show all</li>`,
    react: `import { Button, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";

export function FilterMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button id="filter-button" aria-haspopup="menu" onClick={(event) => setAnchor(event.currentTarget)}>
        Filter
      </Button>
      <Menu aria-labelledby="filter-button" open={anchor !== null} anchorEl={anchor} onOpenChange={() => setAnchor(null)}>
        <MenuItem disabled>Choose an option</MenuItem>
        <MenuItem selected>Show all</MenuItem>
      </Menu>
    </>
  );
}`,
  },
  {
    id: "choose",
    title: "Handle a choice",
    body: "In React, handle `onClick` on each `MenuItem`. The menu then asks to close with the reason `select`; call `event.preventDefault()` in the handler to keep it open. In HTML, listen for `ok:menu:select` on the menu: `event.detail.item` is the item, and `preventDefault()` keeps the menu open.",
    html: `<script type="module">
  document.querySelector("#account-menu [data-ok-menu]").addEventListener("ok:menu:select", (event) => {
    console.log(event.detail.item.textContent);
  });
</script>`,
    react: `import { Button, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";

export function SortMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [sort, setSort] = useState("name");
  return (
    <>
      <Button id="sort-button" aria-haspopup="menu" onClick={(event) => setAnchor(event.currentTarget)}>
        Sort by {sort}
      </Button>
      <Menu aria-labelledby="sort-button" open={anchor !== null} anchorEl={anchor} onOpenChange={() => setAnchor(null)}>
        <MenuItem onClick={() => setSort("name")}>Sort by name</MenuItem>
        <MenuItem onClick={() => setSort("date")}>Sort by date</MenuItem>
      </Menu>
    </>
  );
}`,
  },
  {
    id: "nested",
    title: "Nest menus",
    body: 'A submenu groups related choices under one item. In React, put a `MenuSubmenu` with a `label` among the items. In HTML, wrap the trigger item and the submenu\'s popover in `li[role="none"][data-ok-menu-submenu]`; the trigger has `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`. The submenu opens after its trigger in the reading direction (on the left in right-to-left pages). Arrow Right, Enter, Space or a click open it, Arrow Left and Escape close it, and resting the pointer on the trigger opens it too. Choosing an item in a submenu closes the whole menu.',
    html: `<button type="button" id="file-button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  aria-haspopup="menu" aria-expanded="false" aria-controls="file-menu" data-ok-popover-open="file-menu">
  <span data-ok-button-label>File</span>
</button>
<div id="file-menu" popover="manual" data-ok-popover data-ok-paper data-ok-placement="bottom-start">
  <ul data-ok-menu role="menu" aria-labelledby="file-button">
    <li data-ok-menu-item role="menuitem" tabindex="-1">New file</li>
    <li role="none" data-ok-menu-submenu>
      <div id="share-trigger" data-ok-menu-item role="menuitem" tabindex="-1" aria-haspopup="menu"
        aria-expanded="false" aria-controls="share-menu">Share<svg data-ok-menu-submenu-icon aria-hidden="true" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>
      <div id="share-menu" popover="manual" data-ok-popover data-ok-paper data-ok-placement="right-start">
        <ul data-ok-menu role="menu" aria-labelledby="share-trigger">
          <li data-ok-menu-item role="menuitem" tabindex="-1">Email</li>
          <li data-ok-menu-item role="menuitem" tabindex="-1">Copy link</li>
        </ul>
      </div>
    </li>
  </ul>
</div>`,
    react: `import { Button, Menu, MenuItem, MenuSubmenu } from "@owlky/react";
import { useState } from "react";

export function FileMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        id="file-button"
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        File
      </Button>
      <Menu aria-labelledby="file-button" open={anchor !== null} anchorEl={anchor} onOpenChange={() => setAnchor(null)}>
        <MenuItem>New file</MenuItem>
        <MenuSubmenu id="share-menu" label="Share">
          <MenuItem>Email</MenuItem>
          <MenuItem>Copy link</MenuItem>
        </MenuSubmenu>
      </Menu>
    </>
  );
}`,
  },
  {
    id: "menu-list",
    title: "Show a menu without a popover",
    body: 'A `MenuList` is the list of a menu on its own, for a menu that is always on screen, such as on a Paper. It has the same keyboard as a menu. Its focus item takes the tab stop (`tabindex="0"`): the selected item, else the first one. In React, `autoFocusItem` focuses that item when the list mounts and `autoFocus` focuses the list itself. In HTML, use the native `autofocus` attribute.',
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="1">
  <ul data-ok-menu role="menu" aria-label="Account">
    <li data-ok-menu-item role="menuitem" tabindex="0">Profile</li>
    <li data-ok-menu-item role="menuitem" tabindex="-1">Logout</li>
  </ul>
</div>`,
    react: `import { MenuItem, MenuList, Paper } from "@owlky/react";

export function AccountList() {
  return (
    <Paper>
      <MenuList aria-label="Account">
        <MenuItem>Profile</MenuItem>
        <MenuItem>Logout</MenuItem>
      </MenuList>
    </Paper>
  );
}`,
  },
  {
    id: "focus",
    title: "Choose where focus goes",
    body: 'By default, opening a menu focuses the selected item, else the first one. Set `variant` to `menu` to always focus the first item. With `disableAutoFocusItem`, focus goes to the list itself and the arrow keys then move into it; in HTML, also give the list `tabindex="-1"`. `disabledItemsFocusable` lets the keyboard stop on disabled items, and `disableListWrap` stops the arrow keys at the first and last items.',
    html: `<ul data-ok-menu role="menu" aria-label="Sort" tabindex="-1" data-ok-variant="menu"
  data-ok-disable-auto-focus-item data-ok-disable-list-wrap>
  <li data-ok-menu-item role="menuitem" tabindex="-1">Newest</li>
  <li data-ok-menu-item role="menuitem" tabindex="-1" data-ok-selected>Oldest</li>
</ul>`,
    react: `import { Button, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";

export function SortMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button variant="outlined" onClick={(event) => setAnchor(event.currentTarget)}>
        Sort
      </Button>
      <Menu
        aria-label="Sort"
        open={anchor !== null}
        anchorEl={anchor}
        variant="menu"
        disableAutoFocusItem
        disableListWrap
        onOpenChange={() => setAnchor(null)}
      >
        <MenuItem>Newest</MenuItem>
        <MenuItem selected>Oldest</MenuItem>
      </Menu>
    </>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "The menu's popover takes the Popover options, such as `placement` (default `bottom-start` for menus) and `elevation`. Every option works the same way in both versions.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the state. They aren't options, because HTML writes them as markup or triggers.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:menu:select\`** (cancelable, \`detail.item\`) fires on the menu when an item is chosen. Then the popover closes with the reason \`select\`.
- The popover's events fire too: \`ok:popover:open\`, \`ok:popover:close\` (\`detail.reason\`: \`escape\`, \`backdrop\`, \`select\`, \`tab\`, \`trigger\`).
- **Instance:** \`runtime.get(list, "menu")\` returns \`{ select(item) }\`.
- **React:** \`onOpenChange(false, reason)\` with \`escape\`, \`backdrop\`, \`select\` or \`tab\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Menus follow the WAI-ARIA menu pattern.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The trigger has \`aria-haspopup="menu"\` and \`aria-expanded\`, and the list names itself with \`aria-labelledby\` pointing at the trigger.
- Focus moves into the menu when it opens and back to the trigger when it closes.
- Disabled items have \`aria-disabled="true"\`: they stay visible but can't be chosen.
- The selected item is bold and tinted. The tint alone isn't the only cue.`,
  },
  apiReferenceSection(menuApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <SimpleMenuDemo />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={menuOptions} />
      <OptionsTable schema={menuItemOptions} />
      <OptionsTable schema={popoverOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Menu content props"
      rows={[
        {
          react: "open / anchorEl",
          html: "data-ok-popover-open trigger",
          type: "boolean / Element",
          description: "Shows the menu next to its trigger.",
        },
        {
          react: "onOpenChange",
          html: "ok:popover:beforeclose",
          type: "(open, reason) => void",
          description: "The menu asked to close.",
        },
        {
          react: "paperProps",
          type: "HTMLAttributes",
          description: "Props of the popover paper, such as `className`.",
        },
        {
          react: "MenuSubmenu label",
          html: "the trigger's content",
          type: "ReactNode",
          description: "The submenu's trigger item. A chevron follows it.",
        },
        {
          react: "MenuList autoFocus / autoFocusItem",
          html: "autofocus",
          type: "boolean",
          description: "A standalone list: focus the list or its focus item when it mounts.",
        },
        {
          react: "MenuItem onClick",
          html: "ok:menu:select",
          type: "(event) => void",
          description: "The item was chosen.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Enter / Space", "On the trigger: opens the menu. On an item: chooses it."],
        ["Arrow Down / Arrow Up", "Moves to the next or previous item, wrapping around."],
        ["Home / End", "Moves to the first or last item."],
        ["A letter", "Moves to the next item that starts with it."],
        [
          "Arrow Right / Arrow Left",
          "On a submenu's trigger: opens it. In a submenu: closes it. Mirrored in right-to-left pages.",
        ],
        ["Escape", "Closes the menu, or the open submenu; focus returns to its trigger."],
        ["Tab", "Closes the menu and moves on."],
      ]}
    />
  ),
};

/** Menu docs page (ADR-0019). */
export function MenuDocs() {
  return <GuideDocs sections={menuSections} previews={PREVIEWS} />;
}
