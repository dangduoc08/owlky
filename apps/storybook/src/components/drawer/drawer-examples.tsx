import { drawerOptions } from "@minimal-tailwind/core";
import { Drawer, type DrawerAnchor, DrawerContent, DrawerTrigger } from "@minimal-tailwind/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

const ANCHORS: [DrawerAnchor, string][] = [
  ["left", "Left"],
  ["right", "Right"],
  ["top", "Top"],
  ["bottom", "Bottom"],
];

function MenuList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <button type="button">
            <DemoIcon name="inbox" />
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Demo content (styled by the Storybook preview only; a List component will replace it). */
function Mailbox({ label = "Mailbox" }: { label?: string }) {
  return (
    <nav aria-label={label}>
      <MenuList items={["Inbox", "Starred", "Send email", "Drafts"]} />
      <hr />
      <MenuList items={["All mail", "Trash", "Spam"]} />
    </nav>
  );
}

/**
 * The "Anchor" story — the same markup, in the same order, as the HTML snippet
 * `packages/html/src/components/drawer/examples/anchor-group.html`.
 */
export const anchorGroups: ReactGroup[] = [
  {
    title: "Anchor",
    content: ANCHORS.map(([anchor, label]) => (
      <Drawer key={anchor}>
        <DrawerTrigger variant="outlined">{label}</DrawerTrigger>
        <DrawerContent anchor={anchor} aria-label={`${label} drawer`}>
          <Mailbox />
        </DrawerContent>
      </Drawer>
    )),
  },
];

export const ANCHOR_FILES: GroupFiles = [["Anchor", "group"]];

/** Page area next to a docked drawer (demo layout, styled by the Storybook preview). */
function Page() {
  return (
    <div>
      <p>Page content</p>
    </div>
  );
}

/**
 * Docked drawers (MUI `variant`) — the same markup as
 * `packages/html/src/components/drawer/examples/variants-<file>.html`.
 */
export const variantGroups: ReactGroup[] = [
  {
    title: "Persistent",
    content: (
      <Drawer variant="persistent">
        <DrawerTrigger variant="outlined">Toggle menu</DrawerTrigger>
        <div>
          <DrawerContent aria-label="Persistent drawer">
            <Mailbox label="Persistent mailbox" />
          </DrawerContent>
          <Page />
        </div>
      </Drawer>
    ),
  },
  {
    title: "Permanent",
    content: (
      <Drawer variant="permanent">
        <div>
          <DrawerContent aria-label="Permanent drawer">
            <Mailbox label="Permanent mailbox" />
          </DrawerContent>
          <Page />
        </div>
      </Drawer>
    ),
  },
];

export const VARIANT_FILES: GroupFiles = [
  ["Persistent", "persistent"],
  ["Permanent", "permanent"],
];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const DRAWER_CONTROLS = {
  schema: drawerOptions,
  keys: ["hideBackdrop", "disableEscapeKeyDown"],
} as const;
