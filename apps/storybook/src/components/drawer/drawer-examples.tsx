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
function Mailbox() {
  return (
    <nav aria-label="Mailbox">
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
