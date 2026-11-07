import { listOptions } from "@owlky/core";
import {
  Avatar,
  Checkbox,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon, type DemoIconName } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";
import { NestedDemo } from "./nested-demo.js";

/** A row with an icon and one line of text, as a button. */
function Row({
  icon,
  label,
  selected,
}: {
  icon?: DemoIconName;
  label: string;
  selected?: boolean;
}) {
  return (
    <ListItem disablePadding>
      <ListItemButton selected={selected} aria-current={selected ? "true" : undefined}>
        {icon && (
          <ListItemIcon>
            <DemoIcon name={icon} />
          </ListItemIcon>
        )}
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );
}
Row.displayName = "Row";

/** Two mailbox menus split by a divider (Simple and Selected). */
function Mailbox({ selected }: { selected?: string }) {
  return (
    <div>
      <nav aria-label="Main mailbox folders">
        <List>
          <Row icon="inbox" label="Inbox" selected={selected === "Inbox"} />
          <Row icon="mail" label="Drafts" selected={selected === "Drafts"} />
        </List>
      </nav>
      <Divider />
      <nav aria-label="Secondary mailbox folders">
        <List>
          <Row label="Trash" selected={selected === "Trash"} />
          <Row label="Spam" selected={selected === "Spam"} />
        </List>
      </nav>
    </div>
  );
}
Mailbox.displayName = "Mailbox";

/**
 * The same markup as `packages/html/src/components/list/examples/<story>-group.html`. The
 * wrapper `div`s are story-only demo markup (`.storybook/preview.css`: a paper panel).
 */
export const simpleGroups: ReactGroup[] = [{ title: "Simple", content: <Mailbox /> }];

export const selectedGroups: ReactGroup[] = [
  { title: "Selected", content: <Mailbox selected="Drafts" /> },
];

/** Nested: the Inbox button opens and closes the list below it (open at first). */
export const nestedGroups: ReactGroup[] = [{ title: "Nested", content: <NestedDemo /> }];

const FOLDERS: [DemoIconName, string, string][] = [
  ["image", "Photos", "Jan 9, 2014"],
  ["work", "Work", "Jan 7, 2014"],
  ["sun", "Vacation", "July 20, 2014"],
];

export const folderGroups: ReactGroup[] = [
  {
    title: "Folder",
    content: (
      <div>
        <List>
          {FOLDERS.map(([icon, name, date]) => (
            <ListItem key={name}>
              <ListItemAvatar>
                <Avatar>
                  <DemoIcon name={icon} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={name} secondary={date} />
            </ListItem>
          ))}
        </List>
      </div>
    ),
  },
];

/** Controls: a checkbox labelled by the row's text, and a comment button at the end. */
export const controlsGroups: ReactGroup[] = [
  {
    title: "Controls",
    content: (
      <div>
        <List dense>
          {[1, 2, 3, 4].map((n) => (
            <ListItem
              key={n}
              secondaryAction={
                <IconButton edge="end" aria-label={`Comments on line item ${n}`}>
                  <DemoIcon name="comment" />
                </IconButton>
              }
            >
              <ListItemIcon>
                <Checkbox id={`list-checkbox-${n}`} defaultChecked={n === 1} />
              </ListItemIcon>
              <ListItemText primary={<label htmlFor={`list-checkbox-${n}`}>Line item {n}</label>} />
            </ListItem>
          ))}
        </List>
      </div>
    ),
  },
];

const SETTINGS: [DemoIconName, string, boolean][] = [
  ["wifi", "Wi-Fi", true],
  ["bluetooth", "Bluetooth", false],
];

/** Switch: each switch is labelled by its row's text. */
export const switchGroups: ReactGroup[] = [
  {
    title: "Switch",
    content: (
      <div>
        <List
          aria-labelledby="list-switch-subheader"
          subheader={<ListSubheader id="list-switch-subheader">Settings</ListSubheader>}
        >
          {SETTINGS.map(([icon, label, on]) => (
            <ListItem key={label}>
              <ListItemIcon>
                <DemoIcon name={icon} />
              </ListItemIcon>
              <ListItemText id={`list-switch-${icon}`} primary={label} />
              <Switch edge="end" aria-labelledby={`list-switch-${icon}`} defaultChecked={on} />
            </ListItem>
          ))}
        </List>
      </div>
    ),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const LIST_CONTROLS = {
  schema: listOptions,
  keys: ["dense", "disablePadding"],
} as const;
