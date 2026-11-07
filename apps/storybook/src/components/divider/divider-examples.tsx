import { dividerOptions } from "@owlky/core";
import { Chip, Divider, IconButton, List, ListItem, ListItemText } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

const P =
  "Owlky lines up content with dividers between sections, so related items read as one group.";

/** Toolbar icons (decorative, same SVG as the HTML snippets). */
function LinesIcon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
LinesIcon.displayName = "LinesIcon";

/** A one-line, non-interactive list row (Variants). */
function TextRow({ text }: { text: string }) {
  return (
    <ListItem>
      <ListItemText primary={text} />
    </ListItem>
  );
}
TextRow.displayName = "TextRow";

/**
 * The same markup as `packages/html/src/components/divider/examples/<story>-group.html`. The
 * wrappers and paragraphs are story-only demo markup (`.storybook/preview.css`). In a list, a
 * divider sits in its own `<li>`: a list may only hold list items.
 */
export const variantGroups: ReactGroup[] = [
  {
    title: "Variants",
    content: (
      <div>
        <List>
          <TextRow text="Full width variant below" />
          <li>
            <Divider />
          </li>
          <TextRow text="Inset variant below" />
          <li>
            <Divider variant="inset" />
          </li>
          <TextRow text="Middle variant below" />
          <li>
            <Divider variant="middle" />
          </li>
          <TextRow text="List item" />
        </List>
      </div>
    ),
  },
];

export const orientationGroups: ReactGroup[] = [
  {
    title: "Orientation",
    content: (
      <div>
        <span>Inbox</span>
        <Divider orientation="vertical" />
        <span>Drafts</span>
        <Divider orientation="vertical" />
        <span>Trash</span>
      </div>
    ),
  },
];

export const flexItemGroups: ReactGroup[] = [
  {
    title: "Flex item",
    content: (
      <div>
        <span>Left</span>
        <Divider orientation="vertical" flexItem />
        <span>Center</span>
        <Divider variant="middle" orientation="vertical" flexItem />
        <span>Right</span>
      </div>
    ),
  },
];

export const childrenGroups: ReactGroup[] = [
  {
    title: "With children",
    content: (
      <div>
        <p>{P}</p>
        <Divider>Center</Divider>
        <p>{P}</p>
        <Divider textAlign="left">Left</Divider>
        <p>{P}</p>
        <Divider textAlign="right">Right</Divider>
        <p>{P}</p>
        <Divider>
          <Chip label="Chip" size="small" />
        </Divider>
        <p>{P}</p>
      </div>
    ),
  },
];

export const iconGroups: ReactGroup[] = [
  {
    title: "Icon grouping",
    content: (
      <div role="toolbar" aria-label="Text formatting">
        <IconButton aria-label="Align left">
          <LinesIcon d="M4 6h16M4 12h10M4 18h16" />
        </IconButton>
        <IconButton aria-label="Align center">
          <LinesIcon d="M4 6h16M7 12h10M4 18h16" />
        </IconButton>
        <IconButton aria-label="Align right">
          <LinesIcon d="M4 6h16M10 12h10M4 18h16" />
        </IconButton>
        <Divider variant="middle" orientation="vertical" flexItem />
        <IconButton aria-label="Bold">
          <LinesIcon d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" />
        </IconButton>
      </div>
    ),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const DIVIDER_CONTROLS = { schema: dividerOptions, keys: ["variant"] } as const;
